/**
 * Données du mode Détails (vue éclatée du DJI Avata 2).
 *
 * Les trois rendus de décomposition n'ont ni le même cadrage ni la même échelle.
 * Ils sont recalés sur le MODULE CAMÉRA (milieu et écart des deux protections orange,
 * mesurés sur chaque PNG) : la caméra reste immobile pendant la décomposition et
 * les autres pièces s'en éloignent. Les valeurs projettent chaque image dans
 * l'espace pixel du rendu idle (1254 × 1254) :
 *
 *   x_idle = s · x + tx      y_idle = s · y + ty
 */

export type ExplodeStep = {
  key: "open" | "medium" | "full";
  src: string;
  s: number;
  tx: number;
  ty: number;
  /** Milieu du module caméra dans l'image (px), origine des micro-échelles. */
  anchor: { x: number; y: number };
};

export const EXPLODE_STEPS: readonly ExplodeStep[] = [
  {
    key: "open",
    src: "/assets/avata2/avata2-open-electronics.png",
    s: 1.0097,
    tx: 21.5,
    ty: -39.5,
    anchor: { x: 412, y: 774.5 },
  },
  {
    key: "medium",
    src: "/assets/avata2/avata2-exploded-medium.png",
    s: 1.1566,
    tx: -112.5,
    ty: -152.7,
    anchor: { x: 475.5, y: 774 },
  },
  {
    key: "full",
    src: "/assets/avata2/avata2-exploded-full.png",
    s: 1.0674,
    tx: 30.8,
    ty: 62.5,
    anchor: { x: 381, y: 637 },
  },
] as const;

/** Silhouette (alpha > 50 %) de la vue éclatée complète, en px de son image. */
export const FULL_BOUNDS = { left: 22, top: 31, right: 1238, bottom: 1215 } as const;

export type PartId = "camera" | "battery" | "propulsion" | "electronics" | "sensors";

export type Part = {
  id: PartId;
  label: string;
  title: string;
  text: string;
  img: string;
  /** Position du point sur la vue éclatée complète, en % de l'image. */
  dot: { x: number; y: number };
  /** Côté et hauteur (en % de l'image) de l'étiquette sur desktop. */
  side: "left" | "right";
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
    dot: { x: 31.1, y: 50.2 },
    side: "left",
    labelY: 50,
  },
  {
    id: "battery",
    label: "Batterie",
    title: "Batterie intelligente",
    text: "Li-ion 4S, 2 150 mAh, 14,76 V, 31,7 Wh, environ 145 g. Jusqu’à 23 minutes de vol.",
    img: "/assets/avata2/avata2-battery-removal-dark.png",
    dot: { x: 61.5, y: 37.5 },
    side: "right",
    labelY: 33,
  },
  {
    id: "propulsion",
    label: "Propulsion",
    title: "Propulsion",
    text: "Quatre moteurs brushless et hélices tripales, protégés par des carénages intégrés au châssis.",
    img: "/assets/avata2/avata2-propulsion-exploded-dark.png",
    dot: { x: 19.8, y: 32.6 },
    side: "left",
    labelY: 30,
  },
  {
    id: "electronics",
    label: "Électronique",
    title: "Électronique",
    text: "Carte principale, transmission DJI O4 avec retour vidéo 1080p jusqu’à 100 i/s, GNSS GPS + Galileo + BeiDou, 46 Go de stockage interne et lecteur microSD.",
    img: "/assets/avata2/avata2-electronics-exploded-dark.png",
    dot: { x: 55.2, y: 52 },
    side: "right",
    labelY: 56,
  },
  {
    id: "sensors",
    label: "Capteurs dessous",
    title: "Capteurs inférieurs",
    text: "Capteur ToF et caméras de positionnement visuel sous le châssis, utilisés pour stabiliser le vol près du sol et en intérieur.",
    img: "/assets/avata2/avata2-underside-sensors-dark.png",
    dot: { x: 51.8, y: 83.6 },
    side: "left",
    labelY: 82,
  },
] as const;
