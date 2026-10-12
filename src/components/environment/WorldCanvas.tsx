"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { HERO_EXIT, HERO_SCENE, SCENE_DURATION, SCENE_TRANSITION, STATIONS, journeyOrder } from "@/config/world";
import type { WorldScene } from "@/config/world";
import { useEnvironment } from "@/lib/environment/EnvironmentProvider";
import { sceneUniforms, weatherSun, worldUniforms } from "@/lib/environment/theme";
import type { SceneUniforms } from "@/lib/environment/theme";
import { CAM_ORIGIN, worldCam, worldJourney } from "@/lib/world/camera";
import WeatherCanvas from "./WeatherCanvas";
import { FRAG, VERT } from "./worldShader";
import styles from "./WorldCanvas.module.css";

type SunUniforms = { intensity: number; warmth: number; x: number; elevation: number };

/**
 * LE MONDE — un seul canvas WebGL fixe derrière tout le site.
 *
 * - Hero : la montagne maître, immobile (le matériel est posé sur son rocher), mais vivante.
 * - Après le hero : un voyage autonome de paysage en paysage (config/world.ts), même sans scroll.
 *   Deux emplacements de texture seulement (scène courante + suivante), réutilisés ; la suivante
 *   est préchargée pendant que la courante est à l'écran. Passage par fondu GPU « dans les nuages ».
 * - Lumière : course réelle du soleil (continue), météo, saison. Caméra globale (scroll, focus) via worldCam.
 *
 * Tests (développement) : ?scene=lac (démarre le voyage sur une scène), ?sceneDur=8 (boucle rapide),
 * ?hour=17.5, ?phase=, ?weather=, ?season=.
 */
export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const env = useEnvironment();
  const target = useRef<SceneUniforms>(sceneUniforms("golden", "clear", "summer"));
  const sunTarget = useRef<SunUniforms>({ intensity: 0.8, warmth: 0.6, x: 0.7, elevation: 0.3 });
  const order = useRef<WorldScene[]>(journeyOrder("autumn"));

  // Nouvelle ambiance → le rendu y glisse en quelques secondes (jamais de flash).
  useEffect(() => {
    if (!env) return;
    const forced = new URLSearchParams(window.location.search).has("phase");
    target.current = worldUniforms(env.dayPhase, env.weather, env.season, env.solar, forced);
    const sol = env.solar;
    sunTarget.current = {
      intensity: (forced ? (env.dayPhase === "night" ? 0 : env.dayPhase === "day" ? 1 : 0.55) : sol.intensity) * weatherSun(env.weather),
      warmth: forced ? ({ dawn: 0.7, day: 0.1, golden: 0.95, dusk: 0.8, night: 0 } as const)[env.dayPhase] : sol.warmth,
      // Direction réelle : matin à gauche, soir à droite (azimut est → ouest).
      x: Math.min(0.9, Math.max(0.1, 0.5 + (sol.azimuth - 180) / 160)),
      elevation: Math.min(1, Math.max(0, sol.elevation / 55)),
    };
    order.current = journeyOrder(env.season);
  }, [env]);

  // Caméra globale au scroll + démarrage du voyage quand le hero quitte l'écran.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    let journey: ScrollTrigger | null = null;
    const id = requestAnimationFrame(() => {
      const top = document.getElementById("top");
      if (!top) return;
      const contact = document.getElementById("contact");
      journey = ScrollTrigger.create({
        trigger: top,
        start: "bottom 55%",
        onEnter: () => (worldJourney.active = true),
        onLeaveBack: () => (worldJourney.active = false),
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "sine.inOut", immediateRender: false },
          scrollTrigger: contact
            ? { trigger: top, start: "bottom top", endTrigger: contact, end: "bottom bottom", scrub: 1.2 }
            : { trigger: top, start: "bottom top", end: "max", scrub: 1.2 },
        });
        let prev: { scale: number; x: number; y: number; shade: number } = { scale: HERO_EXIT.scale, x: 0, y: 0, shade: HERO_EXIT.shade };
        STATIONS.forEach((s) => {
          tl.fromTo(worldCam, { ...prev }, { ...s, duration: 1 });
          prev = s;
        });
      });
    });
    return () => {
      cancelAnimationFrame(id);
      journey?.kill();
      mm.revert();
      worldJourney.active = false;
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
      res: U("uRes"), time: U("uTime"), mix: U("uMix"), haze: U("uHaze"), intro: U("uIntro"), cam: U("uCam"), origin: U("uOrigin"),
      a0: U("uSceneA0"), a1: U("uSceneA1"), a2: U("uSceneA2"), b0: U("uSceneB0"), b1: U("uSceneB1"), b2: U("uSceneB2"),
      grade: U("uGrade"), sepia: U("uSepia"), t0: U("uTint0"), t1: U("uTint1"), t2: U("uTint2"), tmix: U("uTintMix"), veil: U("uVeil"), fog: U("uFog"),
      stars: U("uStars"), bg: U("uBg"), shade: U("uShade"), blur: U("uBlur"), dim: U("uDim"), sun: U("uSun"), motion: U("uMotion"),
    };
    // Unités : A = 0/1, B = 2/3 (images / masques). Les textures sont réaffectées aux unités à chaque permutation.
    gl.uniform1i(U("uImgA"), 0);
    gl.uniform1i(U("uMaskA"), 1);
    gl.uniform1i(U("uImgB"), 2);
    gl.uniform1i(U("uMaskB"), 3);
    gl.uniform2f(u.origin, CAM_ORIGIN.x, CAM_ORIGIN.y);

    const small = window.matchMedia("(max-width: 767px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const q = new URLSearchParams(window.location.search);
    const dev = process.env.NODE_ENV !== "production";
    const forcedScene = dev ? q.get("scene") : null;
    const sceneDur = dev && Number(q.get("sceneDur")) > 4 ? Number(q.get("sceneDur")) : SCENE_DURATION;
    const trans = Math.min(SCENE_TRANSITION, sceneDur * 0.35);

    // --- Deux emplacements de texture, réutilisés (jamais plus de deux grandes images en mémoire GPU).
    type Slot = { img: WebGLTexture; mask: WebGLTexture; scene: WorldScene | null; loading: string | null; t0: number };
    const mkTex = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([14, 14, 14, 255]));
      return t;
    };
    const slots: Slot[] = [0, 1].map(() => ({ img: mkTex(), mask: mkTex(), scene: null, loading: null, t0: 0 }));
    let alive = true;

    const decode = async (src: string): Promise<TexImageSource> => {
      // Décodage hors du fil principal quand c'est possible (aucun à-coup pendant le voyage).
      if ("createImageBitmap" in window) {
        const blob = await (await fetch(src)).blob();
        return createImageBitmap(blob);
      }
      const img = new Image();
      img.src = src;
      await img.decode();
      return img;
    };
    const upload = (tex: WebGLTexture, data: TexImageSource, mips: boolean) => {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      if (mips) gl.generateMipmap(gl.TEXTURE_2D);
      if ("close" in data && typeof data.close === "function") data.close();
    };
    const load = (slot: Slot, scene: WorldScene) => {
      if (slot.scene === scene || slot.loading === scene.id) return;
      slot.loading = scene.id;
      Promise.all([decode(small ? scene.mobileSrc : scene.src), decode(scene.mask)])
        .then(([img, mask]) => {
          if (!alive || slot.loading !== scene.id) return;
          upload(slot.img, img, true);
          upload(slot.mask, mask, false);
          slot.scene = scene;
          slot.loading = null;
        })
        .catch((e) => {
          console.warn("[world] scène non chargée", scene.id, e);
          slot.loading = null;
        });
    };

    let cur = 0; // emplacement affiché (A)
    let mixing = false;
    let mixStart = 0;
    let clock = 0; // horloge du voyage (s), avance même en reduced-motion
    let advanced = -1;
    let pos = Math.max(0, forcedScene ? order.current.findIndex((s) => s.id === forcedScene) : 0);
    if (forcedScene) worldJourney.active = true;
    load(slots[0], HERO_SCENE);

    const desired = () => (worldJourney.active ? order.current[pos % order.current.length] : HERO_SCENE);

    const sceneUniformsFor = (slot: Slot, now: number) => {
      const s = slot.scene ?? HERO_SCENE;
      const life = sceneDur + trans;
      const k = reduced.matches ? 0 : Math.min(1, Math.max(0, (now - slot.t0) / life));
      const e = 0.5 - 0.5 * Math.cos(Math.PI * k);
      const m = s.motion;
      const zoom = m.zoomFrom + (m.zoomTo - m.zoomFrom) * e;
      const px = m.panFrom[0] + (m.panTo[0] - m.panFrom[0]) * e;
      const py = m.panFrom[1] + (m.panTo[1] - m.panFrom[1]) * e;
      // Écran plus étroit que la photo → cadrage sur le point focal (jamais d'étirement).
      const narrow = canvas.clientWidth / Math.max(1, canvas.clientHeight) < s.aspect;
      const fx = narrow ? s.focalPoint.x : 0.5;
      return {
        p0: [s.aspect, fx, 0.5, s.water * (small ? 0.6 : 1)] as const,
        p1: [zoom, px, py, s.atmosphere.cloudDrift] as const,
        p2: [s.atmosphere.mist, s.bakedSun?.x ?? 0, s.bakedSun?.y ?? 0, s.bakedSun ? 1 : 0] as const,
      };
    };

    // Résolution adaptative.
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
    let dirty = false;
    const ro = new ResizeObserver(() => (dirty = true));
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    let t = 40;
    let slow = 0;
    let frames = 0;
    let shown = false;
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const lv: SceneUniforms = structuredClone(target.current);
    const sun: SunUniforms = { ...sunTarget.current };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      clock += dt;
      if (!reduced.matches) t += dt;

      const A = slots[cur];
      const B = slots[1 - cur];
      if (!A.scene) return; // première image pas encore là : la photo CSS reste visible

      // --- Voyage : quelle scène doit être à l'écran ?
      if (!mixing) {
        // Une scène a fait son temps → la suivante (une seule fois par scène).
        if (worldJourney.active && A.scene !== HERO_SCENE && clock - A.t0 > sceneDur && advanced !== A.t0) {
          pos++;
          advanced = A.t0;
        }
        const want = desired();
        if (A.scene !== want) {
          load(B, want);
          if (B.scene === want) {
            mixing = true;
            mixStart = clock;
            B.t0 = clock;
          }
        } else if (worldJourney.active || A.scene !== HERO_SCENE) {
          // Préchargement de la suivante pendant que la courante est à l'écran.
          load(B, worldJourney.active ? order.current[(pos + 1) % order.current.length] : order.current[pos % order.current.length]);
        } else {
          load(B, order.current[pos % order.current.length]);
        }
      }
      let mix = 0;
      let haze = 0;
      if (mixing) {
        const k = Math.min(1, (clock - mixStart) / (reduced.matches ? Math.max(trans, 3) : trans));
        mix = k;
        haze = reduced.matches ? 0 : Math.sin(Math.PI * k) * 0.62;
        if (k >= 1) {
          mixing = false;
          cur = 1 - cur;
          mix = 0;
          haze = 0;
        }
      }

      if (dirty) {
        dirty = false;
        resize();
      }

      // Liaison des textures : A → unités 0/1, B → 2/3.
      const SA = slots[cur];
      const SB = slots[1 - cur];
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, SA.img);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, SA.mask);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, SB.img);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, SB.mask);

      // Ambiance : glissement exponentiel vers la cible (~3 s).
      const tg = target.current;
      const kk = 1 - Math.exp(-dt / 1.2);
      (["brightness", "contrast", "saturate", "hue", "sepia", "tintOpacity", "tintMultiply", "veil", "fog", "stars"] as const).forEach((key) => (lv[key] = lerp(lv[key], tg[key], kk)));
      lv.tint.forEach((c, i) => c.forEach((v, j) => (c[j] = lerp(v, tg.tint[i][j], kk))));
      lv.bg.forEach((v, j) => (lv.bg[j] = lerp(v, tg.bg[j], kk)));
      (["intensity", "warmth", "x", "elevation"] as const).forEach((key) => (sun[key] = lerp(sun[key], sunTarget.current[key], kk)));

      const pa = sceneUniformsFor(SA, clock);
      const pb = sceneUniformsFor(SB, clock);
      gl.uniform4f(u.a0, ...pa.p0);
      gl.uniform4f(u.a1, ...pa.p1);
      gl.uniform4f(u.a2, ...pa.p2);
      gl.uniform4f(u.b0, ...pb.p0);
      gl.uniform4f(u.b1, ...pb.p1);
      gl.uniform4f(u.b2, ...pb.p2);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.time, t);
      gl.uniform1f(u.mix, mix);
      gl.uniform1f(u.haze, haze);
      gl.uniform1f(u.motion, reduced.matches ? 0 : small ? 0.6 : 1);
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
      gl.uniform4f(u.sun, sun.intensity, sun.warmth, sun.x, sun.elevation);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!shown) {
        shown = true;
        canvas.dataset.ready = "";
      }
      canvas.dataset.scene = mixing ? `${SA.scene?.id}>${SB.scene?.id}` : (SA.scene?.id ?? "");
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
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      // Pas de loseContext() : en développement React remonte l'effet et réutilise ce contexte.
      slots.forEach((s) => {
        gl.deleteTexture(s.img);
        gl.deleteTexture(s.mask);
      });
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
