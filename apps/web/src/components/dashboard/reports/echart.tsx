"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";

/**
 * echarts/core (even tree-shaken) is heavy, so the implementation stays in a
 * separate chunk that is only downloaded when a page actually renders a chart.
 */
const ChartImpl = dynamic(
  () => import("./chart-impl").then((m) => m.ChartImpl),
  { ssr: false, loading: () => null }
);

export function Chart({
  option,
  height = 260,
}: {
  option: EChartsOption;
  height?: number;
}) {
  return <ChartImpl option={option} height={height} />;
}
