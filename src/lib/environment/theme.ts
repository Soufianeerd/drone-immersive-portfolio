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

const WEATHER: Record<Weather, { brightness: number; saturate: number; contrast: number; veil: number; fog: number }> = {
  clear: { brightness: 1, saturate: 1, contrast: 1, veil: 0, fog: 0 },
  cloudy: { brightness: 0.92, saturate: 0.82, contrast: 0.97, veil: 0.22, fog: 0.15 },
  rain: { brightness: 0.82, saturate: 0.7, contrast: 1.06, veil: 0.32, fog: 0.25 },
  fog: { brightness: 0.95, saturate: 0.72, contrast: 0.9, veil: 0.18, fog: 0.85 },
  snow: { brightness: 1.02, saturate: 0.78, contrast: 0.96, veil: 0.2, fog: 0.35 },
};

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

export function themeFor(phase: DayPhase, weather: Weather, season: Season) {
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
  const pl = p.productLight * (weather === "clear" ? 1 : 0.92);
  const product = `brightness(${pl.toFixed(3)}) saturate(${(0.92 * w.saturate + 0.08).toFixed(3)}) hue-rotate(${Math.round((p.hue + s.hue) * 0.5)}deg)`;
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

/**
 * Variantes photographiques alignées (même cadrage) — à livrer.
 * Clé : `${season}/${phase}`. Absent → master + étalonnage.
 */
export const ENVIRONMENT_VARIANTS: Partial<Record<`${Season}/${DayPhase}`, string>> = {};
