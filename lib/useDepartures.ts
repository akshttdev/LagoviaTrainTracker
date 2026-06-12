"use client";

import { useEffect, useRef, useState } from "react";
import type { DeparturesResponse } from "@/lib/types";

/** The four UI states, modeled as a discriminated union so the page can't
 *  read `data` while loading or `message` on success. */
export type DeparturesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: DeparturesResponse };

/**
 * Debounced, abortable search hook.
 * - Below `minLength` chars → idle (no request, mirrors the API's input contract).
 * - Waits `debounceMs` after the last keystroke before fetching.
 * - Aborts the previous request so out-of-order responses can't flash stale data.
 */
export function useDepartures(
  query: string,
  minLength = 3,
  debounceMs = 350,
): DeparturesState {
  const [state, setState] = useState<DeparturesState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < minLength) return; // too short → idle is derived below, nothing to fetch

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: "loading" });

      try {
        const res = await fetch(`/api/departures?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setState({ status: "error", message: `Request failed (${res.status})` });
          return;
        }
        const data = (await res.json()) as DeparturesResponse;
        setState({ status: "success", data });
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // superseded by a newer query
        setState({ status: "error", message: "Could not reach the server." });
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, minLength, debounceMs]);

  // Idle is a pure function of the query length — derive it during render rather
  // than syncing it through the effect (avoids a cascading-render setState).
  return query.trim().length < minLength ? { status: "idle" } : state;
}
