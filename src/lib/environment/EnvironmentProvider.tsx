"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SITE } from "@/config/site";
import { dayPhaseFor, seasonFor, TIMEZONE_COORDS } from "./resolve";
import { solarState, sunTimes } from "./solar";
import { themeFor } from "./theme";
import type { DayPhase, EnvironmentApiResponse, EnvironmentState, Season, Weather } from "./types";

/**
 * ENVIRONMENT ENGINE
 * heure locale + lever/coucher réels + météo + saison → variables CSS globales.
 *
 * 1. État immédiat (fuseau → coordonnées approchées → soleil calculé localement).
 * 2. Météo serveur (/api/environment), mise en cache 15 min (sessionStorage).
 * 3. Géolocalisation : utilisée si déjà autorisée ; sinon demandée une fois, discrètement,
 *    après l'apparition du site. Refus → repli, jamais bloquant. Rien n'est stocké hors session.
 * 4. Réévaluation de la phase chaque minute, de la météo toutes les 15 min.
 *
 * Tests : ?phase=night&weather=rain&season=winter
 */

const PHASES: DayPhase[] = ["dawn", "day", "golden", "dusk", "night"];
const WEATHERS: Weather[] = ["clear", "cloudy", "rain", "fog", "snow"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
const CACHE_KEY = "env:v1";
const CACHE_MS = 15 * 60_000;

const EnvironmentContext = createContext<EnvironmentState | null>(null);

export function useEnvironment() {
  return useContext(EnvironmentContext);
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Coords = { lat: number; lon: number; source: EnvironmentState["source"] };

function readOverrides() {
  const q = new URLSearchParams(window.location.search);
  const pick = <T extends string>(k: string, list: T[]) => {
    const v = q.get(k) as T | null;
    return v && list.includes(v) ? v : null;
  };
  // Heure de test (développement uniquement) : ?hour=17.5 → 17 h 30 aujourd'hui, heure locale.
  const h = process.env.NODE_ENV !== "production" ? Number.parseFloat(q.get("hour") ?? "") : Number.NaN;
  return { phase: pick("phase", PHASES), weather: pick("weather", WEATHERS), season: pick("season", SEASONS), hour: Number.isFinite(h) ? h : null };
}

function fallbackCoords(): Coords {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const c = TIMEZONE_COORDS[tz];
  if (c) return { ...c, source: "timezone" };
  return { lat: SITE.defaultLocation.lat, lon: SITE.defaultLocation.lon, source: "default" };
}

function computeState(coords: Coords, api: EnvironmentApiResponse | null): EnvironmentState {
  const o = readOverrides();
  let now = Date.now();
  if (o.hour !== null) {
    const d = new Date();
    d.setHours(Math.floor(o.hour), Math.round((o.hour % 1) * 60), 0, 0);
    now = d.getTime();
  }
  const local = sunTimes(new Date(now), coords.lat, coords.lon);
  const sunrise = o.hour === null ? (api?.sunrise ?? local.sunrise) : local.sunrise;
  const sunset = o.hour === null ? (api?.sunset ?? local.sunset) : local.sunset;
  return {
    season: o.season ?? seasonFor(new Date(), coords.lat),
    dayPhase: o.phase ?? dayPhaseFor(now, sunrise, sunset),
    weather: o.weather ?? api?.weather ?? "clear",
    temperature: api?.temperature ?? null,
    cloudCover: api?.cloudCover ?? null,
    sunrise,
    sunset,
    solar: solarState(now, coords.lat, coords.lon, sunrise, sunset),
    source: o.phase || o.weather || o.season || o.hour !== null ? "override" : coords.source,
  };
}

async function fetchEnvironment(c: Coords): Promise<EnvironmentApiResponse | null> {
  const key = `${CACHE_KEY}:${c.lat.toFixed(2)},${c.lon.toFixed(2)}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  } catch {
    /* stockage indisponible : on continue */
  }
  try {
    const res = await fetch(`/api/environment?lat=${c.lat.toFixed(2)}&lon=${c.lon.toFixed(2)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as EnvironmentApiResponse;
    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
    } catch {
      /* rien */
    }
    return data;
  } catch {
    return null;
  }
}

export default function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EnvironmentState | null>(null);
  const coords = useRef<Coords | null>(null);
  const api = useRef<EnvironmentApiResponse | null>(null);

  // 1. État immédiat avant la première peinture du hero.
  useIsoLayoutEffect(() => {
    coords.current = fallbackCoords();
    setState(computeState(coords.current, null));
  }, []);

  // 2-4. Météo, géolocalisation, réévaluations.
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      if (!coords.current) return;
      const data = await fetchEnvironment(coords.current);
      if (!alive) return;
      if (data) api.current = data;
      setState(computeState(coords.current, api.current));
    };
    void refresh();

    const requestGeo = () =>
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coords.current = { lat: pos.coords.latitude, lon: pos.coords.longitude, source: "geolocation" };
          void refresh();
        },
        () => {
          try {
            sessionStorage.setItem("env:geo-denied", "1");
          } catch {
            /* rien */
          }
        },
        { enableHighAccuracy: false, maximumAge: 30 * 60_000, timeout: 8000 },
      );

    let geoTimer = 0;
    if ("geolocation" in navigator) {
      const denied = (() => {
        try {
          return sessionStorage.getItem("env:geo-denied") === "1";
        } catch {
          return false;
        }
      })();
      navigator.permissions
        ?.query({ name: "geolocation" as PermissionName })
        .then((p) => {
          if (p.state === "granted") requestGeo();
          else if (p.state === "prompt" && !denied) geoTimer = window.setTimeout(requestGeo, 6000);
        })
        .catch(() => undefined);
    }

    const tick = window.setInterval(() => {
      if (coords.current) setState(computeState(coords.current, api.current));
    }, 60_000);
    const weatherTick = window.setInterval(refresh, CACHE_MS);
    return () => {
      alive = false;
      window.clearTimeout(geoTimer);
      window.clearInterval(tick);
      window.clearInterval(weatherTick);
    };
  }, []);

  // Application : attributs + variables CSS (les transitions CSS font les fondus).
  useIsoLayoutEffect(() => {
    if (!state) return;
    const root = document.documentElement;
    root.dataset.phase = state.dayPhase;
    root.dataset.weather = state.weather;
    root.dataset.season = state.season;
    const { vars } = themeFor(state.dayPhase, state.weather, state.season, state.solar);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    // Transitions lentes seulement après la première application (pas de fondu au chargement).
    if (!root.classList.contains("env-ready")) {
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("env-ready")));
    }
  }, [state]);

  const value = useMemo(() => state, [state]);
  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}
