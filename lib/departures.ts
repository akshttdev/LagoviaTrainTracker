/**
 * Core business logic: substring station search → per-station fan-out →
 * 15-minute window filter → grouped response. Framework-agnostic (no Next here),
 * so it could sit behind Express unchanged.
 */
import { pooledMap } from "@/lib/concurrency";
import {
  MAX_CONCURRENCY,
  MAX_STATIONS,
  WINDOW_MINUTES,
} from "@/lib/config";
import { getLiveboard, getStations } from "@/lib/irail";
import { matchStations } from "@/lib/match";
import type {
  DeparturesResponse,
  StationDepartures,
  Warning,
} from "@/lib/types";

export async function searchDepartures(q: string): Promise<DeparturesResponse> {
  // May throw if the station list itself is unreachable — the route maps that to 502.
  const stations = await getStations();

  // Diacritic-insensitive, relevance-ranked match. Ranking happens before the
  // cap so the strongest matches survive a broad query, not whichever 50 came first.
  const matched = matchStations(q, stations).slice(0, MAX_STATIONS);

  const now = Math.floor(Date.now() / 1000);
  const windowEnd = now + WINDOW_MINUTES * 60;
  const warnings: Warning[] = [];

  // Fan out, but never more than MAX_CONCURRENCY liveboards at once (rate limit).
  const perStation = await pooledMap(matched, MAX_CONCURRENCY, async (s) => {
    try {
      const departures = await getLiveboard(s.id);
      const inWindow = departures
        .filter((d) => d.scheduledTime >= now && d.scheduledTime <= windowEnd)
        .sort((a, b) => a.scheduledTime - b.scheduledTime);
      const group: StationDepartures = {
        station: s.standardname,
        stationId: s.id,
        departures: inWindow,
      };
      return group;
    } catch {
      // One flaky station shouldn't fail the whole request — record and move on.
      warnings.push({ station: s.standardname, reason: "upstream_error" });
      return null;
    }
  });

  // Drop stations that succeeded but have nothing in the next 15 min.
  const stationsOut = perStation.filter(
    (g): g is StationDepartures => g !== null && g.departures.length > 0,
  );

  return {
    query: q,
    generatedAt: now,
    windowMinutes: WINDOW_MINUTES,
    stationsMatched: matched.length,
    stations: stationsOut,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
