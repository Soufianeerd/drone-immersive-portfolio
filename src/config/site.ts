/**
 * Identité du site — un seul endroit à modifier quand le nom / logo définitif arrive.
 */
export const SITE = {
  brand: "NADRA",
  creator: "Anass",
  disciplines: ["Photo", "Vidéo", "Drone FPV"],
  headline: ["Capturer le mouvement.", "Raconter l’émotion."],
  /** Coordonnées par défaut si la localisation est refusée et le fuseau inconnu. */
  defaultLocation: { lat: 48.6921, lon: 6.1844, label: "Nancy" },
  /** Liens publics : laissés vides tant qu'ils ne sont pas fournis (rien d'inventé). */
  social: {
    instagram: null as string | null,
    email: null as string | null,
  },
  nav: [
    { id: "showreel", label: "Showreel" },
    { id: "portfolio", label: "Portfolio" },
    { id: "gear", label: "Gear" },
    { id: "about", label: "À propos" },
    { id: "contact", label: "Contact" },
  ],
} as const;
