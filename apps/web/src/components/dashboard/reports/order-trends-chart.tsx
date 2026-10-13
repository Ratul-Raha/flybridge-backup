"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { formatMoney } from "@/lib/pricing";
import { useCurrency } from "@/components/dashboard/currency-context";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { Card } from "./card";
import { Chart } from "./echart";
import { AXIS_LABEL, CARD_TOOLTIP, EMERALD, SKY, SPLIT_LINE } from "./lib";

type OrderTrend = { labels: string[]; counts: number[]; revenues: number[] };
type TooltipPoint = { name: string; seriesName: string; value: number };

export function OrderTrendsChart({ data }: { data: OrderTrend | null }) {
  const { currency } = useCurrency();

  const option = useMemo<EChartsOption>(() => {
    const counts = data?.counts ?? [];
    const revenues = data?.revenues ?? [];

    return {
      grid: { left: 8, right: 8, top: 38, bottom: 0, containLabel: true },
      legend: {
        top: 0,
        right: 0,
        data: ["Revenue", "Orders"],
        itemWidth: 9,
        itemHeight: 9,
        textStyle: { color: "#6A7187", fontSize: 11 },
      },
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: unknown) => {
          const points = (Array.isArray(params) ? params : [params]) as TooltipPoint[];
          const day = points[0]?.name ?? "";
          const orderCount = points.find((point) => point.seriesName === "Orders")?.value ?? 0;
          const revenue = points.find((point) => point.seriesName === "Revenue")?.value ?? 0;
          return `<b>${day}</b><br/>Completed revenue: ${formatMoney(Number(revenue), currency)}<br/>Orders placed: ${Number(orderCount).toLocaleString()}`;
        },
      },
      xAxis: {
        type: "category",
        data: data?.labels ?? [],
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      yAxis: [
        {
          type: "value",
          minInterval: 1,
          splitLine: { lineStyle: { color: SPLIT_LINE } },
          axisLabel: {
            color: AXIS_LABEL,
            fontSize: 10,
            formatter: (value: number) =>
              value >= 1_000_000
                ? `${(value / 1_000_000).toFixed(1)}m`
                : value >= 1_000
                  ? `${(value / 1_000).toFixed(1)}k`
                  : `${value}`,
          },
        },
        {
          type: "value",
          minInterval: 1,
          position: "right",
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: AXIS_LABEL, fontSize: 10 },
        },
      ],
      series: [
        {
          name: "Orders",
          type: "bar",
          yAxisIndex: 1,
          data: counts,
          barMaxWidth: 10,
          itemStyle: { color: SKY, opacity: 0.32, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: "Revenue",
          type: "line",
          yAxisIndex: 0,
          smooth: true,
          data: revenues,
          showSymbol: false,
          symbolSize: 6,
          lineStyle: { color: EMERALD, width: 2.5 },
          itemStyle: { color: EMERALD },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(16,185,129,0.2)" },
                { offset: 1, color: "rgba(16,185,129,0.01)" },
              ],
            },
          },
        },
      ],
    };
  }, [data, currency]);

  const totalOrders = data?.counts.reduce((total, count) => total + count, 0) ?? 0;

  return (
    <Card
      title="Orders & revenue trend"
      subtitle="Completed revenue and all orders · last 30 days"
      action={
        data ? (
          <span
            className="font-mono text-[11px] font-semibold rounded-full px-3 py-1 shrink-0"
            style={{ background: "rgba(14,165,233,0.1)", color: "#0369A1" }}
          >
            {totalOrders.toLocaleString()} orders
          </span>
        ) : null
      }
    >
      {data ? (
        <Chart option={option} height={300} />
      ) : (
        <InlineLoader label="Loading order trends…" />
      )}
    </Card>
  );
}
