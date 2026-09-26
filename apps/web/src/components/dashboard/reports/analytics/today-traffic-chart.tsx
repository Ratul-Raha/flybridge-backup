"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { CalendarClock } from "lucide-react";
import { Card } from "../card";
import { Chart } from "../echart";
import { BRAND, EMERALD, AXIS_LABEL, SPLIT_LINE, CARD_TOOLTIP } from "../lib";
import type { TrafficSource } from "@/lib/analytics/types";

/** GA's `hour` dimension is "0".."23"; show it as a 12-hour clock label. */
function hourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

export function TodayTrafficChart({ data }: { data: TrafficSource | null }) {
  const option = useMemo<EChartsOption>(() => {
    const byHour = new Map(
      (data?.today.hourly ?? []).map((h) => [Number(h.label), h])
    );

    // Backfill every hour up to now so the shape of the day reads correctly even
    // when GA omits hours with no traffic.
    const currentHour = new Date().getHours();
    const labels: string[] = [];
    const users: number[] = [];
    const sessions: number[] = [];
    for (let h = 0; h <= currentHour; h++) {
      labels.push(hourLabel(h));
      users.push(byHour.get(h)?.activeUsers ?? 0);
      sessions.push(byHour.get(h)?.sessions ?? 0);
    }

    return {
      grid: { left: 4, right: 4, top: 30, bottom: 0, containLabel: true },
      legend: {
        data: ["Active users", "Sessions"],
        right: 0,
        top: 0,
        itemWidth: 10,
        itemHeight: 10,
        icon: "circle",
        textStyle: { color: AXIS_LABEL, fontSize: 11 },
      },
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5, interval: labels.length > 14 ? 2 : 0 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      series: [
        {
          name: "Active users",
          type: "bar",
          data: users,
          barMaxWidth: 22,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: BRAND },
                { offset: 1, color: "rgba(110,76,255,0.35)" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "Sessions",
          type: "line",
          smooth: true,
          data: sessions,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: EMERALD, width: 2 },
          itemStyle: { color: EMERALD },
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Today's shape"
      subtitle="Hourly active users and sessions so far — context for the live window"
      action={
        data ? (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="font-mono text-[11px] font-semibold rounded-full px-3 py-1"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              {data.today.activeUsers.toLocaleString()} users
            </span>
            <span
              className="font-mono text-[11px] font-semibold rounded-full px-3 py-1"
              style={{ background: "rgba(16,185,129,0.1)", color: EMERALD }}
            >
              {data.today.eventCount.toLocaleString()} events
            </span>
          </div>
        ) : (
          <CalendarClock size={16} style={{ color: "var(--body)" }} />
        )
      }
    >
      <Chart option={option} height={260} />
    </Card>
  );
}
