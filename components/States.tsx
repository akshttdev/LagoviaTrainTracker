"use client";

import type { Warning } from "@/lib/types";

const EXAMPLES = ["Brugge", "Gent", "Brussel", "Antwerpen"];

/** Idle: before a valid search. */
export function IdleHero({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="py-12 text-center">
      <p className="mx-auto max-w-md text-sm uppercase tracking-wide text-muted">
        Search any Lagovia station to see what&rsquo;s leaving in the next 15 minutes
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => onPick(e)}
            className="rounded-xl border border-line bg-card px-4 py-2 text-xs uppercase tracking-wide shadow-sm transition hover:bg-ink hover:text-bg"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Loading: shimmering skeleton cards. */
export function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading departures">
      <div className="shimmer mb-5 h-9 w-56 rounded bg-line" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer rounded-xl border-l-4 border-l-line bg-card px-5 py-4 shadow-sm ring-1 ring-line/70"
          >
            <div className="h-5 w-24 rounded bg-line" />
            <div className="mt-2 h-6 w-44 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** No matching stations / no upcoming departures. */
export function NoResults({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-line bg-card py-16 text-center shadow-sm">
      <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
        No departures found
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-xs uppercase tracking-wide text-muted">
        No station matching &ldquo;{query}&rdquo; has a train leaving in the next 15 minutes
      </p>
    </div>
  );
}

/** Upstream/network failure. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-danger">
        Connection problem
      </p>
      <p className="mt-1 text-sm text-muted">{message}</p>
    </div>
  );
}

/** Truncation notice (broad queries capped at MAX_STATIONS). */
export function WarningBanner({ warnings }: { warnings: Warning[] }) {
  return (
    <div className="mb-8 rounded-lg border border-line bg-card px-4 py-2 shadow-sm">
      {warnings.map((w, i) => (
        <p key={i} className="text-xs uppercase tracking-wide text-muted">
          {w.station} — {w.reason}
        </p>
      ))}
    </div>
  );
}
