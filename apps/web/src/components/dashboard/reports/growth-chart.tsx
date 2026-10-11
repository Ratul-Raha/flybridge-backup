"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Card } from "./card";
import { Chart } from "./echart";
import { BRAND, AXIS_LABEL, SPLIT_LINE, CARD_TOOLTIP } from "./lib";

type Growth = { labels: string[]; signups: number[] };

export function GrowthChart({ data }: { data: Growth | null }) {
  const option = useMemo<EChartsOption>(() => {
    const signups = data?.signups ?? [];
    const total = signups.reduce((a, b) => a + b, 0);
    return {
      grid: { left: 4, right: 4, top: 26, bottom: 0, containLabel: true },
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          return `<b>${p.name}</b><br/>${p.value} new ${p.value === 1 ? "user" : "users"}`;
        },
      },
      xAxis: {
        type: "category",
        data: data?.labels ?? [],
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 10.5 },
      },
      series: [
        {
          name: "Signups",
          type: "line",
          smooth: true,
          data: signups,
          symbol: "circle",
          symbolSize: 7,
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
            total > 0
              ? {
                  data: [
                    {
                      name: "peak",
                      type: "max",
                      label: { formatter: "{c}", color: "#fff", fontSize: 10.5, fontWeight: 600 },
                      itemStyle: { color: BRAND },
                      symbolSize: 38,
                    },
                  ],
                }
              : undefined,
        },
      ],
    };
  }, [data]);

  return (
    <Card
      title="User growth"
      subtitle="New signups per day over the last 14 days"
      action={
        data ? (
          <span
            className="font-mono text-[11px] font-semibold rounded-full px-3 py-1 shrink-0"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            sum {data.signups.reduce((a, b) => a + b, 0).toLocaleString()}
          </span>
        ) : null
      }
    >
      <Chart option={option} height={300} />
    </Card>
  );
}