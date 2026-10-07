"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Part, PartId } from "./avata2Details";
import styles from "./AvataDetailsUi.module.css";

type Props = {
  uiRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  backRef: RefObject<HTMLButtonElement | null>;
  active: boolean;
  part: PartId | null;
  parts: readonly Part[];
  onBack: () => void;
  onOpenPart: (id: PartId) => void;
  onClosePart: () => void;
};

/**
 * Écran technique de la vue éclatée : points, filets et étiquettes en HTML/SVG
 * (aucun texte incrusté dans les PNG), liste numérotée sur mobile, et panneau
 * de composant. L'apparition est pilotée par la timeline Détails d'AvataHero.
 */
export default function AvataDetailsUi({
  uiRef,
  frameRef,
  backRef,
  active,
  part,
  parts,
  onBack,
  onOpenPart,
  onClosePart,
}: Props) {
  const current = part ? parts.find((p) => p.id === part) : null;
  const index = current ? parts.indexOf(current) : -1;

  return (
    <>
      <div ref={uiRef} className={styles.ui} inert={!active || !!part}>
        <div data-d-eyebrow className={styles.eyebrow}>
          <p className={styles.eyebrowTitle}>DJI Avata 2 · Vue éclatée</p>
          <p className={styles.eyebrowHint}>Sélectionnez un composant</p>
        </div>

        <div ref={frameRef} className={styles.frame}>
          <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {parts.map((p) => (
              <line
                key={p.id}
                data-d-line
                pathLength={1}
                x1={p.dot.x}
                y1={p.dot.y}
                x2={p.side === "left" ? -3 : 103}
                y2={p.labelY}
              />
            ))}
          </svg>

          {parts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              data-d-dot
              data-part-trigger={p.id}
              tabIndex={-1}
              aria-hidden="true"
              className={styles.dot}
              style={{ left: `${p.dot.x}%`, top: `${p.dot.y}%` }}
              onClick={() => onOpenPart(p.id)}
            >
              <span>{i + 1}</span>
            </button>
          ))}

          {parts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              data-part-trigger={p.id}
              data-d-focus-first={i === 0 ? "" : undefined}
              className={`${styles.label} ${p.side === "left" ? styles.labelLeft : styles.labelRight}`}
              style={{ top: `${p.labelY}%` }}
              onClick={() => onOpenPart(p.id)}
            >
              <span data-d-label data-side={p.side} className={styles.labelInner}>
                <span className={styles.labelIndex}>0{i + 1}</span>
                <span className={styles.labelText}>{p.label}</span>
              </span>
            </button>
          ))}
        </div>

        <ol className={styles.list} aria-label="Composants">
          {parts.map((p, i) => (
            <li key={p.id} data-d-item>
              <button
                type="button"
                data-part-trigger={p.id}
                data-d-focus-first={i === 0 ? "" : undefined}
                className={styles.listButton}
                onClick={() => onOpenPart(p.id)}
              >
                <span className={styles.labelIndex}>0{i + 1}</span>
                <span>{p.label}</span>
                <span aria-hidden="true" className={styles.listArrow}>
                  →
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <button
        ref={backRef}
        type="button"
        className={styles.back}
        inert={!active || !!part}
        onClick={onBack}
      >
        <span aria-hidden="true">←</span> Retour au drone
      </button>

      {current && (
        <PartPanel part={current} index={index} total={parts.length} onClose={onClosePart} />
      )}
    </>
  );
}

function PartPanel({
  part,
  index,
  total,
  onClose,
}: {
  part: Part;
  index: number;
  total: number;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      // opacité seule : le panneau reste focusable dès son montage
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.45, ease: "power2.out" });
      if (!reduced) {
        gsap.fromTo("[data-p-media]", { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" });
        gsap.fromTo(
          "[data-p-item]",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: "power3.out", delay: 0.1 },
        );
      }
    }, el);
    heading.current?.focus({ preventScroll: true });
    return () => ctx.revert();
  }, [part.id]);

  return (
    <div ref={root} className={styles.part} role="dialog" aria-modal="false" aria-labelledby="part-title">
      <div data-p-media className={styles.partMedia}>
        <Image
          src={part.img}
          alt={`DJI Avata 2 — ${part.title}`}
          fill
          quality={90}
          sizes="(max-width: 767px) 92vw, 50vw"
          className="object-contain"
        />
      </div>
      <div className={styles.partText}>
        <p data-p-item className={styles.partIndex}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} — DJI Avata 2
        </p>
        <h2 data-p-item ref={heading} id="part-title" tabIndex={-1} className={styles.partTitle}>
          {part.title}
        </h2>
        <p data-p-item className={styles.partBody}>
          {part.text}
        </p>
        <div data-p-item>
          <button type="button" className={styles.partBack} onClick={onClose}>
            <span aria-hidden="true">←</span> Vue éclatée
          </button>
        </div>
      </div>
    </div>
  );
}
