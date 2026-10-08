import { GEAR_MANIFEST } from "../../public/assets/gear/gear-manifest";
import type { GearManifestItem } from "../../public/assets/gear/gear-manifest";

/**
 * GEAR — mise en scène du vrai matériel d'Anass (photos réelles détourées, voir public/assets/gear/).
 *
 * - Les vues proviennent uniquement de gear-manifest.ts : aucun angle inventé.
 * - Les PNG d'archive (transparent/) sont servis en WebP allégés (web/, 1400 px max).
 * - Le matériel sans détourage propre (accessoires SmallRig, softbox) est montré en photo encadrée.
 *
 * Disposition : x / b = centre horizontal et bas de l'objet (% de la scène), w = largeur (% de la scène).
 * `m` = disposition mobile (scène verticale).
 */

export type GearShelfId = "image" | "drone" | "stab" | "montage" | "accessoires";

export const GEAR_SHELVES: { id: GearShelfId; label: string }[] = [
  { id: "image", label: "Image" },
  { id: "drone", label: "Drone FPV" },
  { id: "stab", label: "Stabilisation & son" },
  { id: "montage", label: "Montage & tirage" },
  { id: "accessoires", label: "Accessoires" },
];

type Place = { x: number; b: number; w: number; z?: number };

type SceneEntry = {
  shelf: GearShelfId;
  /** Vue posée sur la table (clé `view` du manifeste). */
  stageView: string;
  /** Texte court, factuel : aucune donnée technique inventée. */
  text: string;
  d: Place;
  m: Place;
};

const SCENE: Record<string, SceneEntry> = {
  "canon-eos-r6-mark-ii": {
    shelf: "image",
    stageView: "trois-quarts-avant",
    text: "Boîtier hybride plein format, pour la photo comme pour la vidéo.",
    d: { x: 33, b: 17, w: 21, z: 3 },
    m: { x: 30, b: 46, w: 46 },
  },
  "canon-rf-70-200mm-f2-8-l-is-usm": {
    shelf: "image",
    stageView: "trois-quarts-avant",
    text: "Téléobjectif zoom f/2.8 : portraits serrés, cérémonies, sujets à distance.",
    d: { x: 58, b: 19, w: 19, z: 2 },
    m: { x: 72, b: 47, w: 40 },
  },
  "canon-ef-24-70mm-f2-8-l-ii-usm": {
    shelf: "image",
    stageView: "vue-face-avec-pare-soleil",
    text: "Zoom standard f/2.8, l’objectif polyvalent du reportage.",
    d: { x: 76, b: 20, w: 8.5, z: 2 },
    m: { x: 22, b: 9, w: 20 },
  },
  "canon-rf-50mm-f1-8-stm": {
    shelf: "image",
    stageView: "vue-face",
    text: "Focale fixe lumineuse f/1.8, compacte et discrète.",
    d: { x: 87, b: 17, w: 7, z: 3 },
    m: { x: 50, b: 10, w: 17 },
  },
  "canon-batteries-chargeur": {
    shelf: "image",
    stageView: "vue-trois-quarts",
    text: "Batteries et chargeur Canon, pour les longues journées de tournage.",
    d: { x: 13, b: 16, w: 12, z: 3 },
    m: { x: 78, b: 9, w: 28 },
  },
  "dji-goggles-3": {
    shelf: "drone",
    stageView: "trois-quarts-gauche",
    text: "Lunettes FPV : le pilote voit exactement ce que voit le drone.",
    d: { x: 21, b: 17, w: 25, z: 2 },
    m: { x: 30, b: 50, w: 50 },
  },
  "dji-avata-2": {
    shelf: "drone",
    stageView: "trois-quarts-arriere-gauche",
    text: "Drone FPV compact à hélices protégées, piloté en immersion.",
    d: { x: 52, b: 21, w: 33, z: 3 },
    m: { x: 50, b: 13, w: 86 },
  },
  "dji-fpv-remote-controller-3": {
    shelf: "drone",
    stageView: "trois-quarts-gauche",
    text: "Radiocommande FPV pour le pilotage manuel.",
    d: { x: 81, b: 16, w: 25, z: 2 },
    m: { x: 74, b: 52, w: 46 },
  },
  "dji-rs4-gimbal": {
    shelf: "stab",
    stageView: "trois-quarts-avant",
    text: "Stabilisateur trois axes pour des mouvements de caméra fluides.",
    d: { x: 27, b: 15, w: 17, z: 2 },
    m: { x: 27, b: 22, w: 40 },
  },
  "dji-mic-3": {
    shelf: "stab",
    stageView: "boitier-charge-ouvert-vue-face",
    text: "Micros sans fil et leur boîtier de charge.",
    d: { x: 55, b: 17, w: 20, z: 3 },
    m: { x: 70, b: 52, w: 50 },
  },
  "rode-micro-camera": {
    shelf: "stab",
    stageView: "trois-quarts",
    text: "Micro de caméra RØDE, avec sa suspension.",
    d: { x: 79, b: 17, w: 12, z: 3 },
    m: { x: 74, b: 11, w: 32 },
  },
  "macbook-pro": {
    shelf: "montage",
    stageView: "trois-quarts-ouvert",
    text: "Le poste de montage.",
    d: { x: 30, b: 14, w: 20, z: 2 },
    m: { x: 32, b: 30, w: 48 },
  },
  "sandisk-extreme-portable-ssd-2tb": {
    shelf: "montage",
    stageView: "vue-face",
    text: "SSD portable 2 To : les rushes sauvegardés dès le terrain.",
    d: { x: 54, b: 17, w: 7, z: 3 },
    m: { x: 74, b: 56, w: 20 },
  },
  "canon-selphy-cp1500": {
    shelf: "montage",
    stageView: "vue-dessus-impression",
    text: "Imprimante photo compacte : des tirages remis sur place.",
    d: { x: 74, b: 15, w: 13, z: 3 },
    m: { x: 74, b: 10, w: 34 },
  },
  "trepieds-video-photo-duo": {
    shelf: "accessoires",
    stageView: "vue-ensemble",
    text: "Trépieds photo et vidéo.",
    d: { x: 18, b: 10, w: 15, z: 1 },
    m: { x: 24, b: 10, w: 40 },
  },
  "ray-ban-meta": {
    shelf: "accessoires",
    stageView: "lunettes-trois-quarts",
    text: "Lunettes connectées à caméra intégrée, pour des images à la première personne.",
    d: { x: 46, b: 18, w: 21, z: 3 },
    m: { x: 70, b: 12, w: 52 },
  },
  "accessoires-rig-smallrig-xssive": {
    shelf: "accessoires",
    stageView: "vue-dessus",
    text: "Cage, poignée et accessoires de rig SmallRig ; hub USB-C XSSIVE.",
    d: { x: 68, b: 34, w: 9, z: 1 },
    m: { x: 60, b: 56, w: 24 },
  },
  "fgen-softbox-studio": {
    shelf: "accessoires",
    stageView: "vue-ensemble-eteinte",
    text: "Éclairage studio à boîte à lumière.",
    d: { x: 82, b: 34, w: 9, z: 1 },
    m: { x: 86, b: 56, w: 24 },
  },
};

export type GearSceneView = { key: string; label: string; src: string; cutout: boolean };

export type GearSceneItem = {
  id: string;
  name: string;
  category: string;
  modelConfirmed: boolean;
  shelf: GearShelfId;
  text: string;
  /** Vues réellement disponibles (détourées d'abord, photos d'origine ensuite). */
  views: GearSceneView[];
  stageIndex: number;
  /** Matériel sans détourage : affiché en photo encadrée. */
  photoOnly: boolean;
  d: Place;
  m: Place;
};

const webCutout = (src: string) => src.replace("/assets/gear/transparent/", "/assets/gear/web/").replace("-transparent.png", ".webp");
const webPhoto = (src: string) => src.replace("/assets/gear/originals/", "/assets/gear/web/").replace(".jpg", "-photo.webp");

function toScene(it: GearManifestItem): GearSceneItem | null {
  const s = SCENE[it.id];
  if (!s) return null;
  const views: GearSceneView[] = [
    ...it.views.map((v) => ({ key: v.view, label: v.label, src: webCutout(v.src), cutout: true })),
    ...it.originalOnly.map((v) => ({ key: v.view, label: v.label, src: webPhoto(v.original), cutout: false })),
  ];
  if (!views.length) return null;
  const stageIndex = Math.max(0, views.findIndex((v) => v.key === s.stageView));
  return {
    id: it.id,
    name: it.name,
    category: it.category,
    modelConfirmed: it.modelConfirmed,
    shelf: s.shelf,
    text: s.text,
    views,
    stageIndex,
    photoOnly: !it.views.length,
    d: s.d,
    m: s.m,
  };
}

export const GEAR_SCENE: GearSceneItem[] = GEAR_MANIFEST.map(toScene).filter((x): x is GearSceneItem => x !== null);
