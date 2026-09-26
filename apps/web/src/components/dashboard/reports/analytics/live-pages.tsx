"use client";

import { FileText, MousePointerClick } from "lucide-react";
import { Card } from "../card";
import { BRAND, AMBER } from "../lib";
import { RankedList } from "./ranked-list";
import type { TrafficSource } from "@/lib/analytics/types";

export function LivePages({ data }: { data: TrafficSource | null }) {
  const window = data?.window ?? 30;

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card
        title="Pages right now"
        subtitle={`Most viewed pages in the last ${window} minutes`}
        action={<FileText size={16} style={{ color: "var(--body)" }} />}
      >
        <RankedList
          rows={data?.pages ?? []}
          unit="users"
          secondaryLabel="views"
          emptyText="No page views in this window."
          color={BRAND}
        />
      </Card>

      <Card
        title="Live events"
        subtitle={`Events fired in the last ${window} minutes`}
        action={<MousePointerClick size={16} style={{ color: "var(--body)" }} />}
      >
        <RankedList
          rows={data?.events ?? []}
          unit="hits"
          secondaryLabel="users"
          emptyText="No events in this window."
          color={AMBER}
        />
      </Card>
    </div>
  );
}
