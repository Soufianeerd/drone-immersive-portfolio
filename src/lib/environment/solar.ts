/**
 * Lever / coucher du soleil calculés localement (algorithme NOAA simplifié).
 * Sert de repli quand l'API météo ne répond pas : la phase du jour reste juste.
 */
const rad = Math.PI / 180;

export function sunTimes(date: Date, lat: number, lon: number): { sunrise: number; sunset: number } {
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const n = day - 10957.5 + 0.0008; // jours depuis J2000
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = jStar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.44 * rad));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
  const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
  const toMs = (j: number) => (j + 10957.5) * 86400000;
  return { sunrise: toMs(jTransit - w / 360), sunset: toMs(jTransit + w / 360) };
}
