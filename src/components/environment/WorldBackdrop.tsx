"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { HERO_EXIT, WORLD_SCENES } from "@/config/world";
import Landscape from "./Landscape";
import styles from "./WorldBackdrop.module.css";

/**
 * WORLD — le monde reste derrière tout le site.
 *
 * Calque fixe sous les sections : le MÊME paysage vivant que le hero (nuages, brume, lumière),
 * dans l'état exact où le hero le laisse (même cadrage, même lumière) : quand le hero remonte,
 * aucune ligne n'apparaît. Ensuite la caméra poursuit son trajet au fil du scroll
 * (une station par section) et l'atmosphère s'épaissit en profondeur.
 */
export default function WorldBackdrop() {
  const cam = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cam.current;
    const r = root.current;
    if (!el || !r) return;
    gsap.registerPlugin(ScrollTrigger);
    const stations = WORLD_SCENES[0].stations;
    gsap.set(el, { scale: HERO_EXIT.scale, transformOrigin: HERO_EXIT.origin, xPercent: 0, yPercent: 0 });
    gsap.set(r, { "--world-shade": HERO_EXIT.shade });
    // En pause tant que le hero le recouvre entièrement.
    r.setAttribute("data-world-paused", "");
    const live = ScrollTrigger.create({
      trigger: "#top",
      start: "bottom bottom",
      onEnter: () => r.removeAttribute("data-world-paused"),
      onLeaveBack: () => r.setAttribute("data-world-paused", ""),
    });
    const ctx = gsap.context(() => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "sine.inOut" },
          scrollTrigger: { trigger: "#top", start: "bottom top", endTrigger: "#contact", end: "bottom bottom", scrub: 1.4 },
        });
        stations.forEach((s) => {
          tl.to(el, { scale: s.scale, xPercent: s.x, yPercent: s.y, duration: 1 }).to(r, { "--world-shade": s.shade, duration: 1 }, "<");
        });
      });
    }, r);
    return () => {
      live.kill();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className={styles.world} aria-hidden="true">
      <div ref={cam} className={styles.cam}>
        <Landscape focusable={false} />
        <div className={styles.read} />
      </div>
      <div className={styles.shade} />
    </div>
  );
}
