"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { ScreenError, ScreenLoading } from "@/components/dashboard/user/ui";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  subscription: string;
  status: "active" | "expired" | string;
  enrolledAt: string;
  lessonsCompleted: number;
  totalLessons: number;
  lessonProgress: number;
  quizAvg: number;
  passed: boolean;
  certificateIssued: boolean;
  certificateDownloadedAt: string | null;
  certificateDownloadCount: number;
  completed: boolean;
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
};

type Stats = {
  total: number;
  active: number;
  expired: number;
  completed: number;
  certificates: number;
  certificatesDownloaded: number;
  avgLessonProgress: number;
  avgQuizScore: number;
};

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

const GRID_COLS = "grid-cols-[44px_minmax(0,1fr)_200px_115px_170px_95px_110px]";

const PAGE_SIZES = [10, 20, 50];

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

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
      className="relative rounded-lg border bg-white p-5 overflow-hidden"
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: gradient }} />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3"
        style={{ background: gradient }}
      >
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <p className="font-display text-[24px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
        {label}
      </p>
      {caption && (
        <p className="text-[11.5px] mt-1.5 font-medium" style={{ color: "var(--body)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}

export function CourseEnrollments({ courseSlug }: { courseSlug: string }) {
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseSlug)}/enrollments`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load members");
      setCourse(data.course ?? null);
      setStats(data.stats ?? null);
      setMembers(data.members ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query, sort, statusFilter, perPage]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = members.filter((m) => {
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !m.completed) return false;
        if ((statusFilter === "active" || statusFilter === "expired") && m.status !== statusFilter)
          return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q)
      );
    });
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => +new Date(a.enrolledAt) - +new Date(b.enrolledAt));
        break;
      case "name-asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "lessons":
        arr.sort((a, b) => b.lessonProgress - a.lessonProgress);
        break;
      case "quiz":
        arr.sort((a, b) => b.quizAvg - a.quizAvg);
        break;
      default:
        arr.sort((a, b) => +new Date(b.enrolledAt) - +new Date(a.enrolledAt));
    }
    return arr;
  }, [members, query, sort, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * perPage, safePage * perPage);
  const from = visible.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, visible.length);

  if (loading) return <ScreenLoading label="Loading members…" />;
  if (error) return <ScreenError message={error} />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-200 hover:text-brand-2"
          style={{ color: "var(--brand)" }}
        >
          <ChevronLeft size={14} /> Back to courses
        </Link>

        <div className="flex items-end justify-between gap-4 mt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
              Registered members
            </p>
            <h1
              className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold tracking-[-0.02em] mt-1.5 truncate"
              style={{ color: "var(--ink)" }}
            >
              {course?.title ?? "Course"}
            </h1>
            {course && (
              <p className="text-[13px] mt-1 font-mono" style={{ color: "var(--body)" }}>
                /{course.slug}
                {course.price > 0 ? ` · ${course.currency} ${course.price}` : " · Free"}
              </p>
            )}
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Users size={13} />
            {members.length} registered
          </span>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total members"
            value={stats.total}
            icon={Users}
            gradient="linear-gradient(135deg,#6E4CFF,#8B5CF6)"
            caption={`${stats.active} active`}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            gradient="linear-gradient(135deg,#10B981,#34D399)"
            caption={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% completion rate` : undefined}
          />
          <StatCard
            label="Avg lessons completed"
            value={`${stats.avgLessonProgress}%`}
            icon={BookOpen}
            gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)"
            caption="Course usage"
          />
          <StatCard
            label="Avg quiz score"
            value={`${stats.avgQuizScore}%`}
            icon={GraduationCap}
            gradient="linear-gradient(135deg,#6E4CFF,#8B5CF6)"
            caption="Performance"
          />
          <StatCard
            label="Certificates issued"
            value={stats.certificates}
            icon={Award}
            gradient="linear-gradient(135deg,#F59E0B,#F97316)"
            caption={stats.certificates > 0 && stats.certificatesDownloaded > 0 ? `${Math.round((stats.certificatesDownloaded / stats.certificates) * 100)}% downloaded` : undefined}
          />
          <StatCard
            label="Certificates downloaded"
            value={stats.certificatesDownloaded}
            icon={Download}
            gradient="linear-gradient(135deg,#0EA5E9,#0284C7)"
            caption="Downloaded / printed"
          />
        </div>
      )}

      {/* Toolbar */}
      <div
        className="rounded-[14px] border bg-white p-3 flex flex-col md:flex-row gap-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--body)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          aria-label="Sort members"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
          <option value="lessons">Lessons completed (high → low)</option>
          <option value="quiz">Quiz avg (high → low)</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-[14px] border bg-white overflow-hidden"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className={`hidden md:grid gap-3 px-5 py-2.5 border-b bg-[var(--bg-soft)] ${GRID_COLS}`}
          style={{ borderColor: "var(--line)" }}
        >
          {["#", "Member", "Email", "Enrolled", "Course progress", "Quiz avg", "Status"].map((c) => (
            <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              {c}
            </span>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-14 text-center" style={{ color: "var(--body)" }}>
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              {members.length === 0 ? "No members yet" : "No matches"}
            </p>
            <p className="text-[13px] mt-1">
              {members.length === 0
                ? "Nobody has enrolled in this course yet."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {paged.map((m, idx) => {
              const serial = (safePage - 1) * perPage + idx + 1;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col md:grid gap-1.5 md:gap-3 md:items-center px-5 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${
                    idx > 0 ? "border-t" : ""
                  } ${GRID_COLS}`}
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="hidden md:block font-mono text-[11.5px] tabular-nums"
                    style={{ color: "#A6ADC0" }}
                  >
                    #{String(serial).padStart(2, "0")}
                  </span>

                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="md:hidden font-mono text-[11.5px] shrink-0 tabular-nums"
                      style={{ color: "#A6ADC0" }}
                    >
                      #{String(serial).padStart(2, "0")}
                    </span>
                    <Avatar name={m.name} src={m.avatar} size={32} />
                    <div className="min-w-0">
                      <span className="text-[14px] font-semibold truncate block" style={{ color: "var(--ink)" }}>
                        {m.name}
                      </span>
                      {m.subscription === "paid" && (
                        <span
                          className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: "#B7791F" }}
                        >
                          Paid member
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="hidden md:block text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                    {m.email}
                  </span>
                  <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
                    {new Date(m.enrolledAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  {/* Course progress (lessons) */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, m.lessonProgress))}%`,
                          background: m.lessonProgress >= 100
                            ? "linear-gradient(90deg,#10B981,#34D399)"
                            : "linear-gradient(90deg,#6E4CFF,#8B5CF6)",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[11.5px] tabular-nums shrink-0" style={{ color: "var(--body)" }}>
                      {m.lessonsCompleted}/{m.totalLessons}
                    </span>
                  </div>

                  {/* Quiz avg */}
                  <span className="hidden md:block font-mono text-[12px] tabular-nums" style={{ color: "var(--body)" }}>
                    {m.quizAvg}%
                  </span>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-[4px] text-[10.5px] font-semibold"
                      style={
                        m.status === "active"
                          ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
                          : { background: "#FDF1F0", color: "#C0392B" }
                      }
                    >
                      {m.status === "active" ? "Active" : "Expired"}
                    </span>
                    {m.completed && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[10.5px] font-semibold"
                        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                        title="Course completed"
                      >
                        <CheckCircle2 size={11} />
                        Done
                      </span>
                    )}
                    {m.certificateIssued && (
                      <span title="Certificate issued">
                        <Award size={13} style={{ color: "#F59E0B" }} />
                      </span>
                    )}
                    {m.certificateDownloadCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-[4px] text-[10.5px] font-semibold"
                        style={{ background: "rgba(2,132,199,0.12)", color: "#0284C7" }}
                        title={
                          m.certificateDownloadedAt
                            ? `Downloaded ${new Date(m.certificateDownloadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${m.certificateDownloadCount} time${m.certificateDownloadCount === 1 ? "" : "s"}`
                            : undefined
                        }
                      >
                        <Download size={10} />
                        {m.certificateDownloadCount}
                      </span>
                    )}
                  </div>

                  {/* Mobile meta */}
                  <div className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                      {m.email}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      Enrolled {new Date(m.enrolledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {m.lessonsCompleted}/{m.totalLessons} lessons
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      Quiz avg {m.quizAvg}%
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[10px] font-semibold"
                      style={
                        m.status === "active"
                          ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
                          : { background: "#FDF1F0", color: "#C0392B" }
                      }
                    >
                      {m.status === "active" ? "Active" : "Expired"}
                    </span>
                    {m.completed && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-semibold"
                        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                      >
                        <CheckCircle2 size={10} />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {visible.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
              Showing {from}–{to} of {visible.length}
            </p>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className={selectClass + " !py-[6px] text-[12px]"}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {pageNumbers(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-[12px]" style={{ color: "var(--body)" }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className="h-8 min-w-[32px] px-1.5 rounded-lg text-[12.5px] font-semibold transition-colors duration-150"
                  style={
                    p === safePage
                      ? { background: "var(--brand)", color: "#fff" }
                      : { color: "var(--body)" }
                  }
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
