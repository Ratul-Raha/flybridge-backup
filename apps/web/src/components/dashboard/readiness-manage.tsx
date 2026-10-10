"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  GraduationCap,
  Mail,
  Search,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { CardLoader } from "@/components/dashboard/page-loader";
import { ScreenError } from "@/components/dashboard/user/ui";

type ReadinessRow = {
  id: string;
  score: number;
  label: string;
  country: string;
  degreeLevel: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  categories: { id: string; label: string; pct: number }[];
};

const scoreColor = (score: number): string => {
  if (score >= 80) return "#0FA968";
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#C0392B";
};

function fmtDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateFull(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

export function ReadinessManage() {
  const [runs, setRuns] = useState<ReadinessRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 15, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (minScore) params.set("minScore", minScore);
      if (country.trim()) params.set("country", country.trim());
      if (sort && sort !== "newest") params.set("sort", sort);
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      const res = await fetch(`/api/admin/readiness?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load readiness checks");
      setRuns(data.runs ?? []);
      setPagination(data.pagination ?? { page: 1, perPage, total: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load readiness checks");
    } finally {
      setLoading(false);
    }
  }, [query, minScore, country, sort, page, perPage]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = () => {
    setPage(1);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
  const safePage = Math.min(page, totalPages);
  const from = pagination.total === 0 ? 0 : (safePage - 1) * pagination.perPage + 1;
  const to = Math.min(safePage * pagination.perPage, pagination.total);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--brand)" }}
          >
            Administration
          </p>
          <h1
            className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold tracking-[-0.02em] mt-1.5"
            style={{ color: "var(--ink)" }}
          >
            Readiness checks
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Every study-abroad readiness assessment submitted by members.
          </p>
        </div>
        {pagination.total > 0 && (
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Gauge size={13} />
            {pagination.total.toLocaleString()} assessments
          </span>
        )}
      </div>

      {error && <ScreenError message={error} />}

      {/* Toolbar */}
      <div
        className="rounded-lg border bg-white p-3 flex flex-col lg:flex-row gap-3"
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
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Search by member name or email…"
            className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              setPage(1);
            }}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            aria-label="Filter by minimum score"
          >
            <option value="">Any score</option>
            <option value="80">80% and above</option>
            <option value="60">60% and above</option>
            <option value="40">40% and above</option>
          </select>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Country…"
            className="text-[13.5px] rounded-xl border bg-white px-3.5 py-[10px] w-[130px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            aria-label="Sort assessments"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score">Highest score</option>
            <option value="score-asc">Lowest score</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardLoader label="Loading readiness checks…" />
      ) : (
        <>
          {runs.length === 0 ? (
            <div className="px-5 py-14 text-center rounded-lg border bg-white" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                No readiness checks found
              </p>
              <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
              {/* Header */}
              <div className="hidden lg:grid grid-cols-[minmax(0,1.4fr)_80px_120px_140px_130px_60px] gap-3 px-5 py-2.5 border-b bg-[var(--bg-soft)] items-center" style={{ borderColor: "var(--line)" }}>
                {["Member", "Score", "Level", "Country", "Taken", ""].map((c) => (
                  <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    {c}
                  </span>
                ))}
              </div>

              <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
                {runs.map((r) => (
                  <div key={r.id} className="px-5 py-3.5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {r.user ? (
                          <Avatar name={r.user.name} src={r.user.avatar} size={34} />
                        ) : (
                          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--bg-soft)" }}>
                            <Users size={14} style={{ color: "var(--body)" }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                            {r.user?.name ?? "Deleted user"}
                          </p>
                          {r.user?.email && (
                            <p className="text-[12px] truncate flex items-center gap-1" style={{ color: "var(--body)" }}>
                              <Mail size={11} />
                              {r.user.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className="shrink-0 inline-flex items-center justify-center rounded-lg font-display text-[13px] font-semibold tabular-nums px-2 py-[4px] min-w-[42px]"
                        style={{ background: `${scoreColor(r.score)}1f`, color: scoreColor(r.score) }}
                        title={r.label}
                      >
                        {r.score}
                      </span>

                      <span className="hidden lg:block shrink-0 text-[12.5px] truncate w-[120px]" style={{ color: "var(--body)" }}>
                        {r.label || "—"}
                      </span>

                      <span className="shrink-0 text-[12.5px] truncate w-[140px] hidden md:flex items-center gap-1.5" style={{ color: "var(--body)" }}>
                        <GraduationCap size={13} />
                        {r.degreeLevel || "—"}
                      </span>

                      <span className="shrink-0 text-[12.5px] truncate w-[130px] hidden md:flex items-center gap-1.5" style={{ color: "var(--body)" }}>
                        <Globe size={13} />
                        {r.country || "—"}
                      </span>

                      <span className="shrink-0 hidden xl:flex items-center gap-1.5 text-[12px]" style={{ color: "var(--body)" }}>
                        <CalendarDays size={12} />
                        {fmtDateFull(r.createdAt)}
                      </span>
                    </div>

                    {r.categories.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1.5 mt-3 pl-[46px]">
                        {r.categories.map((c) => (
                          <div key={c.id} className="flex items-center gap-2">
                            <span className="text-[11px] w-[42%] truncate" style={{ color: "var(--body)" }}>
                              {c.label}
                            </span>
                            <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                              <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: scoreColor(c.pct) }} />
                            </div>
                            <span className="text-[10.5px] tabular-nums w-[26px] text-right" style={{ color: "var(--body)" }}>
                              {c.pct}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                  Showing {from}–{to} of {pagination.total.toLocaleString()}
                </p>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className={selectClass + " !py-[6px] text-[12px]"}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  aria-label="Rows per page"
                >
                  {[10, 15, 20, 50].map((n) => (
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
                      onClick={() => setPage(p as number)}
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
        </>
      )}
    </div>
  );
}