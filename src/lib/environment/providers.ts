import { weatherFromWmo } from "./resolve";
import type { EnvironmentApiResponse } from "./types";

/**
 * Fournisseur météo. Open-Meteo par défaut (sans clé). Pour un fournisseur à clé,
 * implémenter WeatherProvider et lire la clé côté serveur (process.env) uniquement.
 */
export type WeatherProvider = (lat: number, lon: number) => Promise<EnvironmentApiResponse>;

export const openMeteo: WeatherProvider = async (lat, lon) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(2));
  url.searchParams.set("longitude", lon.toFixed(2));
  url.searchParams.set("current", "temperature_2m,weather_code,cloud_cover,precipitation");
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");
  const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const d = await res.json();
  const offset = Number(d.utc_offset_seconds ?? 0) * 1000;
  // Open-Meteo renvoie l'heure locale sans décalage : conversion explicite en epoch.
  const local = (s?: string) => (s ? Date.parse(`${s}:00Z`) - offset : null);
  return {
    temperature: d.current?.temperature_2m ?? null,
    weather: weatherFromWmo(d.current?.weather_code, d.current?.cloud_cover),
    cloudCover: d.current?.cloud_cover ?? null,
    precipitation: d.current?.precipitation ?? null,
    sunrise: local(d.daily?.sunrise?.[0]),
    sunset: local(d.daily?.sunset?.[0]),
    timezone: d.timezone ?? null,
  };
};
