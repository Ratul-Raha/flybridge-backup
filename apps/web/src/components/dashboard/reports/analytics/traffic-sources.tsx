"use client";

import { Globe, MonitorSmartphone, MapPin } from "lucide-react";
import { Card } from "../card";
import { SKY, EMERALD, ROSE } from "../lib";
import { RankedList } from "./ranked-list";
import type { TrafficSource } from "@/lib/analytics/types";

export function TrafficSources({ data }: { data: TrafficSource | null }) {
  const window = data?.window ?? 30;
  const subtitle = `Active users in the last ${window} minutes`;

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      <Card title="Traffic sources" subtitle={subtitle} action={<Globe size={16} style={{ color: "var(--body)" }} />}>
        <RankedList
          rows={data?.sources ?? []}
          unit="users"
          emptyText="No referrer data in this window."
          color={SKY}
        />
      </Card>

      <Card
        title="Devices"
        subtitle={subtitle}
        action={<MonitorSmartphone size={16} style={{ color: "var(--body)" }} />}
      >
        <RankedList
          rows={data?.devices ?? []}
          unit="users"
          emptyText="No device data in this window."
          color={EMERALD}
        />
      </Card>

      <Card
        title="Countries"
        subtitle={subtitle}
        action={<MapPin size={16} style={{ color: "var(--body)" }} />}
      >
        <RankedList
          rows={data?.countries ?? []}
          unit="users"
          emptyText="No location data in this window."
          color={ROSE}
        />
      </Card>
    </div>
  );
}
