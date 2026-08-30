"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  FolderOpen,
  Target,
  PlayCircle,
  CheckCircle2,
  ArrowUpRight,
  Bell,
  GraduationCap,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { ScholarshipTicker } from "@/components/dashboard/scholarship-ticker";
import { BengaliText } from "@/components/bengali-text";

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
  type: "free" | "paid";
};

function scoreColor(score: number): string {
  if (score >= 80) return "var(--brand-2)";
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#E0572E";
}

export function MobileDashboardHome() {
  const { user } = useAuth();
  const [seminarCount, setSeminarCount] = useState<number>(0);
  const [resourceCount, setResourceCount] = useState<number>(0);
  const [score, setScore] = useState<number | null>(null);
  const [scoreLabel, setScoreLabel] = useState<string>("");
  const [unread, setUnread] = useState<number | null>(null);
  const [courses, setCourses] = useState<MiniCourse[]>([]);
  const [seminars, setSeminars] = useState<MiniSeminar[]>([]);

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
      .catch(() => setScore(null));
  }, []);

  useEffect(() => {
    fetch("/api/me/seminars", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.seminars) ? data.seminars : [];
        setSeminarCount(list.length);
        setSeminars(
          list
            .map((s: MiniSeminar) => ({
              id: s.id,
              title: s.title,
              dateTime: s.dateTime,
              type: s.type,
            }))
            .slice(0, 3)
        );
      })
      .catch(() => setSeminarCount(0));
  }, []);

  useEffect(() => {
    fetch("/api/resources", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setResourceCount((data.resources ?? []).length))
      .catch(() => setResourceCount(0));
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
            .sort(
              (a: MiniCourse, b: MiniCourse) =>
                (b.progress?.percentage ?? 0) - (a.progress?.percentage ?? 0)
            )
            .slice(0, 3)
        );
      })
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    fetch("/api/notifications?limit=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setUnread(typeof data.unreadCount === "number" ? data.unreadCount : null))
      .catch(() => setUnread(null));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";
  const enrolledCount = courses.length;
  const activeCount = courses.filter((c) => (c.progress?.percentage ?? 0) > 0 && !c.progress?.passed).length;

  const scoreValue = score ?? 0;
  const scoreRadius = 44;
  const scoreCirc = 2 * Math.PI * scoreRadius;
  const scoreOffset = scoreCirc - (scoreValue / 100) * scoreCirc;
  const scoreColors = scoreColor(scoreValue);

  const upcoming = seminars.filter((s) => new Date(s.dateTime).getTime() > Date.now());

  const stats = [
    { label: "Enrolled", value: enrolledCount, icon: BookOpen, href: "/dashboard/courses/mine", accent: "#2F5FE0", bg: "#EAF1FF" },
    { label: "Seminars", value: seminarCount, icon: CalendarDays, href: "/dashboard/seminars/mine", accent: "#6B4CE0", bg: "#F1EEFC" },
    { label: "Resources", value: resourceCount, icon: FolderOpen, href: "/dashboard/resources", accent: "#188A5D", bg: "#E8F7F1" },
    { label: "In progress", value: activeCount, icon: TrendingUp, href: "/dashboard/courses/mine", accent: "#DB8A2E", bg: "#FFF2E4" },
  ];

  const shortcuts = [
    { label: "Seminars", href: "/dashboard/seminars", icon: CalendarDays, accent: "#6B4CE0", bg: "#F1EEFC" },
    { label: "Courses", href: "/dashboard/courses", icon: BookOpen, accent: "#2F5FE0", bg: "#EAF1FF" },
    { label: "Resources", href: "/dashboard/resources", icon: FolderOpen, accent: "#188A5D", bg: "#E8F7F1" },
    { label: "Scholarships", href: "/dashboard/scholarships", icon: GraduationCap, accent: "#DB8A2E", bg: "#FFF2E4" },
    { label: "Readiness", href: "/dashboard/readiness", icon: Target, accent: "#E0572E", bg: "#FCEDE9" },
    { label: "SOP", href: "/dashboard/sop-generator", icon: FileText, accent: "#0FA968", bg: "#E2F6EE" },
  ];

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
      <ScholarshipTicker />

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
            {today}
          </p>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] mt-1" style={{ color: "var(--ink)" }}>
            Hi, {firstName}
          </h1>
        </div>
        {unread !== null && unread > 0 && (
          <Link
            href="/dashboard/notifications"
            aria-label={`${unread} notifications`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border bg-white"
            style={{ borderColor: "var(--line)" }}
          >
            <Bell size={19} style={{ color: "var(--body)" }} />
            <span
              className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ background: "#E0572E" }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          </Link>
        )}
      </div>

      {/* Readiness card */}
      <Link
        href="/dashboard/readiness"
        className="flex items-center gap-4 rounded-[22px] border bg-white px-5 py-5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="relative h-[84px] w-[84px] shrink-0">
          <svg width="84" height="84" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r={scoreRadius} fill="none" stroke="var(--bg-soft)" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={scoreRadius}
              fill="none"
              stroke={scoreColors}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={scoreCirc}
              strokeDashoffset={score ? scoreOffset : scoreCirc}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[20px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
              {score === null ? "—" : scoreValue}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "var(--body)" }}>
              /100
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
            Readiness score
          </span>
          <span className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
            {score === null ? "Not assessed yet" : scoreLabel || `${scoreValue}`}
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold mt-1" style={{ color: "var(--brand)" }}>
            {score === null ? "Take the assessment" : "View my report"}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Link>

      {/* Continue learning */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            Continue learning
          </h2>
          {courses.length > 0 && (
            <Link href="/dashboard/courses/mine" className="text-[13px] font-semibold" style={{ color: "var(--brand)" }}>
              See all
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div
            className="rounded-[22px] border bg-white px-5 py-9 flex flex-col items-center text-center gap-3"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <BookOpen size={26} strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                No courses yet
              </p>
              <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
                Enroll in a course to start tracking your progress.
              </p>
            </div>
            <Link
              href="/dashboard/courses"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full text-white text-[14px] font-semibold px-6 py-3"
              style={{ background: "var(--brand)" }}
            >
              <PlayCircle size={16} />
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {courses.map((c) => {
              const pct = c.progress?.percentage ?? 0;
              const passed = c.progress?.passed ?? false;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/courses/${c.slug}/learn`}
                  className="flex items-center gap-3.5 rounded-[18px] border bg-white px-4 py-4"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl flex items-center justify-center"
                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image ?? ""}
                      alt=""
                      className={`object-cover ${c.image ? "" : "hidden"}`}
                      style={{ width: "100%", height: "100%" }}
                    />
                    {!c.image && <BookOpen size={20} strokeWidth={1.8} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>
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
                        <span className="font-mono text-[13px] font-semibold shrink-0" style={{ color: "var(--brand)" }}>
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
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 rounded-[18px] border p-4"
                style={{ borderColor: "var(--line)", background: s.bg }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70"
                  style={{ color: s.accent }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <div className="flex flex-col">
                  <span className="font-display text-[22px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                    {s.value}
                  </span>
                  <span className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                    {s.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Upcoming seminars */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            Your sessions
          </h2>
          {seminarCount > 0 && (
            <Link href="/dashboard/seminars/mine" className="text-[13px] font-semibold" style={{ color: "var(--brand)" }}>
              See all
            </Link>
          )}
        </div>

        {seminarCount === 0 ? (
          <div
            className="rounded-[22px] border bg-white px-5 py-9 flex flex-col items-center text-center gap-3"
            style={{ borderColor: "var(--line)" }}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "#F1EEFC", color: "#6B4CE0" }}
            >
              <CalendarDays size={26} strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                No seminars yet
              </p>
              <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
                Register for a live seminar for real-time guidance.
              </p>
            </div>
            <Link
              href="/dashboard/seminars"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full text-white text-[14px] font-semibold px-6 py-3"
              style={{ background: "#6B4CE0" }}
            >
              <CalendarDays size={16} />
              Browse seminars
            </Link>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[18px] border bg-white px-4 py-4" style={{ borderColor: "var(--line)" }}>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <CalendarDays size={19} />
            </span>
            <p className="text-[13px] leading-[1.5]" style={{ color: "var(--body)" }}>
              No upcoming sessions right now. New seminars are added regularly.
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
                  className="flex items-center gap-3.5 rounded-[18px] border bg-white px-4 py-3.5"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={{ background: "#F1EEFC", color: "#6B4CE0" }}
                  >
                    <span className="font-display text-[16px] font-semibold leading-none">{dateNum}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider">{month}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                      <BengaliText>{s.title}</BengaliText>
                    </span>
                    <span className="block text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                      {d.toLocaleDateString("en-US", { weekday: "short" })} · {time}
                    </span>
                  </div>
                  <ArrowUpRight size={17} className="shrink-0" style={{ color: "var(--body)" }} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Shortcuts */}
      <section>
        <h2 className="font-display text-[17px] font-semibold mb-3" style={{ color: "var(--ink)" }}>
          Quick access
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {shortcuts.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="flex items-center gap-3 rounded-[18px] border bg-white px-4 py-4"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: q.bg, color: q.accent }}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  {q.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
