"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, PLACEHOLDER_SLOTS, WORK } from "@/content/work";
import type { CategoryId, WorkFormat, WorkItem } from "@/content/work";
import styles from "./Portfolio.module.css";

type Filter = CategoryId | "all";
type Entry = { key: string; format: WorkFormat; categories: CategoryId[]; item?: WorkItem };

const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<Filter, string>;

/**
 * PORTFOLIO — grille éditoriale à formats variables, filtres par discipline.
 * Tant qu'aucune réalisation n'est livrée (WORK vide), des emplacements neutres et
 * explicitement signalés tiennent la mise en page : aucun faux projet, aucun faux client.
 * Chaque réalisation ouvre /portfolio/[slug].
 */
export default function Portfolio() {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [cursorLabel, setCursorLabel] = useState("Voir");

  const entries: Entry[] = useMemo(
    () =>
      WORK.length
        ? WORK.map((w) => ({ key: w.slug, format: w.format, categories: w.categories, item: w }))
        : PLACEHOLDER_SLOTS.map((p, i) => ({ key: `slot-${i}`, format: p.format, categories: p.categories })),
    [],
  );
  const visible = entries.filter((e) => filter === "all" || e.categories.includes(filter));
  const counts = useMemo(() => {
    const c: Partial<Record<Filter, number>> = { all: entries.length };
    entries.forEach((e) => e.categories.forEach((k) => (c[k] = (c[k] ?? 0) + 1)));
    return c;
  }, [entries]);

  // Entrée de section.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("[data-pf-word]", { yPercent: 105 }, {
          yPercent: 0,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 70%" },
        });
        gsap.fromTo("[data-pf-filters] li", { opacity: 0, y: 12 }, {
          opacity: 1,
          y: 0,
          clearProps: "transform,opacity",
          duration: 0.6,
          stagger: 0.04,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 60%" },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Changement de filtre : les vignettes réapparaissent en cascade (révélation par masque).
  useEffect(() => {
    const items = grid.current?.querySelectorAll("[data-pf-item]");
    if (!items?.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tw = gsap.fromTo(
      items,
      { clipPath: "inset(12% 0% 12% 0%)", opacity: 0, y: 30 },
      { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "power3.out", clearProps: "clipPath,transform,opacity" },
    );
    ScrollTrigger.refresh();
    return () => {
      tw.kill();
    };
  }, [filter]);

  // Curseur « Voir » (pointeur fin uniquement).
  useEffect(() => {
    const c = cursor.current;
    if (!c || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const x = gsap.quickTo(c, "x", { duration: 0.35, ease: "power3.out" });
    const y = gsap.quickTo(c, "y", { duration: 0.35, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const showCursor = (label: string) => () => {
    setCursorLabel(label);
    gsap.to(cursor.current, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
  };
  const hideCursor = () => gsap.to(cursor.current, { opacity: 0, scale: 0.4, duration: 0.3, ease: "power2.out" });

  return (
    <section ref={root} id="portfolio" className={styles.section} aria-labelledby="portfolio-title">
      <header className={styles.head}>
        <h2 id="portfolio-title" className={styles.title}>
          <span className={styles.mask}>
            <span data-pf-word className={styles.word}>
              Portfolio
            </span>
          </span>
        </h2>
        <p className={styles.lede}>Mariages, événements, portraits et vols FPV — une sélection qui grandira au fil des projets.</p>
      </header>

      <ul data-pf-filters className={styles.filters} aria-label="Filtrer les réalisations">
        {CATEGORIES.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={styles.filter}
              aria-pressed={filter === c.id}
              disabled={!counts[c.id]}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
              <sup>{counts[c.id] ?? 0}</sup>
            </button>
          </li>
        ))}
      </ul>

      <div ref={grid} className={styles.grid} aria-live="polite">
        {visible.map((e) =>
          e.item ? (
            <Link
              key={e.key}
              href={`/portfolio/${e.item.slug}`}
              data-pf-item
              className={`${styles.item} ${styles[e.format]}`}
              onPointerEnter={showCursor("Voir")}
              onPointerLeave={hideCursor}
            >
              <Cover item={e.item} />
              <span className={styles.caption}>
                <span className={styles.cTitle}>{e.item.title}</span>
                <span className={styles.cMeta}>
                  {e.item.categories.map((k) => LABEL[k]).join(" · ")}
                  {e.item.year ? ` — ${e.item.year}` : ""}
                </span>
              </span>
            </Link>
          ) : (
            <div
              key={e.key}
              data-pf-item
              className={`${styles.item} ${styles.slot} ${styles[e.format]}`}
              onPointerEnter={showCursor("Bientôt")}
              onPointerLeave={hideCursor}
              aria-label={`Emplacement réservé — ${e.categories.map((k) => LABEL[k]).join(", ")}`}
              role="img"
            >
              <span className={styles.frame}>
                <span className={styles.slotFill} aria-hidden />
                <span className={`${styles.mark} ${styles.tl}`} aria-hidden />
                <span className={`${styles.mark} ${styles.br}`} aria-hidden />
              </span>
              <span className={styles.caption}>
                <span className={styles.cTitle}>Projet à venir</span>
                <span className={styles.cMeta}>{e.categories.map((k) => LABEL[k]).join(" · ")}</span>
              </span>
            </div>
          ),
        )}
      </div>

      <div ref={cursor} className={styles.cursor} aria-hidden>
        {cursorLabel}
      </div>
    </section>
  );
}

function Cover({ item }: { item: WorkItem }) {
  const m = item.cover;
  return (
    <span className={styles.frame}>
      {m?.kind === "video" ? (
        <video className={styles.media} src={m.src} poster={m.poster} muted loop playsInline preload="metadata" />
      ) : m?.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.media} src={m.src} alt={m.alt} loading="lazy" decoding="async" />
      ) : (
        <span className={styles.slotFill} aria-hidden />
      )}
    </span>
  );
}
