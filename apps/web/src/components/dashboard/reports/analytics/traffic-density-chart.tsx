"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Card } from "../card";
import { Chart } from "../echart";
import { BRAND, SKY, AXIS_LABEL, SPLIT_LINE, CARD_TOOLTIP } from "../lib";
import type { TrafficSource } from "@/lib/analytics/types";

/** "3 min ago" for a bucket, or "now" for the live minute. */
function bucketLabel(minutesAgo: number): string {
  if (minutesAgo === 0) return "now";
  return `-${minutesAgo}m`;
}

export function TrafficDensityChart({ data }: { data: TrafficSource | null }) {
  const option = useMemo<EChartsOption>(() => {
    const series = data?.series ?? [];
    const users = series.map((b) => b.activeUsers);
    const peak = data?.peakActiveUsers ?? 0;

    return {
      grid: { left: 4, right: 8, top: 30, bottom: 0, containLabel: true },
      legend: {
        data: ["Active users", "Page views"],
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
        axisPointer: { type: "line", lineStyle: { color: SPLIT_LINE } },
        formatter: (params: unknown) => {
          const p = params as { axisValue: string; seriesName: string; value: number; color: string }[];
          if (!p.length) return "";
          const head = `<b>${p[0].axisValue === "now" ? "Current minute" : `${p[0].axisValue} ago`}</b>`;
          const body = p
            .map((row) => `<span style="color:${row.color}">●</span> ${row.seriesName}: <b>${row.value}</b>`)
            .join("<br/>");
          return `${head}<br/>${body}`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: series.map((b) => bucketLabel(b.minutesAgo)),
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: {
          color: AXIS_LABEL,
          fontSize: 10.5,
          // A 60-minute window cannot label every minute legibly.
          interval: series.length > 30 ? 9 : series.length > 15 ? 4 : 1,
        },
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
          type: "line",
          smooth: true,
          data: users,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: BRAND, width: 2.5 },
          itemStyle: { color: BRAND },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(110,76,255,0.28)" },
                { offset: 1, color: "rgba(110,76,255,0.02)" },
              ],
            },
          },
          markPoint:
            peak > 0
              ? {
                  data: [
                    {
                      name: "peak",
                      type: "max",
                      label: { formatter: "{c}", color: "#fff", fontSize: 10.5, fontWeight: 600 },
                      itemStyle: { color: BRAND },
                      symbolSize: 34,
                    },
                  ],
                }
              : undefined,
        },
        {
          name: "Page views",
          type: "line",
          smooth: true,
          data: series.map((b) => b.screenPageViews),
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: SKY, width: 2 },
          itemStyle: { color: SKY },
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="Traffic density"
      subtitle={
        data
          ? `Active users per minute over the last ${data.window} minutes`
          : "Loading the live window…"
      }
      action={
        data ? (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="font-mono text-[11px] font-semibold rounded-full px-3 py-1"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              peak {data.peakActiveUsers}
            </span>
            <span
              className="font-mono text-[11px] font-semibold rounded-full px-3 py-1"
              style={{ background: "rgba(14,165,233,0.1)", color: SKY }}
            >
              avg {data.averageActiveUsers}
            </span>
          </div>
        ) : null
      }
    >
      <Chart option={option} height={300} />
    </Card>
  );
}
