export type Season = "spring" | "summer" | "autumn" | "winter";
export type DayPhase = "dawn" | "day" | "golden" | "dusk" | "night";
export type Weather = "clear" | "cloudy" | "rain" | "fog" | "snow";

export type EnvironmentState = {
  season: Season;
  dayPhase: DayPhase;
  weather: Weather;
  /** Données brutes utiles à l'interface (jamais affichées comme une appli météo). */
  temperature: number | null;
  cloudCover: number | null;
  sunrise: number;
  sunset: number;
  source: "geolocation" | "timezone" | "default" | "override";
};

/** Réponse normalisée de /api/environment. */
export type EnvironmentApiResponse = {
  temperature: number | null;
  weather: Weather;
  cloudCover: number | null;
  precipitation: number | null;
  sunrise: number | null;
  sunset: number | null;
  timezone: string | null;
};
