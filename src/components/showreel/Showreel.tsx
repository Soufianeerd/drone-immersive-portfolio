"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SHOWREEL } from "@/content/showreel";
import { lockScroll, unlockScroll } from "@/lib/scroll";
import styles from "./Showreel.module.css";

/**
 * SHOWREEL — presque plein écran. Lecture automatique (muette) quand ≥ 60 % visible,
 * pause dès qu'il quitte la zone. Clic : grand lecteur (son, progression, plein écran),
 * retour exact à la position dans la page à la fermeture.
 */
export default function Showreel() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const inline = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const has = Boolean(SHOWREEL.src);

  // Apparition : le cadre s'ouvre en montant au-dessus du paysage.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          frame.current,
          { scale: 0.82, opacity: 0 },
          { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "top 20%", scrub: 0.6 } },
        );
        gsap.fromTo("[data-sr-head]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "top 45%", scrub: 0.6 } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Lecture / pause automatiques.
  useEffect(() => {
    const v = inline.current;
    if (!v || !has) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (open) return;
        if (e.intersectionRatio >= 0.6) void v.play().catch(() => undefined);
        else if (e.intersectionRatio < 0.35) v.pause();
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [has, open]);

  const close = useCallback(() => setOpen(false), []);
  const syncInline = useCallback((t: number) => {
    if (inline.current) inline.current.currentTime = t;
  }, []);

  return (
    <section ref={root} id="showreel" className={styles.section} aria-labelledby="showreel-title">
      <header data-sr-head className={styles.head}>
        <h2 id="showreel-title" className={styles.title}>
          Showreel
        </h2>
        <p className={styles.sub}>Drone · Photo · Vidéo · Mariage · Événement · Portrait · Voyage</p>
      </header>

      <div ref={frame} data-sr-frame className={styles.frame}>
        {has ? (
          <video
            ref={inline}
            className={styles.video}
            muted
            loop
            playsInline
            preload="metadata"
            poster={SHOWREEL.poster ?? undefined}
          >
            {SHOWREEL.srcWebm && <source src={SHOWREEL.srcWebm} type="video/webm" />}
            <source src={SHOWREEL.src!} type="video/mp4" />
          </video>
        ) : (
          <div className={styles.pending}>
            <span className={styles.pendingLabel}>Showreel en montage</span>
          </div>
        )}
        <button type="button" className={styles.open} onClick={() => {
            setStartAt(inline.current?.currentTime ?? 0);
            setOpen(true);
          }} aria-label="Ouvrir le showreel en grand">
          <span className={styles.openIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
          <span className={styles.openText}>{has ? "Regarder avec le son" : "Bientôt"}</span>
        </button>
      </div>

      {open && createPortal(<Player onClose={close} startAt={startAt} onTime={syncInline} />, document.body)}
    </section>
  );
}

function fmt(t: number) {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Player({ onClose, startAt, onTime }: { onClose: () => void; startAt: number; onTime: (t: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const has = Boolean(SHOWREEL.src);

  useEffect(() => {
    opener.current = document.activeElement;
    const y = window.scrollY;
    lockScroll();
    closeBtn.current?.focus();
    const v = video.current;
    if (v) {
      v.currentTime = startAt;
      // geste utilisateur : le son est autorisé
      void v.play().catch(() => undefined);
    }
    gsap.fromTo(box.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const vEl = video.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      if (vEl) onTime(vEl.currentTime);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      unlockScroll();
      window.scrollTo({ top: y, behavior: "auto" });
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [onClose, onTime, startAt]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <div ref={box} className={styles.player} role="dialog" aria-modal="true" aria-label="Showreel">
      <div className={styles.playerInner}>
        {has ? (
          <video
            ref={video}
            className={styles.playerVideo}
            playsInline
            muted={muted}
            poster={SHOWREEL.poster ?? undefined}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
            onClick={toggle}
          >
            {SHOWREEL.srcWebm && <source src={SHOWREEL.srcWebm} type="video/webm" />}
            <source src={SHOWREEL.src!} type="video/mp4" />
          </video>
        ) : (
          <div className={styles.pending}>
            <span className={styles.pendingLabel}>Le showreel sera intégré ici dès que le montage est livré.</span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.ctl} onClick={toggle} disabled={!has} aria-label={playing ? "Pause" : "Lecture"}>
          {playing ? "Pause" : "Lecture"}
        </button>
        <button type="button" className={styles.ctl} onClick={() => setMuted((m) => !m)} disabled={!has} aria-pressed={muted}>
          {muted ? "Son coupé" : "Son"}
        </button>
        <input
          className={styles.progress}
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={time}
          disabled={!has}
          aria-label="Progression"
          onChange={(e) => {
            const v = video.current;
            if (v) v.currentTime = Number(e.target.value);
          }}
        />
        <span className={styles.time}>
          {fmt(time)} / {fmt(dur)}
        </span>
        <button
          type="button"
          className={styles.ctl}
          disabled={!has}
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void box.current?.requestFullscreen?.();
          }}
        >
          Plein écran
        </button>
        <button ref={closeBtn} type="button" className={styles.close} onClick={onClose}>
          Fermer <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
