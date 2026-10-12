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

/**
 * Position du soleil (approximation NOAA, précision ~0,5°) : élévation et azimut en degrés
 * (azimut depuis le nord, sens horaire). Suffisant pour une lumière continue et crédible.
 */
export function sunPosition(date: Date, lat: number, lon: number): { elevation: number; azimuth: number } {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst * 15 + lon) * rad;
  const ha = lst - ra;
  const phi = lat * rad;
  const el = Math.asin(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(decl) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
  return { elevation: el / rad, azimuth: ((az / rad) % 360 + 360) % 360 };
}

export type Solar = {
  /** 0 au lever, 1 au coucher (continu ; < 0 avant l'aube, > 1 après le crépuscule). */
  progress: number;
  elevation: number;
  azimuth: number;
  /** 0 (nuit) → 1 (plein soleil). */
  intensity: number;
  /** 0 (lumière neutre de midi) → 1 (lumière rasante très chaude). */
  warmth: number;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function solarState(now: number, lat: number, lon: number, sunrise: number, sunset: number): Solar {
  const { elevation, azimuth } = sunPosition(new Date(now), lat, lon);
  const progress = (now - sunrise) / Math.max(1, sunset - sunrise);
  const intensity = Math.pow(smooth(-7, 28, elevation), 0.85);
  const warmth = elevation < -4 ? smooth(-12, -4, elevation) * 0.6 : 1 - smooth(2, 32, elevation);
  return { progress, elevation, azimuth, intensity, warmth };
}
