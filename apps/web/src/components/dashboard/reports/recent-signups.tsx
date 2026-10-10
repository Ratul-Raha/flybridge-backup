"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/dashboard/avatar";
import { Card } from "./card";
import { InlineLoader } from "@/components/dashboard/page-loader";

type Signup = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  accountType: string;
  createdAt: string;
};

export function RecentSignups() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports/recent-signups", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setSignups(res.data?.signups ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Recent sign ups" subtitle="Newest members on the platform">
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
        {loading && <InlineLoader label="Loading…" />}
        {!loading && signups.length === 0 && (
          <p className="text-[13px] py-6 text-center" style={{ color: "var(--body)" }}>
            No signups yet.
          </p>
        )}
        {signups.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-2.5">
            <Avatar name={s.name} src={s.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                {s.name}
              </p>
              <p className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                {s.email}
              </p>
            </div>
            <span className="text-[11px] shrink-0" style={{ color: "var(--body)" }}>
              {new Date(s.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}