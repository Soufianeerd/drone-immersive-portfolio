/**
 * Retour à l'accueil — point d'entrée unique (logo ANASS, contrôles « accueil »).
 *
 * La scène hero écoute HOME_RESET_EVENT : elle tue toute animation, referme
 * composant / Détails / focus, efface les transformations, restaure le setup et
 * remonte en haut de page (event.preventDefault() signale qu'elle s'en charge).
 */
export const HOME_RESET_EVENT = "anass:home";

export function resetToHome() {
  if (typeof window === "undefined") return;
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  const handled = !window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT, { cancelable: true }));
  if (!handled) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }
}
