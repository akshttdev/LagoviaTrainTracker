"use client";

import { useEffect, useState } from "react";

/** Live wall-clock (HH:MM, 24h). Renders empty on the server to avoid a
 *  hydration mismatch, then fills in on mount. */
export function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums text-lg text-muted">{time}</span>;
}
