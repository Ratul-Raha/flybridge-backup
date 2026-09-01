"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Crown, ShoppingCart, BookOpen, Gauge, Download, Award, ArrowUpRight } from "lucide-react";

type Overview = {
  totalUsers: number;
  activeSubscriptions: number;
  totalOrders: number;
  courseEnrollment: number;
  readinessRuns: number;
  certificatesIssued: number;
  certificatesDownloaded: number;
};

const CARDS: {
  key: keyof Overview;
  label: string;
  icon: typeof Users;
  gradient: string;
  href: string;
  caption: (v: Overview) => string | undefined;
}[] = [
  {
    key: "totalUsers",
    label: "Total users",
    icon: Users,
    gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
    href: "/dashboard/admin/users",
    caption: () => "All registered members",
  },
  {
    key: "activeSubscriptions",
    label: "Active subscription",
    icon: Crown,
    gradient: "linear-gradient(135deg,#F59E0B,#F97316)",
    href: "/dashboard/admin/users?subscription=paid",
    caption: (v) =>
      v.totalUsers > 0 ? `${Math.round((v.activeSubscriptions / v.totalUsers) * 100)}% of all users` : undefined,
  },
  {
    key: "totalOrders",
    label: "Total orders",
    icon: ShoppingCart,
    gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)",
    href: "/dashboard/admin/orders",
    caption: () => "All orders placed",
  },
  {
    key: "courseEnrollment",
    label: "Course enrollment",
    icon: BookOpen,
    gradient: "linear-gradient(135deg,#10B981,#34D399)",
    href: "/dashboard/courses",
    caption: () => "Active course enrollments",
  },
  {
    key: "certificatesIssued",
    label: "Certificates issued",
    icon: Award,
    gradient: "linear-gradient(135deg,#7C3AED,#A855F7)",
    href: "/dashboard/admin/users",
    caption: () => "Courses fully completed",
  },
  {
    key: "certificatesDownloaded",
    label: "Certificates downloaded",
    icon: Download,
    gradient: "linear-gradient(135deg,#0284C7,#06B6D4)",
    href: "/dashboard/admin/users?certificateDownloaded=yes",
    caption: (v) =>
      v.certificatesIssued > 0
        ? `${Math.round((v.certificatesDownloaded / v.certificatesIssued) * 100)}% of issued downloaded`
        : "None downloaded yet",
  },
  {
    key: "readinessRuns",
    label: "Readiness checks",
    icon: Gauge,
    gradient: "linear-gradient(135deg,#F43F5E,#FB7185)",
    href: "/dashboard/admin/readiness",
    caption: () => "Study abroad assessments run",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  caption,
  href,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  gradient: string;
  caption?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-lg border bg-white p-5 overflow-hidden block transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(16,24,40,0.28)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-150"
        style={{ background: gradient }}
      />
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4 transition-transform duration-250 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: gradient, boxShadow: `0 8px 18px -6px ${gradient}66` }}
      >
        <Icon size={19} strokeWidth={2.2} />
      </div>
      <p className="font-display text-[26px] font-semibold leading-none transition-colors duration-200 group-hover:text-[var(--brand)]" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2 flex items-center gap-1" style={{ color: "var(--body)" }}>
        {label}
        <ArrowUpRight
          size={12}
          className="opacity-0 -translate-x-1 translate-y-1 transition-all duration-250 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
          style={{ color: "var(--brand)" }}
        />
      </p>
      {caption && (
        <p className="text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
          {caption}
        </p>
      )}
      <div
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: gradient }}
      />
    </Link>
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <div key={c.key} className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <div className="w-11 h-11 rounded-lg mb-4" style={{ background: "var(--line)" }} />
            <div className="h-[26px] w-16 rounded-lg mb-2" style={{ background: "var(--line)" }} />
            <div className="h-[10px] w-24 rounded" style={{ background: "var(--line)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {CARDS.map((c) => (
        <StatCard
          key={c.key}
          label={c.label}
          value={data[c.key] === null ? "—" : (data[c.key] as number).toLocaleString()}
          icon={c.icon}
          gradient={c.gradient}
          href={c.href}
          caption={c.caption(data)}
        />
      ))}
    </div>
  );
}