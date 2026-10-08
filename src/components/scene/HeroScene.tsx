"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { SITE } from "@/config/site";
import { AVATA_PARTS, SETUP_COPY } from "@/content/setup";
import type { AvataPartId } from "@/content/setup";
import { HERO_EXIT } from "@/config/world";
import { worldCam } from "@/lib/world/camera";
import {
  BOUNDS_W,
  FULL_ASPECT,
  FULL_SRC,
  GHOST_STYLE,
  LAYERS,
  PARTS as EXPLODE_PARTS,
  boundsPct,
  layerStyle,
} from "@/components/gear/avata/avata2Details";
import {
  ACTIVE_HEIGHT,
  ACTIVE_SRC,
  ACTIVE_TO_IDLE,
  ACTIVE_WIDTH,
  IDLE_SIZE,
  IDLE_SRC,
  isOnDrone,
} from "@/components/setup/avata2Calibration";
import { PRODUCTS, productGeometry } from "@/components/setup/setupProducts";
import { ProductTurntable, TURNTABLE } from "./turntable";
import type { ProductId } from "@/components/setup/setupProducts";
import { HOME_RESET_EVENT } from "@/lib/home";
import { lockScroll, scrollToSection, scrollToTarget, unlockScroll } from "@/lib/scroll";
import styles from "./HeroScene.module.css";

/**
 * HERO — paysage vivant + setup FPV posé sur le rocher.
 *
 * États : home → focus(produit) → explore (Avata) → part(composant).
 * « ← Retour » et Échap remontent d'un niveau ; le logo remet tout à zéro.
 * Calques d'un produit (un propriétaire chacun) :
 *   [data-focus] focus · [data-explode] recalage vue éclatée · [data-depth] parallaxe ·
 *   [data-enter] apparition · [data-hover] survol (levée, échelle, inclinaison)
 */

type Mode =
  | { m: "home" }
  | { m: "focus"; p: ProductId }
  | { m: "explore" }
  | { m: "part"; part: AvataPartId };

const HOME: Mode = { m: "home" };
const DEPTH: Record<ProductId, number> = { goggles: 0.7, avata: 1, controller: 1.25 };
const HIT_ORDER: ProductId[] = ["controller", "avata", "goggles"];
const LAYER_BY_KEY = Object.fromEntries(LAYERS.map((l) => [l.key, l]));
const PART_GROUP: Record<AvataPartId, string> = {
  camera: "camera",
  battery: "battery",
  propulsion: "propulsion",
  electronics: "electronics",
  sensors: "sensors",
};

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const activeLayerStyle = {
  left: `${(ACTIVE_TO_IDLE.e / IDLE_SIZE) * 100}%`,
  top: `${(ACTIVE_TO_IDLE.f / IDLE_SIZE) * 100}%`,
  width: `${(ACTIVE_WIDTH / IDLE_SIZE) * 100}%`,
  height: `${(ACTIVE_HEIGHT / IDLE_SIZE) * 100}%`,
  transform: `matrix(${ACTIVE_TO_IDLE.a}, ${ACTIVE_TO_IDLE.b}, ${ACTIVE_TO_IDLE.c}, ${ACTIVE_TO_IDLE.d}, 0, 0)`,
} as const;

export default function HeroScene() {
  const [mode, setMode] = useState<Mode>(HOME);
  const modeRef = useRef<Mode>(HOME);
  const busy = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const hovered = useRef<ProductId | null>(null);
  const lastPointer = useRef("mouse");
  const movers = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc; d: number }[]>([]);

  const trackRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const xCanvasRef = useRef<HTMLDivElement>(null);
  const idleRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const droneImgsRef = useRef<HTMLDivElement>(null);

  const q = useCallback(<T extends HTMLElement = HTMLElement>(sel: string) => heroRef.current?.querySelector<T>(sel) ?? null, []);
  const layer = useCallback((p: ProductId, name: string) => q(`[data-p="${p}"] [data-${name}]`), [q]);
  const panel = useCallback((p: ProductId) => q(`[data-panel="${p}"]`), [q]);

  const commit = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
    document.documentElement.toggleAttribute("data-scene-active", next.m !== "home");
    if (next.m === "home") unlockScroll();
    else lockScroll();
  }, []);

  const run = useCallback((tl: gsap.core.Timeline, done?: () => void) => {
    tlRef.current?.kill();
    tlRef.current = tl;
    busy.current = true;
    tl.eventCallback("onComplete", () => {
      if (tlRef.current === tl) {
        tlRef.current = null;
        busy.current = false;
      }
      done?.();
    });
    tl.play(0);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Hélices de l'Avata                                                   */
  /* ------------------------------------------------------------------ */

  const setProps = useCallback((on: boolean) => {
    gsap.to(activeRef.current, { opacity: on ? 1 : 0, duration: on ? 0.3 : 0.5, delay: on ? 0 : 0.12, ease: "power1.inOut", overwrite: true });
    gsap.to(idleRef.current, { opacity: on ? 0 : 1, duration: on ? 0.42 : 0.3, delay: on ? 0.16 : 0, ease: "power1.inOut", overwrite: true });
  }, []);

  /* ------------------------------------------------------------------ */
  /* Survol : vivant, mais posé                                           */
  /* ------------------------------------------------------------------ */

  /** Turntable : au survol, l'objet tourne lentement sur lui-même (vraies vues, cycle 5–6 s). */
  const spinners = useRef<Partial<Record<ProductId, ProductTurntable>>>({});
  const spinP = useRef<ProductId | null>(null);
  const spinner = useCallback(
    (p: ProductId) => {
      const cfg = TURNTABLE[p];
      if (!cfg) return null;
      let t = spinners.current[p];
      if (!t) {
        const base = q<HTMLElement>(`[data-p="${p}"] [data-tt-base]`);
        const views = gsap.utils.toArray<HTMLElement>(`[data-p="${p}"] [data-tt]`, heroRef.current);
        if (!base || views.length !== cfg.frames.length) return null;
        t = new ProductTurntable([base, ...views], cfg);
        spinners.current[p] = t;
      }
      return t;
    },
    [q],
  );
  const stopSpin = useCallback(
    (instant = false) => {
      const p = spinP.current;
      if (!p) return;
      spinP.current = null;
      spinner(p)?.stop(instant);
    },
    [spinner],
  );
  const startSpin = useCallback(
    (p: ProductId) => {
      if (spinP.current === p) return;
      stopSpin();
      if (reduced()) return;
      const t = spinner(p);
      if (!t) return;
      t.play();
      spinP.current = p;
    },
    [spinner, stopSpin],
  );
  // Les vues du turntable sont décodées dès le chargement : aucun à-coup au premier survol.
  useEffect(() => {
    heroRef.current?.querySelectorAll<HTMLImageElement>("[data-tt]").forEach((img) => void img.decode?.().catch(() => undefined));
  }, []);
  useEffect(() => {
    const all = spinners.current;
    return () => Object.values(all).forEach((t) => t?.kill());
  }, []);

  const setHover = useCallback(
    (next: ProductId | null) => {
      if (hovered.current === next) return;
      if (next) startSpin(next);
      else stopSpin();
      const prev = hovered.current;
      hovered.current = next;
      const hero = heroRef.current;
      if (hero) hero.dataset.hover = next ?? "";
      const rm = reduced();
      if ((prev === "avata") !== (next === "avata")) setProps(next === "avata");
      PRODUCTS.forEach(({ id }) => {
        const el = layer(id, "hover");
        const shadow = layer(id, "shadow");
        const label = q(`[data-name="${id}"]`);
        if (!el) return;
        const on = id === next;
        const dim = next !== null && !on;
        const h = el.offsetHeight;
        // Lévitation : l'objet quitte le rocher pendant qu'il tourne.
        const lift = id === "avata" ? 0.12 : 0.09;
        gsap.to(el, {
          y: on && !rm ? -h * lift : 0,
          scale: on && !rm ? 1.05 : dim ? 0.985 : 1,
          // Secondaire = moins de lumière, jamais transparent (les objets restent posés sur la roche).
          filter: dim ? "brightness(0.6) saturate(0.75)" : "brightness(1) saturate(1)",
          rotationX: 0,
          rotationY: 0,
          duration: on ? 1 : 0.8,
          ease: on ? "expo.out" : "power3.inOut",
          overwrite: "auto",
          onComplete: on || dim ? undefined : () => gsap.set(el, { clearProps: "transform,opacity,filter" }),
        });
        gsap.to(shadow, {
          scaleX: on ? (id === "avata" ? 0.78 : 0.9) : 1,
          opacity: on ? (id === "avata" ? 0.55 : 0.8) : dim ? 0.85 : 1,
          duration: 0.9,
          ease: "expo.out",
          overwrite: "auto",
        });
        if (label) gsap.to(label, { autoAlpha: on ? 1 : 0, y: on || rm ? 0 : 6, duration: on ? 0.5 : 0.25, ease: "power2.out", overwrite: "auto" });
      });
    },
    [layer, q, setProps, startSpin, stopSpin],
  );

  const hitTest = useCallback(
    (x: number, y: number): ProductId | null => {
      for (const p of HIT_ORDER) {
        if (p === "avata") {
          const c = layer("avata", "canvas")?.getBoundingClientRect();
          if (c && isOnDrone((x - c.left) / c.width, (y - c.top) / c.height)) return "avata";
          continue;
        }
        const r = q(`[data-p="${p}"] [data-hit]`)?.getBoundingClientRect();
        if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return p;
      }
      return null;
    },
    [layer, q],
  );

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    lastPointer.current = e.pointerType;
    if (e.pointerType === "touch" || modeRef.current.m !== "home" || busy.current) return;
    const hero = heroRef.current;
    if (!hero) return;
    const r = hero.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!reduced()) movers.current.forEach((m) => (m.x(-nx * 10 * m.d), m.y(-ny * 5 * m.d)));
    const id = hitTest(e.clientX, e.clientY);
    setHover(id);
    // Prise en main : légère inclinaison vers le curseur (aucune fausse rotation 360°).
    if (id && !reduced()) {
      const el = layer(id, "hover");
      const b = el?.getBoundingClientRect();
      if (el && b) {
        const u = ((e.clientX - b.left) / b.width - 0.5) * 2;
        const v = ((e.clientY - b.top) / b.height - 0.5) * 2;
        // La rotation est portée par le turntable ; le pointeur n'ajoute qu'une légère prise en main.
        gsap.to(el, { rotationY: u * 2, rotationX: -v * 2, duration: 0.8, ease: "power3.out", overwrite: false });
      }
    }
    hero.style.cursor = id ? "pointer" : "";
  };

  const onPointerLeave = () => {
    movers.current.forEach((m) => (m.x(0), m.y(0)));
    if (modeRef.current.m === "home") setHover(null);
  };

  /* ------------------------------------------------------------------ */
  /* Focus produit                                                        */
  /* ------------------------------------------------------------------ */

  const focusTarget = useCallback(
    (p: ProductId) => {
      const box = q(`[data-p="${p}"]`);
      if (!box) return null;
      const b = box.getBoundingClientRect();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const header = W < 768 ? 64 : 80;
      const gutter = Math.min(44, Math.max(20, W * 0.032));
      const portrait = W / H < 1.05;
      const zone = portrait
        ? { x: gutter, y: header + 56, w: W - 2 * gutter, h: H * 0.36 }
        : { x: gutter, y: header + 70, w: W * 0.52 - gutter, h: H - header - 70 - 70 };
      const s = Math.min((zone.w * (p === "avata" ? 0.92 : 0.82)) / b.width, (zone.h * 0.78) / b.height, 3.2);
      return {
        x: zone.x + zone.w / 2 - (b.left + b.width / 2),
        y: zone.y + zone.h / 2 - (b.top + b.height / 2),
        scale: s,
      };
    },
    [q],
  );

  const chrome = useCallback(() => gsap.utils.toArray<HTMLElement>("[data-chrome]", heroRef.current), []);

  // Enchaînements Avata : clic → zoom + décomposition ; retour → recomposition + remise sur le rocher.
  const openExploreFn = useRef<() => void>(() => undefined);
  const closeFocusFn = useRef<() => void>(() => undefined);

  const openFocus = useCallback(
    (p: ProductId) => {
      if (modeRef.current.m !== "home" || busy.current) return;
      if (window.scrollY > 4) scrollToTarget(0, { immediate: true });
      const t = focusTarget(p);
      const pn = panel(p);
      if (!t || !pn) return;
      setHover(null);
      const direct = p === "avata";
      if (direct) setProps(true);
      commit({ m: "focus", p });
      const rm = reduced();
      const others = PRODUCTS.filter((o) => o.id !== p).map((o) => layer(o.id, "focus"));
      const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
      tl.to(chrome(), { opacity: 0, y: rm ? 0 : -10, duration: 0.45, stagger: 0.03, ease: "power2.in" }, 0)
        .to(worldCam, { blur: rm ? 0 : 3.2, dim: 0.45, duration: 1.1, ease: "power2.inOut" }, 0)
        .to("[data-brand-wrap]", { opacity: 0.25, duration: 0.8, ease: "power2.inOut" }, 0)
        .to(others, { autoAlpha: 0, y: rm ? 0 : 30, scale: 0.94, duration: 0.7, ease: "power2.in" }, 0)
        .to(layer(p, "shadow"), { opacity: 0, duration: 0.4 }, 0);
      if (rm) {
        tl.to(layer(p, "focus"), { opacity: 0, duration: 0.2 }, 0)
          .set(layer(p, "focus"), { x: t.x, y: t.y, scale: t.scale }, 0.22)
          .to(layer(p, "focus"), { opacity: 1, duration: 0.3 }, 0.24);
      } else {
        tl.to(layer(p, "focus"), { x: t.x, y: t.y, scale: t.scale, duration: direct ? 0.85 : 1.3, ease: direct ? "power3.inOut" : "expo.inOut" }, 0.05);
      }
      tl.fromTo("[data-back]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.7);
      if (direct) {
        // Avata : pas d'étape intermédiaire, la décomposition prend le relais du zoom.
        run(tl, () => openExploreFn.current());
        return;
      }
      tl.set(pn, { autoAlpha: 1 }, 0.5).fromTo(pn.querySelectorAll("[data-pi]"), { opacity: 0, y: rm ? 0 : 22 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out" }, 0.6);
      run(tl, () => pn.querySelector<HTMLElement>("[data-ptitle]")?.focus({ preventScroll: true }));
    },
    [chrome, commit, focusTarget, layer, panel, run, setHover, setProps],
  );

  const closeFocus = useCallback(() => {
    const s = modeRef.current;
    if (s.m !== "focus" || busy.current) return;
    const p = s.p;
    const pn = panel(p);
    const rm = reduced();
    const all = PRODUCTS.map((o) => layer(o.id, "focus"));
    commit(HOME);
    requestAnimationFrame(() => q<HTMLButtonElement>(`[data-p="${p}"] [data-hit]`)?.focus({ preventScroll: true }));
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to(pn, { autoAlpha: 0, duration: 0.3 }, 0)
      .to("[data-back]", { autoAlpha: 0, duration: 0.25 }, 0)
      .to(layer(p, "focus"), { x: 0, y: 0, scale: 1, opacity: 1, duration: rm ? 0.3 : 1.1, ease: "expo.inOut" }, 0.05)
      .to(all.filter((e) => e !== layer(p, "focus")), { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }, 0.45)
      .to(layer(p, "shadow"), { opacity: 1, duration: 0.5 }, 0.9)
      .to(worldCam, { blur: 0, dim: 0, duration: 1, ease: "power2.inOut" }, 0.1)
      .to("[data-brand-wrap]", { opacity: 1, duration: 0.8, ease: "power2.inOut" }, 0.2)
      .to(chrome(), { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: "power2.out" }, 0.7);
    if (p === "avata") gsap.delayedCall(0.4, () => setProps(false));
    run(tl, () => {
      gsap.set([...all, pn, ...chrome(), layer(p, "shadow")], { clearProps: "transform,opacity,visibility" });
      gsap.set(worldCam, { blur: 0, dim: 0 });
      gsap.set("[data-brand-wrap]", { clearProps: "opacity" });
    });
  }, [chrome, commit, layer, panel, q, run, setProps]);
  useEffect(() => {
    closeFocusFn.current = closeFocus;
  }, [closeFocus]);

  /* ------------------------------------------------------------------ */
  /* Avata — explorer le drone                                            */
  /* ------------------------------------------------------------------ */

  const explodeAlign = useCallback(() => {
    const canvas = layer("avata", "canvas");
    const ex = layer("avata", "explode");
    const ghost = ghostRef.current;
    if (!canvas || !ex || !ghost) return null;
    gsap.set(ex, { x: 0, y: 0, scale: 1 });
    const R = canvas.getBoundingClientRect();
    const T = ghost.getBoundingClientRect();
    const sEff = R.width / canvas.offsetWidth;
    gsap.set(ex, { transformOrigin: `${canvas.offsetLeft + canvas.offsetWidth / 2}px ${canvas.offsetTop + canvas.offsetHeight / 2}px` });
    return {
      x: (T.left + T.width / 2 - (R.left + R.width / 2)) / sEff,
      y: (T.top + T.height / 2 - (R.top + R.height / 2)) / sEff,
      scale: T.width / R.width,
    };
  }, [layer]);

  const xLayers = useCallback(() => {
    const unit = (xCanvasRef.current?.offsetWidth ?? BOUNDS_W) / BOUNDS_W;
    const all = gsap.utils.toArray<HTMLElement>("[data-x-layer]", exploreRef.current);
    const camera = all.find((l) => l.dataset.xLayer === "camera")!;
    const moving = all.filter((l) => l !== camera);
    const from = (l: HTMLElement) => {
      const d = LAYER_BY_KEY[l.dataset.xLayer!];
      return { x: d.from.x * unit, y: d.from.y * unit, scale: d.from.s };
    };
    return { camera, moving, from };
  }, []);

  const openExplore = useCallback(() => {
    const s = modeRef.current;
    if (s.m !== "focus" || s.p !== "avata" || busy.current) return;
    const ex = exploreRef.current;
    const pn = panel("avata");
    if (!ex || !pn) return;
    commit({ m: "explore" });
    gsap.set(ex, { autoAlpha: 1 });
    const target = explodeAlign();
    if (!target) return;
    const { camera, moving, from } = xLayers();
    const ui = gsap.utils.toArray<HTMLElement>("[data-x-ui]", ex);
    moving.forEach((l) => gsap.set(l, { ...from(l), autoAlpha: 0, transformOrigin: "50% 50%" }));
    gsap.set(camera, { autoAlpha: 0, x: 0, y: 0, scale: 1 });
    gsap.set(ui, { opacity: 0 });
    const rm = reduced();
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to(pn, { autoAlpha: 0, duration: 0.3 }, 0).to(activeRef.current, { opacity: 0, duration: 0.4 }, 0).to(idleRef.current, { opacity: 1, duration: 0.3 }, 0);
    let t0: number;
    if (rm) {
      tl.to(droneImgsRef.current, { opacity: 0, duration: 0.25 }, 0.1)
        .set(layer("avata", "explode"), target, 0.36)
        .set(moving, { x: 0, y: 0, scale: 1 }, 0.36)
        .to([camera, ...moving], { autoAlpha: 1, duration: 0.35 }, 0.36);
      t0 = 0.75;
    } else {
      tl.to(layer("avata", "explode"), { ...target, duration: 0.7, ease: "power2.inOut" }, 0)
        .to(camera, { autoAlpha: 1, duration: 0.2, ease: "none" }, 0.62)
        .to(droneImgsRef.current, { opacity: 0, duration: 0.35, ease: "power1.in" }, 0.66);
      moving.forEach((l, i) => {
        const at = 0.66 + i * 0.04;
        tl.to(l, { autoAlpha: 1, duration: 0.35 }, at).to(l, { x: 0, y: 0, scale: 1, duration: 1.4, ease: "power3.out" }, at);
      });
      t0 = 1.4;
    }
    tl.to(ui, { opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }, t0);
    run(tl, () => ex.querySelector<HTMLElement>("[data-x-first]")?.focus({ preventScroll: true }));
  }, [commit, explodeAlign, layer, panel, run, xLayers]);
  useEffect(() => {
    openExploreFn.current = openExplore;
  }, [openExplore]);

  const closeExplore = useCallback(() => {
    if (modeRef.current.m !== "explore" || busy.current) return;
    const ex = exploreRef.current;
    const pn = panel("avata");
    if (!ex || !pn) return;
    commit({ m: "focus", p: "avata" });
    const ui = gsap.utils.toArray<HTMLElement>("[data-x-ui]", ex);
    const target = explodeAlign();
    if (!target) return;
    gsap.set(layer("avata", "explode"), target);
    const { camera, moving, from } = xLayers();
    const rm = reduced();
    const tl = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    tl.to(ui, { opacity: 0, duration: 0.3 }, 0);
    if (rm) {
      tl.to([camera, ...moving], { autoAlpha: 0, duration: 0.25 }, 0.2)
        .to(droneImgsRef.current, { opacity: 1, duration: 0.25 }, 0.2)
        .set(layer("avata", "explode"), { x: 0, y: 0, scale: 1 }, 0.46);
    } else {
      [...moving].reverse().forEach((l, i) => {
        const at = 0.15 + i * 0.03;
        tl.to(l, { ...from(l), duration: 0.8, ease: "power3.in" }, at).to(l, { autoAlpha: 0, duration: 0.3 }, at + 0.55);
      });
      tl.to(droneImgsRef.current, { opacity: 1, duration: 0.3 }, 0.75)
        .to(camera, { autoAlpha: 0, duration: 0.15 }, 1.05)
        .to(layer("avata", "explode"), { x: 0, y: 0, scale: 1, duration: 1, ease: "power3.inOut" }, 1.15);
    }
    tl.set(ex, { autoAlpha: 0 }, rm ? 0.5 : 1.2);
    run(tl, () => {
      gsap.set(layer("avata", "explode"), { clearProps: "transform,transformOrigin" });
      gsap.set([camera, ...moving], { clearProps: "transform,opacity,visibility" });
      closeFocusFn.current();
    });
  }, [commit, explodeAlign, layer, panel, run, xLayers]);

  const openPart = useCallback(
    (part: AvataPartId) => {
      const s = modeRef.current;
      if (s.m !== "explore" && s.m !== "part") return;
      // Un clic pendant l'ouverture de la vue éclatée termine l'animation au lieu d'être ignoré.
      if (busy.current) tlRef.current?.progress(1);
      commit({ m: "part", part });
      const group = PART_GROUP[part];
      gsap.utils.toArray<HTMLElement>("[data-x-layer]", exploreRef.current).forEach((l) => {
        gsap.to(l, { opacity: l.dataset.xPart === group ? 1 : 0.16, duration: 0.45, ease: "power2.out", overwrite: "auto" });
      });
      requestAnimationFrame(() => q<HTMLElement>("[data-part-title]")?.focus({ preventScroll: true }));
    },
    [commit, q],
  );

  const closePart = useCallback(() => {
    const s = modeRef.current;
    if (s.m !== "part") return;
    commit({ m: "explore" });
    gsap.to(gsap.utils.toArray<HTMLElement>("[data-x-layer]", exploreRef.current), { opacity: 1, duration: 0.45, overwrite: "auto" });
    requestAnimationFrame(() => q<HTMLElement>(`[data-x-item="${s.part}"]`)?.focus({ preventScroll: true }));
  }, [commit, q]);

  /** Un niveau en arrière (Retour, Échap). */
  const back = useCallback(() => {
    const s = modeRef.current;
    if (s.m === "part") closePart();
    else if (s.m === "explore") closeExplore();
    else if (s.m === "focus") closeFocus();
  }, [closeExplore, closeFocus, closePart]);

  /** Remise à zéro complète (logo) : tout s'arrête, tout revient, aucune trace. */
  const resetAll = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) return;
    if (modeRef.current.m === "home" && !busy.current) return;
    tlRef.current?.kill();
    tlRef.current = null;
    stopSpin(true);
    const targets = [
      ...gsap.utils.toArray<HTMLElement>("[data-focus],[data-explode],[data-hover],[data-shadow],[data-chrome],[data-panel],[data-name],[data-back],[data-x-layer],[data-x-ui]", hero),
      exploreRef.current,
      droneImgsRef.current,
      idleRef.current,
      activeRef.current,
    ].filter(Boolean) as HTMLElement[];
    gsap.to(hero, {
      opacity: 0,
      duration: 0.22,
      onComplete: () => {
        gsap.killTweensOf(targets);
        gsap.set(targets, { clearProps: "transform,transformOrigin,opacity,visibility,filter" });
        gsap.killTweensOf(worldCam, "blur,dim");
        gsap.set(worldCam, { blur: 0, dim: 0 });
        gsap.set("[data-brand-wrap]", { clearProps: "opacity" });
        hovered.current = null;
        hero.dataset.hover = "";
        busy.current = false;
        commit(HOME);
        gsap.to(hero, { opacity: 1, duration: 0.5, ease: "power2.out", clearProps: "opacity" });
      },
    });
  }, [commit, stopSpin]);

  /* ------------------------------------------------------------------ */
  /* Mise en place                                                        */
  /* ------------------------------------------------------------------ */

  useIsoLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    gsap.registerPlugin(ScrollTrigger);
    const rm = reduced();
    const ctx = gsap.context(() => {
      movers.current = PRODUCTS.map((p) => {
        const el = layer(p.id, "depth")!;
        return {
          d: DEPTH[p.id],
          x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
        };
      });

      // Apparition : texte rapide, objets qui se posent, léger mouvement de caméra.
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      const enters = PRODUCTS.map((p) => layer(p.id, "enter"));
      if (rm) {
        intro.to(["[data-line]", "[data-fade]", ...enters], { opacity: 1, duration: 0.5, ease: "none" }, 0);
      } else {
        intro
          .fromTo("[data-landscape-intro]", { scale: 1.06 }, { scale: 1, duration: 2.4, ease: "expo.out", clearProps: "transform" }, 0)
          .fromTo(worldCam, { intro: 1.06 }, { intro: 1, duration: 2.4, ease: "expo.out" }, 0)
          .fromTo("[data-brand]", { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.8 }, 0.1)
          .fromTo("[data-line]", { yPercent: 105, opacity: 1 }, { yPercent: 0, duration: 1.1, stagger: 0.08 }, 0.25)
          .to("[data-fade]", { opacity: 1, duration: 0.8, stagger: 0.06, ease: "power2.out" }, 0.5)
          .fromTo(enters, { opacity: 0, y: -26 }, { opacity: 1, y: 0, duration: 0.95, stagger: 0.1, ease: "power3.out", clearProps: "transform" }, 0.55)
          .fromTo("[data-shadow]", { opacity: 0, scaleX: 0.6 }, { opacity: 1, scaleX: 1, duration: 0.9, stagger: 0.1, ease: "power3.out", clearProps: "transform,opacity" }, 0.7);
      }

      // Hero → Showreel : le rocher et le setup quittent le cadre, le paysage reste un instant.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          // Terminé un peu avant que le hero ne se décroche : le monde (WorldCanvas)
          // reprend alors exactement le même cadrage et la même lumière → aucune ligne visible.
          scrollTrigger: { trigger: trackRef.current, start: "top top", end: "bottom 112%", scrub: 0.5 },
        });
        tl.to("[data-copy]", { yPercent: -30, opacity: 0, duration: 0.35 }, 0)
          .to("[data-products]", { yPercent: 38, opacity: 0, duration: 0.6 }, 0)
          .to("[data-landscape]", { scale: HERO_EXIT.scale, duration: 1, transformOrigin: HERO_EXIT.origin }, 0)
          .fromTo(worldCam, { scale: 1, x: 0, y: 0 }, { scale: HERO_EXIT.scale, x: 0, y: 0, duration: 1, immediateRender: false }, 0)
          .to("[data-brand-wrap]", { opacity: 0, duration: 0.7 }, 0.1)
          .fromTo(worldCam, { shade: 0 }, { shade: HERO_EXIT.shade, duration: 0.7, immediateRender: false }, 0.3);
      });
    }, hero);
    return () => {
      movers.current = [];
      ctx.revert();
    };
  }, [layer, q]);

  // Échap, logo, redimensionnement.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modeRef.current.m !== "home") {
        e.preventDefault();
        back();
      }
    };
    const onHome = () => resetAll();
    const onResize = () => {
      const s = modeRef.current;
      if (s.m !== "focus") return;
      tlRef.current?.progress(1);
      const el = layer(s.p, "focus");
      gsap.set(el, { x: 0, y: 0, scale: 1 });
      const t = focusTarget(s.p);
      if (t) gsap.set(el, t);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(HOME_RESET_EVENT, onHome);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(HOME_RESET_EVENT, onHome);
      window.removeEventListener("resize", onResize);
    };
  }, [back, focusTarget, layer, resetAll]);

  const onProductClick = (p: ProductId, e: React.MouseEvent) => {
    if (modeRef.current.m !== "home") return;
    const keyboard = e.detail === 0;
    if (keyboard || lastPointer.current === "touch") return openFocus(p);
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) openFocus(hit);
  };

  const focused = mode.m === "focus" ? mode.p : mode.m === "home" ? null : "avata";
  const activePart = mode.m === "part" ? AVATA_PARTS.find((x) => x.id === mode.part) : null;

  return (
    <div ref={trackRef} id="top" className={styles.track}>
      <section
        ref={heroRef}
        className={styles.hero}
        aria-labelledby="hero-title"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        data-mode={mode.m}
      >
        {/* Le paysage vivant est rendu par le monde (WorldCanvas) ; ici, le grand nom glissé
            derrière les sommets (masque du ciel), sur la même caméra. */}
        <div data-landscape className={styles.landscape} aria-hidden="true">
          <div data-landscape-intro className={styles.fillAbs}>
            <div className={styles.brandBox}>
              <div data-brand-wrap className={styles.brandWrap}>
                <p data-brand className={styles.brand}>
                  {SITE.brand}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Texte */}
        <div data-copy className={styles.copy} inert={mode.m !== "home"}>
          <p data-chrome data-fade className={styles.disciplines}>
            {SITE.disciplines.join(" · ")}
          </p>
          <h1 id="hero-title" data-chrome className={styles.headline}>
            <span className="sr-only">{SITE.brand} — </span>
            {SITE.headline.map((l, i) => (
              <span key={l} className={styles.mask}>
                <span data-line className={i === 0 ? styles.l1 : styles.l2}>
                  {l}
                </span>
              </span>
            ))}
          </h1>
          <a
            data-chrome
            data-fade
            href="#showreel"
            className={styles.cta}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("showreel");
            }}
          >
            <span className={styles.play} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>
            Voir le showreel
            <span className={styles.ctaRule} aria-hidden="true" />
          </a>
        </div>

        {/* Setup FPV posé sur le rocher */}
        <div className={styles.productsCam}>
          <div data-products className={styles.products}>
            {PRODUCTS.map((p) => {
              const geo = productGeometry(p);
              const isAvata = p.id === "avata";
              return (
                <div key={p.id} data-p={p.id} className={`${styles.product} ${styles[p.id]}`} style={{ aspectRatio: geo.aspect } as CSSProperties}>
                  <div data-focus className={styles.fill}>
                    <div data-shadow className={styles.shadow} aria-hidden="true" />
                    <div data-explode className={styles.fill}>
                      <div data-depth className={styles.fill}>
                        <div data-enter className={styles.fill}>
                          <div data-hover className={`${styles.fill} ${styles.hover}`}>
                            <div data-canvas className={styles.canvas} style={geo.canvas}>
                              {isAvata ? (
                                <div data-tt-base className={styles.fill}>
                                <div ref={droneImgsRef} className={styles.fill}>
                                  <div ref={idleRef} className={styles.fill}>
                                    <Image src={IDLE_SRC} alt="" fill preload quality={90} sizes="(orientation: portrait) 80vw, 40vw" draggable={false} className="select-none object-contain" />
                                  </div>
                                  <div ref={activeRef} className={styles.active} style={activeLayerStyle}>
                                    <Image src={ACTIVE_SRC} alt="" fill loading="eager" quality={90} sizes="(orientation: portrait) 90vw, 45vw" draggable={false} className="select-none object-fill" />
                                  </div>
                                </div>
                                </div>
                              ) : (
                                <div data-tt-base className={styles.fill}>
                                  <Image src={p.src} alt="" fill preload quality={90} sizes="(orientation: portrait) 50vw, 30vw" draggable={false} className="select-none object-contain" />
                                </div>
                              )}
                            </div>
                            {TURNTABLE[p.id]?.frames.map((f, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={f.src} data-tt={i} src={f.src} alt="" className={styles.ttFrame} style={{ width: `${f.w}%`, left: `${50 + f.x - f.w / 2}%` }} draggable={false} decoding="async" aria-hidden="true" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-hit
                    className={styles.hit}
                    aria-label={`${p.name} — découvrir`}
                    aria-expanded={focused === p.id}
                    aria-controls={`panel-${p.id}`}
                    inert={mode.m !== "home"}
                    onClick={(e) => onProductClick(p.id, e)}
                    onFocus={(e) => {
                      if (modeRef.current.m === "home" && e.currentTarget.matches(":focus-visible")) setHover(p.id);
                    }}
                    onBlur={() => {
                      if (hovered.current === p.id) setHover(null);
                    }}
                  />
                  <p data-name={p.id} className={styles.name} aria-hidden="true">
                    {p.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fiches : objet à gauche, récit à droite */}
        {PRODUCTS.map((p) => {
          const c = SETUP_COPY[p.id];
          return (
            <div key={p.id} id={`panel-${p.id}`} data-panel={p.id} className={styles.panel} role="region" aria-labelledby={`ptitle-${p.id}`} inert={mode.m !== "focus" || focused !== p.id}>
              <p data-pi className={styles.pLabel}>
                <span className={styles.pRule} aria-hidden="true" />
                {c.role}
              </p>
              <h2 data-pi data-ptitle id={`ptitle-${p.id}`} tabIndex={-1} className={styles.pTitle}>
                {c.title}
              </h2>
              <p data-pi className={styles.pHook}>
                {c.hook}
              </p>
              <p data-pi className={styles.pText}>
                {c.text}
              </p>
              {p.id === "avata" && (
                <p data-pi>
                  <button type="button" data-explore-btn className={styles.pAction} onClick={openExplore}>
                    Explorer le drone <span aria-hidden="true">→</span>
                  </button>
                </p>
              )}
            </div>
          );
        })}

        {/* Avata — vue éclatée */}
        <div ref={exploreRef} className={styles.explore} inert={mode.m !== "explore" && mode.m !== "part"} aria-label="DJI Avata 2 — vue éclatée" role="region">
          <div className={styles.xStage}>
            <div ref={xCanvasRef} className={styles.xCanvas} style={{ aspectRatio: FULL_ASPECT }}>
              <div ref={ghostRef} className={styles.ghost} style={GHOST_STYLE} aria-hidden="true" />
              {LAYERS.map((l) => {
                const st = layerStyle(l);
                return (
                  <div key={l.key} data-x-layer={l.key} data-x-part={l.part ?? ""} className={styles.xLayer} style={st.box} aria-hidden="true">
                    <span className={styles.xLayerImg} style={st.img}>
                      <Image src={FULL_SRC} alt="" fill loading="eager" fetchPriority="low" quality={90} sizes="(orientation: portrait) 100vw, 60vw" draggable={false} className="select-none object-contain" />
                    </span>
                  </div>
                );
              })}
              {EXPLODE_PARTS.map((p, i) => {
                const d = boundsPct(p.dot.x, p.dot.y);
                const part = AVATA_PARTS[i];
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-x-ui
                    className={`${styles.xDot} ${mode.m === "part" && mode.part === part.id ? styles.xDotOn : ""}`}
                    style={{ left: `${d.x}%`, top: `${d.y}%` }}
                    aria-label={part.label}
                    tabIndex={-1}
                    onClick={() => openPart(part.id)}
                  >
                    <span>{i + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.xPanel}>
            <p data-x-ui className={styles.pLabel}>
              <span className={styles.pRule} aria-hidden="true" />
              {SETUP_COPY.avata.role}
            </p>
            {!activePart ? (
              <div data-x-ui className={styles.xIntro}>
                <h2 className={styles.xHead}>{SETUP_COPY.avata.title}</h2>
                <p className={styles.xHookBig}>{SETUP_COPY.avata.hook}</p>
                <p className={styles.xLede}>{SETUP_COPY.avata.text}</p>
              </div>
            ) : null}
            {activePart ? (
              <div className={styles.xDetail}>
                <p className={styles.xIndex}>{String(AVATA_PARTS.indexOf(activePart) + 1).padStart(2, "0")}</p>
                <h2 data-part-title tabIndex={-1} className={styles.xTitle}>
                  {activePart.label}
                </h2>
                <p className={styles.pHook}>{activePart.hook}</p>
                <p className={styles.pText}>{activePart.text}</p>
                <p className={styles.xTech}>{activePart.tech}</p>
                <button type="button" className={styles.pAction} onClick={closePart}>
                  <span aria-hidden="true">←</span> Tous les composants
                </button>
              </div>
            ) : (
              <ol className={styles.xList}>
                {AVATA_PARTS.map((part, i) => (
                  <li key={part.id} data-x-ui>
                    <button type="button" data-x-item={part.id} data-x-first={i === 0 ? "" : undefined} className={styles.xItem} onClick={() => openPart(part.id)}>
                      <span className={styles.xNum}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={styles.xName}>{part.label}</span>
                      <span className={styles.xHook}>{part.hook}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <button type="button" data-back className={styles.back} onClick={back} inert={mode.m === "home"}>
          <span aria-hidden="true">←</span> Retour
        </button>
      </section>
    </div>
  );
}
