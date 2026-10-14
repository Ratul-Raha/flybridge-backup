"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { Card } from "./card";
import { Chart } from "./echart";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { AXIS_LABEL, BRAND, EMERALD, SKY, SPLIT_LINE } from "./lib";

type UsageTrend = {
  labels: string[];
  pageViews: number[];
  lessonViews: number[];
  quizStarts: number[];
  quizAttempts: number[];
  activeMembers: number[];
};

type TooltipPoint = { name: string; seriesName: string; value: number };

export function UsageTrendChart({
  data,
  subtitle = "Member activity over time",
}: {
  data: UsageTrend | null;
  subtitle?: string;
}) {
  const option = useMemo<EChartsOption>(() => {
    return {
      grid: { left: 8, right: 8, top: 38, bottom: 0, containLabel: true },
      legend: {
        top: 0,
        right: 0,
        data: ["Lesson views", "Quiz starts", "Quiz attempts", "Page views"],
        itemWidth: 9,
        itemHeight: 9,
        textStyle: { color: "#6A7187", fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: unknown) => {
          const points = (Array.isArray(params) ? params : [params]) as TooltipPoint[];
          const day = points[0]?.name ?? "";
          const lines = points.map(
            (point) => `${point.seriesName}: ${Number(point.value).toLocaleString()}`,
          );
          return `<b>${day}</b><br/>${lines.join("<br/>")}`;
        },
      },
      xAxis: {
        type: "category",
        data: data?.labels ?? [],
        axisLine: { lineStyle: { color: SPLIT_LINE } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: AXIS_LABEL, fontSize: 10 },
      },
      series: [
        {
          name: "Lesson views",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data?.lessonViews ?? [],
          lineStyle: { color: BRAND, width: 2.5 },
          itemStyle: { color: BRAND },
        },
        {
          name: "Quiz starts",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data?.quizStarts ?? [],
          lineStyle: { color: SKY, width: 2 },
          itemStyle: { color: SKY },
        },
        {
          name: "Quiz attempts",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: data?.quizAttempts ?? [],
          lineStyle: { color: EMERALD, width: 2 },
          itemStyle: { color: EMERALD },
        },
        {
          name: "Page views",
          type: "bar",
          data: data?.pageViews ?? [],
          barMaxWidth: 10,
          itemStyle: { color: "#C7BFFF", opacity: 0.5, borderRadius: [3, 3, 0, 0] },
        },
      ],
    };
  }, [data]);

  const totalLessonViews = data?.lessonViews.reduce((total, value) => total + value, 0) ?? 0;

  return (
    <Card
      title="Usage trend"
      subtitle={subtitle}
      action={
        data ? (
          <span
            className="font-mono text-[11px] font-semibold rounded-full px-3 py-1 shrink-0"
            style={{ background: "rgba(110,76,255,0.1)", color: BRAND }}
          >
            {totalLessonViews.toLocaleString()} lesson views
          </span>
        ) : null
      }
    >
      {data ? <Chart option={option} height={300} /> : <InlineLoader label="Loading usage…" />}
    </Card>
  );
}
