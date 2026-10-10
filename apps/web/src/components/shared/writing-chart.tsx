"use client";

import type { EChartsOption } from "echarts";
import { Chart } from "@/components/dashboard/reports/echart";
import type { ChartData } from "@/lib/chart-data";

export function WritingChart({ chart }: { chart: ChartData }) {
  const categories = chart.categories?.length ? chart.categories : chart.xAxis ?? [];
  const firstSeries = chart.series[0];
  const option: EChartsOption =
    chart.chartType === "pie"
      ? {
          tooltip: { trigger: "item" },
          legend: { bottom: 0, type: "scroll" },
          series: [
            {
              type: "pie",
              radius: ["35%", "68%"],
              data: categories.map((name, index) => ({ name, value: firstSeries?.data[index] ?? 0 })),
              label: { formatter: "{b}: {c}" },
            },
          ],
        }
      : {
          tooltip: { trigger: "axis" },
          legend: chart.series.length > 1 ? { bottom: 0, type: "scroll" } : undefined,
          grid: { left: 56, right: 20, top: 24, bottom: chart.series.length > 1 ? 56 : 36, containLabel: true },
          xAxis: { type: "category", data: categories, name: chart.xAxis?.length === 1 ? chart.xAxis[0] : undefined },
          yAxis: { type: "value", name: chart.yAxisLabel || chart.unit || undefined },
          series: chart.series.map((series) => ({
            name: series.name,
            type: chart.chartType === "bar" ? "bar" : "line",
            data: series.data,
            smooth: chart.chartType === "line",
            emphasis: { focus: "series" },
          })),
        };

  if (chart.chartType === "table") {
    return (
      <div className="mb-5 overflow-hidden rounded-xl border bg-white p-3 sm:p-5" style={{ borderColor: "var(--line)" }}>
        {chart.title && <p className="mb-3 text-center text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{chart.title}</p>}
        <ChartTable chart={chart} categories={categories} />
        {chart.source && <p className="mt-3 text-[11px]" style={{ color: "var(--body)" }}>Source: {chart.source}</p>}
      </div>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl border bg-white p-3 sm:p-5" style={{ borderColor: "var(--line)" }}>
      {chart.title && <p className="mb-2 text-center text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{chart.title}</p>}
      <Chart option={option} height={Math.min(420, Math.max(280, categories.length * 12 + 260))} />
      <ChartTable chart={chart} categories={categories} compact />
      {chart.source && <p className="mt-3 text-[11px]" style={{ color: "var(--body)" }}>Source: {chart.source}</p>}
    </div>
  );
}

function ChartTable({ chart, categories, compact = false }: { chart: ChartData; categories: string[]; compact?: boolean }) {
  return (
    <div className={compact ? "mt-2 overflow-x-auto" : "overflow-x-auto"}>
      <table className="w-full min-w-[420px] border-collapse text-left text-[11.5px]" aria-label={chart.title || "Task 1 visual data"}>
        <thead>
          <tr style={{ background: "var(--bg-soft)" }}>
            <th className="border px-2.5 py-2 font-semibold" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              {chart.xAxis?.[0] || "Category"}
            </th>
            {chart.series.map((series) => (
              <th key={series.name} className="border px-2.5 py-2 font-semibold" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                {series.name}{chart.unit ? ` (${chart.unit})` : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={`${category}-${index}`}>
              <td className="border px-2.5 py-2" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>{category}</td>
              {chart.series.map((series) => (
                <td key={`${series.name}-${index}`} className="border px-2.5 py-2" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                  {series.data[index] ?? "—"}{chart.unit ? ` ${chart.unit}` : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
