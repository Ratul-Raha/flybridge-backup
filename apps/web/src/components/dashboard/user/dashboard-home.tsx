"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, BookOpen, FolderOpen, ArrowUpRight, Gauge, Award } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { programs } from "@/lib/programs";
import { ScholarshipTicker } from "@/components/dashboard/scholarship-ticker";

type Stat = {
  label: string;
  value: string;
  icon: typeof CalendarDays;
  href?: string;
};

export function DashboardHome() {
  const { user } = useAuth();
  const [seminarCount, setSeminarCount] = useState<number | null>(null);
  const [resourceCount, setResourceCount] = useState<number | null>(null);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/me/readiness", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { assessment?: { score?: number } | null }) =>
        setReadinessScore(data.assessment?.score ?? null)
      )
      .catch(() => setReadinessScore(null));
  }, []);

  useEffect(() => {
    fetch("/api/me/seminars", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSeminarCount((data.seminars ?? []).length))
      .catch(() => setSeminarCount(null));
  }, []);

  useEffect(() => {
    fetch("/api/resources", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setResourceCount((data.resources ?? []).length))
      .catch(() => setResourceCount(null));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const stats: Stat[] = [
    {
      label: "Seminars registered",
      value: seminarCount === null ? "—" : String(seminarCount),
      icon: CalendarDays,
      href: "/dashboard/seminars/mine",
    },
    {
      label: "Courses available",
      value: String(programs.length),
      icon: BookOpen,
      href: "/dashboard/courses",
    },
    {
      label: "Resources",
      value: resourceCount === null ? "—" : String(resourceCount),
      icon: FolderOpen,
      href: "/dashboard/resources",
    },
    {
      label: "Readiness score",
      value: readinessScore === null ? "—" : String(readinessScore),
      icon: Gauge,
      href: "/dashboard/readiness",
    },
  ];

  const quickLinks = [
    {
      label: "Browse seminars",
      desc: "Upcoming live sessions",
      href: "/dashboard/seminars",
      icon: CalendarDays,
    },
    {
      label: "My seminars",
      desc: "Your registrations",
      href: "/dashboard/seminars/mine",
      icon: CalendarDays,
    },
    {
      label: "Explore courses",
      desc: "Programs & curriculums",
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      label: "Resources",
      desc: "Guides, templates & toolkits",
      href: "/dashboard/resources",
      icon: FolderOpen,
    },
    {
      label: "Scholarships",
      desc: "Fund your studies abroad",
      href: "/dashboard/scholarships",
      icon: Award,
    },
    {
      label: "Readiness score",
      desc: "Eligibility score & AI report",
      href: "/dashboard/readiness",
      icon: Gauge,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <ScholarshipTicker />

      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--brand)" }}>
          {today}
        </p>
        <h1 className="font-display text-[clamp(22px,3vw,28px)] font-semibold tracking-[-0.02em] mt-2" style={{ color: "var(--ink)" }}>
          Welcome back, {firstName}
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--body)" }}>
          Here's what's happening on FlyBridge.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href ?? "#"}
            className="rounded-[20px] border bg-white p-4 md:p-6 flex flex-col gap-3 transition-all duration-250 hover:translate-y-[-1px]"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <s.icon size={16} strokeWidth={2} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[20px] md:text-[26px] font-semibold" style={{ color: "var(--ink)" }}>
                {s.value}
              </span>
              <span className="text-[11px] md:text-[12.5px]" style={{ color: "var(--body)" }}>
                {s.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
        {quickLinks.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="group flex items-center gap-4 rounded-[20px] border bg-white p-4 md:p-5 transition-all duration-250 hover:translate-y-[-1px]"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <q.icon size={18} strokeWidth={2} />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                {q.label}
              </span>
              <span className="text-[12px]" style={{ color: "var(--body)" }}>
                {q.desc}
              </span>
            </span>
            <ArrowUpRight
              size={16}
              className="ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
              style={{ color: "var(--body)" }}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
