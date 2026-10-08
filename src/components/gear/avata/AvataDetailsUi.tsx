"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  FULL_ASPECT,
  FULL_SRC,
  GHOST_STYLE,
  LAYERS,
  PARTS,
  boundsPct,
  layerStyle,
} from "./avata2Details";
import type { Part, PartId } from "./avata2Details";
import styles from "./AvataDetailsUi.module.css";

type Props = {
  sceneRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  ghostRef: RefObject<HTMLDivElement | null>;
  /** Vue éclatée interactive (mode avata-details). */
  interactive: boolean;
  /** Composant affiché dans le panneau (reste monté pendant sa sortie). */
  shownPart: PartId | null;
  partClosing: boolean;
  onBackToDrone: () => void;
  onOpenPart: (id: PartId) => void;
  onClosePart: () => void;
};

/**
 * Scène Détails : plein écran sous le header (position fixe, défilement vertical
 * possible sur petit écran), jamais prisonnière du conteneur du hero.
 * Toile = silhouette de la vue éclatée, calques masqués, points / filets / étiquettes
 * en HTML/SVG, liste numérotée en dessous ou à côté sur les écrans étroits.
 */
export default function AvataDetailsUi({
  sceneRef,
  canvasRef,
  ghostRef,
  interactive,
  shownPart,
  partClosing,
  onBackToDrone,
  onOpenPart,
  onClosePart,
}: Props) {
  const current = shownPart ? PARTS.find((p) => p.id === shownPart) ?? null : null;

  return (
    <>
      <div
        ref={sceneRef}
        className={styles.scene}
        role="region"
        aria-label="DJI Avata 2 — vue éclatée"
        inert={!interactive}
        data-anim
      >
        <div className={styles.inner}>
          <div className={styles.top}>
            <div data-d-ui className={styles.eyebrow}>
              <p className={styles.eyebrowTitle}>DJI Avata 2 · Vue éclatée</p>
              <p className={styles.eyebrowHint}>Sélectionnez un composant</p>
            </div>
            <button data-d-ui type="button" className={styles.backDrone} onClick={onBackToDrone}>
              <span aria-hidden="true">←</span> Retour au drone
            </button>
          </div>

          <div className={styles.body}>
            <div ref={canvasRef} className={styles.canvas} style={{ aspectRatio: FULL_ASPECT }}>
              {/* Emplacement exact du drone assemblé : cible du recalage depuis le hero. */}
              <div ref={ghostRef} className={styles.ghost} style={GHOST_STYLE} aria-hidden="true" />

              {LAYERS.map((l) => {
                const st = layerStyle(l);
                return (
                  <div
                    key={l.key}
                    data-x-layer={l.key}
                    data-x-part={l.part ?? ""}
                    className={styles.layer}
                    style={st.box}
                    aria-hidden="true"
                  >
                    <span className={styles.layerImg} style={st.img}>
                      <Image
                        src={FULL_SRC}
                        alt=""
                        fill
                        loading="eager"
                        fetchPriority="low"
                        quality={90}
                        sizes="(orientation: portrait) 100vw, 80vw"
                        draggable={false}
                        className="select-none object-contain"
                      />
                    </span>
                  </div>
                );
              })}

              <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {PARTS.map((p) => {
                  const d = boundsPct(p.dot.x, p.dot.y);
                  const l = boundsPct(0, p.labelY);
                  return (
                    <line
                      key={p.id}
                      data-d-line
                      pathLength={1}
                      x1={d.x}
                      y1={d.y}
                      x2={p.side === "left" ? -4 : 104}
                      y2={l.y}
                    />
                  );
                })}
              </svg>

              {PARTS.map((p, i) => {
                const d = boundsPct(p.dot.x, p.dot.y);
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-d-dot
                    data-part-trigger={p.id}
                    tabIndex={-1}
                    aria-hidden="true"
                    className={styles.dot}
                    style={{ left: `${d.x}%`, top: `${d.y}%` }}
                    onClick={() => onOpenPart(p.id)}
                  >
                    <span>{i + 1}</span>
                  </button>
                );
              })}

              {PARTS.map((p, i) => {
                const l = boundsPct(0, p.labelY);
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-part-trigger={p.id}
                    data-d-label
                    data-side={p.side}
                    className={`${styles.label} ${p.side === "left" ? styles.labelLeft : styles.labelRight}`}
                    style={{ top: `${l.y}%` }}
                    onClick={() => onOpenPart(p.id)}
                  >
                    <span className={styles.labelIndex}>0{i + 1}</span>
                    <span className={styles.labelText}>{p.label}</span>
                  </button>
                );
              })}
            </div>

            <ol className={styles.list} aria-label="Composants du DJI Avata 2">
              {PARTS.map((p, i) => (
                <li key={p.id} data-d-ui>
                  <button
                    type="button"
                    data-part-trigger={p.id}
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
        </div>
      </div>

      {current && (
        <PartPanel
          key={current.id}
          part={current}
          index={PARTS.indexOf(current)}
          closing={partClosing}
          onClose={onClosePart}
        />
      )}
    </>
  );
}

function PartPanel({
  part,
  index,
  closing,
  onClose,
}: {
  part: Part;
  index: number;
  closing: boolean;
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
        gsap.fromTo(
          "[data-p-media]",
          { opacity: 0, scale: 0.94, x: -24 },
          { opacity: 1, scale: 1, x: 0, duration: 0.9, ease: "expo.out", delay: 0.05 },
        );
        gsap.fromTo(
          "[data-p-item]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: "power3.out", delay: 0.15 },
        );
      }
    }, el);
    heading.current?.focus({ preventScroll: true });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className={styles.part}
      role="dialog"
      aria-modal="true"
      aria-labelledby="part-title"
      inert={closing}
      data-part-panel
    >
      <div className={styles.partGrid}>
        <div data-p-media className={styles.partMedia}>
          <Image
            src={part.img}
            alt={`DJI Avata 2 — ${part.title}`}
            fill
            quality={90}
            sizes="(orientation: portrait) 92vw, 55vw"
            className="object-contain"
          />
        </div>
        <div className={styles.partText}>
          <p data-p-item className={styles.partIndex}>
            {String(index + 1).padStart(2, "0")} / {String(PARTS.length).padStart(2, "0")} — DJI Avata 2
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
    </div>
  );
}
