"use client";

import { useState } from "react";
import { useDepartures } from "@/lib/useDepartures";
import { Clock } from "@/components/Clock";
import { SearchBar } from "@/components/SearchBar";
import { StationBlock } from "@/components/StationBlock";
import {
  ErrorBanner,
  IdleHero,
  LoadingState,
  NoResults,
  WarningBanner,
} from "@/components/States";
import type { DeparturesResponse } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const state = useDepartures(query);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-2xl font-extrabold tracking-tight">LAGOVIA</span>
          <Clock />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <h1 className="text-4xl font-extrabold uppercase leading-none tracking-tighter sm:text-5xl">
          Lagovia Train Tracker
        </h1>
        <p className="mt-3 text-xs uppercase tracking-wide text-muted">
          How late are the trains, exactly?
        </p>

        <div className="mt-7">
          <SearchBar value={query} onChange={setQuery} />
          <p className="mt-3 text-xs uppercase tracking-wide text-muted">
            type at least 3 letters
          </p>
        </div>

        <div className="mt-10">
          {state.status === "idle" && <IdleHero onPick={setQuery} />}
          {state.status === "loading" && <LoadingState />}
          {state.status === "error" && <ErrorBanner message={state.message} />}
          {state.status === "success" && <Results data={state.data} />}
        </div>
      </main>
    </div>
  );
}

function Results({ data }: { data: DeparturesResponse }) {
  if (data.stations.length === 0) return <NoResults query={data.query} />;

  return (
    <div>
      {data.warnings?.length ? <WarningBanner warnings={data.warnings} /> : null}
      <p className="mb-8 text-xs uppercase tracking-wide text-muted">
        {data.stations.length} of {data.stationsMatched} matched station
        {data.stationsMatched === 1 ? "" : "s"} · next {data.windowMinutes} minutes
      </p>
      {data.stations.map((s) => (
        <StationBlock key={s.stationId} station={s} />
      ))}
    </div>
  );
}
