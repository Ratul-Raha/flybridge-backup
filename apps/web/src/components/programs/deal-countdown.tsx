"use client";

import { useEffect, useState } from "react";

/**
 * The time left on a deal, counting down in the reader's own clock.
 *
 * Rendered only while a discount is actually running, and only when it has an
 * end date — an open-ended discount has nothing to count down to.
 *
 * The first paint is deliberately empty and the real value arrives after mount,
 * because the server's clock and the reader's rarely agree to the second and a
 * mismatch there would be a hydration error.
 */
export function DealCountdown({
  endsAt,
  tone = "card",
}: {
  endsAt: string;
  tone?: "card" | "menu";
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    if (Number.isNaN(target)) return;

    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (remaining === null) return null;
  // Past the end date: the offer is over, so say nothing rather than counting up.
  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  // Under a day reads in hours and minutes; past that the days matter more than
  // the seconds, so they are the ones that stay on screen.
  const parts = days > 0 ? [`${days}d`, `${pad(hours)}h`, `${pad(minutes)}m`] : [
    `${pad(hours)}h`,
    `${pad(minutes)}m`,
    `${pad(seconds)}s`,
  ];

  const isUrgent = remaining < 24 * 3_600 * 2;

  if (tone === "menu") {
    return (
      <span
        className="shrink-0 font-mono text-[9px] font-medium tabular-nums tracking-[0.06em] whitespace-nowrap"
        style={{ color: isUrgent ? "#C0392B" : "var(--body)" }}
      >
        {parts.join(" ")} left
      </span>
    );
  }

  return (
    <span
      className="mt-[5px] inline-flex items-center gap-1 font-mono text-[10px] font-medium tabular-nums tracking-[0.06em] px-[7px] py-[3px] rounded-full"
      style={{
        background: isUrgent ? "rgba(192,57,43,0.09)" : "var(--brand-soft)",
        color: isUrgent ? "#C0392B" : "var(--brand)",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {parts.join(" ")} left
    </span>
  );
}
