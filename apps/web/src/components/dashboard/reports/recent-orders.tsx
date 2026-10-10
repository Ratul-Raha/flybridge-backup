"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/dashboard/avatar";
import { Card } from "./card";
import { priceLabel } from "./lib";
import { InlineLoader } from "@/components/dashboard/page-loader";

type Order = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  seminar: string;
  type: string;
  price: number;
  createdAt: string;
};

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports/recent-orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setOrders(res.data?.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Recent orders" subtitle="Latest seminar registrations">
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
        {loading && <InlineLoader label="Loading…" />}
        {!loading && orders.length === 0 && (
          <p className="text-[13px] py-6 text-center" style={{ color: "var(--body)" }}>
            No orders yet.
          </p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="flex items-center gap-3 py-2.5">
            <Avatar name={o.name} src={o.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                {o.name}
              </p>
              <p className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                {o.seminar} · {new Date(o.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              className="font-mono text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0"
              style={
                o.type === "paid"
                  ? { background: "rgba(245,158,11,0.12)", color: "#B45309" }
                  : { background: "rgba(14,165,233,0.12)", color: "#0369A1" }
              }
            >
              {priceLabel(o.type, o.price)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}