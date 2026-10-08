"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { HOME_RESET_EVENT } from "@/lib/home";
import { ACTIVE_HEIGHT, ACTIVE_SRC, ACTIVE_TO_IDLE, ACTIVE_WIDTH, IDLE_SIZE, IDLE_SRC, isOnDrone } from "@/components/setup/avata2Calibration";
import { BOUNDS_W, LAYERS } from "./avata2Details";
import type { PartId } from "./avata2Details";
import AvataDetailsUi from "./AvataDetailsUi";
import { PRODUCTS, productGeometry } from "@/components/setup/setupProducts";
import type { ProductId } from "@/components/setup/setupProducts";
import styles from "./AvataLab.module.css";

/**
 * GEAR LAB (non monté sur la home) — expérience technique de l’Avata 2 :
 * focus produit, vue éclatée ancrée sur la caméra, panneaux composants.
 * Conservée pour la future section 04 / Gear.
 *
 *
 * Hero — setup FPV : DJI Goggles 3 · DJI Avata 2 · DJI FPV Remote Controller 3.
 *
 * UNE source de vérité :
 *   home → focus(produit) → avata-details → avata-part(composant)
 * Chaque transition part de l'état courant et vise des valeurs calculées depuis la
 * mise en page réelle (rien n'est « rejoué à l'envers »). resetToHome() tue toute
 * animation, efface toutes les transformations et restaure l'accueil depuis
 * n'importe quel état.
 *
 * Calques par produit (un seul propriétaire d'animation chacun) :
 *   [data-layer=parallax] suivi du curseur · hover · focus · details (Avata) · canvas
 * Avata en plus : float (flottement) · lift (montée au survol) · idle/active (hélices).
 */

export type ExperienceState =
  | { mode: "home" }
  | { mode: "focus"; product: ProductId }
  | { mode: "avata-details" }
  | { mode: "avata-part"; part: PartId };

const HOME: ExperienceState = { mode: "home" };
const LEAVE_DELAY_MS = 90;

const LAYER_BY_KEY = Object.fromEntries(LAYERS.map((l) => [l.key, l]));

const activeLayerStyle = {
  left: `${(ACTIVE_TO_IDLE.e / IDLE_SIZE) * 100}%`,
  top: `${(ACTIVE_TO_IDLE.f / IDLE_SIZE) * 100}%`,
  width: `${(ACTIVE_WIDTH / IDLE_SIZE) * 100}%`,
  height: `${(ACTIVE_HEIGHT / IDLE_SIZE) * 100}%`,
  transform: `matrix(${ACTIVE_TO_IDLE.a}, ${ACTIVE_TO_IDLE.b}, ${ACTIVE_TO_IDLE.c}, ${ACTIVE_TO_IDLE.d}, 0, 0)`,
} as const;

/** Ombre de contact des objets posés (fractions de leur toile). */
const SEC_SHADOW: Record<Exclude<ProductId, "avata">, CSSProperties> = {
  goggles: { "--base": 0.936, "--sh-l": "20%", "--sh-r": "18%" } as CSSProperties,
  controller: { "--base": 0.907, "--sh-l": "30%", "--sh-r": "13%" } as CSSProperties,
};

const SIDE: Record<ProductId, number> = { goggles: -1, avata: 0, controller: 1 };

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Movers = Record<ProductId, { x: gsap.QuickToFunc; y: gsap.QuickToFunc; r?: gsap.QuickToFunc }>;

export default function AvataLab() {
  const [state, setState] = useState<ExperienceState>(HOME);
  const [shownPart, setShownPart] = useState<PartId | null>(null);
  const [partClosing, setPartClosing] = useState(false);

  const stageRef = useRef<HTMLElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const homeBtnRef = useRef<HTMLButtonElement>(null);
  const detailsBtnRef = useRef<HTMLButtonElement>(null);
  // Avata
  const floatRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const droneImgsRef = useRef<HTMLDivElement>(null);
  const idleLayerRef = useRef<HTMLDivElement>(null);
  const activeLayerRef = useRef<HTMLDivElement>(null);
  const shadowBreathRef = useRef<HTMLDivElement>(null);
  const shadowFocusRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  // Détails
  const sceneRef = useRef<HTMLDivElement>(null);
  const detCanvasRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef<ExperienceState>(HOME);
  const busyRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const hoveredRef = useRef<ProductId | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const floatTweens = useRef<gsap.core.Tween[]>([]);
  const movers = useRef<Movers | null>(null);
  const pointer = useRef({ nx: 0, ny: 0, du: 0 });
  const lastPointerType = useRef("mouse");
  const focusScrollY = useRef(0);
  const lastProduct = useRef<ProductId>("avata");
  const ctxRef = useRef<gsap.Context | null>(null);

  /* ------------------------------------------------------------------ */
  /* Accès DOM                                                            */
  /* ------------------------------------------------------------------ */

  const q = useCallback(<T extends HTMLElement = HTMLElement>(sel: string) => {
    return stageRef.current?.querySelector<T>(sel) ?? document.querySelector<T>(sel);
  }, []);
  const productEl = useCallback((p: ProductId) => q(`[data-product="${p}"]`), [q]);
  const layerEl = useCallback(
    (p: ProductId, name: string) => q(`[data-product="${p}"] [data-layer="${name}"]`),
    [q],
  );
  const panelEl = useCallback((p: ProductId) => document.getElementById(`panel-${p}`), []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  }, []);

  const commit = useCallback((next: ExperienceState) => {
    stateRef.current = next;
    setState(next);
    const root = document.documentElement;
    root.toggleAttribute("data-hero-focus", next.mode !== "home");
    // La scène Détails gère son propre défilement ; la page ne bouge pas dessous.
    root.style.overflow = next.mode === "avata-details" || next.mode === "avata-part" ? "hidden" : "";
  }, []);

  const runTl = useCallback((tl: gsap.core.Timeline) => {
    tlRef.current?.kill();
    tlRef.current = tl;
    busyRef.current = true;
    ctxRef.current?.add(() => tl);
    tl.eventCallback("onComplete", () => {
      const done = tl.data as (() => void) | undefined;
      if (tlRef.current === tl) {
        tlRef.current = null;
        busyRef.current = false;
      }
      done?.();
    });
    tl.play(0);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Avata : moteurs, flottement                                          */
  /* ------------------------------------------------------------------ */

  /** Moteurs ON/OFF : hélices floues, levée, ombre. */
  const setActive = useCallback((on: boolean) => {
    const box = floatRef.current?.offsetWidth ?? 800;
    const reduced = reducedMotion();
    const lift = box * 0.034;
    if (on) {
      gsap.to(activeLayerRef.current, { opacity: 1, duration: 0.3, ease: "power1.out", overwrite: true });
      gsap.to(idleLayerRef.current, { opacity: 0, duration: 0.42, delay: 0.16, ease: "power1.inOut", overwrite: true });
      if (reduced) return;
      gsap.to(liftRef.current, {
        keyframes: [
          { y: lift * 0.07, scale: 0.997, duration: 0.12, ease: "power2.out" },
          { y: -lift, scale: 1.04, duration: 1.05, ease: "expo.out" },
        ],
        overwrite: true,
      });
      gsap.to(shadowRef.current, { scaleX: 0.82, scaleY: 0.74, opacity: 0.62, duration: 1, ease: "expo.out", overwrite: true });
    } else {
      gsap.to(idleLayerRef.current, { opacity: 1, duration: 0.32, ease: "power1.out", overwrite: true });
      gsap.to(activeLayerRef.current, { opacity: 0, duration: 0.5, delay: 0.14, ease: "power1.inOut", overwrite: true });
      gsap.to(liftRef.current, { y: 0, scale: 1, duration: reduced ? 0.01 : 1.15, ease: "power3.inOut", overwrite: true });
      gsap.to(shadowRef.current, { scaleX: 1, scaleY: 1, opacity: 1, duration: reduced ? 0.01 : 1.15, ease: "power3.inOut", overwrite: true });
    }
  }, []);

  const killFloat = useCallback(() => {
    floatTweens.current.forEach((t) => t.kill());
    floatTweens.current = [];
  }, []);

  const startFloat = useCallback(() => {
    killFloat();
    if (reducedMotion()) return;
    const box = floatRef.current?.offsetWidth ?? 800;
    const amp = Math.max(3, box * 0.0085);
    floatTweens.current = [
      gsap.to(floatRef.current, { y: -amp, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      gsap.to(floatRef.current, { rotation: 0.45, duration: 5.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: -1.3 }),
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
  }, [killFloat]);

  /* ------------------------------------------------------------------ */
  /* Survol et parallaxe (accueil uniquement)                             */
  /* ------------------------------------------------------------------ */

  const createMovers = useCallback(() => {
    const make = (p: ProductId, withRotation: boolean) => {
      const el = layerEl(p, "parallax");
      return {
        x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
        r: withRotation ? gsap.quickTo(el, "rotation", { duration: 1.1, ease: "power3.out" }) : undefined,
      };
    };
    movers.current = { goggles: make("goggles", false), avata: make("avata", true), controller: make("controller", false) };
  }, [layerEl]);

  const updateParallax = useCallback(() => {
    const m = movers.current;
    if (!m) return;
    const still = stateRef.current.mode !== "home" || reducedMotion();
    if (still) {
      // hors accueil : retour au neutre puis suppression des propriétés en ligne
      const els = PRODUCTS.map((p) => layerEl(p.id, "parallax")).filter(Boolean) as HTMLElement[];
      if (!els.some((el) => el.style.transform)) return;
      gsap.killTweensOf(els);
      gsap.to(els, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(els, { clearProps: "transform" });
          createMovers();
        },
      });
      return;
    }
    const { nx, ny, du } = pointer.current;
    const hoverAvata = hoveredRef.current === "avata";
    m.avata.x(-nx * 12 + (hoverAvata ? du * 10 : 0));
    m.avata.y(-ny * 7);
    m.avata.r?.(hoverAvata ? du * 1.6 : nx * 0.35);
    (["goggles", "controller"] as const).forEach((p) => {
      m[p].x(-nx * 6);
      m[p].y(-ny * 3.5);
    });
  }, [createMovers, layerEl]);

  const setHover = useCallback(
    (next: ProductId | null) => {
      const prev = hoveredRef.current;
      if (prev === next) return;
      hoveredRef.current = next;
      const stage = stageRef.current;
      if (stage) {
        if (next) stage.dataset.hover = next;
        else delete stage.dataset.hover;
      }
      const reduced = reducedMotion();
      if ((prev === "avata") !== (next === "avata")) setActive(next === "avata");
      PRODUCTS.forEach(({ id }) => {
        const el = layerEl(id, "hover");
        if (!el) return;
        const isOn = id === next;
        const dim = next !== null && !isOn;
        // retour à l'identité : plus aucune propriété en ligne
        const settle = isOn || dim ? undefined : () => gsap.set(el, { clearProps: "transform,opacity" });
        if (id === "avata") {
          gsap.to(el, { opacity: dim ? 0.82 : 1, duration: 0.6, ease: "power2.out", overwrite: "auto", onComplete: settle });
          return;
        }
        const h = el.offsetHeight;
        gsap.to(el, {
          onComplete: settle,
          y: isOn && !reduced ? -h * 0.05 : 0,
          scale: isOn && !reduced ? 1.035 : dim && !reduced ? 0.985 : 1,
          opacity: dim ? 0.78 : 1,
          duration: isOn ? 0.9 : 0.8,
          ease: isOn ? "expo.out" : "power3.inOut",
          overwrite: "auto",
        });
      });
    },
    [layerEl, setActive],
  );

  /* ------------------------------------------------------------------ */
  /* Focus produit                                                        */
  /* ------------------------------------------------------------------ */

  /** Zone sûre du produit en focus et transformation à appliquer à son calque focus. */
  const focusTarget = useCallback(
    (p: ProductId) => {
      const box = productEl(p);
      if (!box) return null;
      const b = box.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const header = W < 768 ? 64 : 72;
      const gutter = Math.min(44, Math.max(20, W * 0.032));
      const portrait = W < H;
      const zone = portrait
        ? { x: gutter, y: header + 12, w: W - 2 * gutter, h: Math.max(160, H * 0.4) }
        : { x: gutter, y: header + 24, w: W * 0.56 - gutter - 24, h: H - header - 24 - 40 };
      const avata = p === "avata";
      const s = Math.min(
        (zone.w * (avata ? 0.94 : 0.86)) / b.width,
        (zone.h * (avata ? 0.72 : 0.78)) / b.height,
        avata ? 1100 / b.width : 820 / b.width,
      );
      const cx = zone.x + zone.w / 2;
      const cy = zone.y + zone.h * (avata ? 0.52 : 0.5);
      return {
        x: cx - (b.left + b.width / 2),
        y: cy - (b.top + b.height / 2),
        scale: s,
        panelTop: portrait ? zone.y + zone.h + 8 : null,
      };
    },
    [productEl],
  );

  const placePanel = useCallback((p: ProductId, top: number | null) => {
    const panel = panelEl(p);
    if (!panel) return;
    if (top === null) panel.style.removeProperty("top");
    else panel.style.top = `${top}px`;
  }, [panelEl]);

  const chromeEls = useCallback(() => gsap.utils.toArray<HTMLElement>("[data-chrome]", stageRef.current), []);

  const openFocus = useCallback(
    (p: ProductId) => {
      if (stateRef.current.mode !== "home" || busyRef.current) return;
      const t = focusTarget(p);
      const panel = panelEl(p);
      if (!t || !panel) return;
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      lastProduct.current = p;
      focusScrollY.current = window.scrollY;
      // le survol s'efface ; l'Avata garde ses moteurs allumés en focus
      setHover(null);
      if (p === "avata") setActive(true);
      commit({ mode: "focus", product: p });
      updateParallax();
      placePanel(p, t.panelTop);
      if (stageRef.current) stageRef.current.style.cursor = "";

      const reduced = reducedMotion();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const focusEl = layerEl(p, "focus");
      const others = PRODUCTS.filter((o) => o.id !== p).map((o) => layerEl(o.id, "focus"));
      const label = panel.querySelector("[data-label-line]");
      const items = panel.querySelectorAll("[data-panel-item]");
      const title = panel.querySelector("[data-title-line]");

      const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
      tl.to(chromeEls(), { opacity: 0, duration: 0.45, stagger: 0.03, ease: "power2.out" }, 0)
        .to(lightRef.current, { opacity: p === "avata" ? 0.2 : 0, duration: 1, ease: "power2.inOut" }, 0)
        .to(vignetteRef.current, { opacity: 1, duration: 1.1, ease: "power2.inOut" }, 0)
        .fromTo(homeBtnRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.6);

      if (reduced) {
        tl.to(others, { autoAlpha: 0, duration: 0.3 }, 0)
          .to(focusEl, { opacity: 0, duration: 0.2 }, 0)
          .set(focusEl, { x: t.x, y: t.y, scale: t.scale }, 0.22)
          .to(focusEl, { opacity: 1, duration: 0.3 }, 0.24)
          .set(panel, { autoAlpha: 1 }, 0.3)
          .fromTo([label, title, ...items], { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.3);
      } else {
        tl.to(focusEl, { x: t.x, y: t.y, scale: t.scale, duration: 1.25, ease: "expo.inOut" }, 0)
          // les deux autres reculent et s'effacent
          .to(
            others,
            {
              x: (_i: number, el: HTMLElement) => SIDE[el.closest<HTMLElement>("[data-product]")!.dataset.product as ProductId] * W * 0.05 || -W * 0.04,
              y: -H * 0.012,
              scale: 0.86,
              autoAlpha: 0,
              duration: 0.9,
              ease: "power2.inOut",
            },
            0.05,
          )
          .set(panel, { autoAlpha: 1, x: 0 }, 0.45)
          .fromTo(label, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "expo.out" }, 0.6)
          .fromTo(title, { yPercent: 112 }, { yPercent: 0, duration: 1.05, ease: "expo.out" }, 0.66)
          .fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: "power3.out" }, 0.82);
        if (p === "avata") tl.to(shadowFocusRef.current, { opacity: 0, scale: 1.3, duration: 0.75, ease: "power2.in" }, 0);
      }
      tl.data = () => panel.querySelector<HTMLElement>("[data-panel-title]")?.focus({ preventScroll: true });
      runTl(tl);
    },
    [chromeEls, commit, focusTarget, layerEl, panelEl, placePanel, runTl, setActive, setHover, updateParallax],
  );

  const closeFocus = useCallback(() => {
    const s = stateRef.current;
    if (s.mode !== "focus" || busyRef.current) return;
    const p = s.product;
    const panel = panelEl(p);
    const reduced = reducedMotion();
    const focusEl = layerEl(p, "focus");
    const others = PRODUCTS.filter((o) => o.id !== p).map((o) => layerEl(o.id, "focus"));
    // le focus clavier revient sur le produit avant que la fiche ne devienne inerte
    commit(HOME);
    // la rangée n'est plus inerte qu'après le rendu React
    requestAnimationFrame(() => q<HTMLButtonElement>(`[data-product="${p}"] [data-hit]`)?.focus({ preventScroll: true }));

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to(panel, { autoAlpha: 0, x: reduced ? 0 : 16, duration: 0.35, ease: "power2.in" }, 0)
      .to(homeBtnRef.current, { autoAlpha: 0, duration: 0.3 }, 0);
    if (reduced) {
      tl.to(focusEl, { opacity: 0, duration: 0.2 }, 0)
        .set(focusEl, { x: 0, y: 0, scale: 1 }, 0.22)
        .to([focusEl, ...others], { opacity: 1, autoAlpha: 1, duration: 0.3 }, 0.24);
    } else {
      tl.to(focusEl, { x: 0, y: 0, scale: 1, duration: 1.1, ease: "expo.inOut" }, 0.05)
        .to(others, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.95, ease: "power3.out" }, 0.35);
      if (p === "avata") tl.to(shadowFocusRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }, 0.5);
    }
    tl.to(chromeEls(), { opacity: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" }, reduced ? 0.3 : 0.7)
      .to(lightRef.current, { opacity: 1, duration: 0.9, ease: "power2.inOut" }, 0.2)
      .to(vignetteRef.current, { opacity: 0, duration: 0.9, ease: "power2.inOut" }, 0.2);
    if (p === "avata") later(() => setActive(false), 200);
    tl.data = () => {
      // Aucune transformation résiduelle une fois revenu à l'accueil.
      gsap.set([focusEl, ...others, panel, shadowFocusRef.current, ...chromeEls()], { clearProps: "transform,opacity,visibility" });
      gsap.set(chromeEls(), { opacity: 1 });
      placePanel(p, null);
    };
    runTl(tl);
  }, [chromeEls, commit, later, layerEl, panelEl, placePanel, q, runTl, setActive]);

  /* ------------------------------------------------------------------ */
  /* Avata — Détails (vue éclatée)                                        */
  /* ------------------------------------------------------------------ */

  /** Transformation du calque details de l'Avata qui pose le drone pile sur la vue éclatée. */
  const detailsAlign = useCallback(() => {
    const canvas = layerEl("avata", "canvas");
    const det = layerEl("avata", "details");
    const ghost = ghostRef.current;
    if (!canvas || !det || !ghost) return null;
    gsap.set(det, { x: 0, y: 0, scale: 1 });
    const R = canvas.getBoundingClientRect();
    const T = ghost.getBoundingClientRect();
    const sEff = R.width / canvas.offsetWidth;
    const ox = canvas.offsetLeft + canvas.offsetWidth / 2;
    const oy = canvas.offsetTop + canvas.offsetHeight / 2;
    gsap.set(det, { transformOrigin: `${ox}px ${oy}px` });
    return {
      x: (T.left + T.width / 2 - (R.left + R.width / 2)) / sEff,
      y: (T.top + T.height / 2 - (R.top + R.height / 2)) / sEff,
      scale: T.width / R.width,
    };
  }, [layerEl]);

  const explodeLayers = useCallback(() => {
    const scene = sceneRef.current;
    const unit = (detCanvasRef.current?.offsetWidth ?? BOUNDS_W) / BOUNDS_W;
    const all = gsap.utils.toArray<HTMLElement>("[data-x-layer]", scene);
    const camera = all.find((l) => l.dataset.xLayer === "camera")!;
    const moving = all.filter((l) => l !== camera);
    const from = (l: HTMLElement) => {
      const d = LAYER_BY_KEY[l.dataset.xLayer!];
      return { x: d.from.x * unit, y: d.from.y * unit, scale: d.from.s };
    };
    return { all, camera, moving, from };
  }, []);

  const detailsUi = useCallback(() => {
    const scene = sceneRef.current;
    return {
      ui: gsap.utils.toArray<HTMLElement>("[data-d-ui]", scene),
      lines: gsap.utils.toArray<SVGElement>("[data-d-line]", scene),
      dots: gsap.utils.toArray<HTMLElement>("[data-d-dot]", scene),
      labels: gsap.utils.toArray<HTMLElement>("[data-d-label]", scene),
    };
  }, []);

  const focusFirstPart = useCallback(() => {
    const first = Array.from(
      sceneRef.current?.querySelectorAll<HTMLElement>("[data-d-label], ol [data-part-trigger]") ?? [],
    ).find((el) => el.offsetParent !== null && getComputedStyle(el).display !== "none");
    first?.focus({ preventScroll: true });
  }, []);

  const openDetails = useCallback(() => {
    const s = stateRef.current;
    if (s.mode !== "focus" || s.product !== "avata" || busyRef.current) return;
    const scene = sceneRef.current;
    const det = layerEl("avata", "details");
    const panel = panelEl("avata");
    if (!scene || !det || !panel) return;

    commit({ mode: "avata-details" });
    killFloat();
    scene.scrollTop = 0;
    gsap.set(scene, { autoAlpha: 1 });
    const target = detailsAlign();
    if (!target) return;
    const { camera, moving, from } = explodeLayers();
    const { ui, lines, dots, labels } = detailsUi();
    moving.forEach((l) => gsap.set(l, { ...from(l), autoAlpha: 0, transformOrigin: "50% 50%" }));
    gsap.set(camera, { autoAlpha: 0, x: 0, y: 0, scale: 1 });
    gsap.set(ui, { opacity: 0 });
    gsap.set(lines, { strokeDashoffset: 1 });
    gsap.set([...dots, ...labels], { opacity: 0 });

    const reduced = reducedMotion();
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to(panel, { autoAlpha: 0, x: reduced ? 0 : -16, duration: 0.35, ease: "power2.in" }, 0)
      // moteurs coupés : le drone se pose pour le démontage
      .to(floatRef.current, { y: 0, rotation: 0, duration: 0.45, ease: "power2.out" }, 0)
      .to(liftRef.current, { y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 0)
      .to(idleLayerRef.current, { opacity: 1, duration: 0.3 }, 0)
      .to(activeLayerRef.current, { opacity: 0, duration: 0.45 }, 0.08);

    let t0: number;
    if (reduced) {
      tl.to(droneImgsRef.current, { opacity: 0, duration: 0.25 }, 0.1)
        .set(det, target, 0.36)
        .set(moving, { x: 0, y: 0, scale: 1 }, 0.36)
        .to([camera, ...moving], { autoAlpha: 1, duration: 0.35 }, 0.36);
      t0 = 0.75;
    } else {
      // le drone vient se poser exactement sur la vue éclatée (caméra = ancre)
      tl.to(det, { ...target, duration: 1.0, ease: "power3.inOut" }, 0.15)
        .to(camera, { autoAlpha: 1, duration: 0.2, ease: "none" }, 1.08)
        .to(droneImgsRef.current, { opacity: 0, duration: 0.4, ease: "power1.in" }, 1.14);
      moving.forEach((l, i) => {
        const at = 1.12 + i * 0.045;
        tl.to(l, { autoAlpha: 1, duration: 0.4, ease: "power1.out" }, at).to(
          l,
          { x: 0, y: 0, scale: 1, duration: 1.5, ease: "power3.out" },
          at,
        );
      });
      t0 = 2.3;
    }
    tl.to(ui, { opacity: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" }, t0)
      .to(lines, { strokeDashoffset: 0, duration: reduced ? 0.01 : 0.7, stagger: 0.06, ease: "power2.inOut" }, t0)
      .fromTo(dots, { scale: reduced ? 1 : 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, stagger: 0.06, ease: "back.out(2)" }, t0)
      .fromTo(
        labels,
        { opacity: 0, x: (_i: number, el: HTMLElement) => (reduced ? 0 : el.dataset.side === "left" ? 10 : -10) },
        { opacity: 1, x: 0, duration: 0.55, stagger: 0.06, ease: "power3.out" },
        t0 + 0.2,
      );
    tl.data = focusFirstPart;
    runTl(tl);
  }, [commit, detailsAlign, detailsUi, explodeLayers, focusFirstPart, killFloat, layerEl, panelEl, runTl]);

  const closeDetails = useCallback(() => {
    if (stateRef.current.mode !== "avata-details" || busyRef.current) return;
    const scene = sceneRef.current;
    const det = layerEl("avata", "details");
    const panel = panelEl("avata");
    if (!scene || !det || !panel) return;
    commit({ mode: "focus", product: "avata" });
    detailsBtnRef.current?.focus({ preventScroll: true });
    scene.scrollTop = 0;
    // Recalage frais (la fenêtre a pu changer) : le drone est invisible à cet instant.
    const target = detailsAlign();
    if (!target) return;
    gsap.set(det, target);
    const { camera, moving, from } = explodeLayers();
    const { ui, lines, dots, labels } = detailsUi();
    const reduced = reducedMotion();

    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to([...ui, ...dots, ...labels], { opacity: 0, duration: 0.3, ease: "power1.in" }, 0).to(
      lines,
      { strokeDashoffset: 1, duration: 0.3 },
      0,
    );
    if (reduced) {
      tl.to([camera, ...moving], { autoAlpha: 0, duration: 0.25 }, 0.2)
        .to(droneImgsRef.current, { opacity: 1, duration: 0.25 }, 0.2)
        .set(det, { x: 0, y: 0, scale: 1 }, 0.46)
        .set(scene, { autoAlpha: 0 }, 0.46);
    } else {
      [...moving].reverse().forEach((l, i) => {
        const at = 0.15 + i * 0.03;
        tl.to(l, { ...from(l), duration: 0.8, ease: "power3.in" }, at).to(
          l,
          { autoAlpha: 0, duration: 0.3, ease: "power1.in" },
          at + 0.55,
        );
      });
      tl.to(droneImgsRef.current, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0.75)
        .to(camera, { autoAlpha: 0, duration: 0.15 }, 1.05)
        .set(scene, { autoAlpha: 0 }, 1.2)
        .to(det, { x: 0, y: 0, scale: 1, duration: 1.0, ease: "power3.inOut" }, 1.15)
        .call(() => setActive(true), [], 1.4);
    }
    tl.to(panel, { autoAlpha: 1, x: 0, duration: 0.5, ease: "power2.out" }, reduced ? 0.5 : 1.85);
    tl.data = () => {
      gsap.set(det, { clearProps: "transform,transformOrigin" });
      gsap.set([camera, ...moving], { clearProps: "transform,opacity,visibility" });
      if (reducedMotion()) setActive(true);
      startFloat();
    };
    runTl(tl);
  }, [commit, detailsAlign, detailsUi, explodeLayers, layerEl, panelEl, runTl, setActive, startFloat]);

  const openPart = useCallback(
    (id: PartId) => {
      if (stateRef.current.mode !== "avata-details" || busyRef.current) return;
      commit({ mode: "avata-part", part: id });
      const layers = gsap.utils.toArray<HTMLElement>("[data-x-layer]", sceneRef.current);
      const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
      // le composant choisi prend le dessus, le reste s'efface
      layers.forEach((l) => {
        const on = l.dataset.xPart === id;
        tl.to(l, { opacity: on ? 1 : 0.14, scale: on && !reducedMotion() ? 1.03 : 1, duration: 0.4, ease: "power2.out" }, 0);
      });
      tl.data = () => {
        setPartClosing(false);
        setShownPart(id);
      };
      runTl(tl);
    },
    [commit, runTl],
  );

  const closePart = useCallback(() => {
    const s = stateRef.current;
    if (s.mode !== "avata-part" || busyRef.current) return;
    const id = s.part;
    setPartClosing(true);
    const layers = gsap.utils.toArray<HTMLElement>("[data-x-layer]", sceneRef.current);
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to("[data-part-panel]", { opacity: 0, duration: 0.3, ease: "power1.in" }, 0)
      .call(() => {
        setShownPart(null);
        setPartClosing(false);
        commit({ mode: "avata-details" });
      }, [], 0.3)
      .to(layers, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" }, 0.3);
    tl.data = () => {
      const trigger = Array.from(
        sceneRef.current?.querySelectorAll<HTMLElement>(`[data-part-trigger="${id}"]:not([data-d-dot])`) ?? [],
      ).find((n) => n.offsetParent !== null && getComputedStyle(n).display !== "none");
      trigger?.focus({ preventScroll: true });
    };
    runTl(tl);
  }, [commit, runTl]);

  /* ------------------------------------------------------------------ */
  /* Apparition et retour à l'accueil                                     */
  /* ------------------------------------------------------------------ */

  const playIntro = useCallback(() => {
    const reduced = reducedMotion();
    const stage = stageRef.current;
    const chrome = chromeEls();
    const products = gsap.utils.toArray<HTMLElement>("[data-product] [data-intro]:not([data-chrome])", stage);
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .to(lightRef.current, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0)
      .to(products, { opacity: 1, duration: 0.5, stagger: 0.06, ease: "power1.out" }, 0)
      .to(chrome, { opacity: 1, duration: 0.5, stagger: 0.04, ease: "power1.out" }, 0.15);
    if (!reduced) intro.from(products, { y: 10, scale: 0.985, duration: 0.9, stagger: 0.06 }, 0);
    // une fois apparus, plus aucune propriété résiduelle
    intro.eventCallback("onComplete", () => {
      gsap.set(products, { clearProps: "transform" });
    });
    return intro;
  }, [chromeEls]);

  /**
   * Retour complet à l'accueil, depuis n'importe quel état.
   * Tue toute animation, referme composant / Détails / focus, efface toute
   * transformation, restaure les trois objets, remonte en haut de page.
   */
  const resetToHome = useCallback(
    (opts?: { focus?: HTMLElement | null }) => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = stateRef.current;
      const scrollTop = () => window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });

      if (s.mode === "home" && !busyRef.current) {
        setHover(null);
        scrollTop();
        opts?.focus?.focus({ preventScroll: true });
        return;
      }

      tlRef.current?.kill();
      tlRef.current = null;
      busyRef.current = true;
      clearTimers();
      killFloat();

      const curtain = [
        ...gsap.utils.toArray<HTMLElement>("[data-curtain]", stage),
        sceneRef.current,
        document.querySelector("[data-part-panel]"),
        ...PRODUCTS.map((p) => panelEl(p.id)),
        homeBtnRef.current,
        vignetteRef.current,
      ].filter(Boolean) as HTMLElement[];

      gsap.to(curtain, {
        opacity: 0,
        duration: reducedMotion() ? 0.1 : 0.22,
        ease: "power1.in",
        overwrite: true,
        onComplete: () => {
          const animated = [
            ...gsap.utils.toArray<HTMLElement>("[data-anim], [data-layer], [data-intro], [data-chrome], [data-curtain]", stage),
            ...gsap.utils.toArray<HTMLElement>("[data-x-layer], [data-d-ui], [data-d-dot], [data-d-label]", sceneRef.current),
            ...gsap.utils.toArray<SVGElement>("[data-d-line]", sceneRef.current),
            ...PRODUCTS.map((p) => panelEl(p.id)),
            ...PRODUCTS.flatMap((p) => Array.from(panelEl(p.id)?.querySelectorAll<HTMLElement>("[data-panel-item], [data-label-line], [data-title-line]") ?? [])),
            sceneRef.current,
            homeBtnRef.current,
            vignetteRef.current,
            lightRef.current,
          ].filter(Boolean) as Element[];
          gsap.killTweensOf(animated);
          gsap.set(animated, { clearProps: "transform,transformOrigin,opacity,visibility,strokeDashoffset" });
          PRODUCTS.forEach((p) => placePanel(p.id, null));

          hoveredRef.current = null;
          delete stage.dataset.hover;
          stage.style.cursor = "";
          pointer.current = { nx: 0, ny: 0, du: 0 };
          setShownPart(null);
          setPartClosing(false);
          commit(HOME);
          createMovers();
          window.scrollTo({ top: 0, behavior: "auto" });
          startFloat();
          tlRef.current = null;
          busyRef.current = false;
          playIntro();
          const target = opts?.focus ?? null;
          requestAnimationFrame(() => target?.focus({ preventScroll: true }));
        },
      });
    },
    [clearTimers, commit, createMovers, killFloat, panelEl, placePanel, playIntro, setHover, startFloat],
  );

  /** Contrôle « ← Retour au setup » : retour animé depuis un focus, reset complet sinon. */
  const backToSetup = useCallback(() => {
    const s = stateRef.current;
    const target = q<HTMLButtonElement>(`[data-product="${lastProduct.current}"] [data-hit]`);
    if (s.mode === "focus" && !busyRef.current) closeFocus();
    else resetToHome({ focus: target });
  }, [closeFocus, q, resetToHome]);

  /* ------------------------------------------------------------------ */
  /* Mise en place                                                        */
  /* ------------------------------------------------------------------ */

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      createMovers();
      startFloat();
    }, stageRef);
    ctxRef.current = ctx;

    let cancelled = false;
    const imgs = Array.from(stageRef.current?.querySelectorAll<HTMLImageElement>("img[data-hero-img]") ?? []);
    const decoded = Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 300));
    Promise.race([decoded, timeout]).then(() => {
      if (!cancelled) ctx.add(() => playIntro());
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
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      floatTweens.current = [];
      movers.current = null;
      tlRef.current = null;
      ctxRef.current = null;
      ctx.revert();
      document.documentElement.removeAttribute("data-hero-focus");
      document.documentElement.style.overflow = "";
    };
  }, [createMovers, playIntro, startFloat, updateParallax]);

  // Logo ANASS → resetToHome() (src/lib/home.ts)
  useEffect(() => {
    const onHome = (e: Event) => {
      e.preventDefault();
      resetToHome({ focus: document.activeElement as HTMLElement | null });
    };
    window.addEventListener(HOME_RESET_EVENT, onHome);
    return () => window.removeEventListener(HOME_RESET_EVENT, onHome);
  }, [resetToHome]);

  // Défilement : profondeur au scroll ; un défilement pendant un focus le referme.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const trigger = { trigger: stage, start: "top top", end: "bottom top", scrub: true };
      gsap.to(setupRef.current, { yPercent: 14, opacity: 0.3, ease: "none", scrollTrigger: trigger });
      gsap.to(textRef.current, { yPercent: -10, opacity: 0, ease: "none", scrollTrigger: { ...trigger, end: "60% top" } });
    });
    const onScroll = () => {
      if (stateRef.current.mode === "focus" && Math.abs(window.scrollY - focusScrollY.current) > 40) closeFocus();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      mm.revert();
    };
  }, [closeFocus]);

  // Échap : composant → vue éclatée → fiche → accueil, un niveau à la fois.
  useEffect(() => {
    if (state.mode === "home") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      const s = stateRef.current;
      if (s.mode === "avata-part") closePart();
      else if (s.mode === "avata-details") closeDetails();
      else if (s.mode === "focus") closeFocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.mode, closePart, closeDetails, closeFocus]);

  // Redimensionnement / zoom : repositionne le produit en focus d'après la nouvelle zone sûre.
  useEffect(() => {
    let raf = 0;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (window.innerWidth === lastW && window.innerHeight === lastH) return;
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        const s = stateRef.current;
        if (s.mode === "home") {
          if (!busyRef.current) startFloat();
          return;
        }
        const p = s.mode === "focus" ? s.product : "avata";
        if (busyRef.current) {
          // transition en cours : on la termine net puis on recale
          tlRef.current?.progress(1);
        }
        const focusEl = layerEl(p, "focus");
        if (!focusEl) return;
        gsap.set(focusEl, { x: 0, y: 0, scale: 1 });
        const t = focusTarget(p);
        if (!t) return;
        gsap.set(focusEl, { x: t.x, y: t.y, scale: t.scale });
        placePanel(p, t.panelTop);
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [focusTarget, layerEl, placePanel, startFloat]);

  /* ------------------------------------------------------------------ */
  /* Pointeur                                                             */
  /* ------------------------------------------------------------------ */

  const hitProduct = useCallback(
    (x: number, y: number): { id: ProductId | null; du: number } => {
      const canvas = layerEl("avata", "canvas");
      if (canvas) {
        const r = canvas.getBoundingClientRect();
        const u = (x - r.left) / r.width;
        const v = (y - r.top) / r.height;
        if (isOnDrone(u, v)) return { id: "avata", du: Math.max(-1, Math.min(1, (u - 0.5) * 2)) };
      }
      for (const p of ["goggles", "controller"] as const) {
        const r = q(`[data-product="${p}"] [data-hit]`)?.getBoundingClientRect();
        if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { id: p, du: 0 };
      }
      return { id: null, du: 0 };
    },
    [layerEl, q],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    lastPointerType.current = e.pointerType;
    if (e.pointerType === "touch") return;
    const stage = stageRef.current;
    if (!stage || stateRef.current.mode !== "home" || busyRef.current) {
      if (stage) stage.style.cursor = "";
      return;
    }
    const r = stage.getBoundingClientRect();
    const { id, du } = hitProduct(e.clientX, e.clientY);
    pointer.current = { nx: ((e.clientX - r.left) / r.width - 0.5) * 2, ny: ((e.clientY - r.top) / r.height - 0.5) * 2, du };
    if (id) {
      if (leaveTimer.current) {
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }
      setHover(id);
    } else if (hoveredRef.current && !leaveTimer.current) {
      leaveTimer.current = window.setTimeout(() => {
        leaveTimer.current = null;
        if (stateRef.current.mode === "home") setHover(null);
        updateParallax();
      }, LEAVE_DELAY_MS);
    }
    stage.style.cursor = id ? "pointer" : "";
    updateParallax();
  };

  const onPointerLeave = () => {
    pointer.current = { nx: 0, ny: 0, du: 0 };
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
    if (stateRef.current.mode === "home" && !busyRef.current) setHover(null);
    updateParallax();
  };

  const onProductClick = (p: ProductId, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (stateRef.current.mode !== "home" || busyRef.current) return;
    const keyboard = e.detail === 0;
    const touch = lastPointerType.current === "touch";
    if (keyboard || touch) return openFocus(p);
    const hit = hitProduct(e.clientX, e.clientY).id;
    if (hit) openFocus(hit);
  };

  const mode = state.mode;
  const focusProduct = state.mode === "focus" ? state.product : null;

  return (
    <section
      ref={stageRef}
      className={styles.stage}
      aria-label="Setup FPV d'Anass : DJI Goggles 3, DJI Avata 2, DJI FPV Remote Controller 3"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={(e) => {
        lastPointerType.current = e.pointerType;
      }}
    >
      <div ref={vignetteRef} data-anim className={styles.vignette} aria-hidden="true" />

      <div ref={textRef} className={styles.editorialRow}>
        <div data-curtain data-chrome data-intro className={styles.editorial}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            01 <span className="mx-2 text-faint">/</span> Setup FPV
          </p>
          <h1 className={styles.title}>
            <span className="sr-only">Anass — </span>
            Filmer au plus près
            <br />
            du mouvement.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.5] text-soft">
            Créateur d’images
            <span className="mx-2.5 text-faint">—</span>
            <span className="text-fg/85">Photo · Vidéo · Drone FPV</span>
          </p>
        </div>
      </div>

      <div ref={setupRef} className={styles.setup}>
        <div data-curtain className={styles.row} inert={mode !== "home"}>
          {/* Lumière de sol (décor) : seul calque rogné, jamais un produit. */}
          <div className={styles.decor} aria-hidden="true">
            <div ref={lightRef} data-intro className={styles.floorLight} />
          </div>
          {PRODUCTS.map((p) => {
            const geo = productGeometry(p);
            const isAvata = p.id === "avata";
            return (
              <div
                key={p.id}
                data-product={p.id}
                className={`${styles.product} ${styles[p.id]}`}
                style={{ "--rel": p.rel, aspectRatio: geo.aspect } as CSSProperties}
              >
                <div data-layer="parallax" className={styles.fill}>
                  <div data-layer="hover" className={styles.fill}>
                    <div data-layer="focus" className={styles.fill}>
                      <div data-layer="details" className={styles.fill}>
                        <div data-layer="canvas" className={styles.canvas} style={geo.canvas}>
                          <div data-intro className={styles.fill}>
                            {isAvata ? (
                              <>
                                <div ref={shadowBreathRef} className={styles.shadowPos} aria-hidden="true">
                                  <div ref={shadowFocusRef} className={styles.fill}>
                                    <div ref={shadowRef} className={styles.shadow} />
                                  </div>
                                </div>
                                <div ref={floatRef} className={styles.fill}>
                                  <div ref={liftRef} className={styles.fill}>
                                    <div ref={droneImgsRef} className={styles.fill}>
                                      <div ref={idleLayerRef} className={styles.fill}>
                                        <Image
                                          src={IDLE_SRC}
                                          alt=""
                                          fill
                                          preload
                                          quality={90}
                                          sizes="(orientation: portrait) 90vw, 50vw"
                                          draggable={false}
                                          data-hero-img
                                          className="select-none object-contain"
                                        />
                                      </div>
                                      <div ref={activeLayerRef} className={styles.activeLayer} style={activeLayerStyle}>
                                        <Image
                                          src={ACTIVE_SRC}
                                          alt=""
                                          fill
                                          loading="eager"
                                          quality={90}
                                          sizes="(orientation: portrait) 100vw, 60vw"
                                          draggable={false}
                                          className="select-none object-fill"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className={styles.secShadow} style={SEC_SHADOW[p.id as "goggles" | "controller"]} aria-hidden="true" />
                                <Image
                                  src={p.src}
                                  alt=""
                                  fill
                                  preload
                                  quality={90}
                                  sizes="(orientation: portrait) 60vw, 40vw"
                                  draggable={false}
                                  data-hero-img
                                  className="select-none object-contain"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  data-hit
                  className={styles.hit}
                  aria-label={`${p.name} — afficher la fiche`}
                  aria-expanded={focusProduct === p.id}
                  aria-controls={`panel-${p.id}`}
                  onClick={(e) => onProductClick(p.id, e)}
                  onFocus={(e) => {
                    if (stateRef.current.mode === "home" && !busyRef.current && e.currentTarget.matches(":focus-visible")) setHover(p.id);
                  }}
                  onBlur={() => {
                    if (stateRef.current.mode === "home" && hoveredRef.current === p.id) setHover(null);
                  }}
                />
                <p data-chrome data-intro className={styles.caption} aria-hidden="true">
                  {p.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div data-curtain className={styles.foot}>
        <p data-chrome data-intro className={styles.hint} aria-hidden="true">
          <span className="hidden [@media(hover:hover)]:inline">Survolez un objet</span>
          <span className="inline [@media(hover:hover)]:hidden">Touchez un objet</span>
        </p>
        <a href="#projets" data-chrome data-intro className={styles.scrollCue}>
          <span>Défiler</span>
          <span className={styles.scrollLine} aria-hidden="true">
            <span />
          </span>
        </a>
      </div>

      {/* Fiches produit */}
      {PRODUCTS.map((p) => (
        <div
          key={p.id}
          id={`panel-${p.id}`}
          role="region"
          aria-labelledby={`panel-${p.id}-title`}
          className={styles.panel}
          inert={focusProduct !== p.id}
        >
          <div className={styles.panelInner}>
            <p className={styles.panelLabel}>
              <span data-label-line className={styles.labelLine} />
              <span data-panel-item>
                {p.index} — {p.kind}
              </span>
            </p>
            <h2
              id={`panel-${p.id}-title`}
              data-panel-title
              tabIndex={-1}
              className={`${styles.panelTitle} ${p.name.length > 14 ? styles.panelTitleLong : ""}`}
            >
              <span data-title-line className="block">
                {p.name}
              </span>
            </h2>
            <p data-panel-item className={styles.panelText}>
              {p.text}
            </p>
            {p.id === "avata" && (
              <div data-panel-item>
                <button ref={detailsBtnRef} type="button" className={styles.panelAction} onClick={openDetails}>
                  Détails <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      <button ref={homeBtnRef} type="button" className={styles.home} onClick={backToSetup} inert={mode === "home"}>
        <span aria-hidden="true">←</span>
        <span>Retour au setup</span>
      </button>

      <AvataDetailsUi
        sceneRef={sceneRef}
        canvasRef={detCanvasRef}
        ghostRef={ghostRef}
        interactive={mode === "avata-details"}
        shownPart={shownPart}
        partClosing={partClosing}
        onBackToDrone={closeDetails}
        onOpenPart={openPart}
        onClosePart={closePart}
      />
    </section>
  );
}

