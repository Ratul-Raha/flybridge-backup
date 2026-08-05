"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { Card } from "./card";
import { Chart } from "./echart";
import { BRAND, SKY, CARD_TOOLTIP } from "./lib";

type Split = { free: number; paid: number; total: number };

export function SubscriptionPie() {
  const [data, setData] = useState<Split | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports/subscription-split", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const free = data?.free ?? 0;
    const paid = data?.paid ?? 0;
    return {
      tooltip: {
        ...CARD_TOOLTIP,
        trigger: "item",
        formatter: (p: unknown) => {
          const { name, value, percent } = p as { name: string; value: number; percent: number };
          return `<b>${name}</b><br/>${value} ${value === 1 ? "user" : "users"} · ${percent}%`;
        },
      },
      legend: {
        orient: "vertical",
        right: 6,
        top: "middle",
        itemWidth: 10,
        itemHeight: 10,
        icon: "circle",
        textStyle: { color: "#6A7187", fontSize: 11.5 },
        itemGap: 12,
      },
      series: [
        {
          type: "pie",
          radius: ["62%", "82%"],
          center: ["30%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#fff", borderWidth: 3, borderRadius: 8 },
          label: { show: false },
          emphasis: { scaleSize: 6 },
          data: [
            { name: "Paid", value: paid, itemStyle: { color: BRAND } },
            { name: "Free", value: free, itemStyle: { color: SKY } },
          ],
        },
      ],
      graphic: [
        {
          type: "text",
          left: "30%",
          top: "42%",
          style: {
            text: String(data?.total ?? 0),
            fill: "#12162A",
            fontSize: 22,
            fontWeight: 700,
            textAlign: "center",
          },
        },
        {
          type: "text",
          left: "30%",
          top: "52%",
          style: { text: "total users", fill: "#A6ADC0", fontSize: 10, textAlign: "center" },
        },
      ],
    };
  }, [data]);

  return (
    <Card title="Free vs paid" subtitle="Subscription split of all users">
      <Chart option={option} height={300} />
    </Card>
  );
}