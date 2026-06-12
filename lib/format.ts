/**
 * Pure display helpers — no React, no fetch. Easy to unit-test, which is why the
 * formatting lives here instead of inline in the components.
 */

/** Epoch seconds → "HH:MM" in 24-hour format (rail convention). */
export function formatTime(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "in 4 min" / "now" — relative to the server's "now" (response.generatedAt). */
export function relativeTime(epochSeconds: number, nowSeconds: number): string {
  const mins = Math.round((epochSeconds - nowSeconds) / 60);
  return mins <= 0 ? "now" : `in ${mins} min`;
}

export type DelayTone = "ok" | "late" | "cancelled";

/** Raw delay/cancel → a display label + a tone the UI colors on. */
export function delayLabel(
  delayMinutes: number,
  canceled: boolean,
): { text: string; tone: DelayTone } {
  if (canceled) return { text: "Cancelled", tone: "cancelled" };
  if (delayMinutes <= 0) return { text: "On time", tone: "ok" };
  return { text: `+${delayMinutes} min`, tone: "late" };
}
