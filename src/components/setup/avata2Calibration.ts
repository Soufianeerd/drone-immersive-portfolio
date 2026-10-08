/**
 * Calibration des deux rendus DJI Avata 2 utilisés par le hero.
 *
 * Les PNG "idle" (1254×1254) et "hélices en mouvement" (1448×1086) n'ont ni le
 * même cadrage ni la même échelle. La transformation ci-dessous a été mesurée
 * hors-ligne (OpenCV, findTransformECC en mode affine, pyramide 1/4 → 1/2 → 1)
 * sur les deux images composées sur fond neutre : elle projette chaque pixel de
 * l'image "hélices" dans l'espace pixel de l'image "idle" (IoU silhouettes 0,87,
 * coïncidence caméra / capot / protections orange au pixel près).
 *
 *   x_idle = a·x + c·y + e
 *   y_idle = b·x + d·y + f
 *
 * Ne pas modifier sans refaire la mesure : un écart de 1 % produit un saut visible.
 */

export const IDLE_SRC = "/assets/avata2/avata2-clean-3q-front.png";
export const ACTIVE_SRC = "/assets/avata2/avata2-propellers-motion-transparent.png";

export const IDLE_SIZE = 1254; // carré
export const ACTIVE_WIDTH = 1448;
export const ACTIVE_HEIGHT = 1086;

export const ACTIVE_TO_IDLE = {
  a: 0.860178,
  b: -0.112195,
  c: -0.036026,
  d: 0.812036,
  e: 21.837784,
  f: 309.604218,
} as const;

/** Boîte englobante de la silhouette dans l'image idle (px). */
export const DRONE_BOUNDS = { left: 14, top: 321, right: 1253, bottom: 965 } as const;

/**
 * Silhouette pleine (union idle + hélices recalées, fermeture morphologique,
 * trous comblés) échantillonnée en grille 64×64, 1 bit par cellule, en hexadécimal.
 * Sert au hit-test : le hover ne démarre que lorsque le curseur est réellement
 * sur le drone, pas sur les zones transparentes du PNG.
 */
const MASK_SIZE = 64;
const MASK_HEX =
  "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000003fe0000000000000fff000000000fff3fff000000007fffffff00000001ffffffff00000003ffffffff00000007ffffffffbf000007fffffffffff00003fffffffffff8000ffffffffffffc00fffffffffffffe07ffffffffffffff0fffffffffffffff3ffffffffffffffe7ffffffffffffffe7ffffffffffffffe7ffffffffffffffc7ffffffffffffff07fffffffffffffc07fffffffffffff803fffffffffffff801fffffffffffffc00bffffffffffffc0001fffffffffffc00003ffffffffffc00000ffffffffff8000003fffffffff8000000f7fffffff000000000ffffffe000000000ffffffc000000000107fff00000000000003fc000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const MASK_BITS: Uint8Array = (() => {
  const bits = new Uint8Array(MASK_SIZE * MASK_SIZE);
  for (let i = 0; i < MASK_HEX.length; i++) {
    const nibble = parseInt(MASK_HEX[i], 16);
    for (let j = 0; j < 4; j++) bits[i * 4 + j] = (nibble >> (3 - j)) & 1;
  }
  return bits;
})();

/** u, v ∈ [0,1] dans le repère de l'image idle. */
export function isOnDrone(u: number, v: number): boolean {
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
  const x = Math.floor(u * MASK_SIZE);
  const y = Math.floor(v * MASK_SIZE);
  return MASK_BITS[y * MASK_SIZE + x] === 1;
}
