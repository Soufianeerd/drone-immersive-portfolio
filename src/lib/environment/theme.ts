import type { Solar } from "./solar";
import type { DayPhase, Season, Weather } from "./types";

/**
 * Traduction de l'état environnemental en direction artistique.
 * Le cadrage ne change jamais : seuls la lumière, la couleur, la brume et la météo varient.
 * Tant que les variantes photographiques alignées ne sont pas livrées, l'étalonnage
 * est appliqué au master (filtres + voiles). Voir ENVIRONMENT_VARIANTS.
 */

type Grade = { brightness: number; contrast: number; saturate: number; hue: number; sepia: number };

const PHASE: Record<DayPhase, Grade & { tint: string; tintOpacity: number; tintBlend: string; stars: number; fog: number; productLight: number }> = {
  dawn: { brightness: 0.92, contrast: 0.96, saturate: 0.78, hue: -14, sepia: 0, tint: "linear-gradient(180deg, rgb(150 160 205) 0%, rgb(232 186 190) 55%, rgb(120 130 160) 100%)", tintOpacity: 0.28, tintBlend: "soft-light", stars: 0, fog: 0.55, productLight: 0.92 },
  day: { brightness: 1.06, contrast: 1.02, saturate: 0.82, hue: -10, sepia: 0, tint: "linear-gradient(180deg, rgb(120 170 225) 0%, rgb(230 236 242) 60%, rgb(210 214 220) 100%)", tintOpacity: 0.32, tintBlend: "soft-light", stars: 0, fog: 0.18, productLight: 1.04 },
  golden: { brightness: 1, contrast: 1.02, saturate: 1.05, hue: 0, sepia: 0, tint: "linear-gradient(180deg, rgb(255 170 90) 0%, rgb(255 210 150) 50%, rgb(120 70 40) 100%)", tintOpacity: 0.12, tintBlend: "soft-light", stars: 0, fog: 0.2, productLight: 1 },
  dusk: { brightness: 0.72, contrast: 1.04, saturate: 0.85, hue: -22, sepia: 0, tint: "linear-gradient(180deg, rgb(70 60 130) 0%, rgb(190 110 120) 55%, rgb(40 35 60) 100%)", tintOpacity: 0.42, tintBlend: "multiply", stars: 0.25, fog: 0.3, productLight: 0.78 },
  night: { brightness: 0.56, contrast: 1.1, saturate: 0.55, hue: -32, sepia: 0, tint: "linear-gradient(180deg, rgb(10 18 45) 0%, rgb(30 45 90) 55%, rgb(8 12 28) 100%)", tintOpacity: 0.5, tintBlend: "multiply", stars: 1, fog: 0.22, productLight: 0.72 },
};

const WEATHER: Record<Weather, { brightness: number; saturate: number; contrast: number; veil: number; fog: number; sun: number }> = {
  clear: { brightness: 1, saturate: 1, contrast: 1.03, veil: 0, fog: 0, sun: 1 },
  cloudy: { brightness: 0.88, saturate: 0.72, contrast: 0.9, veil: 0.34, fog: 0.18, sun: 0.35 },
  rain: { brightness: 0.74, saturate: 0.56, contrast: 0.96, veil: 0.48, fog: 0.32, sun: 0.15 },
  fog: { brightness: 0.96, saturate: 0.62, contrast: 0.78, veil: 0.24, fog: 1, sun: 0.3 },
  snow: { brightness: 1.0, saturate: 0.68, contrast: 0.9, veil: 0.26, fog: 0.4, sun: 0.4 },
};

/** Part de lumière solaire directe selon la météo (halo, lumière rasante). */
export const weatherSun = (w: Weather) => WEATHER[w].sun;

const SEASON: Record<Season, { hue: number; sepia: number; saturate: number }> = {
  spring: { hue: 2, sepia: 0, saturate: 1.04 },
  summer: { hue: 0, sepia: 0, saturate: 1 },
  autumn: { hue: 4, sepia: 0.08, saturate: 1.02 },
  winter: { hue: -6, sepia: 0, saturate: 0.94 },
};

/** Couleurs d'interface (palette de marque : charcoal / olive / stone / sand + accent de lumière). */
const AMBIENT: Record<DayPhase, { bg: string; surface: string; text: string; muted: string; accent: string; warmth: number; shadow: string }> = {
  dawn: { bg: "#0f1013", surface: "#17181c", text: "#f5f3ee", muted: "#b9b4ab", accent: "#e3b0a0", warmth: 0.45, shadow: "rgb(10 10 20 / 0.55)" },
  day: { bg: "#0f1011", surface: "#18191a", text: "#f5f3ee", muted: "#c0bab0", accent: "#d9cfbf", warmth: 0.3, shadow: "rgb(0 0 0 / 0.5)" },
  golden: { bg: "#0e0e0e", surface: "#171513", text: "#f5f3ee", muted: "#c9c2b5", accent: "#e8a453", warmth: 0.85, shadow: "rgb(20 8 0 / 0.6)" },
  dusk: { bg: "#0e0d12", surface: "#17151d", text: "#f3f1ee", muted: "#bdb4b8", accent: "#d39478", warmth: 0.6, shadow: "rgb(15 5 20 / 0.6)" },
  night: { bg: "#0a0c11", surface: "#12151c", text: "#eef0f4", muted: "#a9b1c0", accent: "#9fb6da", warmth: 0.1, shadow: "rgb(0 5 20 / 0.7)" },
};

export function themeFor(phase: DayPhase, weather: Weather, season: Season, solar?: Solar) {
  const p = PHASE[phase];
  const w = WEATHER[weather];
  const s = SEASON[season];
  const scene = [
    `brightness(${(p.brightness * w.brightness).toFixed(3)})`,
    `contrast(${(p.contrast * w.contrast).toFixed(3)})`,
    `saturate(${(p.saturate * w.saturate * s.saturate).toFixed(3)})`,
    `hue-rotate(${p.hue + s.hue}deg)`,
    `sepia(${(p.sepia + s.sepia).toFixed(2)})`,
  ].join(" ");
  // Lumière sur les produits : suit la course réelle du soleil (continue), sinon la phase.
  const pl = (solar ? 0.72 + 0.32 * solar.intensity : p.productLight) * (weather === "clear" ? 1 : 0.92);
  const ps = 0.92 * w.saturate + 0.08;
  const ph = Math.round((p.hue + s.hue) * 0.5);
  // Filtre neutre → « none » : aucun calque filtré inutile sous les animations des objets.
  const product = Math.abs(pl - 1) < 0.01 && Math.abs(ps - 1) < 0.01 && ph === 0 ? "none" : `brightness(${pl.toFixed(3)}) saturate(${ps.toFixed(3)}) hue-rotate(${ph}deg)`;
  const a = AMBIENT[phase];
  const rainy = weather === "rain" || weather === "cloudy";
  return {
    vars: {
      "--scene-filter": scene,
      "--product-filter": product,
      "--scene-tint": p.tint,
      "--scene-tint-opacity": String(p.tintOpacity),
      "--scene-tint-blend": p.tintBlend,
      "--scene-veil": String(w.veil),
      "--scene-fog": String(Math.min(1, p.fog + w.fog)),
      "--scene-stars": String(weather === "clear" ? p.stars : p.stars * 0.25),
      "--ambient-bg": a.bg,
      "--ambient-surface": a.surface,
      "--ambient-text": a.text,
      "--ambient-muted": a.muted,
      "--ambient-accent": rainy ? `color-mix(in oklab, ${a.accent} 70%, #9aa3ad)` : a.accent,
      "--ambient-warmth": String(rainy ? a.warmth * 0.6 : a.warmth),
      "--ambient-shadow": a.shadow,
      "--ambient-overlay": phase === "night" ? "rgb(5 8 18 / 0.55)" : "rgb(10 8 6 / 0.35)",
    } as Record<string, string>,
  };
}

/** Teinte de phase en valeurs numériques (mêmes couleurs que les dégradés CSS) pour le rendu WebGL du monde. */
const TINT_RGB: Record<DayPhase, [number, number, number][]> = {
  dawn: [[150, 160, 205], [232, 186, 190], [120, 130, 160]],
  day: [[120, 170, 225], [230, 236, 242], [210, 214, 220]],
  golden: [[255, 170, 90], [255, 210, 150], [120, 70, 40]],
  dusk: [[70, 60, 130], [190, 110, 120], [40, 35, 60]],
  night: [[10, 18, 45], [30, 45, 90], [8, 12, 28]],
};

export type SceneUniforms = {
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  sepia: number;
  tint: [number, number, number][];
  tintOpacity: number;
  tintMultiply: number;
  veil: number;
  fog: number;
  stars: number;
  bg: [number, number, number];
};

/** Étalonnage du paysage (même logique que `themeFor`), en nombres pour le shader du monde. */
export function sceneUniforms(phase: DayPhase, weather: Weather, season: Season): SceneUniforms {
  const p = PHASE[phase];
  const w = WEATHER[weather];
  const s = SEASON[season];
  const hex = AMBIENT[phase].bg;
  const bg: [number, number, number] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  return {
    brightness: p.brightness * w.brightness,
    contrast: p.contrast * w.contrast,
    saturate: p.saturate * w.saturate * s.saturate,
    hue: p.hue + s.hue,
    sepia: p.sepia + s.sepia,
    tint: TINT_RGB[phase].map((c) => c.map((v) => v / 255) as [number, number, number]),
    tintOpacity: p.tintOpacity,
    tintMultiply: p.tintBlend === "multiply" ? 1 : 0,
    veil: w.veil,
    fog: Math.min(1, p.fog + w.fog),
    stars: weather === "clear" ? p.stars : p.stars * 0.25,
    bg,
  };
}

/* ------------------------------------------------------------------ */
/* Étalonnage continu du monde (course solaire réelle)                  */
/* ------------------------------------------------------------------ */

type Key = { el: number; brightness: number; contrast: number; saturate: number; hue: number; tint: [number, number, number][]; tintOpacity: number; tintMultiply: number; stars: number; fog: number };

/** Images clés par élévation du soleil. Matin et soir ont leurs propres couleurs. */
const MORNING: Key[] = [
  { el: -18, brightness: 0.5, contrast: 1.1, saturate: 0.5, hue: -32, tint: TINT_RGB.night, tintOpacity: 0.55, tintMultiply: 1, stars: 1, fog: 0.22 },
  { el: -6, brightness: 0.7, contrast: 1.02, saturate: 0.7, hue: -20, tint: [[90, 100, 160], [210, 160, 180], [70, 75, 110]], tintOpacity: 0.42, tintMultiply: 1, stars: 0.35, fog: 0.5 },
  { el: 0, brightness: 0.88, contrast: 0.97, saturate: 0.8, hue: -12, tint: TINT_RGB.dawn, tintOpacity: 0.3, tintMultiply: 0, stars: 0, fog: 0.55 },
  { el: 8, brightness: 0.98, contrast: 1.0, saturate: 0.92, hue: -4, tint: [[255, 196, 150], [250, 226, 200], [150, 120, 100]], tintOpacity: 0.18, tintMultiply: 0, stars: 0, fog: 0.32 },
  { el: 25, brightness: 1.03, contrast: 1.05, saturate: 0.95, hue: -6, tint: TINT_RGB.day, tintOpacity: 0.18, tintMultiply: 0, stars: 0, fog: 0.1 },
  { el: 60, brightness: 1.05, contrast: 1.06, saturate: 0.92, hue: -8, tint: TINT_RGB.day, tintOpacity: 0.22, tintMultiply: 0, stars: 0, fog: 0.08 },
];
const EVENING: Key[] = [
  { el: -18, brightness: 0.5, contrast: 1.1, saturate: 0.5, hue: -32, tint: TINT_RGB.night, tintOpacity: 0.55, tintMultiply: 1, stars: 1, fog: 0.22 },
  { el: -6, brightness: 0.66, contrast: 1.05, saturate: 0.8, hue: -24, tint: TINT_RGB.dusk, tintOpacity: 0.46, tintMultiply: 1, stars: 0.3, fog: 0.3 },
  { el: 0, brightness: 0.86, contrast: 1.04, saturate: 0.98, hue: -6, tint: [[230, 120, 90], [250, 170, 130], [90, 55, 50]], tintOpacity: 0.26, tintMultiply: 0, stars: 0, fog: 0.24 },
  { el: 7, brightness: 1.0, contrast: 1.02, saturate: 1.06, hue: 0, tint: TINT_RGB.golden, tintOpacity: 0.16, tintMultiply: 0, stars: 0, fog: 0.2 },
  { el: 25, brightness: 1.03, contrast: 1.05, saturate: 0.98, hue: -4, tint: [[200, 200, 210], [240, 236, 228], [200, 196, 190]], tintOpacity: 0.14, tintMultiply: 0, stars: 0, fog: 0.1 },
  { el: 60, brightness: 1.05, contrast: 1.06, saturate: 0.92, hue: -8, tint: TINT_RGB.day, tintOpacity: 0.22, tintMultiply: 0, stars: 0, fog: 0.08 },
];

function sample(keys: Key[], el: number) {
  const e = Math.min(keys[keys.length - 1].el, Math.max(keys[0].el, el));
  let i = 0;
  while (i < keys.length - 2 && e > keys[i + 1].el) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = (e - a.el) / (b.el - a.el);
  const l = (x: number, y: number) => x + (y - x) * k;
  return {
    brightness: l(a.brightness, b.brightness),
    contrast: l(a.contrast, b.contrast),
    saturate: l(a.saturate, b.saturate),
    hue: l(a.hue, b.hue),
    tint: a.tint.map((c, j) => c.map((v, m) => l(v, b.tint[j][m]) / 255)) as [number, number, number][],
    tintOpacity: l(a.tintOpacity, b.tintOpacity),
    tintMultiply: l(a.tintMultiply, b.tintMultiply),
    stars: l(a.stars, b.stars),
    fog: l(a.fog, b.fog),
  };
}

/**
 * Étalonnage du monde piloté par la position RÉELLE du soleil (continu : 6 h 20 ≠ 8 h ≠ midi ≠ 17 h),
 * puis météo et saison. Une phase forcée par paramètre de test (?phase=) reste prioritaire.
 */
export function worldUniforms(phase: DayPhase, weather: Weather, season: Season, solar: Solar, forcedPhase: boolean): SceneUniforms {
  if (forcedPhase) return sceneUniforms(phase, weather, season);
  const w = WEATHER[weather];
  const s = SEASON[season];
  const g = sample(solar.progress < 0.5 ? MORNING : EVENING, solar.elevation);
  const hex = AMBIENT[phase].bg;
  const bg: [number, number, number] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  return {
    brightness: g.brightness * w.brightness,
    contrast: g.contrast * w.contrast,
    saturate: g.saturate * w.saturate * s.saturate,
    hue: g.hue + s.hue,
    sepia: s.sepia,
    tint: g.tint,
    tintOpacity: g.tintOpacity,
    tintMultiply: g.tintMultiply,
    veil: w.veil,
    fog: Math.min(1, g.fog + w.fog),
    stars: weather === "clear" ? g.stars : g.stars * 0.25,
    bg,
  };
}

/**
 * Variantes photographiques alignées (même cadrage) — à livrer.
 * Clé : `${season}/${phase}`. Absent → master + étalonnage.
 */
export const ENVIRONMENT_VARIANTS: Partial<Record<`${Season}/${DayPhase}`, string>> = {};
