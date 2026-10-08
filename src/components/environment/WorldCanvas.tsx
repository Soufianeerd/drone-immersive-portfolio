"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { HERO_EXIT, WORLD_SCENES } from "@/config/world";
import { useEnvironment } from "@/lib/environment/EnvironmentProvider";
import { sceneUniforms } from "@/lib/environment/theme";
import type { SceneUniforms } from "@/lib/environment/theme";
import { CAM_ORIGIN, worldCam } from "@/lib/world/camera";
import WeatherCanvas from "./WeatherCanvas";
import { FRAG, VERT } from "./worldShader";
import styles from "./WorldCanvas.module.css";

const IMG_AR = 2560 / 1441;

/**
 * LE MONDE — un seul calque fixe derrière tout le site, rendu en WebGL en une passe :
 * paysage réel, nuages du ciel qui glissent, brume qui coule, lumière qui respire,
 * étalonnage heure / météo / saison, caméra pilotée par le scroll et le focus produit.
 *
 * Coût constant et faible (un seul draw par image, résolution adaptative), au lieu d'une
 * pile de calques CSS plein écran. Sans WebGL 2 : photo fixe (même cadrage), sans animation.
 */
export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const env = useEnvironment();
  const target = useRef<SceneUniforms>(sceneUniforms("golden", "clear", "summer"));
  const live = useRef<SceneUniforms | null>(null);

  // Nouvelle ambiance → le rendu y glisse en quelques secondes (jamais de flash).
  useEffect(() => {
    if (!env) return;
    target.current = sceneUniforms(env.dayPhase, env.weather, env.season);
    if (!live.current) live.current = structuredClone(target.current);
  }, [env]);

  // Caméra : stations de scroll après le hero (créées une fois la page entière en place).
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const id = requestAnimationFrame(() => {
      const top = document.getElementById("top");
      if (!top) return;
      const contact = document.getElementById("contact");
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "sine.inOut", immediateRender: false },
          scrollTrigger: contact
            ? { trigger: top, start: "bottom top", endTrigger: contact, end: "bottom bottom", scrub: 1.2 }
            : { trigger: top, start: "bottom top", end: "max", scrub: 1.2 },
        });
        let prev: { scale: number; x: number; y: number; shade: number } = { scale: HERO_EXIT.scale, x: 0, y: 0, shade: HERO_EXIT.shade };
        WORLD_SCENES[0].stations.forEach((s) => {
          const next = { scale: s.scale, x: s.x / 100, y: s.y / 100, shade: s.shade };
          tl.fromTo(worldCam, { ...prev }, { ...next, duration: 1 });
          prev = next;
        });
      });
    });
    return () => {
      cancelAnimationFrame(id);
      mm.revert();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
    if (!gl) {
      fallbackRef.current?.removeAttribute("hidden");
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    } catch (e) {
      console.warn("[world] WebGL indisponible, repli statique", e);
      fallbackRef.current?.removeAttribute("hidden");
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      img: U("uImg"), mask: U("uMask"), res: U("uRes"), ar: U("uAr"), time: U("uTime"), intro: U("uIntro"), cam: U("uCam"), origin: U("uOrigin"),
      grade: U("uGrade"), sepia: U("uSepia"), t0: U("uTint0"), t1: U("uTint1"), t2: U("uTint2"), tmix: U("uTintMix"), veil: U("uVeil"), fog: U("uFog"),
      stars: U("uStars"), bg: U("uBg"), shade: U("uShade"), blur: U("uBlur"), dim: U("uDim"),
    };

    let ready = 0;
    const texture = (unit: number, src: string, mips: boolean) => {
      const tex = gl.createTexture();
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        if (mips) gl.generateMipmap(gl.TEXTURE_2D);
        ready++;
      };
    };
    const small = window.matchMedia("(max-width: 767px)").matches;
    texture(0, small ? "/environment/master/landscape-1280.webp" : "/environment/master/landscape.webp", true);
    texture(1, "/environment/master/world-masks.png", false);
    gl.uniform1i(u.img, 0);
    gl.uniform1i(u.mask, 1);
    gl.uniform1f(u.ar, IMG_AR);
    gl.uniform2f(u.origin, CAM_ORIGIN.x, CAM_ORIGIN.y);

    // Résolution adaptative : le paysage est une image douce, inutile de le calculer en Retina.
    const maxScale = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1);
    let scale = maxScale;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = Math.max(1, Math.round(canvas.clientWidth * scale));
      h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    // Redimensionner efface le canvas : on le fait seulement juste avant de dessiner (jamais d'image noire).
    let dirty = false;
    const ro = new ResizeObserver(() => (dirty = true));
    ro.observe(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let last = performance.now();
    let t = 40;
    let slow = 0;
    let frames = 0;
    let shown = false;
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (ready < 2) return;
      if (dirty) {
        dirty = false;
        resize();
      }
      if (!reduced.matches) t += dt;

      // Ambiance : glissement exponentiel vers la cible (~3 s).
      const tg = target.current;
      const lv = (live.current ??= structuredClone(tg));
      const k = 1 - Math.exp(-dt / 1.2);
      (["brightness", "contrast", "saturate", "hue", "sepia", "tintOpacity", "tintMultiply", "veil", "fog", "stars"] as const).forEach((key) => (lv[key] = lerp(lv[key], tg[key], k)));
      lv.tint.forEach((c, i) => c.forEach((v, j) => (c[j] = lerp(v, tg.tint[i][j], k))));
      lv.bg.forEach((v, j) => (lv.bg[j] = lerp(v, tg.bg[j], k)));

      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.time, t);
      gl.uniform1f(u.intro, worldCam.intro);
      gl.uniform3f(u.cam, worldCam.scale, worldCam.x, worldCam.y);
      gl.uniform4f(u.grade, lv.brightness, lv.contrast, lv.saturate, lv.hue);
      gl.uniform1f(u.sepia, lv.sepia);
      gl.uniform3fv(u.t0, lv.tint[0]);
      gl.uniform3fv(u.t1, lv.tint[1]);
      gl.uniform3fv(u.t2, lv.tint[2]);
      gl.uniform2f(u.tmix, lv.tintOpacity, lv.tintMultiply);
      gl.uniform1f(u.veil, lv.veil);
      gl.uniform1f(u.fog, lv.fog);
      gl.uniform1f(u.stars, lv.stars);
      gl.uniform3fv(u.bg, lv.bg);
      gl.uniform1f(u.shade, worldCam.shade);
      gl.uniform1f(u.blur, worldCam.blur);
      gl.uniform1f(u.dim, worldCam.dim);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!shown) {
        shown = true;
        canvas.dataset.ready = "";
      }
      // Machine lente : on baisse la résolution du paysage plutôt que de saccader.
      frames++;
      slow = slow * 0.95 + (dt > 0.024 ? 1 : 0) * 0.05;
      if (frames > 90 && slow > 0.5 && scale > 0.6) {
        scale = Math.max(0.6, scale - 0.15);
        slow = 0;
        frames = 0;
        dirty = true;
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      // Pas de loseContext() : en développement React remonte l'effet et réutilise ce contexte.
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div className={styles.world} aria-hidden="true">
      <div ref={fallbackRef} className={styles.fallback} hidden />
      <canvas ref={canvasRef} className={styles.canvas} />
      <WeatherCanvas className={styles.weather} />
    </div>
  );
}
