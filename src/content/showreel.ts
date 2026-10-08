/**
 * Showreel : 30 à 60 s, tout l'univers (drone, photo, vidéo, mariage, événement, portrait,
 * voyage, moments humains). Renseigner `src` (MP4 H.264) et idéalement `srcWebm` + `poster`.
 * Tant que `src` est null, le cadre affiche un état « en montage » explicite.
 */
export const SHOWREEL: { src: string | null; srcWebm: string | null; poster: string | null; title: string } = {
  src: null,
  srcWebm: null,
  poster: null,
  title: "Showreel",
};
