"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "#projets", label: "Projets" },
  { href: "#services", label: "Services" },
  { href: "#a-propos", label: "À propos" },
  { href: "#contact", label: "Contact" },
] as const;

/**
 * Header du site : identité à gauche, navigation à droite.
 * Transparent sur le hero, fond plein (sans flou) une fois la page défilée.
 * La navigation s'efface pendant le focus de l'Avata (attribut data-hero-focus sur <html>).
 */
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#top" className={styles.brand} aria-label="Anass — retour en haut de page">
        Anass
      </a>

      <nav aria-label="Navigation principale" className={styles.nav}>
        <ul className={styles.navList}>
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={styles.link}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={menuButton}
        type="button"
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Fermer" : "Menu"}
      </button>

      <div id="site-menu" className={`${styles.sheet} ${open ? styles.sheetOpen : ""}`} inert={!open}>
        <ul>
          {NAV.map((item, i) => (
            <li key={item.href}>
              <a
                ref={i === 0 ? firstLink : undefined}
                href={item.href}
                className={styles.sheetLink}
                onClick={() => setOpen(false)}
              >
                <span className={styles.sheetIndex}>0{i + 2}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
