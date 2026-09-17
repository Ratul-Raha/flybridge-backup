"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  Loader2,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { ScreenError, ScreenLoading } from "@/components/dashboard/user/ui";

type WishlistEntry = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  scholarshipUsd: number;
  joinedAt: string;
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
};

type Stats = {
  total: number;
  thisWeek: number;
  today: number;
  withEmail: number;
  withPhone: number;
  scholarshipValue: number;
};

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

const GRID_COLS = "grid-cols-[44px_minmax(0,1fr)_220px_160px_120px_80px]";
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

export function CourseWishlist({ courseSlug }: { courseSlug: string }) {
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/courses/${encodeURIComponent(courseSlug)}/wishlist`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load wishlist");
      setCourse(data.course ?? null);
      setStats(data.stats ?? null);
      setEntries(data.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query, sort, perPage]);

  const remove = async (entry: WishlistEntry) => {
    if (!confirm(`Remove "${entry.name}" from the waitlist?`)) return;
    setDeletingId(entry.id);
    try {
      const res = await fetch(
        `/api/courses/${encodeURIComponent(courseSlug)}/wishlist/${entry.id}`,
        { method: "DELETE", cache: "no-store" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = entries.filter((e) => {
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q)
      );
    });
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt));
        break;
      case "name-asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        arr.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
    }
    return arr;
  }, [entries, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * perPage, safePage * perPage);
  const from = visible.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, visible.length);

  if (loading) return <ScreenLoading label="Loading waitlist…" />;
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
              Wishlist · Waitlist members
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
              </p>
            )}
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Heart size={13} />
            {entries.length} on waitlist
          </span>
        </div>
      </div>

      <p className="text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
        People who joined the waitlist for this course. Remove them here once they
        enroll — they&apos;ll still be visible under &quot;Registered members&quot;.
      </p>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total waitlist"
            value={stats.total}
            icon={Heart}
            gradient="linear-gradient(135deg,#6E4CFF,#8B5CF6)"
            caption="All joined entries"
          />
          <StatCard
            label="New this week"
            value={stats.thisWeek}
            icon={Users}
            gradient="linear-gradient(135deg,#10B981,#34D399)"
            caption="Since this week"
          />
          <StatCard
            label="New today"
            value={stats.today}
            icon={Users}
            gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)"
            caption="Since midnight"
          />
          <StatCard
            label="With email"
            value={stats.withEmail}
            icon={AtSign}
            gradient="linear-gradient(135deg,#F59E0B,#F97316)"
            caption="Reachable by email"
          />
          <StatCard
            label="With phone"
            value={stats.withPhone}
            icon={Phone}
            gradient="linear-gradient(135deg,#0EA5E9,#0284C7)"
            caption="Reachable by phone"
          />
          <StatCard
            label="Scholarship value"
            value={`$${stats.scholarshipValue}`}
            icon={Gift}
            gradient="linear-gradient(135deg,#2E9E6B,#7CF0BD)"
            caption="Committed on launch"
          />
        </div>
      )}

      {/* Toolbar */}
      <div
        className="rounded-lg border bg-white p-3 flex flex-col md:flex-row gap-3"
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
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={selectClass}
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          aria-label="Sort waitlist"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-lg border bg-white overflow-hidden"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className={`hidden md:grid gap-3 px-5 py-2.5 border-b bg-[var(--bg-soft)] ${GRID_COLS}`}
          style={{ borderColor: "var(--line)" }}
        >
          {["#", "Name", "Email", "Phone", "Joined", "Remove"].map((c) => (
            <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              {c}
            </span>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-14 text-center" style={{ color: "var(--body)" }}>
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              {entries.length === 0 ? "No one on the waitlist yet" : "No matches"}
            </p>
            <p className="text-[13px] mt-1">
              {entries.length === 0
                ? "Share the landing page waitlist form to start collecting names."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {paged.map((e, idx) => {
              const serial = (safePage - 1) * perPage + idx + 1;
              return (
                <div
                  key={e.id}
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

                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="md:hidden font-mono text-[11.5px] shrink-0 tabular-nums"
                      style={{ color: "#A6ADC0" }}
                    >
                      #{String(serial).padStart(2, "0")}
                    </span>
                    <Avatar name={e.name} size={32} />
                    <div className="min-w-0">
                      <span className="text-[14px] font-semibold truncate block" style={{ color: "var(--ink)" }}>
                        {e.name}
                      </span>
                      {e.userId && (
                        <span
                          className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: "var(--brand)" }}
                        >
                          Registered user
                        </span>
                      )}
                      {e.scholarshipUsd > 0 && (
                        <span
                          className="inline-flex items-center gap-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] mt-0.5"
                          style={{ color: "#0E8A54" }}
                        >
                          <Gift size={9} /> ${e.scholarshipUsd} scholarship
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="hidden md:block text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                    {e.email || "—"}
                  </span>
                  <span className="hidden md:block text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                    {e.phone || "—"}
                  </span>
                  <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
                    {new Date(e.joinedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <button
                    type="button"
                    disabled={deletingId === e.id}
                    onClick={() => remove(e)}
                    className="hidden md:inline-flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-full border px-3 py-[5px] transition-all duration-200 disabled:opacity-50"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)" }}
                    title={`Remove ${e.name} from waitlist`}
                  >
                    {deletingId === e.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>

                  {/* Mobile meta */}
                  <div className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                      {e.email || "no email"}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {e.phone || "no phone"}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      Joined {new Date(e.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === e.id}
                      onClick={() => remove(e)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-semibold transition-colors duration-150 disabled:opacity-50"
                      style={{ background: "#FDF1F0", color: "#C0392B" }}
                    >
                      {deletingId === e.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      Remove
                    </button>
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