/**
 * Mode Détails — vue éclatée du DJI Avata 2.
 *
 * Une seule image source : `avata2-exploded-full.png` (1254 × 1254). Elle est
 * découpée en calques disjoints par des masques (public/assets/avata2/exploded-masks,
 * générés hors-ligne à partir de polygones tracés sur le rendu) : au repos, les
 * calques recomposent exactement le rendu, pixel pour pixel.
 *
 * Animation : la CAMÉRA est l'ancre. Le drone assemblé (rendu idle) est recalé sur
 * le module caméra du rendu éclaté (milieu et écart des protections orange) :
 *
 *   x_idle = 1,0674 · x_full + 30,8      y_idle = 1,0674 · y_full + 62,5
 *
 * Chaque calque part d'une position « assemblée » (`from`, en px du rendu éclaté,
 * estimée par superposition avec le drone assemblé) et rejoint sa place éclatée.
 */

export const FULL_SRC = "/assets/avata2/avata2-exploded-full.png";
export const FULL_SIZE = 1254;

/** Silhouette de la vue éclatée (px) : la toile Détails épouse cette boîte. */
export const FULL_BOUNDS = { left: 22, top: 31, right: 1238, bottom: 1215 } as const;
const BW = FULL_BOUNDS.right - FULL_BOUNDS.left;
const BH = FULL_BOUNDS.bottom - FULL_BOUNDS.top;
export const FULL_ASPECT = `${BW} / ${BH}`;

/** Toile du rendu idle exprimée dans le repère du rendu éclaté. */
const IDLE_SCALE = 1.0674;
const IDLE_IN_FULL = { left: -30.8 / IDLE_SCALE, top: -62.5 / IDLE_SCALE, size: FULL_SIZE / IDLE_SCALE };

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

/** Emplacement exact du drone assemblé dans la toile Détails (cible du recalage). */
export const GHOST_STYLE = {
  left: pct((IDLE_IN_FULL.left - FULL_BOUNDS.left) / BW),
  top: pct((IDLE_IN_FULL.top - FULL_BOUNDS.top) / BH),
  width: pct(IDLE_IN_FULL.size / BW),
  height: pct(IDLE_IN_FULL.size / BH),
} as const;

export type PartId = "camera" | "battery" | "propulsion" | "electronics" | "sensors";

export type ExplodeLayer = {
  key: string;
  /** Boîte du masque dans le rendu éclaté (px). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Position « assemblée » de départ : décalage (px du rendu éclaté) et échelle. */
  from: { x: number; y: number; s: number };
  part: PartId | null;
};

/** Ordre = ordre d'empilement pendant le mouvement (la caméra, ancre, au-dessus). */
export const LAYERS: readonly ExplodeLayer[] = [
  { key: "frame", x: 0, y: 7, w: 1244, h: 1225, from: { x: -77, y: -238, s: 0.95 }, part: null },
  { key: "bottom", x: 401, y: 891, w: 530, h: 330, from: { x: -100, y: -340, s: 0.94 }, part: "sensors" },
  { key: "electronics", x: 502, y: 588, w: 333, h: 237, from: { x: -100, y: -145, s: 0.95 }, part: "electronics" },
  { key: "battery", x: 568, y: 429, w: 300, h: 173, from: { x: -115, y: -45, s: 0.95 }, part: "battery" },
  { key: "shell", x: 368, y: 26, w: 520, h: 458, from: { x: -74, y: 144, s: 0.96 }, part: null },
  { key: "propTL", x: 91, y: 240, w: 307, h: 333, from: { x: 185, y: -12, s: 0.92 }, part: "propulsion" },
  { key: "propTR", x: 918, y: 306, w: 310, h: 322, from: { x: -131, y: 14, s: 0.92 }, part: "propulsion" },
  { key: "propBL", x: 83, y: 673, w: 250, h: 277, from: { x: 24, y: -261, s: 0.92 }, part: "propulsion" },
  { key: "propBR", x: 923, y: 703, w: 182, h: 230, from: { x: -235, y: -159, s: 0.92 }, part: "propulsion" },
  { key: "camera", x: 270, y: 478, w: 367, h: 235, from: { x: 0, y: 0, s: 1 }, part: "camera" },
] as const;

export function layerStyle(l: ExplodeLayer) {
  const mask = `url(/assets/avata2/exploded-masks/${l.key}.png)`;
  return {
    box: {
      left: pct((l.x - FULL_BOUNDS.left) / BW),
      top: pct((l.y - FULL_BOUNDS.top) / BH),
      width: pct(l.w / BW),
      height: pct(l.h / BH),
      maskImage: mask,
      WebkitMaskImage: mask,
    },
    img: {
      left: pct(-l.x / l.w),
      top: pct(-l.y / l.h),
      width: pct(FULL_SIZE / l.w),
      height: pct(FULL_SIZE / l.h),
    },
  };
}

/** Conversion px du rendu éclaté → fraction de la toile Détails. */
export const BOUNDS_W = BW;

export type Part = {
  id: PartId;
  label: string;
  title: string;
  text: string;
  img: string;
  /** Point sur la vue éclatée, en px du rendu. */
  dot: { x: number; y: number };
  side: "left" | "right";
  /** Hauteur de l'étiquette (px du rendu). */
  labelY: number;
};

/**
 * Caractéristiques reprises des rendus annotés DJI fournis dans
 * public/assets/avata2/ (aucune donnée inventée).
 */
export const PARTS: readonly Part[] = [
  {
    id: "camera",
    label: "Caméra",
    title: "Module caméra",
    text: "Capteur CMOS 1/1,3 pouce de 12 MP, objectif ultra grand-angle de 155° ouvert à f/2.8, sur nacelle mécanique un axe. Stabilisation RockSteady 3.0+ et HorizonSteady.",
    img: "/assets/avata2/avata2-camera-detail-dark.png",
    dot: { x: 390, y: 630 },
    side: "left",
    labelY: 630,
  },
  {
    id: "battery",
    label: "Batterie",
    title: "Batterie intelligente",
    text: "Li-ion 4S, 2 150 mAh, 14,76 V, 31,7 Wh, environ 145 g. Jusqu’à 23 minutes de vol.",
    img: "/assets/avata2/avata2-battery-removal-dark.png",
    dot: { x: 771, y: 470 },
    side: "right",
    labelY: 430,
  },
  {
    id: "propulsion",
    label: "Propulsion",
    title: "Propulsion",
    text: "Quatre moteurs brushless et hélices tripales, protégés par des carénages intégrés au châssis.",
    img: "/assets/avata2/avata2-propulsion-exploded-dark.png",
    dot: { x: 248, y: 409 },
    side: "left",
    labelY: 380,
  },
  {
    id: "electronics",
    label: "Électronique",
    title: "Électronique",
    text: "Carte principale, transmission DJI O4 avec retour vidéo 1080p jusqu’à 100 i/s, GNSS GPS + Galileo + BeiDou, 46 Go de stockage interne et lecteur microSD.",
    img: "/assets/avata2/avata2-electronics-exploded-dark.png",
    dot: { x: 692, y: 652 },
    side: "right",
    labelY: 700,
  },
  {
    id: "sensors",
    label: "Capteurs dessous",
    title: "Capteurs inférieurs",
    text: "Capteur ToF et caméras de positionnement visuel sous le châssis, utilisés pour stabiliser le vol près du sol et en intérieur.",
    img: "/assets/avata2/avata2-underside-sensors-dark.png",
    dot: { x: 650, y: 1048 },
    side: "left",
    labelY: 1030,
  },
] as const;

/** Position (en % de la toile Détails) d'un point du rendu éclaté. */
export function boundsPct(x: number, y: number) {
  return { x: ((x - FULL_BOUNDS.left) / BW) * 100, y: ((y - FULL_BOUNDS.top) / BH) * 100 };
}
