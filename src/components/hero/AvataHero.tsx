"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent as ReactFocusEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { HOME_RESET_EVENT } from "@/lib/home";
import {
  ACTIVE_HEIGHT,
  ACTIVE_SRC,
  ACTIVE_TO_IDLE,
  ACTIVE_WIDTH,
  DRONE_BOUNDS,
  IDLE_SIZE,
  IDLE_SRC,
  isOnDrone,
} from "./avata2Calibration";
import { EXPLODE_STEPS, FULL_BOUNDS, PARTS } from "./avata2Details";
import type { PartId } from "./avata2Details";
import AvataDetailsUi from "./AvataDetailsUi";
import styles from "./AvataHero.module.css";

/**
 * Hero — setup FPV : DJI Goggles 3 · DJI Avata 2 · DJI FPV Remote Controller 3.
 *
 * Machine d'états (l'Avata est le seul objet interactif) :
 *   idle ⇄ hover → focused (fiche) ⇄ details (vue éclatée → composant)
 * Chaque transition a un retour ; resetScene() ramène tout à idle (logo ANASS).
 *
 * Chaque calque n'a qu'un seul propriétaire d'animation :
 *   parallax      → suivi du curseur (quickTo)
 *   detailsMove   → recentrage de la vue éclatée (timeline Détails)
 *   rig           → déplacement de focus (timeline Focus)
 *   intro         → apparition initiale + fondu reduced-motion
 *   float         → flottement idle (mis en pause pendant Détails)
 *   lift          → montée / rapprochement au hover
 *   idle/active layers → passage idle ↔ hélices ; droneImgs → disparition au profit de l'éclaté
 *   [data-explode-step] → séquence de décomposition (timeline Détails)
 *   secondaires   : [data-sec-parallax] / [data-sec-hover] / [data-sec-focus]
 */

type SceneState = "idle" | "hover" | "focused" | "details";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const MOBILE_MAX = 767;
const HEADER_H = 72;
const LEAVE_DELAY_MS = 90;

// Silhouette du drone dans l'image idle, normalisée.
const BOUNDS_W = (DRONE_BOUNDS.right - DRONE_BOUNDS.left) / IDLE_SIZE;
const BOUNDS_H = (DRONE_BOUNDS.bottom - DRONE_BOUNDS.top) / IDLE_SIZE;
const BOUNDS_CX = (DRONE_BOUNDS.left + DRONE_BOUNDS.right) / 2 / IDLE_SIZE - 0.5;
const BOUNDS_CY = (DRONE_BOUNDS.top + DRONE_BOUNDS.bottom) / 2 / IDLE_SIZE - 0.5;

const activeLayerStyle = {
  left: `${(ACTIVE_TO_IDLE.e / IDLE_SIZE) * 100}%`,
  top: `${(ACTIVE_TO_IDLE.f / IDLE_SIZE) * 100}%`,
  width: `${(ACTIVE_WIDTH / IDLE_SIZE) * 100}%`,
  height: `${(ACTIVE_HEIGHT / IDLE_SIZE) * 100}%`,
  transform: `matrix(${ACTIVE_TO_IDLE.a}, ${ACTIVE_TO_IDLE.b}, ${ACTIVE_TO_IDLE.c}, ${ACTIVE_TO_IDLE.d}, 0, 0)`,
} as const;

const SECONDARIES = [
  {
    key: "goggles",
    side: -1,
    src: "/assets/goggles3/goggles3-hero-3q.png",
    alt: "DJI Goggles 3",
    className: styles.goggles,
  },
  {
    key: "remote",
    side: 1,
    src: "/assets/fpv-remote-controller-3/fpv-remote-controller-3-hero-3q.png",
    alt: "DJI FPV Remote Controller 3",
    className: styles.remote,
  },
] as const;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function AvataHero() {
  const [state, setState] = useState<SceneState>("idle");
  const [part, setPart] = useState<PartId | null>(null);

  const stageRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const detailsMoveRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const droneImgsRef = useRef<HTMLSpanElement>(null);
  const idleLayerRef = useRef<HTMLSpanElement>(null);
  const activeLayerRef = useRef<HTMLSpanElement>(null);
  const shadowBreathRef = useRef<HTMLDivElement>(null);
  const shadowFocusRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const droneRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const detailsBtnRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const detailsUiRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneScrollRef = useRef<HTMLDivElement>(null);
  const textScrollRef = useRef<HTMLDivElement>(null);

  // État "vivant" lu par les handlers sans attendre un rendu React.
  const stateRef = useRef<SceneState>("idle");
  const partRef = useRef<PartId | null>(null);
  const overRef = useRef(false);
  const leaveTimer = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const lastPointerType = useRef<string>("mouse");
  const focusTl = useRef<gsap.core.Timeline | null>(null);
  const detailsTl = useRef<gsap.core.Timeline | null>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const focusScrollY = useRef(0);
  const pointer = useRef({ nx: 0, ny: 0, du: 0 });
  const movers = useRef<{
    px: gsap.QuickToFunc;
    py: gsap.QuickToFunc;
    pr: gsap.QuickToFunc;
    lx: gsap.QuickToFunc;
    sec: { side: number; x: gsap.QuickToFunc; y: gsap.QuickToFunc }[];
  } | null>(null);
  const floatTweens = useRef<gsap.core.Tween[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const commit = useCallback((next: SceneState) => {
    stateRef.current = next;
    setState(next);
    const root = document.documentElement;
    // Le header masque sa navigation pendant le focus et les détails (voir SiteHeader.module.css).
    root.toggleAttribute("data-hero-focus", next === "focused" || next === "details");
    // La vue éclatée occupe l'écran : la page ne défile pas pendant Détails.
    root.style.overflow = next === "details" ? "hidden" : "";
  }, []);

  /* ------------------------------------------------------------------ */
  /* Calques                                                              */
  /* ------------------------------------------------------------------ */

  const run = useCallback((fn: () => void) => {
    if (ctxRef.current) ctxRef.current.add(fn);
    else fn();
  }, []);

  /** Moteurs ON/OFF : levée, rapprochement, passage idle ↔ hélices, ombre, recul du setup. */
  const setActive = useCallback(
    (on: boolean) => {
      run(() => {
        const box = rigRef.current?.offsetWidth ?? 800;
        const reduced = prefersReducedMotion();
        const lift = box * 0.034;
        const secHover = stageRef.current?.querySelectorAll<HTMLElement>("[data-sec-hover]") ?? [];

        // Le reste du setup passe au second plan pendant que le drone s'active.
        secHover.forEach((el) => {
          const side = Number(el.dataset.side);
          gsap.to(el, {
            x: on && !reduced ? -side * box * 0.016 : 0,
            y: on && !reduced ? -box * 0.007 : 0,
            scale: on && !reduced ? 0.955 : 1,
            opacity: on ? 0.78 : 1,
            duration: on ? 1.05 : 1.15,
            ease: on ? "expo.out" : "power3.inOut",
            overwrite: "auto",
          });
        });

        if (on) {
          // Les hélices floues arrivent par-dessus ; l'idle ne s'efface qu'ensuite,
          // de sorte que les pales nettes "se brouillent" au lieu de disparaître.
          gsap.to(activeLayerRef.current, { opacity: 1, duration: 0.3, ease: "power1.out", overwrite: "auto" });
          gsap.to(idleLayerRef.current, { opacity: 0, duration: 0.42, delay: 0.16, ease: "power1.inOut", overwrite: "auto" });
          if (reduced) return;
          gsap.to(liftRef.current, {
            keyframes: [
              // léger tassement au démarrage des moteurs, puis montée
              { y: lift * 0.07, scale: 0.997, duration: 0.12, ease: "power2.out" },
              { y: -lift, scale: 1.04, duration: 1.05, ease: "expo.out" },
            ],
            overwrite: "auto",
          });
          gsap.to(shadowRef.current, {
            scaleX: 0.82,
            scaleY: 0.74,
            opacity: 0.62,
            duration: 1,
            ease: "expo.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(idleLayerRef.current, { opacity: 1, duration: 0.32, ease: "power1.out", overwrite: "auto" });
          gsap.to(activeLayerRef.current, { opacity: 0, duration: 0.5, delay: 0.14, ease: "power1.inOut", overwrite: "auto" });
          if (reduced) return;
          gsap.to(liftRef.current, { y: 0, scale: 1, duration: 1.15, ease: "power3.inOut", overwrite: "auto" });
          gsap.to(shadowRef.current, {
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            duration: 1.15,
            ease: "power3.inOut",
            overwrite: "auto",
          });
        }
      });
    },
    [run],
  );

  /** Met à jour la parallaxe selon l'état courant. */
  const updateParallax = useCallback(() => {
    const m = movers.current;
    if (!m) return;
    const s = stateRef.current;
    if (s === "focused" || s === "details" || prefersReducedMotion()) {
      m.px(0);
      m.py(0);
      m.pr(0);
      m.lx(0);
      m.sec.forEach((q) => {
        q.x(0);
        q.y(0);
      });
      return;
    }
    const { nx, ny, du } = pointer.current;
    const hover = s === "hover";
    // Profondeur : le drone glisse à l'opposé du curseur, la lumière de sol moins.
    m.px(-nx * 12 + (hover ? du * 10 : 0));
    m.py(-ny * 7);
    m.pr(hover ? du * 1.6 : nx * 0.35);
    m.lx(-nx * 5);
    // objets secondaires plus éloignés : moitié moins de déplacement
    m.sec.forEach((q) => {
      q.x(-nx * 6);
      q.y(-ny * 3.5);
    });
  }, []);

  const startFloat = useCallback(() => {
    floatTweens.current.forEach((t) => t.kill());
    floatTweens.current = [];
    if (prefersReducedMotion()) {
      gsap.set([floatRef.current, shadowBreathRef.current], { clearProps: "transform,opacity" });
      return;
    }
    const box = rigRef.current?.offsetWidth ?? 800;
    const amp = Math.max(4, box * 0.0085);
    floatTweens.current = [
      gsap.to(floatRef.current, { y: -amp, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.to(floatRef.current, { rotation: 0.45, duration: 5.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -1.3 }),
      // l'ombre respire en opposition : drone plus haut → ombre plus petite et plus pâle
      gsap.to(shadowBreathRef.current, {
        scaleX: 0.93,
        scaleY: 0.9,
        opacity: 0.8,
        duration: 3.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      }),
    ];
  }, []);

  /* ------------------------------------------------------------------ */
  /* Focus                                                                */
  /* ------------------------------------------------------------------ */

  const buildFocusTimeline = useCallback(() => {
    const stage = stageRef.current;
    const rig = rigRef.current;
    const panel = panelRef.current;
    if (!stage || !rig || !panel) return null;

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const box = rig.offsetWidth;
    const rigCx = rig.offsetLeft + box / 2;
    const rigCy = rig.offsetTop + box / 2;
    const droneW = BOUNDS_W * box;
    const droneH = BOUNDS_H * box;
    const mobile = W <= MOBILE_MAX;

    const scale = mobile
      ? Math.min((0.9 * W) / droneW, (0.4 * H) / droneH)
      : Math.min((0.76 * W) / droneW, (0.8 * H) / droneH);
    const targetX = mobile ? 0.5 * W : 0.27 * W;
    const targetY = mobile ? 0.34 * H : 0.5 * H;
    const x = targetX - rigCx - BOUNDS_CX * box * scale;
    const y = targetY - rigCy - BOUNDS_CY * box * scale;

    const chrome = stage.querySelectorAll("[data-chrome]");
    const labelLine = panel.querySelector("[data-label-line]");
    const labelText = panel.querySelector("[data-label-text]");
    const titleLine = panel.querySelector("[data-title-line]");
    const items = panel.querySelectorAll("[data-panel-item]");
    const secFocus = stage.querySelectorAll<HTMLElement>("[data-sec-focus]");
    const reduced = prefersReducedMotion();

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    tl.to(chrome, { opacity: 0, y: reduced ? 0 : -6, duration: 0.5, stagger: 0.04, ease: "power2.out" }, 0)
      .to(lightRef.current, { opacity: 0.18, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(vignetteRef.current, { opacity: 1, duration: 1.2, ease: "power2.inOut" }, 0);

    if (reduced) {
      tl.to(secFocus, { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 0)
        .to(introRef.current, { opacity: 0, duration: 0.22, ease: "power1.in" }, 0)
        .set(rig, { x, y, scale }, 0.22)
        .set(shadowFocusRef.current, { opacity: 0 }, 0.22)
        .to(introRef.current, { opacity: 1, duration: 0.35, ease: "power1.out" }, 0.24)
        .set(panel, { autoAlpha: 1 }, 0.3)
        .fromTo([labelLine, labelText, titleLine, ...items], { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.32)
        .fromTo(closeRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.32);
      return tl;
    }

    tl.to(rig, { x, y, scale, duration: 1.3, ease: "expo.inOut" }, 0)
      // Goggles et télécommande reculent et s'effacent pendant que le drone avance.
      .to(
        secFocus,
        {
          x: (_i: number, el: HTMLElement) => Number(el.dataset.side) * W * 0.06,
          y: -H * 0.015,
          scale: 0.86,
          autoAlpha: 0,
          duration: 1.0,
          ease: "power2.inOut",
        },
        0.06,
      )
      // le drone se rapproche de la caméra : le sol et son ombre s'éloignent
      .to(shadowFocusRef.current, { opacity: 0, scale: 1.3, duration: 0.75, ease: "power2.in" }, 0)
      .set(panel, { autoAlpha: 1 }, 0.5)
      .fromTo(labelLine, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "expo.out" }, 0.62)
      .fromTo(labelText, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, 0.7)
      .fromTo(titleLine, { yPercent: 112 }, { yPercent: 0, duration: 1.05, ease: "expo.out" }, 0.74)
      .fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.09, ease: "power3.out" }, 0.92)
      .fromTo(closeRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, 1.0);

    return tl;
  }, []);

  const openFocus = useCallback(() => {
    if (stateRef.current !== "idle" && stateRef.current !== "hover") return;
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    const wasActive = stateRef.current === "hover";
    focusScrollY.current = window.scrollY;
    commit("focused");
    if (stageRef.current) stageRef.current.style.cursor = "";
    updateParallax();
    if (!wasActive) setActive(true);
    run(() => {
      focusTl.current?.kill();
      const tl = buildFocusTimeline();
      focusTl.current = tl;
      tl?.timeScale(1).play(0);
    });
    // Déplace le focus clavier dans la fiche une fois le titre apparu.
    later(() => {
      if (stateRef.current === "focused") titleRef.current?.focus({ preventScroll: true });
    }, 700);
  }, [buildFocusTimeline, commit, later, run, setActive, updateParallax]);

  /** focused → idle. `speed` accélère le retour (utilisé par resetScene). */
  const closeFocus = useCallback(
    (speed = 1.2, restoreFocus = true) => {
      if (stateRef.current !== "focused") return;
      const tl = focusTl.current;
      // Le focus clavier revient sur le drone avant que la fiche ne devienne inerte.
      if (restoreFocus) droneRef.current?.focus({ preventScroll: true });
      else (document.activeElement as HTMLElement | null)?.blur?.();
      const finish = () => {
        const next: SceneState = overRef.current ? "hover" : "idle";
        commit(next);
        if (next === "idle") setActive(false);
        updateParallax();
      };
      if (!tl) {
        finish();
        return;
      }
      tl.eventCallback("onReverseComplete", finish);
      tl.timeScale(speed).reverse();
      // les moteurs ralentissent pendant le retour si le curseur n'est plus sur le drone
      if (!overRef.current) {
        later(() => {
          if (stateRef.current === "focused" && !overRef.current) setActive(false);
        }, 450 / speed);
      }
    },
    [commit, later, setActive, updateParallax],
  );

  /* ------------------------------------------------------------------ */
  /* Détails : décomposition                                              */
  /* ------------------------------------------------------------------ */

  const buildDetailsTimeline = useCallback(() => {
    const stage = stageRef.current;
    const move = detailsMoveRef.current;
    const ui = detailsUiRef.current;
    const frame = frameRef.current;
    if (!stage || !move || !ui || !frame) return null;

    const steps = gsap.utils.toArray<HTMLElement>("[data-explode-step]", stage);
    const fullEl = steps[2];
    if (!fullEl) return null;

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const mobile = W <= MOBILE_MAX;
    const reduced = prefersReducedMotion();
    const stageRect = stage.getBoundingClientRect();

    // Mesure de la vue éclatée complète à sa position "drone" (detailsMove neutre,
    // flottement ramené à zéro par la timeline).
    gsap.set(move, { x: 0, y: 0, scale: 1 });
    const rigScale = Number(gsap.getProperty(rigRef.current, "scaleX")) || 1;
    const floatY = Number(gsap.getProperty(floatRef.current, "y")) || 0;
    const r = fullEl.getBoundingClientRect();
    const canvas = { x: r.left - stageRect.left, y: r.top - stageRect.top - floatY * rigScale, w: r.width, h: r.height };
    const fb = {
      x: canvas.x + (canvas.w * FULL_BOUNDS.left) / IDLE_SIZE,
      y: canvas.y + (canvas.h * FULL_BOUNDS.top) / IDLE_SIZE,
      w: (canvas.w * (FULL_BOUNDS.right - FULL_BOUNDS.left)) / IDLE_SIZE,
      h: (canvas.h * (FULL_BOUNDS.bottom - FULL_BOUNDS.top)) / IDLE_SIZE,
    };

    // Cible : centrée avec la place des étiquettes (desktop) ou en haut de l'écran (mobile).
    const top = (mobile ? 64 : HEADER_H) + 56;
    const k = mobile
      ? Math.min((0.9 * W) / fb.w, (0.46 * H) / fb.h)
      : Math.min((0.5 * W) / fb.w, (H - top - 40) / fb.h);
    const tcx = W / 2;
    const tcy = top + (fb.h * k) / 2 + (mobile ? 0 : Math.max(0, (H - top - 40 - fb.h * k) / 2));
    const dx = tcx - k * (fb.x + fb.w / 2);
    const dy = tcy - k * (fb.y + fb.h / 2);

    // Cadre des points / étiquettes = toile de la vue éclatée à sa position finale.
    gsap.set(frame, { left: canvas.x * k + dx, top: canvas.y * k + dy, width: canvas.w * k, height: canvas.h * k });

    const panel = panelRef.current;
    const eyebrow = ui.querySelectorAll("[data-d-eyebrow]");
    const lines = ui.querySelectorAll("[data-d-line]");
    const dots = ui.querySelectorAll("[data-d-dot]");
    const labels = ui.querySelectorAll("[data-d-label]");
    const list = ui.querySelectorAll("[data-d-item]");

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

    tl.to(panel, { autoAlpha: 0, x: reduced ? 0 : -24, duration: 0.45, ease: "power2.in" }, 0)
      .to(closeRef.current, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(floatRef.current, { y: 0, rotation: 0, duration: 0.5, ease: "power2.out" }, 0);

    if (reduced) {
      tl.to(introRef.current, { opacity: 0, duration: 0.2 }, 0.1)
        .set(move, { x: dx, y: dy, scale: k }, 0.3)
        .set(droneImgsRef.current, { autoAlpha: 0 }, 0.3)
        .set(steps[2], { autoAlpha: 1 }, 0.3)
        .to(introRef.current, { opacity: 1, duration: 0.3 }, 0.32)
        .set(ui, { autoAlpha: 1 }, 0.5)
        .set(lines, { strokeDashoffset: 0 }, 0.5)
        .fromTo([...eyebrow, ...lines, ...dots, ...labels, ...list], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.5)
        .fromTo(backRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.5);
      return tl;
    }

    const blur = mobile ? 0 : 6;
    tl.to(move, { x: dx, y: dy, scale: k, duration: 1.7, ease: "power3.inOut" }, 0.1)
      // 1 — le capot s'ouvre : le drone actif laisse place à l'électronique visible
      .fromTo(steps[0], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power1.inOut" }, 0.3)
      .to(droneImgsRef.current, { autoAlpha: 0, duration: 0.35, ease: "power1.in" }, 0.6)
      // 2 — les pièces quittent le corps : la caméra reste fixe, le reste s'écarte
      .fromTo(
        steps[1],
        { autoAlpha: 0, scale: 0.955, filter: `blur(${blur}px)` },
        { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.85, ease: "power2.out" },
        1.0,
      )
      .to(steps[0], { autoAlpha: 0, scale: 1.02, filter: `blur(${blur / 2}px)`, duration: 0.6, ease: "power1.in" }, 1.15)
      // 3 — éclaté complet
      .fromTo(
        steps[2],
        { autoAlpha: 0, scale: 0.955, filter: `blur(${blur}px)` },
        { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.85, ease: "power2.out" },
        1.75,
      )
      .to(steps[1], { autoAlpha: 0, scale: 1.02, filter: `blur(${blur / 2}px)`, duration: 0.6, ease: "power1.in" }, 1.9)
      // Écran technique
      .set(ui, { autoAlpha: 1 }, 2.25)
      .fromTo(eyebrow, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 2.25)
      .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.06, ease: "power2.inOut" }, 2.3)
      .fromTo(dots, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, stagger: 0.06, ease: "back.out(2)" }, 2.3)
      .fromTo(
        labels,
        { opacity: 0, x: (_i: number, el: HTMLElement) => (el.dataset.side === "left" ? 10 : -10) },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" },
        2.55,
      )
      .fromTo(list, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" }, 2.4)
      .fromTo(backRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 2.3);

    return tl;
  }, []);

  const openDetails = useCallback(() => {
    if (stateRef.current !== "focused") return;
    const ftl = focusTl.current;
    // La fiche doit être arrivée avant de mesurer la position du drone.
    if (ftl && (ftl.progress() < 1 || ftl.reversed())) return;
    commit("details");
    floatTweens.current.forEach((t) => t.pause());
    run(() => {
      detailsTl.current?.kill();
      const tl = buildDetailsTimeline();
      detailsTl.current = tl;
      tl?.timeScale(1).play(0);
    });
    later(() => {
      if (stateRef.current !== "details") return;
      const first = Array.from(
        detailsUiRef.current?.querySelectorAll<HTMLElement>("[data-d-focus-first]") ?? [],
      ).find((el) => el.offsetParent !== null);
      (first ?? backRef.current)?.focus({ preventScroll: true });
    }, prefersReducedMotion() ? 600 : 2600);
  }, [buildDetailsTimeline, commit, later, run]);

  /** details → focused (ou directement idle si `then` est fourni). */
  const closeDetails = useCallback(
    (speed = 1.5, then?: () => void) => {
      if (stateRef.current !== "details") return;
      partRef.current = null;
      setPart(null);
      const tl = detailsTl.current;
      const finish = () => {
        commit("focused");
        startFloat();
        if (then) then();
        // le panneau n'est plus inert qu'après le rendu React : focus à l'image suivante
        else requestAnimationFrame(() => detailsBtnRef.current?.focus({ preventScroll: true }));
      };
      if (!tl) {
        finish();
        return;
      }
      tl.eventCallback("onReverseComplete", finish);
      tl.timeScale(speed).reverse();
    },
    [commit, startFloat],
  );

  const openPart = useCallback((id: PartId) => {
    if (stateRef.current !== "details") return;
    partRef.current = id;
    setPart(id);
  }, []);

  const closePart = useCallback(() => {
    const id = partRef.current;
    if (!id) return;
    partRef.current = null;
    setPart(null);
    // le focus revient sur l'étiquette qui a ouvert le composant
    requestAnimationFrame(() => {
      const visible = Array.from(
        detailsUiRef.current?.querySelectorAll<HTMLElement>(`[data-part-trigger="${id}"]:not([data-d-dot])`) ?? [],
      ).find((n) => n.offsetParent !== null);
      (visible ?? backRef.current)?.focus({ preventScroll: true });
    });
  }, []);

  /**
   * Retour complet à l'accueil depuis n'importe quel état.
   * Déclenché par resetToHome() (logo ANASS) via HOME_RESET_EVENT.
   */
  const resetScene = useCallback(() => {
    clearTimers();
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    overRef.current = false;
    if (stageRef.current) stageRef.current.style.cursor = "";
    const s = stateRef.current;
    if (s === "details") {
      closeDetails(2.8, () => closeFocus(2.2, false));
    } else if (s === "focused") {
      const ftl = focusTl.current;
      if (ftl && ftl.progress() < 1 && !ftl.reversed()) ftl.progress(1);
      closeFocus(2.2, false);
    } else if (s === "hover") {
      commit("idle");
      setActive(false);
    }
    pointer.current = { nx: 0, ny: 0, du: 0 };
    updateParallax();
  }, [clearTimers, closeDetails, closeFocus, commit, setActive, updateParallax]);

  /* ------------------------------------------------------------------ */
  /* Mise en place                                                        */
  /* ------------------------------------------------------------------ */

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([rigRef.current, floatRef.current, liftRef.current, parallaxRef.current], { force3D: true });
      gsap.set(detailsMoveRef.current, { transformOrigin: "0 0" });
      const secParallax = gsap.utils.toArray<HTMLElement>("[data-sec-parallax]");
      movers.current = {
        px: gsap.quickTo(parallaxRef.current, "x", { duration: 0.9, ease: "power3.out" }),
        py: gsap.quickTo(parallaxRef.current, "y", { duration: 0.9, ease: "power3.out" }),
        pr: gsap.quickTo(parallaxRef.current, "rotation", { duration: 1.1, ease: "power3.out" }),
        lx: gsap.quickTo(lightRef.current, "x", { duration: 1.2, ease: "power3.out" }),
        sec: secParallax.map((el) => ({
          side: Number(el.dataset.side),
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
        })),
      };

      startFloat();
    }, stageRef);
    ctxRef.current = ctx;

    // Apparition : courte et immédiate. Les éléments [data-intro] ne sont masqués
    // par CSS que si JS est actif (classe `js` posée avant le premier rendu).
    let cancelled = false;
    const stage = stageRef.current;
    const imgs = Array.from(stage?.querySelectorAll<HTMLImageElement>("img[data-hero-img]") ?? []);
    const decoded = Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 300));
    Promise.race([decoded, timeout]).then(() => {
      if (cancelled) return;
      ctx.add(() => {
        const reduced = prefersReducedMotion();
        const chrome = gsap.utils.toArray<HTMLElement>("[data-chrome]");
        const secParallax = gsap.utils.toArray<HTMLElement>("[data-sec-parallax]");
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .to(lightRef.current, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0)
          .to(introRef.current, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0)
          .to(secParallax, { opacity: 1, duration: 0.55, stagger: 0.07, ease: "power1.out" }, 0.05)
          .to(chrome, { opacity: 1, duration: 0.5, stagger: 0.05, ease: "power1.out" }, 0.2);
        if (!reduced) {
          intro
            .from(introRef.current, { y: 10, scale: 0.985, duration: 0.9 }, 0)
            .from(secParallax, { scale: 0.985, duration: 0.9, stagger: 0.07 }, 0.05);
        }
      });
    });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionPref = () => {
      ctx.add(() => startFloat());
      updateParallax();
    };
    mq.addEventListener("change", onMotionPref);

    return () => {
      cancelled = true;
      mq.removeEventListener("change", onMotionPref);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      floatTweens.current = [];
      movers.current = null;
      focusTl.current = null;
      detailsTl.current = null;
      ctxRef.current = null;
      ctx.revert();
      document.documentElement.removeAttribute("data-hero-focus");
      document.documentElement.style.overflow = "";
    };
  }, [startFloat, updateParallax]);

  // Retour accueil (logo ANASS).
  useEffect(() => {
    const onHome = () => resetScene();
    window.addEventListener(HOME_RESET_EVENT, onHome);
    return () => window.removeEventListener(HOME_RESET_EVENT, onHome);
  }, [resetScene]);

  // Défilement : la scène s'éloigne plus lentement que la page (profondeur),
  // le texte part plus vite. Un défilement pendant le focus referme la fiche.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const trigger = { trigger: stage, start: "top top", end: "bottom top", scrub: true };
      gsap.to(sceneScrollRef.current, { yPercent: 18, opacity: 0.25, ease: "none", scrollTrigger: trigger });
      gsap.to(textScrollRef.current, { yPercent: -10, opacity: 0, ease: "none", scrollTrigger: { ...trigger, end: "60% top" } });
    });
    const onScroll = () => {
      if (stateRef.current === "focused" && Math.abs(window.scrollY - focusScrollY.current) > 40) closeFocus();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      mm.revert();
    };
  }, [closeFocus]);

  // Échap : composant → vue éclatée → fiche → accueil, un niveau à la fois.
  useEffect(() => {
    if (state === "idle" || state === "hover") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (partRef.current) closePart();
      else if (stateRef.current === "details") closeDetails();
      else if (stateRef.current === "focused") closeFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, closePart, closeDetails, closeFocus]);

  // Redimensionnement : recalcule focus / détails et l'amplitude du flottement.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    let lastW = stage.clientWidth;
    let lastH = stage.clientHeight;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (stage.clientWidth === lastW && stage.clientHeight === lastH) return;
        lastW = stage.clientWidth;
        lastH = stage.clientHeight;
        run(() => {
          const s = stateRef.current;
          if (s !== "details") startFloat();
          if ((s === "focused" || s === "details") && focusTl.current) {
            const old = focusTl.current;
            const p = old.progress();
            const reversed = old.reversed();
            const cb = old.eventCallback("onReverseComplete");
            old.kill();
            const tl = buildFocusTimeline();
            if (tl) {
              focusTl.current = tl;
              tl.progress(p);
              if (reversed) {
                tl.eventCallback("onReverseComplete", cb);
                tl.timeScale(1.2).reverse();
              } else if (p < 1) tl.play();
            }
          }
          if (s === "details" && detailsTl.current) {
            const old = detailsTl.current;
            const p = old.progress();
            const reversed = old.reversed();
            const cb = old.eventCallback("onReverseComplete");
            old.kill();
            const tl = buildDetailsTimeline();
            if (tl) {
              detailsTl.current = tl;
              tl.progress(p);
              if (reversed) {
                tl.eventCallback("onReverseComplete", cb);
                tl.timeScale(1.5).reverse();
              } else if (p < 1) tl.play();
            }
          }
        });
      });
    });
    ro.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [buildDetailsTimeline, buildFocusTimeline, run, startFloat]);

  /* ------------------------------------------------------------------ */
  /* Pointeur                                                             */
  /* ------------------------------------------------------------------ */

  const hitTest = useCallback((clientX: number, clientY: number) => {
    const el = droneRef.current;
    if (!el) return { over: false, du: 0 };
    const r = el.getBoundingClientRect();
    const u = (clientX - r.left) / r.width;
    const v = (clientY - r.top) / r.height;
    return { over: isOnDrone(u, v), du: Math.max(-1, Math.min(1, (u - 0.5) * 2)) };
  }, []);

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    lastPointerType.current = e.pointerType;
    if (e.pointerType === "touch") return;
    const stage = stageRef.current;
    if (!stage) return;
    const s = stateRef.current;
    if (s === "details") return;
    const r = stage.getBoundingClientRect();
    const { over, du } = hitTest(e.clientX, e.clientY);
    pointer.current = {
      nx: ((e.clientX - r.left) / r.width - 0.5) * 2,
      ny: ((e.clientY - r.top) / r.height - 0.5) * 2,
      du,
    };

    if (over) {
      overRef.current = true;
      if (leaveTimer.current) {
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }
      if (s === "idle") {
        commit("hover");
        setActive(true);
      }
    } else if (overRef.current && !leaveTimer.current) {
      leaveTimer.current = window.setTimeout(() => {
        leaveTimer.current = null;
        overRef.current = false;
        if (stateRef.current === "hover") {
          commit("idle");
          setActive(false);
          updateParallax();
        }
      }, LEAVE_DELAY_MS);
    }
    stage.style.cursor = over && (s === "idle" || s === "hover") ? "pointer" : "";
    updateParallax();
  };

  const onPointerLeave = () => {
    pointer.current = { nx: 0, ny: 0, du: 0 };
    overRef.current = false;
    if (leaveTimer.current) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (stateRef.current === "hover") {
      commit("idle");
      setActive(false);
    }
    updateParallax();
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    lastPointerType.current = e.pointerType;
  };

  const onStageClick = (e: ReactMouseEvent<HTMLElement>) => {
    const target = e.target as Node;
    const s = stateRef.current;
    // Détails : on ne sort que par les contrôles explicites (Retour, Échap, ANASS).
    if (s === "details") return;
    const onDroneButton = droneRef.current?.contains(target) ?? false;

    if (s === "focused") {
      if (panelRef.current?.contains(target) || closeRef.current?.contains(target)) return;
      if (onDroneButton && hitTest(e.clientX, e.clientY).over) {
        // retour en cours : un clic sur le drone relance le focus ; sinon il ne ferme pas la fiche
        const tl = focusTl.current;
        if (tl?.reversed()) {
          tl.eventCallback("onReverseComplete", null);
          setActive(true);
          tl.timeScale(1).play();
        }
        return;
      }
      closeFocus();
      return;
    }

    if (!onDroneButton) return;
    const keyboard = e.detail === 0;
    const touch = lastPointerType.current === "touch";
    if (keyboard || touch || hitTest(e.clientX, e.clientY).over) openFocus();
  };

  const onDroneFocus = (e: ReactFocusEvent<HTMLButtonElement>) => {
    if (stateRef.current !== "idle") return;
    if (!e.currentTarget.matches(":focus-visible")) return;
    commit("hover");
    setActive(true);
  };

  const onDroneBlur = () => {
    if (stateRef.current === "hover" && !overRef.current) {
      commit("idle");
      setActive(false);
    }
  };

  const focused = state === "focused";
  const details = state === "details";

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      aria-label="Setup FPV d'Anass : DJI Goggles 3, DJI Avata 2, DJI FPV Remote Controller 3"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onClick={onStageClick}
    >
      <div ref={lightRef} data-intro className={styles.floorLight} aria-hidden="true" />
      <div ref={vignetteRef} className={styles.vignette} aria-hidden="true" />

      {/* Cadrage éditorial : nom, phrase, métiers. Ne concurrence pas les objets. */}
      <div ref={textScrollRef} className={styles.textScroll}>
        <div data-chrome data-intro className={styles.editorial}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            01 <span className="mx-2 text-faint">/</span> Setup FPV
          </p>
          <h1 className={styles.title}>
            <span className="sr-only">Anass — </span>
            Filmer au plus près
            <br />
            du mouvement.
          </h1>
          <p className="mt-4 text-[15px] leading-[1.5] text-soft">
            Créateur d’images
            <span className="mx-2.5 text-faint">—</span>
            <span className="text-fg/85">Photo · Vidéo · Drone FPV</span>
          </p>
        </div>
      </div>

      <p
        data-chrome
        data-intro
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[clamp(20px,3.2vw,36px)] left-[var(--gutter)] z-[3] flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
      >
        <span className="inline-block h-px w-6 bg-faint" />
        <span className="hidden [@media(hover:hover)]:inline">Survolez le drone</span>
        <span className="inline [@media(hover:hover)]:hidden">Touchez le drone</span>
      </p>

      <div ref={sceneScrollRef} className={styles.sceneScroll}>
        {/* Objets secondaires du setup : non interactifs, derrière l'Avata */}
        {SECONDARIES.map((obj) => (
          <div key={obj.key} className={`${styles.secondary} ${obj.className}`}>
            <div data-sec-parallax data-intro data-side={obj.side} className={styles.layer}>
              <div data-sec-hover data-side={obj.side} className={styles.secLayer}>
                <div data-sec-focus data-side={obj.side} className={styles.secLayer}>
                  <div className={styles.secShadow} aria-hidden="true" />
                  <Image
                    src={obj.src}
                    alt={obj.alt}
                    fill
                    preload
                    quality={90}
                    sizes="(max-width: 767px) 50vw, 30vw"
                    draggable={false}
                    data-hero-img
                    className="select-none object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div ref={parallaxRef} className={styles.parallax}>
          <div ref={detailsMoveRef} className={styles.layer}>
            <div ref={rigRef} className={styles.rig}>
              <div ref={introRef} data-intro className={styles.layer}>
                <div ref={shadowBreathRef} className={styles.shadowPos} aria-hidden="true">
                  <div ref={shadowFocusRef} className={styles.layer}>
                    <div ref={shadowRef} className={styles.shadow} />
                  </div>
                </div>

                <div ref={floatRef} className={styles.layer}>
                  <div ref={liftRef} className={styles.layer}>
                    <button
                      ref={droneRef}
                      type="button"
                      className={styles.droneButton}
                      aria-label={focused || details ? "DJI Avata 2" : "DJI Avata 2 — afficher la fiche"}
                      aria-expanded={focused || details}
                      aria-controls="avata2-panel"
                      tabIndex={details ? -1 : 0}
                      onFocus={onDroneFocus}
                      onBlur={onDroneBlur}
                    >
                      <span ref={droneImgsRef} className={styles.layer}>
                        <span ref={idleLayerRef} className={styles.layer}>
                          <Image
                            src={IDLE_SRC}
                            alt=""
                            fill
                            preload
                            quality={90}
                            sizes="(max-width: 767px) 100vw, 90vw"
                            draggable={false}
                            data-hero-img
                            className="select-none object-contain"
                          />
                        </span>
                        <span ref={activeLayerRef} className={styles.activeLayer} style={activeLayerStyle}>
                          <Image
                            src={ACTIVE_SRC}
                            alt=""
                            fill
                            loading="eager"
                            quality={90}
                            sizes="(max-width: 767px) 110vw, 100vw"
                            draggable={false}
                            className="select-none object-fill"
                          />
                        </span>
                      </span>
                      <span className={styles.focusMark} aria-hidden="true" />
                    </button>

                    {/* Décomposition, recalée sur le module caméra (voir avata2Details.ts) */}
                    {EXPLODE_STEPS.map((step) => (
                      <span
                        key={step.key}
                        data-explode-step={step.key}
                        className={styles.explodeStep}
                        aria-hidden="true"
                        style={{
                          left: `${(step.tx / IDLE_SIZE) * 100}%`,
                          top: `${(step.ty / IDLE_SIZE) * 100}%`,
                          width: `${step.s * 100}%`,
                          height: `${step.s * 100}%`,
                          transformOrigin: `${(step.anchor.x / IDLE_SIZE) * 100}% ${(step.anchor.y / IDLE_SIZE) * 100}%`,
                        }}
                      >
                        <Image
                          src={step.src}
                          alt=""
                          fill
                          loading="eager"
                          fetchPriority="low"
                          quality={90}
                          sizes="(max-width: 767px) 100vw, 70vw"
                          draggable={false}
                          className="select-none object-contain"
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Légendes : une seule ligne commune, effacées avec le reste au focus */}
        <p data-chrome data-intro className={`${styles.caption} ${styles.capGoggles}`} aria-hidden="true">
          DJI Goggles 3
        </p>
        <p data-chrome data-intro className={`${styles.caption} ${styles.capAvata}`} aria-hidden="true">
          DJI Avata 2
        </p>
        <p data-chrome data-intro className={`${styles.caption} ${styles.capRemote}`} aria-hidden="true">
          DJI FPV Remote Controller 3
        </p>
      </div>

      <a
        href="#projets"
        data-chrome
        data-intro
        className={`${styles.scrollCue} group z-[3] font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:text-fg focus-visible:text-fg focus-visible:outline-none`}
      >
        <span>Défiler</span>
        <span className={styles.scrollLine} aria-hidden="true">
          <span />
        </span>
      </a>

      {/* Fiche éditoriale */}
      <div
        ref={panelRef}
        id="avata2-panel"
        role="region"
        aria-labelledby="avata2-title"
        className={styles.panel}
        inert={!focused}
      >
        <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <span data-label-line className={styles.labelLine} />
          <span data-label-text>01 — Drone FPV</span>
        </p>
        <h2
          ref={titleRef}
          id="avata2-title"
          tabIndex={-1}
          className="mt-6 overflow-hidden pb-[0.08em] text-[clamp(44px,6.4vw,104px)] font-medium leading-[0.92] tracking-[-0.045em] text-fg outline-none"
        >
          <span data-title-line className="block">
            DJI Avata&nbsp;2
          </span>
        </h2>
        <p data-panel-item className="mt-7 max-w-[38ch] text-pretty text-[15px] leading-[1.6] text-soft md:text-base">
          Drone FPV compact à hélices carénées. Capteur 1/1,3&nbsp;pouce, champ de vision de 155° et vidéo
          jusqu’en 4K à 60&nbsp;i/s, pour voler au plus près du sujet.
        </p>
        <div data-panel-item className="mt-10">
          <button
            ref={detailsBtnRef}
            type="button"
            onClick={openDetails}
            className="group inline-flex items-center gap-4 border-b border-line pb-2 text-[15px] font-medium text-fg transition-colors duration-300 hover:border-accent focus-visible:border-accent focus-visible:outline-none"
          >
            Détails
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              →
            </span>
          </button>
        </div>
      </div>

      <button
        ref={closeRef}
        type="button"
        className={`${styles.close} group flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted transition-colors duration-300 hover:text-fg focus-visible:text-fg focus-visible:outline-none`}
        onClick={() => closeFocus()}
        inert={!focused}
        aria-label="Fermer la fiche DJI Avata 2"
      >
        <span>Fermer</span>
        <kbd className="hidden rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted md:inline">
          Esc
        </kbd>
      </button>

      <AvataDetailsUi
        uiRef={detailsUiRef}
        frameRef={frameRef}
        backRef={backRef}
        active={details}
        part={part}
        parts={PARTS}
        onBack={() => closeDetails()}
        onOpenPart={openPart}
        onClosePart={closePart}
      />
    </section>
  );
}
