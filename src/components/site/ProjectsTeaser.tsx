"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import styles from "./ProjectsTeaser.module.css";

const NEXT = [
  { id: "services", index: "03", label: "Services" },
  { id: "a-propos", index: "04", label: "À propos" },
  { id: "contact", index: "05", label: "Contact" },
] as const;

/**
 * Amorce de la section 02. Pas encore de projets : un titre, une phrase et
 * l'index des sections à venir, pour que la page se lise comme un site complet.
 */
export default function ProjectsTeaser() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          ctx.add(() => {
            const target = entry.target as HTMLElement;
            if (target.dataset.reveal === "line") {
              gsap.fromTo(target, { scaleX: 0 }, { scaleX: 1, opacity: 1, duration: reduced ? 0.01 : 1.4, ease: "expo.inOut" });
              return;
            }
            gsap.fromTo(
              target,
              { opacity: 0, y: reduced ? 0 : 28 },
              { opacity: 1, y: 0, duration: reduced ? 0.4 : 1.1, ease: "expo.out", delay: Number(target.dataset.delay ?? 0) },
            );
          });
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    el.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="projets" aria-labelledby="projets-title" className={styles.section}>
      <div data-reveal="line" className={styles.rule} aria-hidden="true" />

      <div className={styles.head}>
        <p data-reveal className={styles.index}>
          02
        </p>
        <h2 id="projets-title" data-reveal data-delay="0.08" className={styles.title}>
          Projets
        </h2>
        <p data-reveal data-delay="0.18" className={styles.lede}>
          Films, photographies et prises de vue aériennes en FPV. La sélection est en cours de montage.
        </p>
      </div>

      <ol className={styles.next} aria-label="Sections à venir">
        {NEXT.map((item, i) => (
          <li key={item.id} id={item.id} data-reveal data-delay={String(0.1 + i * 0.07)} className={styles.row}>
            <span className={styles.rowIndex}>{item.index}</span>
            <span className={styles.rowLabel}>{item.label}</span>
            <span className={styles.rowState}>À venir</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
