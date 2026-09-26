"use client";

import type { TrafficRow } from "@/lib/analytics/types";

/**
 * Ranked list with a proportional meter — the same shape GA4's own realtime
 * panels use, so the numbers line up with what an admin sees in GA.
 */
export function RankedList({
  rows,
  unit,
  emptyText,
  color,
  secondaryLabel,
}: {
  rows: TrafficRow[];
  unit: string;
  emptyText: string;
  color: string;
  /** Optional right-aligned figure rendered after the primary value. */
  secondaryLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-[13px] py-8 text-center" style={{ color: "var(--body)" }}>
        {emptyText}
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="flex flex-col gap-2.5 mt-3">
      {rows.map((row, i) => {
        const pct = Math.max((row.value / max) * 100, 3);
        return (
          <div key={`${row.label}-${i}`}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span
                className="text-[12.5px] font-medium truncate"
                style={{ color: "var(--ink)" }}
                title={row.label}
              >
                {row.label}
              </span>
              <span className="text-[12px] shrink-0 font-mono" style={{ color: "var(--body)" }}>
                {row.value.toLocaleString()} {unit}
                {secondaryLabel && row.secondary > 0 ? ` · ${row.secondary} ${secondaryLabel}` : ""}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--line)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
