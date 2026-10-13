"use client";

import Link from "next/link";
import {
  Users,
  UserPlus,
  DollarSign,
  ShoppingCart,
  BookOpen,
  Gauge,
  Download,
  Award,
  ArrowUpRight,
} from "lucide-react";
import { InlineLoader } from "@/components/dashboard/page-loader";
import { useCurrency } from "@/components/dashboard/currency-context";

type Overview = {
  totalUsers: number;
  courseEnrollment: number;
  readinessRuns: number;
  certificatesIssued: number;
  certificatesDownloaded: number;
};

type Stat = {
  key: string;
  label: string;
  value: string | number;
  icon: typeof Users;
  gradient: string;
  href: string;
  caption?: string;
};

type OrderSummary = { totalOrders: number; totalRevenue: number };

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
      <p
        className="font-display text-[26px] font-semibold leading-none transition-colors duration-200 group-hover:text-[var(--brand)]"
        style={{ color: "var(--ink)" }}
      >
        {value}
      </p>
      <p
        className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2 flex items-center gap-1"
        style={{ color: "var(--body)" }}
      >
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

export function StatCards({
  data,
  newSignups,
  orders,
}: {
  data: Overview | null;
  newSignups: number;
  orders: OrderSummary | null;
}) {
  const { fmt } = useCurrency();

  if (!data) {
    return <InlineLoader label="Loading…" />;
  }

  const cards: Stat[] = [
    {
      key: "totalUsers",
      label: "Total users",
      value: data.totalUsers,
      icon: Users,
      gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)",
      href: "/dashboard/admin/users",
      caption: "All registered members",
    },
    {
      key: "newSignups",
      label: "New signups · 14 days",
      value: newSignups,
      icon: UserPlus,
      gradient: "linear-gradient(135deg,#0284C7,#38BDF8)",
      href: "/dashboard/admin/users",
      caption: "Recent member growth",
    },
    {
      key: "revenue",
      label: "Revenue",
      value: orders ? fmt(orders.totalRevenue) : "—",
      icon: DollarSign,
      gradient: "linear-gradient(135deg,#10B981,#34D399)",
      href: "/dashboard/admin/orders",
      caption: "Completed orders · selected currency",
    },
    {
      key: "totalOrders",
      label: "Total orders",
      value: orders?.totalOrders ?? "—",
      icon: ShoppingCart,
      gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)",
      href: "/dashboard/admin/orders",
      caption: "All statuses · selected currency",
    },
    {
      key: "courseEnrollment",
      label: "Course enrollments",
      value: data.courseEnrollment,
      icon: BookOpen,
      gradient: "linear-gradient(135deg,#10B981,#34D399)",
      href: "/dashboard/courses",
      caption: "Active course enrollments",
    },
    {
      key: "readinessRuns",
      label: "Readiness checks",
      value: data.readinessRuns,
      icon: Gauge,
      gradient: "linear-gradient(135deg,#F43F5E,#FB7185)",
      href: "/dashboard/admin/readiness",
      caption: "Study abroad assessments run",
    },
    {
      key: "certificatesIssued",
      label: "Certificates issued",
      value: data.certificatesIssued,
      icon: Award,
      gradient: "linear-gradient(135deg,#7C3AED,#A855F7)",
      href: "/dashboard/admin/users",
      caption: "Courses fully completed",
    },
    {
      key: "certificatesDownloaded",
      label: "Certificates downloaded",
      value: data.certificatesDownloaded,
      icon: Download,
      gradient: "linear-gradient(135deg,#0284C7,#06B6D4)",
      href: "/dashboard/admin/users?certificateDownloaded=yes",
      caption:
        data.certificatesIssued > 0
          ? `${Math.round((data.certificatesDownloaded / data.certificatesIssued) * 100)}% of issued downloaded`
          : "None downloaded yet",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <StatCard
          key={c.key}
          label={c.label}
          value={typeof c.value === "number" ? c.value.toLocaleString() : c.value}
          icon={c.icon}
          gradient={c.gradient}
          href={c.href}
          caption={c.caption}
        />
      ))}
    </div>
  );
}
