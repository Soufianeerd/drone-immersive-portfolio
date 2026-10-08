/**
 * Scènes du monde traversé au scroll.
 *
 * Seule la scène « montagne / lac » existe aujourd'hui (paysage maître du hero). Les autres
 * paysages (vallée, lac brumeux, côte…) seront ajoutés ici quand les vrais médias seront livrés :
 * aucun paysage de remplacement n'est inventé.
 */

/** État du paysage à la sortie du hero : le monde persistant reprend exactement ce cadrage. */
export const HERO_EXIT = { scale: 1.32, origin: "50% 18%", shade: 0.42 } as const;

/**
 * `stations` = trajet de la caméra après le hero, une station par section
 * (portfolio → gear → à propos → contact). x / y en % (translation),
 * `shade` 0..1 = assombrissement (jamais un aplat).
 */
export type WorldStation = { scale: number; x: number; y: number; shade: number };
export type WorldScene = { id: string; src: string | null; stations: WorldStation[] };

export const WORLD_SCENES: WorldScene[] = [
  {
    id: "montagne-lac",
    src: "/environment/master/landscape.webp",
    stations: [
      { scale: 1.42, x: -5, y: 4, shade: 0.5 }, // portfolio : on longe la crête, vers la mer de nuages
      { scale: 1.5, x: 6, y: 2, shade: 0.56 }, // gear : flanc de montagne
      { scale: 1.4, x: 2, y: 6, shade: 0.52 }, // à propos : descente vers la vallée
      { scale: 1.18, x: 0, y: 3, shade: 0.4 }, // contact : le sommet réapparaît
    ],
  },
  // { id: "vallee-foret", src: null, stations: [] },
  // { id: "lac-brume", src: null, stations: [] },
  // { id: "cote-falaises", src: null, stations: [] },
];
