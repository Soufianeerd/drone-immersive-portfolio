import type { ProductId } from "@/components/setup/setupProducts";

/**
 * Textes des focus produit du hero : l'émotion avant la technique.
 * Les données techniques reprises ici proviennent des rendus et fiches DJI déjà fournis.
 */
export const SETUP_COPY: Record<ProductId, { title: string; hook: string; text: string; role: string }> = {
  goggles: {
    title: "DJI Goggles 3",
    hook: "Voir autrement.",
    text: "Les lunettes placent le regard dans le drone. La trajectoire se ressent avant de se voir : le cadre s’anticipe, le plan se construit en vol, au plus près du sujet.",
    role: "Vision du pilote",
  },
  avata: {
    title: "DJI Avata 2",
    hook: "Vivez l’action de l’intérieur.",
    text: "Compact et protégé, l’Avata 2 vole là où une caméra ne passe pas : au ras du sol, entre les arbres, au cœur de l’action. Le spectateur ne regarde plus la scène, il la traverse.",
    role: "La caméra en vol",
  },
  controller: {
    title: "DJI FPV Remote Controller 3",
    hook: "Le geste juste.",
    text: "Chaque intention devient mouvement : la précision d’une trajectoire, la douceur d’un virage, le rythme exact du plan. Le contrôle reste dans la main du pilote.",
    role: "Pilotage manuel",
  },
};

/** Callouts de la vue éclatée de l'Avata 2 : bénéfice créatif d'abord, donnée technique ensuite. */
export const AVATA_PARTS = [
  {
    id: "camera",
    label: "Caméra",
    hook: "Au cœur du mouvement.",
    text: "Son champ de vision immersif rapproche le spectateur de l’action et conserve la sensation d’espace, de vitesse et de trajectoire.",
    tech: "Capteur 1/1,3 pouce · 155° · RockSteady 3.0+ et HorizonSteady",
  },
  {
    id: "battery",
    label: "Batterie",
    hook: "Le temps d’une prise.",
    text: "Elle se change en quelques secondes : on enchaîne les vols, la lumière n’attend pas.",
    tech: "Jusqu’à 23 minutes de vol",
  },
  {
    id: "propulsion",
    label: "Propulsion",
    hook: "La trajectoire au millimètre.",
    text: "Hélices carénées et moteurs nerveux : le drone se faufile au plus près des sujets, en intérieur comme en extérieur.",
    tech: "Quatre moteurs brushless · hélices protégées",
  },
  {
    id: "electronics",
    label: "Électronique",
    hook: "Voir en direct.",
    text: "L’image du drone arrive dans les lunettes en temps réel : le pilote voit exactement ce que filme la caméra.",
    tech: "Transmission DJI O4",
  },
  {
    id: "sensors",
    label: "Capteurs",
    hook: "Stable près du sol.",
    text: "Sous le châssis, les capteurs gardent le drone posé et précis au ras du sol et en intérieur.",
    tech: "Capteur ToF · positionnement visuel",
  },
] as const;

export type AvataPartId = (typeof AVATA_PARTS)[number]["id"];
