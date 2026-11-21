import { db, today, type WeatherRecord } from "./db";

const API_BASE = "https://api.open-meteo.com/v1/forecast";

export interface WeatherResult {
  updated: number;
  error?: string;
}

async function fetchForecast(latitude: number, longitude: number): Promise<Response> {
  const url =
    `${API_BASE}?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&past_days=7&forecast_days=7&timezone=auto`;
  return fetch(url);
}

export async function refreshWeather(): Promise<WeatherResult> {
  const gardens = await db.gardens.toArray();
  const garden = gardens.find((g) => g.latitude !== undefined && g.longitude !== undefined);
  if (!garden) {
    return {
      updated: 0,
      error: "Renseignez d'abord la latitude et la longitude de votre jardin (ex. 43,60 et 1,44 pour Toulouse).",
    };
  }

  let response: Response;
  try {
    response = await fetchForecast(garden.latitude!, garden.longitude!);
  } catch {
    return { updated: 0, error: "Connexion impossible. Vérifiez votre connexion internet (la météo a besoin d'un accès réseau)." };
  }
  if (!response.ok) {
    return { updated: 0, error: `Le service météo a répondu une erreur (${response.status}). Réessayez plus tard.` };
  }

  const data = (await response.json()) as {
    daily?: {
      time: string[];
      temperature_2m_max?: (number | null)[];
      temperature_2m_min?: (number | null)[];
      precipitation_sum?: (number | null)[];
    };
  };
  const daily = data.daily;
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    return { updated: 0, error: "Le service météo n'a renvoyé aucune donnée." };
  }

  const records: WeatherRecord[] = daily.time.map((date, i) => ({
    date,
    tempMaxC: daily.temperature_2m_max?.[i] ?? undefined,
    tempMinC: daily.temperature_2m_min?.[i] ?? undefined,
    rainMm: daily.precipitation_sum?.[i] ?? 0,
    frost: (daily.temperature_2m_min?.[i] ?? 10) <= 0,
    source: "Open-Meteo",
  }));

  await db.transaction("rw", db.weather_records, async () => {
    for (const record of records) {
      await db.weather_records.put(record);
    }
  });
  return { updated: records.length };
}

export function rainLastDays(records: WeatherRecord[], days: number): number {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startIso = start.toISOString().slice(0, 10);
  return records
    .filter((r) => r.date >= startIso && r.date <= today())
    .reduce((acc, r) => acc + (r.rainMm ?? 0), 0);
}

export function rainForecastDays(records: WeatherRecord[], days: number): number {
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endIso = end.toISOString().slice(0, 10);
  return records
    .filter((r) => r.date >= today() && r.date <= endIso)
    .reduce((acc, r) => acc + (r.rainMm ?? 0), 0);
}
