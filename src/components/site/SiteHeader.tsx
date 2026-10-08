"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/config/site";
import { HOME_RESET_EVENT, resetToHome } from "@/lib/home";
import { scrollToSection } from "@/lib/scroll";
import styles from "./SiteHeader.module.css";

const NAV = SITE.nav;

/**
 * Header NADRA. Le logo réinitialise toujours la home (scène, focus, vue éclatée, scroll).
 * Desktop : cinq entrées ; mobile : menu plein écran. Aucune numérotation décorative.
 */
export default function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > window.innerHeight * 0.85);
      // bas de page : le dernier chapitre est le chapitre courant
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) setActive(NAV[NAV.length - 1].id);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section courante (indicateur discret dans la navigation).
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom) return setActive(NAV[NAV.length - 1].id);
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
          else if (e.target.id === active && e.boundingClientRect.top > 0) setActive(null);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const btn = menuBtn.current;
    document.documentElement.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    // Ferme proprement un éventuel focus produit avant de quitter le hero.
    if (document.documentElement.hasAttribute("data-scene-active")) window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT));
    window.history.replaceState(null, "", `#${id}`);
    scrollToSection(id);
  };

  return (
    <header data-site-header className={`${styles.header} ${solid ? styles.solid : ""} ${open ? styles.open : ""}`}>
      <a
        href="#top"
        className={styles.brand}
        aria-label={`${SITE.brand} — retour au début`}
        onClick={(e) => {
          e.preventDefault();
          setOpen(false);
          resetToHome();
        }}
      >
        <span className={styles.wordmark}>{SITE.brand}</span>
        <span className={styles.sub}>{SITE.disciplines.join(" · ")}</span>
      </a>

      <nav data-site-nav aria-label="Navigation principale" className={styles.nav}>
        <ul>
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                className={styles.link}
                aria-current={active === n.id ? "location" : undefined}
                onClick={go(n.id)}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={menuBtn}
        type="button"
        className={styles.menuBtn}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Fermer" : "Menu"}
      </button>

      <div id="mobile-menu" className={styles.sheet} hidden={!open}>
        <ol>
          {NAV.map((n, i) => (
            <li key={n.id}>
              <a ref={i === 0 ? firstLink : undefined} href={`#${n.id}`} className={styles.sheetLink} onClick={go(n.id)}>
                {n.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
