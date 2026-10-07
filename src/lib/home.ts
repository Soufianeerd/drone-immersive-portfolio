/**
 * Retour à l'accueil — point d'entrée unique.
 *
 * Utilisé par le logo ANASS du header (et tout futur contrôle « accueil »).
 * La scène hero écoute HOME_RESET_EVENT pour refermer Détails / focus / hover
 * et restaurer le setup FPV ; ici on remet seulement l'URL et le scroll en état.
 */
export const HOME_RESET_EVENT = "anass:home";

export function resetToHome() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT));
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
}
