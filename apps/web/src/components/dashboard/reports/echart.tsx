"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export function Chart({ option, height = 260 }: { option: EChartsOption; height?: number }) {
  return (
    <div style={{ height }}>
      <ReactECharts option={option} notMerge style={{ height: "100%" }} />
    </div>
  );
}