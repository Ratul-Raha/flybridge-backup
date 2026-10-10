"use client";

import { useEffect, useState } from "react";
import { UserPlus, CalendarCheck, CalendarPlus, Activity } from "lucide-react";
import { Card } from "./card";
import { timeAgo, BRAND, SKY, EMERALD } from "./lib";
import { InlineLoader } from "@/components/dashboard/page-loader";

type ActivityItem = {
  id: string;
  type: "signup" | "registration" | "seminar";
  text: string;
  sub: string;
  avatar: string | null;
  at: string;
};

const TYPE_STYLE: Record<ActivityItem["type"], { bg: string; fg: string; icon: typeof UserPlus }> = {
  signup: { bg: "rgba(110,76,255,0.1)", fg: BRAND, icon: UserPlus },
  registration: { bg: "rgba(14,165,233,0.1)", fg: SKY, icon: CalendarCheck },
  seminar: { bg: "rgba(16,185,129,0.1)", fg: EMERALD, icon: CalendarPlus },
};

export function PlatformActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports/platform-activity", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setItems(res.data?.activity ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card
      title="Platform activity"
      subtitle="Latest events across the platform"
      action={<Activity size={16} style={{ color: "var(--body)" }} />}
    >
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
        {loading && <InlineLoader label="Loading…" />}
        {!loading && items.length === 0 && (
          <p className="text-[13px] py-6 text-center" style={{ color: "var(--body)" }}>
            No activity yet.
          </p>
        )}
        {items.map((item) => {
          const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.signup;
          const Icon = style.icon;
          return (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: style.bg, color: style.fg }}
              >
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                  {item.text}
                </p>
                <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  {item.sub}
                </p>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: "var(--body)" }}>
                {timeAgo(item.at)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}