/**
 * Portfolio — source unique des réalisations.
 * Ajouter un projet = une entrée dans WORK (médias dans public/work/<slug>/).
 * Tant que WORK est vide, des EMPLACEMENTS neutres explicitement signalés sont affichés :
 * aucun faux client, aucune fausse réalisation.
 */

export const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "mariage", label: "Mariages" },
  { id: "evenement", label: "Événements" },
  { id: "portrait", label: "Portraits" },
  { id: "drone", label: "Drone FPV" },
  { id: "video", label: "Vidéo" },
  { id: "photo", label: "Photo" },
  { id: "perso", label: "Projets personnels" },
] as const;

export type CategoryId = Exclude<(typeof CATEGORIES)[number]["id"], "all">;

/** wide 21:9 · landscape 3:2 · portrait 4:5 · tall 9:16 · square 1:1 */
export type WorkFormat = "wide" | "landscape" | "portrait" | "tall" | "square";

export type WorkMedia =
  | { kind: "video"; src: string; poster?: string }
  | { kind: "image"; src: string; alt: string };

export type WorkItem = {
  slug: string;
  title: string;
  categories: CategoryId[];
  format: WorkFormat;
  year?: number;
  client?: string;
  context?: string;
  cover?: WorkMedia;
  gallery?: WorkMedia[];
  gear?: string[];
};

export const WORK: WorkItem[] = [];

/** Emplacements de développement (affichés seulement si WORK est vide). */
export const PLACEHOLDER_SLOTS: readonly { categories: CategoryId[]; format: WorkFormat }[] = [
  { categories: ["drone", "video"], format: "wide" },
  { categories: ["mariage", "photo"], format: "portrait" },
  { categories: ["evenement", "video"], format: "landscape" },
  { categories: ["portrait", "photo"], format: "tall" },
  { categories: ["drone", "photo"], format: "landscape" },
  { categories: ["perso", "video"], format: "square" },
  { categories: ["mariage", "video"], format: "landscape" },
  { categories: ["portrait", "photo"], format: "portrait" },
];
