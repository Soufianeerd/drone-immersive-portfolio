/**
 * Caméra du monde — une seule source de vérité, lue à chaque image par WorldCanvas.
 * GSAP l'anime comme un objet ordinaire (intro du hero, sortie du hero, focus produit,
 * stations de scroll). Aucun rendu React : zéro re-render pendant les animations.
 *
 * Géométrie (identique aux calques HTML du hero, pour que produits et nom restent alignés) :
 *  - `intro` : échelle autour du centre de l'écran (apparition) ;
 *  - `scale`, `x`, `y` : échelle autour de (50 %, 18 %) puis translation en fraction d'écran ;
 *  - `shade` : assombrissement vers la couleur d'ambiance ; `blur` / `dim` : focus produit.
 */
export type WorldCamera = {
  intro: number;
  scale: number;
  x: number;
  y: number;
  shade: number;
  blur: number;
  dim: number;
};

export const worldCam: WorldCamera = { intro: 1, scale: 1, x: 0, y: 0, shade: 0, blur: 0, dim: 0 };

/** Le voyage de paysages démarre quand le hero a quitté l'écran (le rocher et le matériel ne flottent jamais). */
export const worldJourney = { active: false };

/** Origine de l'échelle de sortie / des stations (fraction d'écran). */
export const CAM_ORIGIN = { x: 0.5, y: 0.18 } as const;
