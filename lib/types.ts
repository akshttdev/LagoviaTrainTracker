/**
 * Types are split into two layers on purpose:
 *
 *   1. `IRail*`  — the RAW shape iRail returns. Note everything is a `string`
 *      (even numbers/booleans). We model only the fields we actually consume.
 *   2. our clean domain/API types — what WE expose. Numbers are numbers,
 *      booleans are booleans, names are friendly.
 *
 * Keeping them separate means the messy upstream contract is quarantined to one
 * boundary (lib/irail.ts), and the rest of the app speaks our clean language.
 */

// ─────────────────────────── 1. RAW iRail upstream ───────────────────────────

/** A station from GET /v1/stations/ (only the fields we use). */
export interface IRailStation {
  id: string;            // e.g. "BE.NMBS.008821006"
  standardname: string;  // canonical, e.g. "Antwerpen-Centraal"
  name: string;          // localized display, e.g. "Antwerp-Central"
}

export interface IRailStationsResponse {
  station: IRailStation[];
}

interface IRailVehicleInfo {
  shortname: string;     // friendly train number, e.g. "IC 707"
}

/** One departure inside a liveboard. Every value is a string — the core trap. */
export interface IRailDeparture {
  station: string;            // DESTINATION station name
  time: string;               // scheduled departure, Unix epoch seconds (as string!)
  delay: string;              // delay in SECONDS (as string!)
  canceled: string;           // "0" | "1"
  platform?: string;          // platform number (string; may be absent)
  vehicleinfo: IRailVehicleInfo;
}

/**
 * GET /v1/liveboard/?id=…  — `departures` (and its `departure` array) can be
 * absent when a station has nothing scheduled, hence the optionals.
 */
export interface IRailLiveboardResponse {
  station: string;
  departures?: {
    number: string;
    departure?: IRailDeparture[];
  };
}

// ─────────────────────────── 2. Our clean API shape ──────────────────────────

/** A single departure, normalized into real types. */
export interface Departure {
  trainNumber: string;
  destination: string;
  scheduledTime: number;   // Unix epoch seconds (number)
  delayMinutes: number;    // delay floored to whole minutes
  canceled: boolean;
  platform: string;        // "" when iRail didn't provide one
}

/** Departures grouped under the origin station they leave from. */
export interface StationDepartures {
  station: string;         // origin station (matched the query)
  stationId: string;
  departures: Departure[];
}

/** A station whose liveboard failed — surfaced instead of failing the whole request. */
export interface Warning {
  station: string;
  reason: string;
}

/** 200 response body for GET /api/departures?q=… */
export interface DeparturesResponse {
  query: string;
  generatedAt: number;     // server epoch used as "now"
  windowMinutes: number;
  stationsMatched: number;
  stations: StationDepartures[];
  warnings?: Warning[];    // present only if at least one station failed
}

/** 400 response body for the input contract (q missing / < 3 chars). */
export interface ErrorResponse {
  error: string;
  message: string;
  minLength?: number;
  received?: number;
}
