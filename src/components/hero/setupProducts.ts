/**
 * Les trois objets du setup FPV.
 *
 * Toute la composition raisonne sur la SILHOUETTE réelle (boîte alpha mesurée sur
 * chaque PNG), jamais sur la toile transparente : chaque produit est posé dans une
 * boîte qui épouse sa silhouette, et le PNG complet déborde librement autour
 * (aucun overflow ne le coupe).
 *
 * Présence visuelle (√ surface alpha affichée), Avata = 1 :
 *   Goggles ≈ 0,70 · Remote Controller ≈ 0,60
 * → largeur de silhouette relative à celle de l'Avata (`rel`) :
 *   rel = presence · √(alphaAvata / alphaProduit) · (largeur bbox produit / largeur bbox Avata)
 */

export type ProductId = "goggles" | "avata" | "controller";

export type Product = {
  id: ProductId;
  index: string;
  kind: string;
  name: string;
  text: string;
  src: string;
  /** Toile du PNG (px). */
  canvas: { w: number; h: number };
  /** Silhouette dans la toile (alpha > 50 %, px). */
  bbox: { left: number; top: number; right: number; bottom: number };
  /** Largeur de silhouette relative à l'Avata. */
  rel: number;
};

export const PRODUCTS: readonly Product[] = [
  {
    id: "goggles",
    index: "02",
    kind: "Lunettes FPV",
    name: "DJI Goggles 3",
    text: "Le cockpit du vol en immersion : deux écrans micro-OLED 1080p, liaison vidéo DJI O4 et Real View PiP, qui affiche l’environnement réel sans retirer les lunettes.",
    src: "/assets/goggles3/goggles3-hero-3q.png",
    canvas: { w: 1448, h: 1086 },
    bbox: { left: 49, top: 131, right: 1432, bottom: 1017 },
    rel: 0.612,
  },
  {
    id: "avata",
    index: "01",
    kind: "Drone FPV",
    name: "DJI Avata 2",
    text: "Drone FPV compact à hélices carénées. Capteur 1/1,3 pouce, champ de vision de 155° et vidéo jusqu’en 4K à 60 i/s, pour voler au plus près du sujet.",
    src: "/assets/avata2/avata2-clean-3q-front.png",
    canvas: { w: 1254, h: 1254 },
    bbox: { left: 21, top: 321, right: 1241, bottom: 966 },
    rel: 1,
  },
  {
    id: "controller",
    index: "03",
    kind: "Radiocommande",
    name: "DJI FPV Remote Controller 3",
    text: "La radiocommande du pilotage manuel : deux sticks, sélecteur de modes Normal / Sport / Manuel et commandes de prise de vue à portée de doigts.",
    src: "/assets/fpv-remote-controller-3/fpv-remote-controller-3-hero-3q.png",
    canvas: { w: 1448, h: 1086 },
    bbox: { left: 20, top: 217, right: 1432, bottom: 986 },
    rel: 0.58,
  },
] as const;

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<ProductId, Product>;

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

/** Géométrie CSS d'un produit : boîte = silhouette, toile positionnée autour. */
export function productGeometry(p: Product) {
  const bw = p.bbox.right - p.bbox.left;
  const bh = p.bbox.bottom - p.bbox.top;
  return {
    aspect: `${bw} / ${bh}`,
    canvas: {
      left: pct(-p.bbox.left / bw),
      top: pct(-p.bbox.top / bh),
      width: pct(p.canvas.w / bw),
      height: pct(p.canvas.h / bh),
    },
  };
}
