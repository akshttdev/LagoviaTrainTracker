/**
 * The iRail boundary. This is the ONLY file that talks to iRail and the ONLY
 * place that converts the raw (all-strings) upstream shape into our clean types.
 */
import { BASE_URL, STATION_CACHE_TTL_MS, USER_AGENT } from "@/lib/config";
import type {
  Departure,
  IRailDeparture,
  IRailLiveboardResponse,
  IRailStation,
  IRailStationsResponse,
} from "@/lib/types";

/** One place to add the User-Agent, force JSON, and turn non-2xx into errors. */
async function fetchIRail(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store", // live data — bypass Next's fetch cache; we cache stations ourselves
  });
  if (!res.ok) {
    throw new Error(`iRail ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json();
}

// ── Stations (cached: ~600 entries that rarely change) ───────────────────────

let stationsCache: { data: IRailStation[]; at: number } | null = null;

export async function getStations(): Promise<IRailStation[]> {
  if (stationsCache && Date.now() - stationsCache.at < STATION_CACHE_TTL_MS) {
    return stationsCache.data;
  }
  const json = (await fetchIRail("/stations/?format=json&lang=en")) as IRailStationsResponse;
  stationsCache = { data: json.station, at: Date.now() };
  return json.station;
}

// ── Liveboard for one station → clean departures ─────────────────────────────

/** Raw iRail departure → our clean Departure. The string→number conversion. */
function toDeparture(raw: IRailDeparture): Departure {
  return {
    trainNumber: raw.vehicleinfo.shortname,
    destination: raw.station, // iRail's "station" on a departure is the DESTINATION
    scheduledTime: Number(raw.time), // epoch seconds (string → number)
    delayMinutes: Math.floor(Number(raw.delay) / 60), // seconds → whole minutes
    canceled: raw.canceled === "1",
  };
}

/** Departures leaving a station, by station id. Unfiltered by time — caller windows it. */
export async function getLiveboard(stationId: string): Promise<Departure[]> {
  const json = (await fetchIRail(
    `/liveboard/?id=${encodeURIComponent(stationId)}&format=json&arrdep=departure`,
  )) as IRailLiveboardResponse;

  // `departures` / `departure` are absent when a station has nothing scheduled.
  const raw = json.departures?.departure ?? [];
  return raw.map(toDeparture);
}
