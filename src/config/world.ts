/**
 * LE MONDE — source de vérité unique des paysages traversés.
 *
 * - `HERO_SCENE` : la montagne maître du hero (rocher + matériel posé dessus). Jamais remplacée
 *   tant que le hero est à l'écran : les produits y restent physiquement posés.
 * - `JOURNEY` : le voyage autonome derrière le reste du site (photos fournies, aucune image générée).
 *   Chaque scène a son propre mouvement de caméra, sa brume, son eau et son soleil photographié.
 *
 * Masques techniques (RGBA, calculés depuis chaque photo) : R = ciel qui dérive, G = brume,
 * B = ciel (étoiles), A = eau. Voir scripts de préparation.
 */

export type WorldEnvironment = "mountain" | "forest" | "lake" | "coast" | "waterfall" | "snow" | "canyon" | "desert";

export type WorldScene = {
  id: string;
  label: string;
  src: string;
  mobileSrc: string;
  mask: string;
  /** Ratio largeur / hauteur de la photo. */
  aspect: number;
  priority: "primary" | "optional";
  environment: WorldEnvironment;
  /**
   * Mouvement de caméra propre à la scène, sur toute sa durée d'affichage :
   * zoom (≥ 1) et déplacement (fraction d'écran) de « from » à « to ».
   */
  motion: { zoomFrom: number; zoomTo: number; panFrom: [number, number]; panTo: [number, number] };
  /** Point d'intérêt (0..1) : cadrage conservé sur écran étroit (mobile), jamais d'étirement. */
  focalPoint: { x: number; y: number };
  /** Ondulation / reflets de l'eau (0 = aucune). */
  water: number;
  /** Brume (zones G du masque) et dérive des nuages du ciel. */
  atmosphere: { mist: number; cloudDrift: number };
  /** Soleil déjà présent sur la photo (position 0..1) : jamais de second disque solaire. */
  bakedSun: { x: number; y: number } | null;
};

const S = "/environment/scenes";
const scene = (file: string, s: Omit<WorldScene, "src" | "mobileSrc" | "mask" | "aspect" | "priority">): WorldScene => ({
  src: `${S}/optimized/${file}.webp`,
  mobileSrc: `${S}/optimized/${file}-m.webp`,
  mask: `${S}/masks/${file}.png`,
  aspect: 1672 / 941,
  priority: "primary",
  ...s,
});

export const HERO_SCENE: WorldScene = {
  id: "hero",
  label: "Montagne — rocher du hero",
  src: "/environment/master/landscape.webp",
  mobileSrc: "/environment/master/landscape-1280.webp",
  mask: "/environment/master/world-masks.png",
  aspect: 2560 / 1441,
  priority: "primary",
  environment: "mountain",
  // Immobile : le matériel est posé sur le rocher de cette photo.
  motion: { zoomFrom: 1, zoomTo: 1, panFrom: [0, 0], panTo: [0, 0] },
  focalPoint: { x: 0.5, y: 0.5 },
  water: 0,
  atmosphere: { mist: 1, cloudDrift: 1 },
  bakedSun: null,
};

export const JOURNEY: WorldScene[] = [
  scene("01-montagnes-mer-de-nuages-golden", {
    id: "montagnes",
    label: "Montagnes, mer de nuages",
    environment: "mountain",
    motion: { zoomFrom: 1.04, zoomTo: 1.14, panFrom: [0.012, 0.01], panTo: [-0.03, -0.012] }, // vers les sommets
    focalPoint: { x: 0.7, y: 0.4 },
    water: 0,
    atmosphere: { mist: 1, cloudDrift: 1 },
    bakedSun: { x: 0.14, y: 0.29 },
  }),
  scene("02-foret-vallee-riviere", {
    id: "foret",
    label: "Forêt, vallée, rivière",
    environment: "forest",
    motion: { zoomFrom: 1.08, zoomTo: 1.1, panFrom: [0.03, -0.006], panTo: [-0.03, 0.012] }, // travelling latéral, légère descente
    focalPoint: { x: 0.72, y: 0.5 },
    water: 0.7,
    atmosphere: { mist: 0.6, cloudDrift: 0.8 },
    bakedSun: null,
  }),
  scene("03-vallee-foret-brumeuse-golden", {
    id: "brume",
    label: "Vallée forestière brumeuse",
    environment: "forest",
    motion: { zoomFrom: 1.03, zoomTo: 1.1, panFrom: [-0.01, 0], panTo: [0.012, -0.01] },
    focalPoint: { x: 0.45, y: 0.55 },
    water: 0,
    atmosphere: { mist: 1.2, cloudDrift: 0.8 },
    bakedSun: { x: 0.895, y: 0.19 },
  }),
  scene("04-lac-alpin-montagnes", {
    id: "lac",
    label: "Lac alpin",
    environment: "lake",
    motion: { zoomFrom: 1.03, zoomTo: 1.08, panFrom: [0, 0.006], panTo: [-0.008, -0.004] }, // push-in très subtil
    focalPoint: { x: 0.6, y: 0.55 },
    water: 0.55,
    atmosphere: { mist: 0.3, cloudDrift: 1 },
    bakedSun: null,
  }),
  scene("05-falaises-ocean-golden", {
    id: "falaises",
    label: "Falaises, océan",
    environment: "coast",
    motion: { zoomFrom: 1.08, zoomTo: 1.1, panFrom: [-0.03, 0], panTo: [0.025, -0.008] }, // le long de la falaise
    focalPoint: { x: 0.35, y: 0.55 },
    water: 1,
    atmosphere: { mist: 0.2, cloudDrift: 1 },
    bakedSun: { x: 0.94, y: 0.215 },
  }),
  scene("06-cote-rocheuse-vagues", {
    id: "cote",
    label: "Côte rocheuse, vagues",
    environment: "coast",
    motion: { zoomFrom: 1.06, zoomTo: 1.1, panFrom: [0.02, 0.006], panTo: [-0.02, -0.006] },
    focalPoint: { x: 0.55, y: 0.6 },
    water: 1.1,
    atmosphere: { mist: 0.2, cloudDrift: 1 },
    bakedSun: { x: 0.94, y: 0.17 },
  }),
  scene("07-cascade-riviere-montagnes", {
    id: "cascade",
    label: "Cascade, rivière",
    environment: "waterfall",
    motion: { zoomFrom: 1.03, zoomTo: 1.09, panFrom: [0.01, 0.004], panTo: [-0.018, -0.004] }, // vers l'eau
    focalPoint: { x: 0.72, y: 0.55 },
    water: 0.9,
    atmosphere: { mist: 0.4, cloudDrift: 0.8 },
    bakedSun: { x: 0.12, y: 0.17 },
  }),
  scene("08-montagnes-enneigees", {
    id: "neige",
    label: "Montagnes enneigées",
    environment: "snow",
    motion: { zoomFrom: 1.03, zoomTo: 1.12, panFrom: [-0.012, 0.012], panTo: [0.01, -0.012] },
    focalPoint: { x: 0.6, y: 0.4 },
    water: 0,
    atmosphere: { mist: 1.1, cloudDrift: 1 },
    bakedSun: { x: 0.106, y: 0.2 },
  }),
  scene("09-canyon-riviere-golden", {
    id: "canyon",
    label: "Canyon, rivière",
    environment: "canyon",
    motion: { zoomFrom: 1.02, zoomTo: 1.12, panFrom: [0.004, -0.004], panTo: [-0.01, 0.01] }, // avance dans la gorge
    focalPoint: { x: 0.55, y: 0.6 },
    water: 0.5,
    atmosphere: { mist: 0.3, cloudDrift: 0.9 },
    bakedSun: { x: 0.04, y: 0.22 },
  }),
  scene("10-desert-dunes-golden", {
    id: "desert",
    label: "Désert, dunes",
    environment: "desert",
    motion: { zoomFrom: 1.08, zoomTo: 1.11, panFrom: [0.028, 0], panTo: [-0.028, -0.006] }, // latéral sur les dunes
    focalPoint: { x: 0.6, y: 0.6 },
    water: 0,
    atmosphere: { mist: 0.25, cloudDrift: 0.7 },
    bakedSun: { x: 0.24, y: 0.228 },
  }),
];

/** Rythme du voyage (secondes) : durée d'une scène et de son fondu atmosphérique. */
export const SCENE_DURATION = 24;
export const SCENE_TRANSITION = 4.5;

/** Ordre du voyage selon la saison (même géographie, priorités différentes ; jamais de neige sur une plage). */
export function journeyOrder(season: "spring" | "summer" | "autumn" | "winter"): WorldScene[] {
  const by = (ids: string[]) => ids.map((id) => JOURNEY.find((s) => s.id === id)!).filter(Boolean);
  switch (season) {
    case "winter":
      return by(["montagnes", "neige", "lac", "brume", "foret", "cascade", "falaises", "cote", "canyon", "desert"]);
    case "summer":
      return by(["montagnes", "foret", "lac", "cascade", "falaises", "cote", "canyon", "desert", "brume", "neige"]);
    case "autumn":
      return by(["montagnes", "brume", "foret", "lac", "falaises", "cote", "cascade", "neige", "canyon", "desert"]);
    default:
      return by(["montagnes", "foret", "brume", "lac", "falaises", "cote", "cascade", "neige", "canyon", "desert"]);
  }
}

/** État du paysage à la sortie du hero (caméra globale). */
export const HERO_EXIT = { scale: 1.32, origin: "50% 18%", shade: 0.42 } as const;

/**
 * Profondeur au scroll (caméra globale, par section après le hero) : léger cadrage et
 * assombrissement de lisibilité. Le mouvement propre des scènes continue en dessous.
 */
export type WorldStation = { scale: number; x: number; y: number; shade: number };
export const STATIONS: WorldStation[] = [
  { scale: 1.04, x: 0, y: 0, shade: 0.46 }, // showreel → portfolio
  { scale: 1.06, x: 0.01, y: 0, shade: 0.54 }, // gear
  { scale: 1.04, x: -0.008, y: 0.006, shade: 0.5 }, // à propos
  { scale: 1.0, x: 0, y: 0, shade: 0.38 }, // contact
];
