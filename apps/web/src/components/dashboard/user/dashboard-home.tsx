"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  BookOpen,
  FolderOpen,
  Target,
  ArrowUpRight,
  PlayCircle,
  Hourglass,
  CheckCircle2,
  Bell,
  GraduationCap,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ScholarshipTicker } from "@/components/dashboard/scholarship-ticker";
import { BengaliText } from "@/components/bengali-text";
import { PageLoader } from "@/components/dashboard/page-loader";
import { DashboardMyRank } from "@/components/dashboard/user/dashboard-my-rank";

type Stat = {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof CalendarDays;
  href?: string;
  accent: string;
  bg: string;
  glow: string;
};

type MiniCourse = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  progress: { percentage: number; passed: boolean } | null;
};

type MiniSeminar = {
  id: string;
  title: string;
  dateTime: string;
};

function scoreColor(score: number): string {
  if (score >= 80) return "var(--brand-2)";
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#E0572E";
}

export function DashboardHome() {
  const { user } = useAuth();
  const [seminarCount, setSeminarCount] = useState<number>(0);
  const [resourceCount, setResourceCount] = useState<number>(0);
  const [score, setScore] = useState<number | null>(null);
  const [scoreLabel, setScoreLabel] = useState<string>("");
  const [unread, setUnread] = useState<number | null>(null);
  const [courses, setCourses] = useState<MiniCourse[]>([]);
  const [seminars, setSeminars] = useState<MiniSeminar[]>([]);
  const [settled, setSettled] = useState(0);

  useEffect(() => {
    fetch("/api/me/readiness", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const a = data?.assessment;
        if (a && typeof a.score === "number") {
          setScore(a.score);
          setScoreLabel(a.label ?? "");
        } else {
          setScore(null);
        }
      })
      .catch(() => setScore(null))
      .finally(() => setSettled((n) => n + 1));
  }, []);

  useEffect(() => {
    fetch("/api/me/seminars", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.seminars) ? data.seminars : [];
        setSeminarCount(list.length);
        setSeminars(
          list
            .map((s: { id: string; title: string; dateTime: string }) => ({
              id: s.id,
              title: s.title,
              dateTime: s.dateTime,
            }))
            .slice(0, 3)
        );
      })
      .catch(() => setSeminarCount(0))
      .finally(() => setSettled((n) => n + 1));
  }, []);

  useEffect(() => {
    fetch("/api/resources", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setResourceCount((data.resources ?? []).length))
      .catch(() => setResourceCount(0))
      .finally(() => setSettled((n) => n + 1));
  }, []);

  useEffect(() => {
    fetch("/api/me/courses", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.courses) ? data.courses : [];
        const enrolledIds = new Set<string>(data?.enrolled ?? []);
        const mine = list.filter((c: MiniCourse) => enrolledIds.has(c.id));
        setCourses(
          mine
            .map((c: MiniCourse) => c)
            .sort(
              (a: MiniCourse, b: MiniCourse) =>
                (b.progress?.percentage ?? 0) - (a.progress?.percentage ?? 0)
            )
            .slice(0, 3)
        );
      })
      .catch(() => setCourses([]))
      .finally(() => setSettled((n) => n + 1));
  }, []);

  useEffect(() => {
    fetch("/api/notifications?limit=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setUnread(typeof data.unreadCount === "number" ? data.unreadCount : null))
      .catch(() => setUnread(null))
      .finally(() => setSettled((n) => n + 1));
  }, []);

  if (settled < 5) {
    return <PageLoader label="Loading dashboard…" />;
  }

  const firstName = user?.name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const enrolledCount = courses.length;
  const activeCount = courses.filter((c) => (c.progress?.percentage ?? 0) > 0 && !c.progress?.passed).length;
  const avgProgress = courses.length
    ? Math.round(courses.reduce((n, c) => n + (c.progress?.percentage ?? 0), 0) / courses.length)
    : 0;

  const stats: Stat[] = [
    {
      label: "Enrolled courses",
      value: enrolledCount,
      hint: avgProgress > 0 ? `${avgProgress}% avg progress` : "Start a course",
      icon: BookOpen,
      href: "/dashboard/courses/mine",
      accent: "#2F5FE0",
      bg: "#EAF1FF",
      glow: "rgba(47,95,224,0.16)",
    },
    {
      label: "Seminars registered",
      value: seminarCount,
      hint: seminarCount > 0 ? "View your sessions" : "Find a live session",
      icon: CalendarDays,
      href: "/dashboard/seminars/mine",
      accent: "#6B4CE0",
      bg: "#F1EEFC",
      glow: "rgba(107,76,224,0.16)",
    },
    {
      label: "Resources available",
      value: resourceCount,
      hint: "Guides & templates",
      icon: FolderOpen,
      href: "/dashboard/resources",
      accent: "#188A5D",
      bg: "#E8F7F1",
      glow: "rgba(24,138,93,0.14)",
    },
    {
      label: "Active learning",
      value: activeCount,
      hint: "In progress now",
      icon: TrendingUp,
      href: "/dashboard/courses/mine",
      accent: "#DB8A2E",
      bg: "#FFF2E4",
      glow: "rgba(219,138,46,0.16)",
    },
  ];

  const upcoming = seminars.filter(
    (s) => new Date(s.dateTime).getTime() > Date.now()
  );

  const scoreValue = score ?? 0;
  const scoreRadius = 52;
  const scoreCirc = 2 * Math.PI * scoreRadius;
  const scoreOffset = scoreCirc - (scoreValue / 100) * scoreCirc;
  const scoreColors = scoreColor(scoreValue);

  const quickLinks = [
    { label: "Browse seminars", desc: "Upcoming live sessions", href: "/dashboard/seminars", icon: CalendarDays, accent: "#6B4CE0", bg: "#F1EEFC" },
    { label: "Explore courses", desc: "Programs & curriculums", href: "/dashboard/courses", icon: BookOpen, accent: "#2F5FE0", bg: "#EAF1FF" },
    { label: "Resources", desc: "Guides, templates & toolkits", href: "/dashboard/resources", icon: FolderOpen, accent: "#188A5D", bg: "#E8F7F1" },
    { label: "Scholarships", desc: "Fund your studies abroad", href: "/dashboard/scholarships", icon: GraduationCap, accent: "#DB8A2E", bg: "#FFF2E4" },
    { label: "Readiness score", desc: "Eligibility report", href: "/dashboard/readiness", icon: Target, accent: "#E0572E", bg: "#FCEDE9" },
    { label: "SOP Generator", desc: "Draft your statement", href: "/dashboard/sop-generator", icon: FileText, accent: "#0FA968", bg: "#E2F6EE" },
  ];

  return (
    <div className="flex flex-col gap-7">
      <ScholarshipTicker />

      {/* Welcome hero */}
      <div
        className="relative overflow-hidden rounded-lg text-white px-6 md:px-10 py-8 md:py-10"
        style={{ background: "linear-gradient(135deg, #0E2740 0%, #102A43 45%, #175C7A 100%)" }}
      >
        <div
          className="absolute -right-24 -top-28 h-64 w-64 rounded-full opacity-90"
          style={{ background: "radial-gradient(circle, rgba(20,181,126,0.35), transparent 70%)" }}
        />
        <div
          className="absolute left-1/2 -bottom-32 h-64 w-64 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(47,95,224,0.35), transparent 70%)" }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] rounded-full px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                {today}
              </span>
            </div>
            <h1 className="font-display text-[clamp(24px,3.4vw,34px)] font-semibold tracking-[-0.02em] mt-4 leading-[1.15] text-balance">
              Welcome back, {firstName}
            </h1>
            <p className="text-[14px] leading-[1.6] mt-2.5 max-w-[46ch]" style={{ color: "rgba(255,255,255,0.78)" }}>
              Here&apos;s your learning at a glance. Keep building toward your future abroad — one step at a time.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 rounded-full px-5 py-[11px] text-[13.5px] font-semibold transition-all duration-250 hover:translate-y-[-1px] hover:opacity-95"
                style={{ background: "var(--brand-2)", color: "#fff" }}
              >
                <PlayCircle size={16} />
                Continue learning
              </Link>
              <Link
                href="/dashboard/seminars"
                className="inline-flex items-center gap-2 rounded-full px-5 py-[11px] text-[13.5px] font-semibold transition-all duration-250 hover:translate-y-[-1px]"
                style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}
              >
                <CalendarDays size={16} />
                Find a seminar
              </Link>
            </div>
          </div>

          {/* Score ring */}
          <div className="relative flex items-center gap-5 rounded-lg bg-white/10 backdrop-blur px-6 py-5 lg:min-w-[280px]">
            <div className="relative h-[104px] w-[104px] shrink-0">
              <svg width="104" height="104" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r={scoreRadius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
                <circle
                  cx="60"
                  cy="60"
                  r={scoreRadius}
                  fill="none"
                  stroke={scoreColors}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={scoreCirc}
                  strokeDashoffset={score ? scoreOffset : scoreCirc}
                  style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[24px] font-semibold leading-none" style={{ color: score ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {score === null ? "—" : scoreValue}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  /100
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.65)" }}>
                Readiness score
              </span>
              <span className="font-display text-[18px] font-semibold leading-snug">
                {score === null ? "Not assessed yet" : scoreLabel || `${scoreValue}`}
              </span>
              <Link
                href="/dashboard/readiness"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mt-1"
                style={{ color: "var(--brand-2)" }}
              >
                {score === null ? "Take the assessment" : "View my report"}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href ?? "#"}
                className="group relative overflow-hidden rounded-lg border p-5 flex flex-col justify-between gap-5 transition-all duration-250 hover:translate-y-[-2px] hover:shadow-[0_18px_36px_-22px_rgba(18,32,67,0.35)]"
                style={{ borderColor: "var(--line)", background: s.bg }}
              >
                <span
                  className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-2xl transition-opacity duration-300 opacity-70 group-hover:opacity-100"
                  style={{ background: s.glow }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: s.accent }}>
                    {s.label}
                  </span>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-250 group-hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.7)", color: s.accent, boxShadow: `0 4px 14px -4px ${s.glow}` }}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </span>
                </div>
                <div className="relative flex items-end justify-between gap-3">
                  <span
                    className="font-display text-[34px] font-semibold leading-none tracking-[-0.03em]"
                    style={{ color: "var(--ink)" }}
                  >
                    {s.value}
                  </span>
                  {s.hint && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium leading-none"
                      style={{ background: "rgba(255,255,255,0.7)", color: "var(--body)" }}
                    >
                      {s.hint}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* My rank */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          <DashboardMyRank />
          <div className="hidden lg:col-span-2 lg:flex flex-col justify-center rounded-lg border border-dashed px-5 py-5" style={{ borderColor: "var(--line)" }}>
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              Climb the weekly board
            </p>
            <p className="text-[12.5px] mt-1 leading-[1.6]" style={{ color: "var(--body)" }}>
              Your rank is weighted by lessons finished, quiz accuracy and recent momentum, reshuffled every Monday. Keep learning to rise.
            </p>
          </div>
        </div>
      </section>

      {/* Two-column content */}
      <div className="grid lg:grid-cols-5 gap-4 md:gap-5">
        {/* Continue learning */}
        <section className="lg:col-span-3 rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                Continue learning
              </h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                Pick up where you left off.
              </p>
            </div>
            <Link
              href="/dashboard/courses/mine"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold shrink-0"
              style={{ color: "var(--brand)" }}
            >
              All courses
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div
              className="rounded-lg px-5 py-10 flex flex-col items-center text-center gap-3"
              style={{ background: "var(--bg-soft)" }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-md"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <BookOpen size={22} strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  No courses yet
                </p>
                <p className="text-[12.5px] mt-1 max-w-[300px] mx-auto" style={{ color: "var(--body)" }}>
                  Enroll in a course to unlock step-by-step lessons and track your progress here.
                </p>
              </div>
              <Link
                href="/dashboard/courses"
                className="mt-1 inline-flex items-center gap-1.5 rounded-full text-white text-[13px] font-semibold px-5 py-2.5 transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                <BookOpen size={14} />
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((c) => {
                const pct = c.progress?.percentage ?? 0;
                const passed = c.progress?.passed ?? false;
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/courses/${c.slug}/learn`}
                    className="group flex items-center gap-4 rounded-lg border px-4 py-3.5 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_24px_-18px_rgba(18,32,67,0.28)]"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span
                      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md flex items-center justify-center"
                      style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image ?? ""}
                        alt=""
                        className={`object-cover ${c.image ? "" : "hidden"}`}
                        style={{ width: "100%", height: "100%" }}
                      />
                      {!c.image && <BookOpen size={18} strokeWidth={1.8} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[13.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                          <BengaliText>{c.title}</BengaliText>
                        </span>
                        {passed ? (
                          <span
                            className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1 shrink-0"
                            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                          >
                            <CheckCircle2 size={12} />
                            Passed
                          </span>
                        ) : (
                          <span className="font-mono text-[12px] font-semibold shrink-0" style={{ color: "var(--brand)" }}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-soft)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: passed ? "var(--brand-2)" : "var(--brand)" }}
                        />
                      </div>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
                      style={{ color: "var(--body)" }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming seminars */}
        <section className="lg:col-span-2 rounded-lg border bg-white p-5 md:p-6" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                Your sessions
              </h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                Registered upcoming seminars.
              </p>
            </div>
            <Link
              href="/dashboard/seminars/mine"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold shrink-0"
              style={{ color: "var(--brand)" }}
            >
              All
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {seminarCount === 0 ? (
            <div
              className="rounded-lg px-5 py-10 flex flex-col items-center text-center gap-3"
              style={{ background: "var(--bg-soft)" }}
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-md"
                style={{ background: "#F1EEFC", color: "#6B4CE0" }}
              >
                <CalendarDays size={22} strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  No seminars yet
                </p>
                <p className="text-[12.5px] mt-1 max-w-[280px] mx-auto" style={{ color: "var(--body)" }}>
                  Register for a live seminar for real-time guidance on your journey abroad.
                </p>
              </div>
              <Link
                href="/dashboard/seminars"
                className="mt-1 inline-flex items-center gap-1.5 rounded-full text-white text-[13px] font-semibold px-5 py-2.5 transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
                style={{ background: "#6B4CE0" }}
              >
                <CalendarDays size={14} />
                Browse seminars
              </Link>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border px-4 py-4" style={{ borderColor: "var(--line)" }}>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Hourglass size={17} />
              </span>
              <p className="text-[13px] leading-[1.5]" style={{ color: "var(--body)" }}>
                No upcoming sessions right now. New seminars are added regularly — check back soon.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcoming.map((s) => {
                const d = new Date(s.dateTime);
                const dateNum = d.toLocaleDateString("en-US", { day: "2-digit" });
                const month = d.toLocaleDateString("en-US", { month: "short" });
                const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <Link
                    key={s.id}
                    href={`/dashboard/seminars/mine/${s.id}`}
                    className="group flex items-center gap-3.5 rounded-lg border px-4 py-3 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_12px_24px_-18px_rgba(18,32,67,0.28)]"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md"
                      style={{ background: "#F1EEFC", color: "#6B4CE0" }}
                    >
                      <span className="font-display text-[15px] font-semibold leading-none">{dateNum}</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider">{month}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                        <BengaliText>{s.title}</BengaliText>
                      </span>
                      <span className="block text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                        {d.toLocaleDateString("en-US", { weekday: "short" })} · {time}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
                      style={{ color: "var(--body)" }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
              Explore FlyBridge
            </h2>
            <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
              Quick shortcuts across your dashboard.
            </p>
          </div>
          {unread !== null && unread > 0 && (
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-2 text-[12.5px] font-semibold"
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full font-mono text-[10.5px] font-semibold px-3 py-1.5"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Bell size={12} />
                {unread} new
              </span>
            </Link>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-center gap-4 rounded-lg border bg-white p-4 md:p-5 transition-all duration-250 hover:translate-y-[-2px] hover:shadow-[0_16px_32px_-20px_rgba(18,32,67,0.25)]"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                  style={{ background: q.bg, color: q.accent }}
                >
                  <Icon size={19} strokeWidth={2} />
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
