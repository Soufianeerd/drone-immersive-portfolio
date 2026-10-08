"use client";

import { useEffect, useRef } from "react";
import { useEnvironment } from "@/lib/environment/EnvironmentProvider";

/**
 * Particules météo (pluie fine / neige lente) sur canvas. Densité réduite sur mobile,
 * coupée en reduced-motion et quand l'onglet / la section n'est pas visible.
 */
export default function WeatherCanvas({ className }: { className?: string }) {
  const env = useEnvironment();
  const ref = useRef<HTMLCanvasElement>(null);
  const kind = env?.weather === "rain" ? "rain" : env?.weather === "snow" ? "snow" : null;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !kind) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const count = kind === "rain" ? (mobile ? 90 : 220) : mobile ? 60 : 140;
    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 0.7, // profondeur
      s: Math.random(),
    }));
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(50, t - last) / 16.7;
      last = t;
      if (!visible || document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      if (kind === "rain") {
        ctx.strokeStyle = "rgba(210, 220, 235, 0.35)";
        ctx.lineCap = "round";
        for (const p of parts) {
          p.y += (14 + p.z * 16) * dt;
          p.x += (1.5 + p.z * 2) * dt;
          if (p.y > h) {
            p.y = -20;
            p.x = Math.random() * w;
          }
          ctx.globalAlpha = 0.25 + p.z * 0.55;
          ctx.lineWidth = 0.6 + p.z * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2 - p.z * 2, p.y - 10 - p.z * 14);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "rgba(250, 250, 255, 0.9)";
        for (const p of parts) {
          p.y += (0.5 + p.z * 1.1) * dt;
          p.x += Math.sin((t / 1600) * (0.6 + p.s) + p.s * 10) * 0.4 * dt;
          if (p.y > h) {
            p.y = -6;
            p.x = Math.random() * w;
          }
          ctx.globalAlpha = 0.35 + p.z * 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.8 + p.z * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [kind]);

  return <canvas ref={ref} className={className} aria-hidden="true" data-weather-canvas={kind ?? "none"} />;
}
