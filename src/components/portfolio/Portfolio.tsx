"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PLACEHOLDER_SLOTS } from "@/content/work";
import type { WorkFormat } from "@/content/work";
import type { PublicCategory, PublicWork } from "@/lib/cms/types";
import styles from "./Portfolio.module.css";

type Filter = string; // slug de catégorie ou "all"
type Entry = { key: string; format: WorkFormat; categories: string[]; item?: PublicWork };

/**
 * PORTFOLIO — grille éditoriale à formats variables, filtres par discipline.
 * Tant qu'aucune réalisation n'est livrée (WORK vide), des emplacements neutres et
 * explicitement signalés tiennent la mise en page : aucun faux projet, aucun faux client.
 * Chaque réalisation ouvre /portfolio/[slug].
 */
export default function Portfolio({ categories, work }: { categories: PublicCategory[]; work: PublicWork[] }) {
  const LABEL: Record<string, string> = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.name])), [categories]);
  const filters = useMemo(() => [{ id: "all", label: "Tout" }, ...categories.map((c) => ({ id: c.slug, label: c.name }))], [categories]);
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const entries: Entry[] = useMemo(
    () =>
      work.length
        ? work.map((w) => ({ key: w.slug, format: w.format, categories: w.categories, item: w }))
        : PLACEHOLDER_SLOTS.map((p, i) => ({ key: `slot-${i}`, format: p.format, categories: p.categories.filter((k) => k in LABEL) })),
    [work, LABEL],
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
        {filters.map((c) => (
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
            >
              <Cover item={e.item} />
              <span className={styles.caption}>
                <span className={styles.cTitle}>{e.item.title}</span>
                <span className={styles.cMeta}>
                  {e.item.categories.map((k) => LABEL[k] ?? k).join(" · ")}
                  {e.item.year ? ` — ${e.item.year}` : ""}
                </span>
              </span>
            </Link>
          ) : (
            <div
              key={e.key}
              data-pf-item
              className={`${styles.item} ${styles.slot} ${styles[e.format]}`}
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

    </section>
  );
}

function Cover({ item }: { item: PublicWork }) {
  const m = item.cover;
  return (
    <span className={styles.frame}>
      {m?.kind === "video" ? (
        <video className={styles.media} src={m.url} poster={m.poster ?? undefined} muted loop playsInline preload="metadata" />
      ) : m?.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.media} src={m.url} alt={m.caption || item.title} loading="lazy" decoding="async" />
      ) : (
        <span className={styles.slotFill} aria-hidden />
      )}
    </span>
  );
}
