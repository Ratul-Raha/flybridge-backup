"use client";

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { Card } from "./card";
import { Chart } from "./echart";
import { CARD_TOOLTIP } from "./lib";

type StatusCount = { status: string; count: number };

const STATUS_COLORS: Record<string, string> = {
  completed: "#10B981",
  pending: "#F59E0B",
  failed: "#EF4444",
  cancelled: "#6B7280",
  refunded: "#8B5CF6",
};

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrderStatusChart({ data }: { data: StatusCount[] | null }) {
  const total = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  const option = useMemo<EChartsOption>(() => {
    const items = data ?? [];
    return {
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "item",
        formatter: (params: unknown) => {
          const point = params as { name: string; value: number; percent: number };
          return `<b>${statusLabel(point.name)}</b><br/>${point.value.toLocaleString()} orders · ${point.percent}%`;
        },
      },
      legend: {
        orient: "vertical",
        right: 0,
        top: "middle",
        itemWidth: 9,
        itemHeight: 9,
        icon: "circle",
        itemGap: 11,
        textStyle: { color: "#6A7187", fontSize: 11 },
        formatter: (name: string) => {
          const item = items.find((entry) => entry.status === name);
          return item ? `${statusLabel(name)}  ${item.count.toLocaleString()}` : statusLabel(name);
        },
      },
      series: [
        {
          type: "pie",
          radius: ["55%", "78%"],
          center: ["29%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#fff", borderWidth: 2.5, borderRadius: 6 },
          label: { show: false },
          emphasis: { scale: false },
          data: items.map((item) => ({
            name: item.status,
            value: item.count,
            itemStyle: { color: STATUS_COLORS[item.status] ?? "#6B7280" },
          })),
        },
      ],
      graphic: [
        {
          type: "text",
          left: "29%",
          top: "42%",
          style: {
            text: total.toLocaleString(),
            fill: "#12162A",
            fontSize: 21,
            fontWeight: 700,
            textAlign: "center",
          },
        },
        {
          type: "text",
          left: "29%",
          top: "54%",
          style: { text: "orders", fill: "#A6ADC0", fontSize: 10, textAlign: "center" },
        },
      ],
    };
  }, [data, total]);

  return (
    <Card title="Order status" subtitle="Current order breakdown">
      {data === null ? (
        <InlineLoader label="Loading order status…" />
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-[13px]" style={{ color: "var(--body)" }}>
          No order data yet.
        </p>
      ) : (
        <Chart option={option} height={300} />
      )}
    </Card>
  );
}
