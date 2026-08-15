"use client";

import { useEffect, useState } from "react";
import { Users, Crown, ShoppingCart, BookOpen, Gauge } from "lucide-react";

type Overview = {
  totalUsers: number;
  activeSubscriptions: number;
  totalOrders: number;
  courseEnrollment: number;
  readinessRuns: number;
};

const CARDS: {
  key: keyof Overview;
  label: string;
  icon: typeof Users;
  gradient: string;
  caption: (v: Overview) => string | undefined;
}[] = [
  {
    key: "totalUsers",
    label: "Total users",
    icon: Users,
    gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
    caption: () => "All registered members",
  },
  {
    key: "activeSubscriptions",
    label: "Active subscription",
    icon: Crown,
    gradient: "linear-gradient(135deg,#F59E0B,#F97316)",
    caption: (v) =>
      v.totalUsers > 0 ? `${Math.round((v.activeSubscriptions / v.totalUsers) * 100)}% of all users` : undefined,
  },
  {
    key: "totalOrders",
    label: "Total orders",
    icon: ShoppingCart,
    gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)",
    caption: () => "Paid seminar registrations",
  },
  {
    key: "courseEnrollment",
    label: "Course enrollment",
    icon: BookOpen,
    gradient: "linear-gradient(135deg,#10B981,#34D399)",
    caption: () => "Seminar registrations",
  },
  {
    key: "readinessRuns",
    label: "Readiness checks",
    icon: Gauge,
    gradient: "linear-gradient(135deg,#F43F5E,#FB7185)",
    caption: () => "Study abroad assessments run",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  caption,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  gradient: string;
  caption?: string;
}) {
  return (
    <div
      className="relative rounded-[22px] border bg-white p-5 overflow-hidden transition-transform duration-250 hover:translate-y-[-2px]"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: gradient }} />
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-4"
        style={{ background: gradient, boxShadow: `0 8px 18px -6px ${gradient}66` }}
      >
        <Icon size={19} strokeWidth={2.2} />
      </div>
      <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
        {label}
      </p>
      {caption && (
        <p className="text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}

export function StatCards() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {CARDS.map((c) => (
          <div key={c.key} className="rounded-[22px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <div className="w-11 h-11 rounded-2xl mb-4" style={{ background: "var(--line)" }} />
            <div className="h-[26px] w-16 rounded-lg mb-2" style={{ background: "var(--line)" }} />
            <div className="h-[10px] w-24 rounded" style={{ background: "var(--line)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {CARDS.map((c) => (
        <StatCard
          key={c.key}
          label={c.label}
          value={data[c.key] === null ? "—" : (data[c.key] as number).toLocaleString()}
          icon={c.icon}
          gradient={c.gradient}
          caption={c.caption(data)}
        />
      ))}
    </div>
  );
}