"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { GEAR_SCENE, GEAR_SHELVES } from "@/content/gearScene";
import type { GearSceneItem, GearShelfId } from "@/content/gearScene";
import styles from "./Gear.module.css";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * GEAR — le vrai matériel d'Anass, posé sur une table de studio.
 * Étagères (Image, Drone FPV, …) ; survol : lévitation légère, perspective, nom ;
 * clic : fiche avec les angles RÉELLEMENT photographiés (glisser / flèches pour passer d'une vue à l'autre).
 */
export default function Gear() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [shelf, setShelf] = useState<GearShelfId>("image");
  const [hover, setHover] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const items = GEAR_SCENE.filter((i) => i.shelf === shelf);
  const open = GEAR_SCENE.find((i) => i.id === openId) ?? null;
  const lastFocus = useRef<HTMLElement | null>(null);

  // Entrée de section.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("[data-gear-word]", { yPercent: 105 }, { yPercent: 0, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 70%" } });
        gsap.fromTo("[data-gear-light]", { opacity: 0 }, { opacity: 1, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 60%" } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Préchargement des pièces de toutes les étagères quand la section approche.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        GEAR_SCENE.forEach((i) => {
          const img = new Image();
          img.decoding = "async";
          img.src = i.views[i.stageIndex].src;
        });
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Changement d'étagère : le matériel se pose sur la table.
  useIsoLayoutEffect(() => {
    const objs = stage.current?.querySelectorAll<HTMLElement>("[data-gear-obj]");
    if (!objs?.length || reduced()) return;
    const tw = gsap.fromTo(
      objs,
      { opacity: 0, y: -28 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out", clearProps: "opacity,transform" },
    );
    return () => {
      tw.kill();
    };
  }, [shelf]);

  const openItem = useCallback((id: string, from: HTMLElement | null) => {
    lastFocus.current = from;
    setHover(null);
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    requestAnimationFrame(() => lastFocus.current?.focus({ preventScroll: true }));
  }, []);

  const changeShelf = (id: GearShelfId) => {
    if (id === shelf) return;
    setOpenId(null);
    setHover(null);
    setShelf(id);
  };

  // Légère inclinaison au pointeur (variables CSS, sans re-rendu React).
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || reduced()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width - 0.5;
    const v = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--dx", `${(u * 10).toFixed(1)}px`);
    e.currentTarget.style.setProperty("--tilt", `${(u * 2.4 - v * 0.6).toFixed(2)}deg`);
  };
  const onLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.setProperty("--dx", "0px");
    e.currentTarget.style.setProperty("--tilt", "0deg");
    if (e.pointerType === "mouse") setHover(null);
  };

  return (
    <section ref={root} id="gear" className={styles.section} aria-labelledby="gear-title">
      <header className={styles.head}>
        <h2 id="gear-title" className={styles.title}>
          <span className={styles.mask}>
            <span data-gear-word className={styles.word}>
              Le setup
            </span>
          </span>
        </h2>
        <p className={styles.lede}>Le vrai matériel d’Anass, photographié chez lui. Survolez, puis ouvrez une pièce pour la voir sous tous ses angles réels.</p>
      </header>

      <div className={styles.shelves} role="tablist" aria-label="Catégories de matériel">
        {GEAR_SHELVES.map((s) => {
          const n = GEAR_SCENE.filter((i) => i.shelf === s.id).length;
          return (
            <button key={s.id} type="button" role="tab" aria-selected={shelf === s.id} aria-controls="gear-stage" className={styles.shelf} onClick={() => changeShelf(s.id)}>
              {s.label}
              <sup>{n}</sup>
            </button>
          );
        })}
      </div>

      <div
        ref={stage}
        id="gear-stage"
        role="tabpanel"
        className={styles.stage}
        data-hover={hover ?? undefined}
        data-open={open ? "" : undefined}
      >
        <div className={styles.wall} aria-hidden />
        <div data-gear-light className={styles.light} aria-hidden />
        <div className={styles.table} aria-hidden />

        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            data-gear-obj
            className={`${styles.obj} ${it.photoOnly ? styles.print : ""} ${hover === it.id ? styles.on : ""}`}
            style={
              {
                "--x": it.d.x,
                "--b": it.d.b,
                "--w": it.d.w,
                "--z": it.d.z ?? 1,
                "--mx": it.m.x,
                "--mb": it.m.b,
                "--mw": it.m.w,
              } as CSSProperties
            }
            aria-label={`${it.name} — voir la fiche`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHover(it.id)}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHover(it.id)}
            onBlur={() => setHover(null)}
            onClick={(e) => openItem(it.id, e.currentTarget)}
          >
            <span className={styles.shadow} aria-hidden />
            <span className={styles.lift}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.views[it.stageIndex].src} alt="" decoding="async" draggable={false} />
            </span>
            <span className={styles.name} aria-hidden>
              {it.name}
            </span>
          </button>
        ))}

        {open ? <Sheet key={open.id} item={open} onClose={close} /> : null}
      </div>

      <ul className={styles.inventory} aria-label="Matériel de cette catégorie">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              className={styles.row}
              aria-pressed={openId === it.id}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(it.id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
              onClick={(e) => openItem(it.id, e.currentTarget)}
            >
              <span>{it.name}</span>
              <span className={styles.rowCat}>{it.category}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Fiche : vues réelles uniquement ; glisser, flèches ou vignettes pour passer d'un angle à l'autre. */
function Sheet({ item, onClose }: { item: GearSceneItem; onClose: () => void }) {
  const [idx, setIdx] = useState(item.stageIndex);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const n = item.views.length;
  const go = useCallback((d: number) => setIdx((i) => (i + d + n) % n), [n]);
  const view = item.views[idx];

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    if (reduced() || !box.current) return;
    const tw = gsap.fromTo(box.current, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", clearProps: "opacity,transform" });
    return () => {
      tw.kill();
    };
  }, []);

  return (
    <div ref={box} className={styles.sheet} role="dialog" aria-modal="false" aria-labelledby="gear-sheet-title">
      <button type="button" className={styles.scrim} aria-label="Fermer la fiche" tabIndex={-1} onClick={onClose} />
      <div className={styles.sheetPanel}>
        <div className={styles.sheetTop}>
          <p className={styles.sheetCat}>{item.category}</p>
          <button ref={closeBtn} type="button" className={styles.close} onClick={onClose}>
            Fermer <span aria-hidden>×</span>
          </button>
        </div>
        <h3 id="gear-sheet-title" className={styles.sheetTitle}>
          {item.name}
        </h3>
        <p className={styles.sheetText}>{item.text}</p>

        <div
          className={`${styles.viewer} ${view.cutout ? "" : styles.viewerPhoto}`}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, moved: false };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || n < 2) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 48) {
              go(dx < 0 ? 1 : -1);
              drag.current = { x: e.clientX, moved: true };
            }
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={view.src} src={view.src} alt={`${item.name} — ${view.label}`} className={styles.viewImg} draggable={false} />
        </div>

        <div className={styles.viewBar}>
          <button type="button" className={styles.arrow} onClick={() => go(-1)} disabled={n < 2} aria-label="Vue précédente">
            ←
          </button>
          <p className={styles.viewLabel} aria-live="polite">
            {view.label}
            <span>
              {idx + 1} / {n}
            </span>
          </p>
          <button type="button" className={styles.arrow} onClick={() => go(1)} disabled={n < 2} aria-label="Vue suivante">
            →
          </button>
        </div>

        {n > 1 ? (
          <ul className={styles.thumbs} aria-label="Vues disponibles">
            {item.views.map((v, i) => (
              <li key={v.src}>
                <button type="button" className={styles.thumb} aria-pressed={i === idx} aria-label={v.label} onClick={() => setIdx(i)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.src} alt="" loading="lazy" draggable={false} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className={styles.note}>Photos réelles du matériel — {n > 1 ? `${n} angles disponibles` : "une seule vue disponible"}.</p>
      </div>
    </div>
  );
}
