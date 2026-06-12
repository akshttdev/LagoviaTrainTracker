# AGENTS.md

Guidance for AI coding agents — and humans — working in this repository.

## Project

**Lagovia Train Tracker** answers one question well: _which trains are leaving a
station in the next 15 minutes, and how late are they?_ It is a small,
production-shaped app that wraps the live [iRail](https://docs.irail.be/) API —
no database, every result is a live fetch.

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) · React 19 |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 |
| **Data** | iRail v1 REST API |

## Commands

```bash
npm run dev     # local dev server (Turbopack)
npm run build   # production build + typecheck
npm run lint    # ESLint — keep this clean before pushing
```

## Architecture

Each file has one job and a well-defined interface; data flows one direction and
inner layers never import outer ones.

```
app/page.tsx ──────────── UI · four states: idle / loading / success / error
  └ lib/useDepartures.ts ─ debounced, abortable search hook
     └ app/api/departures/route.ts ─ thin HTTP wrapper: parse · validate · delegate
        └ lib/departures.ts ─ business rules: match · fan-out · 15-min filter · group
           ├ lib/match.ts ──── station matching: accent- & separator-insensitive, ranked
           ├ lib/concurrency.ts ─ bounded worker pool (respects iRail's rate limit)
           └ lib/irail.ts ──── the ONLY file that talks to iRail; raw strings → clean types
              └ lib/types.ts ─ raw (all-string) + clean domain types

lib/config.ts ───────────── every tunable knob in one place (window, min length, …)
```

### Conventions

- **`lib/irail.ts` is the single boundary.** It is the only file that calls iRail
  and the only place raw strings become typed values (`toDeparture`). Data
  transforms belong here.
- **`lib/departures.ts` is pure business logic** — no framework, no wire details.
  It could sit behind Express unchanged.
- **No magic numbers.** Anything that tunes behavior (15-minute window, 3-char
  minimum, concurrency, station cap) lives in `lib/config.ts`.
- **Matching is centralized** in `lib/match.ts`: accent-folded, separator-folded,
  and ranked (exact > prefix > substring) before any result cap is applied.

## AI-assisted development

This project was built with **Claude Code** as a pair-programmer. I owned the
design and the decisions; the assistant handled exploration, implementation, and —
most valuably — **disciplined verification**. Nothing was "done" until
`npm run lint` and `npm run build` were both green. A few representative examples:

**Proving the failure path actually works.** Rather than trust the error UI in
theory, I forced an upstream failure by temporarily pointing `BASE_URL` at a dead
host. The server returned **502 → the client rendered `ErrorBanner`** — verified
end-to-end, then reverted. (More reliable than toggling Wi-Fi: the station list is
cached for 24h and would otherwise mask the failure.)

**Debugging "6 stations matched, but only 1 shown."** The summary said _"6
stations"_ while one block rendered. Tracing `lib/departures.ts` exposed two
different quantities — `stationsMatched` (names that matched the query) vs. the
stations actually displayed (those with a departure inside the window). The fix
was honest copy: _"1 of 6 matched stations,"_ surfacing the filtering instead of
hiding it.

**Building and verifying the matcher in isolation.** The diacritic-folding and
ranking in `lib/match.ts` were checked with quick throwaway `tsx` runs before
wiring them in: `Brügge → brugge`, exact ranked above prefix, zero false positives.

**Finding a real bug by testing edge cases.** Running the matcher against actual
hyphenated Belgian names revealed that typing `gent sint` (a space) returned
**nothing**, because the data uses a hyphen (`Gent-Sint-Pieters`). Fixed by folding
every separator to a single space in both the query and the station name.

**Fixing a latent lint error.** A pre-existing `react-hooks/set-state-in-effect`
violation in `useDepartures.ts` (setting "idle" synchronously inside an effect) was
resolved by _deriving_ the idle state during render — the React-recommended
"you-might-not-need-an-effect" pattern — instead of syncing it through state.

The throughline: AI was used to move fast **and** to verify — never to ship code
that hadn't been run.
