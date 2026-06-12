import type { Departure } from "@/lib/types";
import { delayLabel, formatTime } from "@/lib/format";

export function DepartureRow({ dep }: { dep: Departure }) {
  const status = delayLabel(dep.delayMinutes, dep.canceled);
  const actualTime = dep.scheduledTime + dep.delayMinutes * 60;
  const onTime = status.tone === "ok";

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border-l-4 bg-card px-5 py-4 shadow-sm ring-1 ring-line/70 ${
        onTime ? "border-l-accent" : "border-l-danger"
      }`}
    >
      {/* left: time + train number, then destination */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          {onTime ? (
            <span className="text-xl font-bold tabular-nums">{formatTime(dep.scheduledTime)}</span>
          ) : (
            <>
              <span className="text-sm text-muted line-through">{formatTime(dep.scheduledTime)}</span>
              {!dep.canceled && (
                <span className="text-xl font-bold tabular-nums text-danger">
                  {formatTime(actualTime)}
                </span>
              )}
            </>
          )}
          <span className="text-xs text-accent">{dep.trainNumber}</span>
        </div>
        <div
          className={`mt-1 truncate text-lg font-bold uppercase tracking-tight ${
            dep.canceled ? "text-muted line-through" : ""
          }`}
        >
          {dep.destination}
        </div>
      </div>

      {/* right: platform + status */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {dep.platform && (
          <span className="rounded bg-paper px-2 py-1 text-[10px] uppercase tracking-wide text-muted">
            Platform {dep.platform}
          </span>
        )}
        <span
          className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
            onTime ? "text-accent" : "text-danger"
          }`}
        >
          {!onTime && <WarnIcon />}
          {status.text}
        </span>
      </div>
    </div>
  );
}

function WarnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
