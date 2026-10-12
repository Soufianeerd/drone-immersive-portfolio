/**
 * Shader du monde : tout le paysage vivant en UNE passe GPU, sur deux scènes à la fois.
 *
 * Deux emplacements (A = scène courante, B = scène suivante) : photo + masques techniques
 * (R = ciel qui dérive, G = brume, B = ciel/étoiles, A = eau). `uMix` fond A vers B ; au milieu
 * du passage, une brume plus dense, un léger flou et un décalage d'exposition masquent la coupure
 * (le drone traverse un banc de nuages, ce n'est pas un diaporama).
 *
 * Seuls bougent ce qui doit bouger : nuages du ciel (le soleil photographié reste en place),
 * brume dans les zones de brume, eau (ondulation + reflets, jamais les rochers), caméra de scène.
 * L'étalonnage suit la course réelle du soleil (continu), la météo et la saison.
 */
export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImgA;
uniform sampler2D uMaskA;
uniform sampler2D uImgB;
uniform sampler2D uMaskB;
uniform vec2 uRes;
uniform float uTime;
uniform float uMix;       // 0 = scène A seule, 1 = scène B seule
uniform float uHaze;      // voile de transition (0..1), max au milieu du passage
uniform float uIntro;
uniform vec3 uCam;        // caméra globale : échelle, x, y
uniform vec2 uOrigin;
// Par emplacement (A, B) : aspect, focal x, focal y, eau | zoom, pan x, pan y, dérive | brume, soleil x, soleil y, soleil photographié
uniform vec4 uSceneA0; uniform vec4 uSceneA1; uniform vec4 uSceneA2;
uniform vec4 uSceneB0; uniform vec4 uSceneB1; uniform vec4 uSceneB2;
uniform vec4 uGrade;
uniform float uSepia;
uniform vec3 uTint0;
uniform vec3 uTint1;
uniform vec3 uTint2;
uniform vec2 uTintMix;
uniform float uVeil;
uniform float uFog;
uniform float uStars;
uniform vec3 uBg;
uniform float uShade;
uniform float uBlur;
uniform float uDim;
uniform vec4 uSun;        // intensité, chaleur, position x écran du halo (soleil non photographié), élévation (0..1)
uniform float uMotion;    // 1 normal, ~0.35 mobile, 0 reduced-motion
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
  return v;
}
vec3 softLight(vec3 b, vec3 s) {
  return mix(b - (1.0 - 2.0 * s) * b * (1.0 - b), b + (2.0 * s - 1.0) * (sqrt(b) - b), step(0.5, s));
}
vec3 hueRotate(vec3 c, float deg) {
  float a = radians(deg), co = cos(a), si = sin(a);
  mat3 m = mat3(
    0.213 + co * 0.787 - si * 0.213, 0.213 - co * 0.213 + si * 0.143, 0.213 - co * 0.213 - si * 0.787,
    0.715 - co * 0.715 - si * 0.715, 0.715 + co * 0.285 + si * 0.140, 0.715 - co * 0.715 + si * 0.715,
    0.072 - co * 0.072 + si * 0.928, 0.072 - co * 0.072 - si * 0.283, 0.072 + co * 0.928 + si * 0.072);
  return m * c;
}

// Une scène vivante : cadrage cover (point focal), caméra de scène, nuages, brume, eau, lumière.
vec3 sceneColor(sampler2D img, sampler2D msk, vec2 s, vec4 p0, vec4 p1, vec4 p2, float lod, out float sky) {
  float t = uTime;
  // Caméra de scène (zoom autour du centre + déplacement), puis cover avec point focal.
  vec2 q = vec2(0.5) + (s - vec2(0.5)) / p1.x - p1.yz;
  float bw = max(uRes.x, uRes.y * p0.x);
  vec2 box = vec2(bw, bw / p0.x);
  vec2 uv = (q * uRes - (uRes - box) * p0.yz) / box;
  uv = clamp(uv, vec2(0.001), vec2(0.999));

  vec4 m = texture(msk, uv);
  sky = m.b;

  // Eau : ondulation douce (double bruit) — l'eau seule, jamais les rochers.
  float w = m.a * p0.w * uMotion;
  vec2 wn = vec2(fbm(uv * vec2(26.0, 70.0) + vec2(t * 0.09, t * 0.04)), fbm(uv * vec2(30.0, 80.0) - vec2(t * 0.07, -t * 0.05))) - 0.5;
  vec2 uvw = uv + wn * 0.0032 * w;

  vec3 col = textureLod(img, uvw, lod).rgb;

  // Ciel : les nuages glissent lentement (masque R, soleil photographié exclu).
  vec2 drift = vec2(0.026 * sin(t * 6.2831 / 64.0), -0.004 * sin(t * 6.2831 / 64.0 + 1.3)) * p1.w * uMotion;
  float edge = smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x);
  col = mix(col, textureLod(img, clamp(uv + drift, 0.0, 1.0), lod).rgb, m.r * edge * step(0.001, uMotion));

  // Reflets mouvants sur l'eau.
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float glint = smoothstep(0.62, 0.92, fbm(uv * vec2(60.0, 150.0) + vec2(t * 0.22, t * 0.05)));
  col += vec3(1.0, 0.95, 0.85) * glint * smoothstep(0.35, 0.9, lum) * 0.1 * w;

  // Brume qui coule (zones G du masque) + voile léger à mi-hauteur.
  float n1 = fbm(vec2(uv.x * 2.6 + t * 0.012, uv.y * 7.0));
  float n2 = fbm(vec2(uv.x * 4.1 - t * 0.0075, uv.y * 10.0 + 4.0));
  float n3 = fbm(vec2(uv.x * 1.8 + t * 0.005, uv.y * 5.0 + 9.0));
  float mist = m.g * (smoothstep(0.42, 0.8, n1) * 0.55 + smoothstep(0.48, 0.85, n2) * 0.32);
  float band = smoothstep(0.3, 0.42, uv.y) * (1.0 - smoothstep(0.58, 0.68, uv.y)) * smoothstep(0.45, 0.85, n3) * 0.12;
  col = mix(col, vec3(0.97, 0.96, 0.94), clamp((mist + band) * p2.x, 0.0, 0.8));

  // Lumière solaire : halo au soleil photographié (sans nouveau disque), sinon depuis la direction réelle.
  vec2 sp = p2.w > 0.5 ? p2.yz : vec2(uSun.z, mix(0.62, 0.12, uSun.w));
  vec2 d = (uv - sp) / vec2(0.36, 0.42);
  float halo = exp(-dot(d, d) * 1.6);
  vec3 warm = mix(vec3(1.0, 0.92, 0.82), vec3(1.0, 0.62, 0.34), uSun.y);
  col += warm * halo * (0.05 + 0.12 * uSun.y) * uSun.x * (0.85 + 0.15 * sin(t * 0.7));
  // Lumière rasante : côté soleil un peu plus chaud et lumineux, côté opposé plus froid.
  float side = clamp(1.0 - abs(uv.x - sp.x) * 1.4, 0.0, 1.0);
  col *= mix(vec3(1.0), mix(vec3(0.96, 0.98, 1.03), vec3(1.05, 1.0, 0.94), side), uSun.y * uSun.x);
  return col;
}

void main() {
  vec2 s = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  vec2 p = uOrigin + (s - uOrigin) / uCam.x - uCam.yz;
  p = vec2(0.5) + (p - vec2(0.5)) / uIntro;

  float lod = uBlur + uHaze * 1.6;
  float skyA = 0.0, skyB = 0.0;
  vec3 col;
  if (uMix < 0.002) {
    col = sceneColor(uImgA, uMaskA, p, uSceneA0, uSceneA1, uSceneA2, lod, skyA);
  } else if (uMix > 0.998) {
    col = sceneColor(uImgB, uMaskB, p, uSceneB0, uSceneB1, uSceneB2, lod, skyB);
  } else {
    vec3 a = sceneColor(uImgA, uMaskA, p, uSceneA0, uSceneA1, uSceneA2, lod, skyA);
    vec3 b = sceneColor(uImgB, uMaskB, p, uSceneB0, uSceneB1, uSceneB2, lod, skyB);
    // Fondu non linéaire « à travers les nuages » : la brume occupe le milieu du passage.
    float k = smoothstep(0.0, 1.0, uMix);
    col = mix(a, b, k);
  }
  float sky = mix(skyA, skyB, smoothstep(0.0, 1.0, uMix));

  // Voile de transition (banc de nuages traversé) + exposition.
  float nh = fbm(p * vec2(3.0, 5.0) + vec2(uTime * 0.03, 0.0));
  col = mix(col, vec3(0.93, 0.92, 0.9), uHaze * (0.42 + 0.3 * nh));
  col *= 1.0 + uHaze * 0.08;

  // Bancs de brume (météo / heure).
  float n1 = fbm(vec2(p.x * 2.6 + uTime * 0.012, p.y * 7.0));
  float fb = exp(-pow((p.y - 0.5) / 0.07, 2.0)) * (0.6 + 0.4 * n1) + exp(-pow((p.y - 0.63) / 0.06, 2.0)) * 0.6;
  col = mix(col, vec3(0.92, 0.93, 0.96), clamp(uFog * fb * 0.4, 0.0, 0.7));
  // Brume générale (brouillard) : la profondeur se perd, le lointain d'abord.
  col = mix(col, vec3(0.84, 0.86, 0.89), clamp(uFog * (0.16 + 0.22 * (1.0 - p.y)), 0.0, 0.5));

  // Exposition suivant la course du soleil (continue), puis étalonnage (même chaîne que les filtres CSS).
  col *= mix(0.86, 1.04, uSun.x);
  col *= uGrade.x;
  col = (col - 0.5) * uGrade.y + 0.5;
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uGrade.z);
  col = hueRotate(col, uGrade.w);
  vec3 sep = vec3(dot(col, vec3(0.393, 0.769, 0.189)), dot(col, vec3(0.349, 0.686, 0.168)), dot(col, vec3(0.272, 0.534, 0.131)));
  col = clamp(mix(col, sep, uSepia), 0.0, 1.0);

  vec3 tc = p.y < 0.55 ? mix(uTint0, uTint1, p.y / 0.55) : mix(uTint1, uTint2, (p.y - 0.55) / 0.45);
  vec3 blended = mix(softLight(col, tc), col * tc, uTintMix.y);
  col = mix(col, blended, uTintMix.x);

  vec2 cell = floor(p * vec2(520.0, 292.0));
  float st = step(0.9972, hash(cell)) * (0.6 + 0.4 * sin(uTime * 1.7 + hash(cell + 3.1) * 40.0));
  col += vec3(st) * uStars * sky * 0.9;

  col = mix(col, softLight(col, vec3(0.47, 0.49, 0.54)), uVeil);
  col *= 1.0 - uDim;
  col = mix(col, uBg, uShade);
  outColor = vec4(col, 1.0);
}
`;
