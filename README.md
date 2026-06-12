# Lagovia Train Tracker

> The trains are always late. This tells you exactly _how_ late.

Type part of a station name and see every upcoming departure (next 15 minutes)
from every matching station — train number, destination, scheduled time, and
current delay. Live data from the open [iRail](https://docs.irail.be/) API.

**Track chosen: B (Frontend / Fullstack)** — a web page backed by a single JSON
endpoint, both served by one app.

---

## Quick start

**Prerequisites:** Node.js 18.18+ (Node 20+ recommended). No API key — iRail is
open and unauthenticated.

```bash
npm install
npm run dev      # → http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build + typecheck
npm run start    # serve the production build
npm run lint     # ESLint (clean)
```

No `.env`, no database, no external services to provision.

---

## Using it

- Type **≥ 3 characters** into the search box. Searches fire automatically
  (debounced ~350 ms) — no button to press.
- Results are **grouped by station**, each with its upcoming departures.
- Below 3 characters the UI stays idle and sends no request (see the input
  contract below).

---

## API

The page is powered by one endpoint, which you can call directly:

```
GET /api/departures?q=<substring>
```

### 200 — success

```jsonc
{
  "query": "bru",
  "generatedAt": 1749730080,     // server epoch (seconds) used as "now"
  "windowMinutes": 15,
  "stationsMatched": 6,          // stations whose NAME matched the query
  "stations": [                  // only those WITH a departure in the window
    {
      "station": "Brugge",
      "stationId": "BE.NMBS.008891009",
      "departures": [
        {
          "trainNumber": "IC 2832",
          "destination": "Knokke",
          "scheduledTime": 1749730140,  // epoch seconds
          "delayMinutes": 0,            // delay floored to whole minutes
          "canceled": false,
          "platform": "6"               // "" if iRail didn't provide one
        }
      ]
    }
  ],
  "warnings": [                  // present only if a station's liveboard failed
    { "station": "Lissewege", "reason": "upstream_error" }
  ]
}
```

`stationsMatched` (names matched) can exceed the number of `stations` returned,
because stations with **no** departure in the 15-minute window are dropped. The
UI shows this honestly as _"1 of 6 matched stations."_

### 400 — input contract (query too short)

Queries shorter than 3 characters never reach iRail; they get an explicit,
documented error:

```jsonc
{
  "error": "query_too_short",
  "message": "Query must be at least 3 characters.",
  "minLength": 3,
  "received": 2
}
```

### 502 — upstream unavailable

If the iRail station list can't be reached, the endpoint returns
`{ "error": "upstream_unavailable", "message": "..." }` and the UI shows a
connection banner.

---

## How the requirements are met

| Requirement | Where |
|---|---|
| **Input contract** — `< 3 chars` → explicit error | `app/api/departures/route.ts` (400 + documented shape); client mirrors it by staying idle |
| **15-minute window** | `lib/departures.ts` filters `now ≤ scheduledTime ≤ now + 15 min` (`WINDOW_MINUTES` in `lib/config.ts`) |
| **Search triggers at ≥ 3 chars** | `lib/useDepartures.ts` (debounced + abortable) |
| **List grouped / labelled by station** | `components/StationBlock.tsx`; grouped in the API response |
| **Bonus: fuzzy search** | `lib/match.ts` — typo-tolerant fallback, e.g. `Antverpen → Antwerpen-Centraal` |

---

## Architecture (short)

Strictly layered; data flows one way and inner layers never import outer ones.
Full diagram and conventions in [`AGENTS.md`](./AGENTS.md).

```
UI (page + components)
  └ useDepartures (hook) → /api/departures (route) → searchDepartures (core)
       ├ match.ts        station matching
       ├ concurrency.ts  bounded fan-out
       └ irail.ts        the ONLY iRail boundary (raw strings → clean types)
```

`lib/departures.ts` is pure business logic with no framework or wire details, so
the same core could sit behind Express unchanged — only the thin route wrapper is
Next-specific.

### Matching, specifically (`lib/match.ts`)

Two tiers, so normal queries stay clean and the bonus still works:

1. **Substring** — accent-folded (`Brügge` = `brugge`) and separator-folded
   (`gent sint` = `Gent-Sint-Pieters`), ranked exact > prefix > substring.
2. **Typo-tolerant fallback** — runs **only when tier 1 finds nothing**, using
   word-level edit distance (1 typo for short queries, 2 for longer). This is
   what makes `Antverpen → Antwerpen-Centraal` work without polluting ordinary
   searches.

---

## Decisions & trade-offs

- **Next.js (App Router) instead of Express + a separate React app.** The brief
  prefers React; Next lets one project serve both the page **and** the
  `GET /api/departures` endpoint — no second server to run or deploy. Business
  logic stays framework-agnostic in `lib/`, so it's a packaging choice, not a
  lock-in.
- **No database — live fetch per request.** Delays are only meaningful live;
  caching them would trade correctness for speed in the one place correctness
  matters most.
- **Station list cached 24 h; liveboards always fresh.** The ~600-station list
  barely changes, so it's cached in memory; per-station departures use
  `cache: "no-store"`.
- **Bounded concurrency (`MAX_CONCURRENCY = 3`).** A broad query fans out to many
  stations; a small worker pool respects iRail's rate limit instead of firing
  hundreds of parallel requests.
- **One flaky station doesn't fail the request** — a failed liveboard becomes a
  `warning` and the rest still return.
- **Tunable knobs live in `lib/config.ts`**, never hardcoded inline — window, min
  length, concurrency, and station cap are each a one-line change.

## Known limitations

- **Other-language / exonym names aren't resolved.** French names like
  `anvers` / `gand` / `bruxelles` won't reliably find Antwerpen / Gent / Brussel —
  iRail's data carries Dutch + localized names, not a full alias table. A curated
  synonym map would be the fix.
- **Fuzzy matching is word-level and conservative.** It rescues typos like
  `Antverpen`; it won't recover badly garbled or heavily reordered input.
- **No automated test runner is wired up.** Matching logic was verified with
  throwaway `tsx` runs against the live station list; the pure functions in
  `lib/match.ts` are structured to make adding a suite trivial. A conscious scope
  call given the time budget, not an oversight.
- **In-memory caches are per-process** — fine for this single-instance app; a
  multi-instance deploy would want a shared cache.

---

## Time spent

**Roughly `<FILL IN>` hours.** _(Replace with your actual figure before submitting.)_

---

## AI usage report

**Tool:** [Claude Code](https://www.anthropic.com/claude-code) (Claude Opus 4.x),
used as a pair-programmer throughout — for codebase exploration, implementation,
and especially **verification** (every change gated on a clean `npm run lint` and
`npm run build`). A detailed, example-by-example account of how it was used for
**testing and debugging** is in [`AGENTS.md`](./AGENTS.md#ai-assisted-development).

**Used for**
- Exploring the codebase and tracing data flow (e.g. the "6 matched, 1 shown" question).
- Implementing the matching module (`lib/match.ts`) and the typo-tolerant fallback.
- Forcing and verifying the error / loading / empty states end-to-end.
- Catching and fixing a latent lint error.

**Accepted as-is**
- The layered scaffold and the accent/ranking matcher's first cut.
- The CSS cursor rules and the header restructure.
- The lint fix (derive `idle` during render instead of `setState` in an effect).

**Rewrote / iterated on**
- The **fuzzy matcher**: the first version compared the query against each word's
  leading slice, which produced noise (`gnt` matched _Antwerpen_ as well as
  _Gent_). After testing against the live station list I dropped it — word-level
  edit distance alone cleanly handles `Antverpen`, `gnt`, `bruge`, `brusel`.
- `normalize()` — moved to a `\p{Diacritic}` Unicode escape, then added
  separator-folding once testing showed `gent sint` (space) missed
  `Gent-Sint-Pieters` (hyphen).

**Rejected**
- Pulling in **Fuse.js** for fuzzy search — kept matching dependency-free so the
  logic is mine to explain in the walkthrough.
- Setting up a full test framework — out of scope for the time budget.

**Representative prompts** (paraphrased): _"why does the summary say 6 stations
but only one shows?"_, _"how do I test the error screen?"_, _"the bonus wants
Antverpen → Antwerpen — implement typo tolerance as a fallback after substring."_
