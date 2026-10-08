import type { DayPhase, Season, Weather } from "./types";

const MIN = 60_000;

/** Phase du jour à partir du lever / coucher réels (pas d'une heure fixe). */
export function dayPhaseFor(now: number, sunrise: number, sunset: number): DayPhase {
  if (now >= sunrise - 45 * MIN && now < sunrise + 50 * MIN) return "dawn";
  if (now >= sunrise + 50 * MIN && now < sunset - 80 * MIN) return "day";
  if (now >= sunset - 80 * MIN && now < sunset - 5 * MIN) return "golden";
  if (now >= sunset - 5 * MIN && now < sunset + 50 * MIN) return "dusk";
  return "night";
}

/** Saison météorologique, inversée dans l'hémisphère sud. */
export function seasonFor(date: Date, lat: number | null): Season {
  const m = date.getMonth();
  const north: Season[] = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  const s = north[m];
  if (lat !== null && lat < 0) {
    return ({ winter: "summer", summer: "winter", spring: "autumn", autumn: "spring" } as const)[s];
  }
  return s;
}

/** Codes WMO → état météo du site. */
export function weatherFromWmo(code: number | null | undefined, cloudCover?: number | null): Weather {
  if (code === null || code === undefined) return "clear";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (code === 3 || (code === 2 && (cloudCover ?? 0) > 60)) return "cloudy";
  return "clear";
}

/** Fuseau → coordonnées approximatives (repli sans géolocalisation). */
export const TIMEZONE_COORDS: Record<string, { lat: number; lon: number }> = {
  "Europe/Paris": { lat: 48.86, lon: 2.35 },
  "Europe/Luxembourg": { lat: 49.61, lon: 6.13 },
  "Europe/Brussels": { lat: 50.85, lon: 4.35 },
  "Europe/Zurich": { lat: 47.37, lon: 8.54 },
  "Europe/London": { lat: 51.51, lon: -0.13 },
  "Europe/Madrid": { lat: 40.42, lon: -3.7 },
  "Europe/Berlin": { lat: 52.52, lon: 13.4 },
  "Europe/Rome": { lat: 41.9, lon: 12.5 },
  "Africa/Casablanca": { lat: 33.57, lon: -7.59 },
  "America/New_York": { lat: 40.71, lon: -74.0 },
  "America/Montreal": { lat: 45.5, lon: -73.57 },
  "America/Toronto": { lat: 43.65, lon: -79.38 },
  "America/Los_Angeles": { lat: 34.05, lon: -118.24 },
  "Asia/Dubai": { lat: 25.2, lon: 55.27 },
  "Asia/Tokyo": { lat: 35.68, lon: 139.69 },
  "Australia/Sydney": { lat: -33.87, lon: 151.21 },
};
