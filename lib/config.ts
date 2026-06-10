/**
 * Central constants. Kept in one place so behavior is tunable without hunting
 * through logic — and so the walkthrough has a single "where are the knobs" answer.
 */

/** iRail v1 base. We hit /v1/ directly to avoid the legacy 303 redirect. */
export const BASE_URL = "https://api.irail.be/v1";

/** iRail asks for an identifying User-Agent (app/version (site; email)). */
export const USER_AGENT =
  "lagovia-train-tracker/1.0 (github.com/akshat; akshttt.dev@gmail.com)";

/** Input contract: queries shorter than this are rejected with 400. */
export const MIN_QUERY_LENGTH = 3;

/** Only return departures scheduled within this many minutes from "now". */
export const WINDOW_MINUTES = 15;

/** Max liveboard requests in flight at once — respects iRail's 3 req/s limit. */
export const MAX_CONCURRENCY = 3;

/** Safety cap: a very broad substring could match many stations; bound the fan-out. */
export const MAX_STATIONS = 20;

/** Station list barely changes — cache it this long (ms). */
export const STATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
