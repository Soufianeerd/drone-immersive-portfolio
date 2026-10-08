import type Lenis from "lenis";

/**
 * Défilement du site : Lenis quand il est actif (mouvement autorisé), sinon le
 * défilement natif. Un seul point d'entrée pour les ancres et le retour en haut.
 */
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function scrollToTarget(target: number | string | HTMLElement, opts?: { immediate?: boolean }) {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const immediate = opts?.immediate || reduced;
  if (lenis) {
    lenis.scrollTo(target, { immediate, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "number" ? null : target;
  const top = typeof target === "number" ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
}

/** Verrouille le défilement de la page (focus produit, lecteur vidéo). */
export function lockScroll() {
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  document.documentElement.style.overflow = "";
  lenis?.start();
}

/**
 * Navigation vers une section. Le showreel est centré dans l'écran (cadre entier visible),
 * les autres sections s'alignent sur leur haut.
 */
export function scrollToSection(id: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  const frame = id === "showreel" ? el.querySelector<HTMLElement>("[data-sr-frame]") : null;
  if (frame) {
    // Dimensions de mise en page (indépendantes du scale/clip animés).
    let top = 0;
    for (let n: HTMLElement | null = frame; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
    const room = window.innerHeight - header;
    scrollToTarget(Math.max(0, top - header - Math.max(0, (room - frame.offsetHeight) / 2)));
    return;
  }
  scrollToTarget(el);
}
