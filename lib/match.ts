/**
 * Station name matching: diacritic-insensitive substring search with relevance
 * ranking. Pure and framework-agnostic so it's trivial to reason about and test
 * in isolation. This is the ONLY place that decides "does this query hit this
 * station, and how well?".
 */
import type { IRailStation } from "@/lib/types";

/** Fold a station name or query to a canonical form for comparison:
 *  - strip accents      → "Brügge"        == "brugge"
 *  - unify separators    → "Gent-Sint-..." == "gent sint ..."  (so a typed space
 *    matches a hyphenated name, and vice-versa)
 *  NFD splits a letter into base + combining mark; we then drop the marks. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // strip combining marks
    .toLowerCase()
    .replace(/[\s\-/.'’]+/g, " ") // collapse hyphens, dots, apostrophes, spaces → one space
    .trim();
}

/** Match tiers, best first. Lower number = better match. */
const EXACT = 0;
const PREFIX = 1;
const SUBSTRING = 2;

/** Score one field against an already-normalized needle, or null if no hit. */
function scoreField(needle: string, field: string): number | null {
  const hay = normalize(field);
  if (hay === needle) return EXACT;
  if (hay.startsWith(needle)) return PREFIX;
  if (hay.includes(needle)) return SUBSTRING;
  return null;
}

/**
 * Rank a station against a query. Considers both the canonical and localized
 * names and keeps the better tier. Returns null when neither field matches.
 */
export function rankStation(needle: string, station: IRailStation): number | null {
  const n = normalize(needle);
  const a = scoreField(n, station.standardname);
  const b = scoreField(n, station.name);
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

// ── Typo tolerance (fuzzy fallback) ──────────────────────────────────────────

/** Levenshtein edit distance (insert/delete/substitute), classic two-row DP.
 *  Inputs are single tokens, so this stays cheap. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Allowed typos scale with query length: 1 for short queries, 2 once long
 *  enough that a single slip is too strict (e.g. "antverpen" → "antwerpen"). */
function maxTypos(len: number): number {
  return len <= 8 ? 1 : 2;
}

/**
 * Smallest edit distance between the (normalized) needle and any whole word in
 * the station's names. Matching per-word (not against the full name) is what
 * lets "antverpen" reach the "antwerpen" in "Antwerpen-Centraal". Returns null
 * when even the closest word is beyond the typo budget.
 */
function fuzzyDistance(needle: string, station: IRailStation): number | null {
  const budget = maxTypos(needle.length);
  let best = Infinity;
  for (const field of [station.standardname, station.name]) {
    for (const token of normalize(field).split(" ")) {
      if (!token) continue;
      const d = editDistance(needle, token);
      if (d < best) best = d;
    }
  }
  return best <= budget ? best : null;
}

/**
 * Filter a station list to those matching `query`, sorted by relevance
 * (best tier first, then alphabetically for a stable, predictable order).
 * Ranking happens BEFORE any downstream cap, so the strongest matches survive.
 *
 * Two tiers: exact/prefix/substring first; if (and only if) that finds nothing,
 * fall back to typo-tolerant matching so "Antverpen" still reaches "Antwerpen-
 * Centraal". The fallback never dilutes a clean substring result.
 */
export function matchStations(
  query: string,
  stations: IRailStation[],
): IRailStation[] {
  const needle = normalize(query);
  if (!needle) return [];

  const ranked: { station: IRailStation; key: number }[] = [];
  for (const station of stations) {
    const rank = rankStation(query, station);
    if (rank !== null) ranked.push({ station, key: rank });
  }

  // Tier 2 only when the substring pass came up empty — typo rescue, not noise.
  if (ranked.length === 0) {
    for (const station of stations) {
      const dist = fuzzyDistance(needle, station);
      if (dist !== null) ranked.push({ station, key: dist });
    }
  }

  ranked.sort(
    (x, y) =>
      x.key - y.key ||
      x.station.standardname.localeCompare(y.station.standardname),
  );
  return ranked.map((r) => r.station);
}
