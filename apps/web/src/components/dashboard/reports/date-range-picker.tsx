"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Check, ChevronDown } from "lucide-react";
import type { DashboardRangeSelection, ResolvedDashboardRange } from "@/lib/admin/dashboard-range";
import type { MarketingPeriod } from "@/lib/marketing-analytics-period";

const PRESETS: { period: MarketingPeriod; label: string }[] = [
  { period: "7d", label: "7 days" },
  { period: "30d", label: "30 days" },
  { period: "month", label: "This month" },
  { period: "last-month", label: "Last month" },
];

function todayInput(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function DateRangePicker({
  value,
  range,
  onChange,
}: {
  value: DashboardRangeSelection;
  range?: ResolvedDashboardRange | null;
  onChange: (next: DashboardRangeSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(value.period === "custom");
  const [from, setFrom] = useState(value.period === "custom" ? value.from : "");
  const [to, setTo] = useState(value.period === "custom" ? value.to : "");

  useEffect(() => {
    if (value.period === "custom") {
      setCustomOpen(true);
      setFrom(value.from);
      setTo(value.to);
    }
  }, [value]);

  const activeLabel =
    value.period === "custom"
      ? (range?.label ?? "Custom range")
      : (PRESETS.find((preset) => preset.period === value.period)?.label ?? "30 days");

  const applyCustom = () => {
    if (!from || !to) return;
    onChange({ period: "custom", from, to });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:border-[var(--brand)]"
        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
      >
        <CalendarRange size={15} style={{ color: "var(--brand)" }} />
        {activeLabel}
        <ChevronDown size={14} style={{ color: "var(--body)" }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-40 mt-2 w-[280px] rounded-xl border bg-white p-2 shadow-[0_18px_44px_-18px_rgba(16,24,40,0.35)]"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex flex-col">
              {PRESETS.map((preset) => {
                const active = value.period === preset.period;
                return (
                  <button
                    key={preset.period}
                    type="button"
                    onClick={() => {
                      onChange({ period: preset.period });
                      setOpen(false);
                    }}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-[var(--brand-soft)]"
                    style={{ color: active ? "var(--brand)" : "var(--ink)" }}
                  >
                    {preset.label}
                    {active && <Check size={14} />}
                  </button>
                );
              })}
            </div>

            <div className="my-1.5 h-px" style={{ background: "var(--line)" }} />

            <button
              type="button"
              onClick={() => setCustomOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-[var(--brand-soft)]"
              style={{ color: value.period === "custom" ? "var(--brand)" : "var(--ink)" }}
            >
              Custom range
              <ChevronDown
                size={14}
                style={{
                  transform: customOpen ? "rotate(180deg)" : "none",
                  transition: "transform .2s",
                }}
              />
            </button>

            {customOpen && (
              <div className="flex flex-col gap-2 px-1 pb-1 pt-2">
                <label
                  className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--body)" }}
                >
                  From
                  <input
                    type="date"
                    value={from}
                    max={to || todayInput()}
                    onChange={(event) => setFrom(event.target.value)}
                    className="rounded-lg border px-2.5 py-1.5 text-[12.5px] font-normal"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </label>
                <label
                  className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--body)" }}
                >
                  To
                  <input
                    type="date"
                    value={to}
                    min={from}
                    max={todayInput()}
                    onChange={(event) => setTo(event.target.value)}
                    className="rounded-lg border px-2.5 py-1.5 text-[12.5px] font-normal"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </label>
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!from || !to}
                  className="mt-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: "var(--brand)" }}
                >
                  Apply range
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
