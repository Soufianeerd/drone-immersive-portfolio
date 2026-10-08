/**
 * Shader du monde : tout le paysage vivant en UNE passe GPU.
 *
 * Entrées : photo maître (cadrage fixe) + masques (R = ciel qui dérive, G = mer de nuages,
 * B = ciel pour les étoiles). Le relief, le rocher et les montagnes restent la photo réelle ;
 * seuls bougent le ciel (vrais nuages qui glissent derrière les sommets), une brume qui coule
 * sur la mer de nuages et la lumière. L'étalonnage (heure / météo / saison) reprend exactement
 * la chaîne des filtres CSS d'origine : brightness → contrast → saturate → hue-rotate → sepia,
 * puis teinte de phase (soft-light ou multiply) et voile météo.
 */
export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImg;
uniform sampler2D uMask;
uniform vec2 uRes;      // pixels du canvas
uniform float uAr;      // ratio de la photo (2560 / 1441)
uniform float uTime;    // secondes (figé en reduced-motion)
uniform float uIntro;   // échelle d'apparition (autour du centre)
uniform vec3 uCam;      // échelle, translation x, translation y (fraction d'écran)
uniform vec2 uOrigin;   // origine de l'échelle (fraction d'écran, y vers le bas)
uniform vec4 uGrade;    // brightness, contrast, saturate, hue (deg)
uniform float uSepia;
uniform vec3 uTint0;
uniform vec3 uTint1;
uniform vec3 uTint2;
uniform vec2 uTintMix;  // opacité, mode (0 soft-light, 1 multiply)
uniform float uVeil;
uniform float uFog;
uniform float uStars;
uniform vec3 uBg;
uniform float uShade;
uniform float uBlur;
uniform float uDim;
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

void main() {
  // Écran (0..1, y vers le bas) → caméra inverse → cadrage « cover » de la photo.
  vec2 s = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  vec2 p = uOrigin + (s - uOrigin) / uCam.x - uCam.yz;
  p = vec2(0.5) + (p - vec2(0.5)) / uIntro;
  float bw = max(uRes.x, uRes.y * uAr);
  vec2 box = vec2(bw, bw / uAr);
  vec2 uv = (p * uRes - (uRes - box) * 0.5) / box;
  uv = clamp(uv, vec2(0.0), vec2(1.0));

  vec4 m = texture(uMask, uv);
  float lod = uBlur;
  vec3 col = textureLod(uImg, uv, lod).rgb;

  // Ciel : les vrais nuages glissent lentement derrière les sommets.
  float t = uTime;
  vec2 drift = vec2(0.026 * sin(t * 6.2831 / 64.0), -0.004 * sin(t * 6.2831 / 64.0 + 1.3));
  float edge = smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x);
  col = mix(col, textureLod(uImg, clamp(uv + drift, 0.0, 1.0), lod).rgb, m.r * edge);

  // Brume qui coule sur la mer de nuages (deux vitesses) + voile léger devant les montagnes.
  float n1 = fbm(vec2(uv.x * 2.6 + t * 0.012, uv.y * 7.0));
  float n2 = fbm(vec2(uv.x * 4.1 - t * 0.0075, uv.y * 10.0 + 4.0));
  float n3 = fbm(vec2(uv.x * 1.8 + t * 0.005, uv.y * 5.0 + 9.0));
  float sea = m.g * (smoothstep(0.42, 0.8, n1) * 0.55 + smoothstep(0.48, 0.85, n2) * 0.32);
  float band = smoothstep(0.3, 0.42, uv.y) * (1.0 - smoothstep(0.58, 0.68, uv.y)) * smoothstep(0.45, 0.85, n3) * 0.16;
  col = mix(col, vec3(0.97, 0.96, 0.94), clamp(sea + band, 0.0, 0.8));

  // La lumière respire sur le sommet.
  vec2 g = (uv - vec2(0.5, 0.26)) / vec2(0.26, 0.32);
  col += vec3(1.0, 0.74, 0.5) * exp(-dot(g, g) * 2.0) * (0.06 + 0.06 * sin(t * 0.7));

  // Bancs de brume (intensité pilotée par la météo / la phase).
  float fb = exp(-pow((uv.y - 0.5) / 0.07, 2.0)) * (0.6 + 0.4 * n1) + exp(-pow((uv.y - 0.63) / 0.06, 2.0)) * 0.7 * (0.6 + 0.4 * n2);
  col = mix(col, vec3(0.92, 0.93, 0.96), clamp(uFog * fb * 0.42, 0.0, 0.7));

  // Étalonnage (même chaîne que les filtres CSS).
  col *= uGrade.x;
  col = (col - 0.5) * uGrade.y + 0.5;
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uGrade.z);
  col = hueRotate(col, uGrade.w);
  vec3 sep = vec3(dot(col, vec3(0.393, 0.769, 0.189)), dot(col, vec3(0.349, 0.686, 0.168)), dot(col, vec3(0.272, 0.534, 0.131)));
  col = clamp(mix(col, sep, uSepia), 0.0, 1.0);

  // Teinte de phase.
  vec3 tc = uv.y < 0.55 ? mix(uTint0, uTint1, uv.y / 0.55) : mix(uTint1, uTint2, (uv.y - 0.55) / 0.45);
  vec3 blended = mix(softLight(col, tc), col * tc, uTintMix.y);
  col = mix(col, blended, uTintMix.x);

  // Étoiles (nuit), uniquement dans le ciel.
  vec2 cell = floor(uv * vec2(520.0, 292.0));
  float st = step(0.9972, hash(cell)) * (0.6 + 0.4 * sin(t * 1.7 + hash(cell + 3.1) * 40.0));
  col += vec3(st) * uStars * m.b * 0.9;

  // Voile météo.
  col = mix(col, softLight(col, vec3(0.47, 0.49, 0.54)), uVeil);

  // Focus produit, profondeur au scroll.
  col *= 1.0 - uDim;
  col = mix(col, uBg, uShade);
  outColor = vec4(col, 1.0);
}
`;
