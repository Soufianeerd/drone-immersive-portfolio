import { gsap } from "gsap";

/**
 * PRODUCT TURNTABLE — l'objet tourne lentement sur lui-même à partir de ses VRAIES photos.
 *
 * - Uniquement des vues réellement photographiées (public/assets/gear → détourées, recadrées
 *   sur la silhouette). Aucun angle inventé, aucun morphing génératif : ce n'est pas un scan 360°.
 * - Chaque vue partage le référentiel de la vue de repos du hero : posée sur la même ligne de sol,
 *   centroïde alpha aligné, même masse visuelle (`w` = largeur en % de la silhouette de repos,
 *   `x` = décalage horizontal en %). Seule retouche : un gamma global pour rejoindre la lumière de la vue de repos.
 * - Le passage d'une vue réelle à la suivante est masqué dans un mouvement continu (dérive latérale,
 *   légère compression, relais d'opacité sans double exposition), piloté par gsap.ticker.
 * - Couverture incomplète → orbite partielle (aller-retour) plutôt qu'un faux arrière.
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
    mode: "orbit",
    cycle: 6.5,
    frames: [
      { src: "/assets/turntable/real/goggles-3q-droit.webp", angle: 120, w: 107.69, x: -5.37 },
      { src: "/assets/turntable/real/goggles-arriere-dessus.webp", angle: 180, w: 94.8, x: -1.48 },
    ],
  },
  // Trois orientations réelles (IMG_3290-3292) : gauche (repos) ↔ dessus ↔ droite. Aucun dos inventé.
  controller: {
    mode: "orbit",
    cycle: 6.5,
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

/** Rotation apparente de part et d'autre d'une vraie vue (°) et dérive latérale associée (%). */
const YAW = 30;
const DRIFT = 2.4;

/**
 * Pilote un turntable : `layers[0]` = vue de repos, `layers[i]` = frames[i - 1].
 * Chaque calque doit être positionné en absolu dans la même boîte.
 */
export class ProductTurntable {
  private path: number[];
  private seg: number;
  private pos = 0;
  private speed = 0;
  private target = 0; // vitesse visée (0 ou 1)
  private settle: gsap.core.Tween | null = null;
  private running = false;

  constructor(
    private layers: HTMLElement[],
    private cfg: TurnConfig,
  ) {
    const n = cfg.frames.length;
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    this.path = cfg.mode === "loop" ? [0, ...ids, 0] : [0, ...ids, ...ids.slice(0, -1).reverse(), 0];
    this.seg = cfg.cycle / (this.path.length - 1);
  }

  /** Le survol commence : accélération douce jusqu'à la vitesse de croisière. */
  play() {
    this.settle?.kill();
    this.settle = null;
    this.target = 1;
    if (!this.running) {
      this.running = true;
      gsap.ticker.add(this.tick);
    }
  }

  /** Le survol s'arrête : décélération, arrêt sur une vraie vue, retour à la vue de repos. */
  stop(instant = false) {
    this.target = 0;
    if (instant) {
      this.kill();
      this.pos = 0;
      this.render(0, 0, 0, 1);
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
    if (this.settle) return;
    // Accélère en ~0,8 s, décélère en ~0,95 s (jamais d'arrêt net).
    const ramp = this.target > this.speed ? dt / 0.8 : -dt / 0.95;
    this.speed = Math.min(1, Math.max(0, this.speed + ramp));
    const segs = this.path.length - 1;
    this.pos = (this.pos + (this.speed * dt) / this.seg) % segs;
    this.draw();
    if (this.target === 0 && this.speed === 0) this.finish();
  };

  /** Termine proprement sur une vraie vue, puis rejoint la vue de repos. */
  private finish() {
    const segs = this.path.length - 1;
    const k = Math.floor(this.pos);
    const f = this.pos - k;
    const end = f < 0.2 ? k : k + 1; // jamais d'arrêt entre deux vues
    const st = { p: this.pos };
    this.settle = gsap.to(st, {
      p: end,
      duration: 0.25 + Math.abs(end - this.pos) * 0.5,
      ease: "sine.out",
      onUpdate: () => {
        this.pos = st.p;
        this.draw();
      },
      onComplete: () => {
        const e = end % segs;
        if (this.path[e] === 0) return this.done();
        // Vue réelle atteinte ; retour à la vue de repos EN REPASSANT par les vraies vues,
        // par le chemin le plus court (jamais de saut d'angle direct).
        const forward = segs - e;
        const target = forward < e ? segs : 0;
        const dist = Math.abs(target - e);
        const back = { p: e };
        this.settle = gsap.to(back, {
          p: target,
          duration: Math.min(2.6, Math.max(1, dist * this.seg * 0.6)),
          delay: 0.12,
          ease: "sine.inOut",
          onUpdate: () => {
            this.pos = back.p;
            this.draw();
          },
          onComplete: () => this.done(),
        });
      },
    });
  }

  private done() {
    this.pos = 0;
    this.render(0, 0, 0, 1);
    this.kill();
  }

  private draw() {
    const segs = this.path.length - 1;
    const k = Math.floor(this.pos) % segs;
    const f = this.pos - Math.floor(this.pos);
    const a = this.path[k];
    const b = this.path[k + 1];
    // Sens du mouvement : en orbite, le retour inverse la dérive.
    const dir = this.cfg.mode === "orbit" && k >= segs / 2 ? -1 : 1;
    this.render(a, b, f, dir);
  }

  /**
   * Relais a → b à l'avancement f (0..1).
   * L'objet tourne en continu (rotateY en perspective, vitesse constante) : chaque vraie vue couvre
   * son secteur de −YAW à +YAW, et le passage à la vue suivante se fait au milieu du mouvement,
   * sur une fenêtre courte, quand les deux vues sont au même angle apparent.
   */
  private render(a: number, b: number, f: number, dir: number) {
    // Relais court, au moment où les deux vues sont au même angle apparent (milieu du secteur).
    const s = smooth(0.43, 0.57, f);
    for (let i = 0; i < this.layers.length; i++) {
      const el = this.layers[i];
      if (i !== a && i !== b) {
        if (el.style.opacity !== "0") el.style.opacity = "0";
        continue;
      }
      const incoming = i === b && a !== b;
      // Sortante opaque tant que l'entrante n'est pas à moitié installée : pas de double exposition.
      const o = incoming ? s : a === b ? 1 : Math.min(1, 2 * (1 - s));
      const u = a === b ? 0 : incoming ? f - 1 : f; // position dans le secteur (−1..1)
      const yaw = dir * u * YAW;
      const x = dir * u * DRIFT;
      el.style.opacity = o.toFixed(3);
      el.style.zIndex = incoming ? "2" : "1";
      el.style.transformOrigin = "50% 100%";
      el.style.transform = u === 0 ? "" : `perspective(1600px) translate3d(${x.toFixed(3)}%, 0, 0) rotateY(${yaw.toFixed(3)}deg)`;
    }
  }
}
