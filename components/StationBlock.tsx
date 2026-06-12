import type { StationDepartures } from "@/lib/types";
import { DepartureRow } from "@/components/DepartureRow";

export function StationBlock({ station }: { station: StationDepartures }) {
  const count = station.departures.length;
  return (
    <section className="mb-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="break-words text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
          {station.station}
        </h2>
        <span className="shrink-0 text-xs text-muted">
          {count} {count === 1 ? "train" : "trains"}
        </span>
      </div>
      <div className="space-y-3">
        {station.departures.map((dep, i) => (
          <DepartureRow key={`${dep.trainNumber}-${dep.scheduledTime}-${i}`} dep={dep} />
        ))}
      </div>
    </section>
  );
}
