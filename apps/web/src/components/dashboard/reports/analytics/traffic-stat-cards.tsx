"use client";

import { Users, Eye, Zap, Radio } from "lucide-react";
import type { TrafficSource } from "@/lib/analytics/types";

type Card = {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  icon: typeof Users;
  gradient: string;
  caption: string;
  pulse?: boolean;
};

function cards(data: TrafficSource): Card[] {
  const { trafficDensity, window, peak, today } = data;
  const windowLabel = `last ${window} min`;

  return [
    {
      key: "active-users",
      label: "Active right now",
      value: trafficDensity.activeUsers,
      icon: Radio,
      gradient: "linear-gradient(135deg,#F43F5E,#FB7185)",
      caption:
        trafficDensity.activeUsers > 0
          ? `${windowLabel} peak ${peak?.activeUsers ?? 0} concurrent`
          : `No visitors in the ${windowLabel}`,
      pulse: true,
    },
    {
      key: "pageviews",
      label: "Page views",
      value: trafficDensity.screenPageViews,
      icon: Eye,
      gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
      caption: `${data.series.reduce((a, b) => a + b.screenPageViews, 0)} in the ${windowLabel}`,
    },
    {
      key: "events",
      label: "Events",
      value: trafficDensity.eventCount,
      icon: Zap,
      gradient: "linear-gradient(135deg,#F59E0B,#F97316)",
      caption: window > 0 ? `${(trafficDensity.eventCount / window).toFixed(1)} per minute` : "—",
    },
    {
      key: "today",
      label: "Users today",
      value: today.activeUsers,
      icon: Users,
      gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)",
      caption: `${today.screenPageViews.toLocaleString()} page views so far`,
    },
  ];
}

export function TrafficStatCards({ data }: { data: TrafficSource | null }) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <div className="w-11 h-11 rounded-lg mb-4" style={{ background: "var(--line)" }} />
            <div className="h-[26px] w-16 rounded-lg mb-2" style={{ background: "var(--line)" }} />
            <div className="h-[10px] w-24 rounded" style={{ background: "var(--line)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards(data).map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.key}
            className="relative rounded-lg border bg-white p-5 overflow-hidden"
            style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
          >
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]"
              style={{ background: c.gradient }}
            />
            <div
              className="relative w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4"
              style={{ background: c.gradient, boxShadow: `0 8px 18px -6px ${c.gradient}66` }}
            >
              <Icon size={19} strokeWidth={2.2} />
              {c.pulse && c.value > 0 && (
                <span
                  className="absolute inset-0 rounded-lg animate-ping opacity-40"
                  style={{ background: c.gradient }}
                />
              )}
            </div>
            <p
              className="relative font-display text-[26px] font-semibold leading-none"
              style={{ color: "var(--ink)" }}
            >
              {c.value.toLocaleString()}
              {c.suffix}
            </p>
            <p
              className="relative font-mono text-[10px] uppercase tracking-[0.14em] mt-2"
              style={{ color: "var(--body)" }}
            >
              {c.label}
            </p>
            <p className="relative text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
              {c.caption}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c.gradient }} />
          </div>
        );
      })}
    </div>
  );
}
