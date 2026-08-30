"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";

type MyRank = {
  rank: number | null;
  total: number;
  my: {
    name: string;
    avatar: string | null;
    composite: number;
    weeklyActivity: number;
  } | null;
};

const TOP_COLORS: Record<number, { ring: string; fg: string; bg: string; label: string }> = {
  1: { ring: "#D9A521", fg: "#A87B00", bg: "rgba(217,165,33,0.12)", label: "Gold" },
  2: { ring: "#94A3B8", fg: "#64748B", bg: "rgba(148,163,184,0.14)", label: "Silver" },
  3: { ring: "#C2712F", fg: "#A15C07", bg: "rgba(194,113,47,0.14)", label: "Bronze" },
};

export function DashboardMyRank() {
  const [data, setData] = useState<MyRank | null>(null);

  useEffect(() => {
    fetch("/api/me/leaderboard", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d ?? null))
      .catch(() => setData(null));
  }, []);

  const medal = data?.rank && data.rank <= 3 ? TOP_COLORS[data.rank] : null;
  const hasProgress = data?.my !== null;

  return (
    <Link
      href="/leaderboard"
      className="group relative overflow-hidden flex items-center gap-4 rounded-lg border bg-white p-5 transition-all duration-250 hover:translate-y-[-2px] hover:shadow-[0_16px_32px_-20px_rgba(18,32,67,0.25)]"
      style={{ borderColor: "var(--line)" }}
    >
      <span
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: medal ? medal.bg : "rgba(15,169,104,0.12)" }}
      />
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: medal ? medal.bg : "var(--brand-soft)", color: medal ? medal.fg : "var(--brand)" }}
      >
        <Trophy size={19} strokeWidth={2} />
      </span>

      <span className="flex flex-col min-w-0">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
          Weekly rank
        </span>
        <span className="flex items-baseline gap-2 mt-1">
          {data === null ? (
            <span className="font-display text-[22px] font-semibold leading-none" style={{ color: "var(--body)" }}>
              —
            </span>
          ) : data.rank !== null ? (
            <span className="flex items-baseline gap-1.5">
              <span
                className="font-display text-[30px] font-bold leading-none tracking-[-0.03em]"
                style={{ color: medal ? medal.fg : "var(--ink)" }}
              >
                #{data.rank}
              </span>
              <span className="text-[12.5px] font-medium" style={{ color: "var(--body)" }}>
                of {data.total} learners
              </span>
            </span>
          ) : (
            <span className="font-display text-[16px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
              Not ranked yet
            </span>
          )}
        </span>
        {hasProgress && data?.rank !== null && (
          <span
            className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: "var(--body)" }}
          >
            {medal ? `${medal.label} tier` : "Reshuffles every Monday"}
          </span>
        )}
        {data?.rank === null && (
          <span className="mt-1.5 text-[12px]" style={{ color: "var(--body)" }}>
            Complete lessons to join the board.
          </span>
        )}
      </span>

      <ArrowUpRight
        size={16}
        className="ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
        style={{ color: "var(--body)" }}
      />
    </Link>
  );
}
