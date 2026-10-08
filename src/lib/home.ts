import { scrollToTarget } from "./scroll";

/**
 * Retour à l'accueil — point d'entrée unique (logo ANASS).
 * Le hero écoute HOME_RESET_EVENT pour annuler toute sélection d'objet ;
 * ici : ancre nettoyée, retour en haut de la home.
 */
export const HOME_RESET_EVENT = "anass:home";

export function resetToHome() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT, { cancelable: true }));
  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  scrollToTarget(0);
}
