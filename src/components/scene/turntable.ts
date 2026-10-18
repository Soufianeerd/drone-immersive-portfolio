import { gsap } from "gsap";

/**
 * PRODUCT TURNTABLE — l'objet tourne lentement sur lui-même à partir de ses VRAIES photos.
 *
 * - Uniquement des vues réellement photographiées (public/assets/gear → détourées, recadrées
 *   sur la silhouette). Aucun angle inventé, aucun morphing génératif : ce n'est pas un scan 360°.
 * - Chaque vue partage le référentiel de la vue de repos du hero : posée sur la même ligne de sol,
 *   centroïde alpha aligné, même masse visuelle (`w` = largeur en % de la silhouette de repos,
 *   `x` = décalage horizontal en %). Seule retouche : un gamma global pour rejoindre la lumière de la vue de repos.
 * - Rotation CONTINUE dès le survol (jamais de pause sur une vue) : l'objet lévite et tourne à vitesse
 *   constante ; chaque vraie vue balaie son secteur et se fond dans la suivante pendant le mouvement
 *   (fondu long + léger flou de vitesse), sans retour en arrière visible. Piloté par gsap.ticker.
 */

export type ProductKey = "goggles" | "avata" | "controller";

export type TurnFrame = {
  src: string;
  /** Angle approximatif de la prise de vue (°, informatif). */
  angle: number;
  /** Largeur de la vue, en % de la silhouette de repos. */
  w: number;
  /** Décalage horizontal du centre de la vue, en % de la silhouette de repos. */
  x: number;
};

export type TurnConfig = {
  frames: TurnFrame[];
  /** "loop" : tour complet ; "orbit" : aller-retour sur les angles disponibles. */
  mode: "loop" | "orbit";
  /** Durée d'un cycle complet (s). */
  cycle: number;
};

export const TURNTABLE: Partial<Record<ProductKey, TurnConfig>> = {
  // Avant (repos) → arrière gauche → arrière droit → face → avant.
  avata: {
    mode: "loop",
    cycle: 6,
    frames: [
      { src: "/assets/turntable/real/avata-arr-gauche.webp", angle: 135, w: 113.6, x: 2.8 },
      { src: "/assets/turntable/real/avata-arr-droit.webp", angle: 225, w: 113.43, x: 5.55 },
      { src: "/assets/turntable/real/avata-face.webp", angle: 360, w: 114.2, x: 2.47 },
    ],
  },
  // Trois orientations réelles (IMG_3286-3289) : repos (3/4 gauche) → 3/4 droit → arrière / dessus, puis retour.
  // La vue intérieure (lentilles) est exclue : raccord physiquement absurde dans une orbite extérieure.
  goggles: {
    mode: "loop",
    cycle: 5.6,
    frames: [
      { src: "/assets/turntable/real/goggles-3q-droit.webp", angle: 120, w: 107.69, x: -5.37 },
      { src: "/assets/turntable/real/goggles-arriere-dessus.webp", angle: 180, w: 94.8, x: -1.48 },
    ],
  },
  // Trois orientations réelles (IMG_3290-3292) : gauche (repos) ↔ dessus ↔ droite. Aucun dos inventé.
  controller: {
    mode: "loop",
    cycle: 5.6,
    frames: [
      { src: "/assets/turntable/real/controller-dessus.webp", angle: 90, w: 79.12, x: 1.54 },
      { src: "/assets/turntable/real/controller-3q-droit.webp", angle: 150, w: 100.95, x: 1.3 },
    ],
  },
};

const smooth = (a: number, b: number, t: number) => {
  const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/** Rotation apparente par secteur (° par vue), dérive latérale (% par vue), demi-largeur du fondu (en vue). */
const YAW = 26;
const DRIFT = 3;
const BLEND = 0.2;
/** Lévitation : amplitude verticale (% de la hauteur), roulis (°), période (s). */
const BOB = 1.6;
const ROLL = 0.7;
const BOB_PERIOD = 3.2;

/**
 * Pilote un turntable : `layers[0]` = vue de repos, `layers[i]` = frames[i - 1].
 * Chaque calque doit être positionné en absolu dans la même boîte.
 */
export class ProductTurntable {
  private n: number; // nombre de vues dans la boucle (repos inclus)
  private seg: number; // durée d'une vue à vitesse de croisière (s)
  private pos = 0; // position continue dans la boucle, en vues (0 = repos)
  private speed = 0; // 0..1
  private target = 0;
  private lev = 0; // intensité de lévitation 0..1
  private time = 0;
  private settle: gsap.core.Tween | null = null;
  private running = false;

  constructor(
    private layers: HTMLElement[],
    private cfg: TurnConfig,
  ) {
    this.n = cfg.frames.length + 1;
    this.seg = cfg.cycle / this.n;
  }

  /** Le survol commence : la rotation démarre aussitôt et monte en vitesse en ~0,5 s. */
  play() {
    if (this.settle) {
      this.settle.kill();
      this.settle = null;
      this.speed = Math.max(this.speed, 0.35);
    }
    this.target = 1;
    if (!this.running) {
      this.running = true;
      gsap.ticker.add(this.tick);
    }
  }

  /** Le survol s'arrête : la rotation continue en ralentissant jusqu'à la vue de repos. */
  stop(instant = false) {
    this.target = 0;
    if (instant) {
      this.kill();
      this.pos = 0;
      this.lev = 0;
      this.render();
    }
  }

  kill() {
    this.settle?.kill();
    this.settle = null;
    if (this.running) gsap.ticker.remove(this.tick);
    this.running = false;
    this.speed = 0;
    this.target = 0;
  }

  private tick = (_t: number, dtMs: number) => {
    const dt = Math.min(dtMs, 50) / 1000;
    this.time += dt;
    // La lévitation suit le survol (montée ~0,6 s, descente ~0,9 s).
    this.lev = Math.min(1, Math.max(0, this.lev + (this.target ? dt / 0.6 : -dt / 0.9)));
    if (!this.settle) {
      if (this.target) {
        this.speed = Math.min(1, this.speed + dt / 0.5);
        this.pos = (this.pos + (this.speed * dt) / this.seg) % this.n;
      } else this.glideHome();
    }
    this.render();
    if (!this.target && !this.settle && this.lev === 0 && this.pos === 0) this.kill();
  };

  /** Fin du survol : décélération continue (aucun arrêt net) jusqu'au repos, toujours dans le sens de rotation. */
  private glideHome() {
    if (this.pos === 0) return;
    const v = Math.max(this.speed, 0.25) / this.seg; // vitesse courante, en vues/s
    const toRest = this.n - this.pos;
    const glide = (to: number, then?: () => void) => {
      const dist = to - this.pos;
      // power2.out démarre à 2·dist/durée : on raccorde la vitesse actuelle.
      const duration = Math.min(2.4, Math.max(0.7, (2 * dist) / v));
      const st = { p: this.pos };
      this.settle = gsap.to(st, {
        p: to,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          this.pos = st.p % this.n;
        },
        onComplete: () => {
          this.pos = to % this.n;
          this.settle = null;
          this.speed = 0;
          then?.();
        },
      });
    };
    if (toRest <= 1.6) return glide(this.n);
    // Trop loin du repos : ralentit jusqu'à la prochaine vraie vue, puis fondu doux vers la vue de repos.
    glide(Math.ceil(this.pos + 0.35), () => {
      const from = this.pos;
      const st = { k: 0 };
      this.settle = gsap.to(st, {
        k: 1,
        duration: 0.75,
        ease: "sine.inOut",
        onUpdate: () => this.renderDissolve(from, st.k),
        onComplete: () => {
          this.settle = null;
          this.pos = 0;
        },
      });
    });
  }

  private bob() {
    const ph = (this.time / BOB_PERIOD) * Math.PI * 2;
    const e = smooth(0, 1, this.lev);
    return { y: -Math.sin(ph) * BOB * e, r: Math.sin(ph * 0.5 + 0.8) * ROLL * e };
  }

  private apply(el: HTMLElement, o: number, d: number, blur: number, z: string) {
    const { y, r } = this.bob();
    el.style.opacity = o.toFixed(3);
    el.style.zIndex = z;
    el.style.transformOrigin = "50% 60%";
    const yaw = d * YAW;
    const x = d * DRIFT;
    el.style.transform =
      Math.abs(d) < 1e-4 && Math.abs(y) < 1e-3 && Math.abs(r) < 1e-3
        ? ""
        : `perspective(1600px) translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0) rotateZ(${r.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg)`;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
  }

  /**
   * Chaque vue k est de face à pos = k et balaie son secteur à vitesse constante (yaw ∝ écart).
   * Autour de chaque frontière (pos = k ± 0,5), les deux vues voisines se fondent pendant qu'elles
   * continuent toutes deux de tourner dans le même sens : pas de saut, pas de retour en arrière.
   */
  private render() {
    const n = this.n;
    const k = Math.floor(this.pos + 0.5) % n; // vue dominante
    const d = this.pos - Math.round(this.pos); // écart à la vue dominante (−0,5..0,5)
    const next = d >= 0 ? (k + 1) % n : (k - 1 + n) % n; // voisine du côté de la frontière
    const edge = 0.5 - Math.abs(d); // distance à la frontière
    const s = edge < BLEND ? 0.5 * (1 - smooth(0, 1, edge / BLEND)) : 0; // part de la voisine (0..0,5)
    const motion = Math.min(1, this.speed * 1.5);
    const blur = s * 2.4 * motion; // flou de vitesse, maximal à la frontière (identique pour les deux vues)
    // La vue « en avant » dans le sens de rotation passe au-dessus : l'ordre ne s'inverse jamais à la frontière.
    const ahead = d >= 0;
    for (let i = 0; i < this.layers.length; i++) {
      const el = this.layers[i];
      if (i === k) {
        this.apply(el, 1, d, blur, ahead ? "1" : "2");
      } else if (i === next && s > 0.001) {
        this.apply(el, smooth(0, 0.5, s), ahead ? d - 1 : d + 1, blur, ahead ? "2" : "1");
      } else if (el.style.opacity !== "0") {
        el.style.opacity = "0";
        el.style.filter = "";
      }
    }
  }

  /** Fondu final (hors rotation) d'une vraie vue vers la vue de repos. */
  private renderDissolve(from: number, t: number) {
    const a = Math.round(from) % this.n;
    for (let i = 0; i < this.layers.length; i++) {
      const el = this.layers[i];
      if (i === 0) this.apply(el, smooth(0, 0.6, t), 0, 0, "2");
      else if (i === a) this.apply(el, 1 - smooth(0.4, 1, t), 0, 0, "1");
      else el.style.opacity = "0";
    }
  }
}
