"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import type { SiteBackground as Bg } from "@/lib/cms/types";
import { worldCam } from "@/lib/world/camera";

/**
 * Fond personnalisé (choisi dans l'admin) à la place du paysage vivant : photo ou vidéo en boucle.
 * Mode « boomerang » : la vidéo repart à l'envers à la fin, puis à l'endroit (idéal pour des plans courts).
 * Suit la caméra du site (flou / assombrissement au focus produit) comme le paysage.
 */
export default function SiteBackground({ background }: { background: Exclude<Bg, { type: "world" }> }) {
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Caméra : même flou / assombrissement que le paysage vivant.
  useEffect(() => {
    const el = media.current;
    if (!el) return;
    let last = "";
    const tick = () => {
      const f = `blur(${worldCam.blur.toFixed(2)}px) brightness(${(1 - worldCam.dim).toFixed(3)})`;
      if (f !== last) el.style.filter = last = f;
      el.style.transform = `scale(${(worldCam.scale * worldCam.intro).toFixed(4)})`;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  // Boomerang : lecture arrière image par image à la fin de la vidéo.
  useEffect(() => {
    const v = video.current;
    if (!v || background.type !== "video" || background.mode !== "boomerang") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = 0;
    const back = (t: number) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      const next = v.currentTime - dt;
      if (next <= 0.04) {
        v.currentTime = 0;
        last = 0;
        void v.play().catch(() => undefined);
        return;
      }
      if (!v.seeking) v.currentTime = next;
      raf = requestAnimationFrame(back);
    };
    const onEnded = () => {
      last = 0;
      raf = requestAnimationFrame(back);
    };
    v.addEventListener("ended", onEnded);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("ended", onEnded);
    };
  }, [background]);

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "var(--color-ink, #0b0c0e)", pointerEvents: "none" }}>
      <div ref={media} style={{ position: "absolute", inset: 0, transformOrigin: "50% 18%", willChange: "transform, filter" }}>
        {background.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video
            ref={video}
            src={background.url}
            poster={background.poster}
            autoPlay
            muted
            playsInline
            loop={background.mode === "loop"}
            preload="auto"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      {/* Voile de lisibilité (textes clairs sur n'importe quelle image). */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.1) 40%, rgba(0,0,0,.45) 100%)" }} />
    </div>
  );
}
