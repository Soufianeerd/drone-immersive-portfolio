"use client";

import { useEffect, useState } from "react";
import { resetToHome } from "@/lib/home";
import styles from "./SiteHeader.module.css";

/**
 * Header du site. ANASS ramène toujours à l'accueil (resetToHome) depuis n'importe
 * quel état de la scène. Seules les sections qui existent sont listées.
 * La navigation s'efface pendant le focus / les détails de l'Avata (html[data-hero-focus]).
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <a
        href="#top"
        className={styles.brand}
        aria-label="Anass — accueil"
        onClick={(e) => {
          e.preventDefault();
          resetToHome();
        }}
      >
        Anass
      </a>

      <nav aria-label="Navigation principale" className={styles.nav}>
        <a href="#projets" className={styles.link}>
          Projets
        </a>
      </nav>
    </header>
  );
}
