"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, Loader2, Search, Trash2, Users } from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { PageLoader } from "@/components/dashboard/page-loader";
import { ScreenError } from "@/components/dashboard/user/ui";
import { useAuth } from "@/lib/auth/auth-context";
import { csvFilename, downloadCsv } from "@/lib/csv";

type Registration = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  avatar: string | null;
  registeredAt: string;
};

type SeminarInfo = {
  id: string;
  title: string;
  dateTime: string;
};

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

const GRID_COLS = "grid-cols-[44px_minmax(0,1fr)_170px_240px_180px_44px]";

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

export function SeminarRegistrations({ seminarId }: { seminarId: string }) {
  const { user } = useAuth();
  const [seminar, setSeminar] = useState<SeminarInfo | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canDelete = user?.accountType === "admin";

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/seminars/${seminarId}/registrations`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load registrations");
      setSeminar(data.seminar ?? null);
      setRegistrations(data.registrations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [seminarId]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(
    async (r: Registration) => {
      if (!confirm(`Delete registration for ${r.name} (${r.email})?`)) return;
      setDeletingId(r.id);
      try {
        const res = await fetch(
          `/api/seminars/${seminarId}/registrations/${r.id}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to delete registration");
        }
        setRegistrations((prev) => prev.filter((x) => x.id !== r.id));
      } catch (e) {
        alert(e instanceof Error ? e.message : "Failed to delete registration");
      } finally {
        setDeletingId(null);
      }
    },
    [seminarId]
  );

  useEffect(() => {
    setPage(1);
  }, [query, sort, perPage]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = registrations.filter((r) => {
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q)
      );
    });
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => +new Date(a.registeredAt) - +new Date(b.registeredAt));
        break;
      case "name-asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        arr.sort((a, b) => +new Date(b.registeredAt) - +new Date(a.registeredAt));
    }
    return arr;
  }, [registrations, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * perPage, safePage * perPage);
  const from = visible.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, visible.length);

  const exportCsv = () => {
    if (visible.length === 0) return;
    downloadCsv(
      csvFilename("seminar-registrations"),
      ["Name", "Email", "Phone", "Registered"],
      visible.map((r) => [r.name, r.email, r.phone ?? "", r.registeredAt])
    );
  };

  if (loading) return <PageLoader label="Loading registrations…" />;
  if (error) return <ScreenError message={error} />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/dashboard/seminars"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-200 hover:text-brand-2"
          style={{ color: "var(--brand)" }}
        >
          <ArrowLeft size={14} /> Back to seminars
        </Link>

        <div className="flex items-end justify-between gap-4 mt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
              Registrations
            </p>
            <h1
              className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold tracking-[-0.02em] mt-1.5 truncate"
              style={{ color: "var(--ink)" }}
            >
              {seminar?.title ?? "Seminar"}
            </h1>
            {seminar && (
              <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
                {new Date(seminar.dateTime).toLocaleString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Users size={13} />
            {registrations.length} registered
          </span>
        </div>
      </div>

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
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-[10px] text-[12.5px] font-semibold transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-50 disabled:pointer-events-none"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          <FileDown size={14} />
          Export
        </button>
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
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
            #
          </span>
          {["Name", "Phone", "Email", "Registered"].map((c) => (
            <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              {c}
            </span>
          ))}
          {canDelete && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              Actions
            </span>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-14 text-center" style={{ color: "var(--body)" }}>
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              {registrations.length === 0 ? "No registrations yet" : "No matches"}
            </p>
            <p className="text-[13px] mt-1">
              {registrations.length === 0
                ? "Nobody has registered for this seminar yet."
                : "Try a different search or sort."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {paged.map((r, idx) => {
              const serial = (safePage - 1) * perPage + idx + 1;
              return (
                <div
                  key={r.id}
                  className={`group flex flex-col md:grid gap-1.5 md:gap-3 md:items-center px-5 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${
                    idx > 0 ? "border-t" : ""
                  } ${GRID_COLS}`}
                  style={{ borderColor: "var(--line)" }}
                >
                  {/* Serial (own cell) */}
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
                    <Avatar name={r.name} src={r.avatar} size={32} />
                    <span className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                      {r.name}
                    </span>
                  </div>

                  <span className="hidden md:block text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                    {r.phone ?? "—"}
                  </span>
                  <span className="hidden md:block text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                    {r.email}
                  </span>
                  <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
                    {new Date(r.registeredAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Mobile meta */}
                  <div className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {r.phone ?? "—"}
                    </span>
                    <span className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                      {r.email}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                      {new Date(r.registeredAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        disabled={deletingId === r.id}
                        className="ml-auto flex items-center gap-1.5 text-[11.5px] font-medium rounded-lg border px-2.5 py-[5px] transition-colors duration-200 hover:bg-[#FDF1F0] disabled:opacity-50 disabled:pointer-events-none"
                        style={{ borderColor: "var(--line)", color: "#C0392B" }}
                        aria-label={`Delete registration for ${r.name}`}
                      >
                        {deletingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        {deletingId === r.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>

                  {/* Actions (desktop) */}
                  {canDelete && (
                    <div className="hidden md:flex items-center justify-end pr-1">
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        disabled={deletingId === r.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:border-[rgba(192,57,43,0.35)] hover:bg-[#FDF1F0] hover:text-[#C0392B] disabled:opacity-50 disabled:pointer-events-none"
                        style={{ borderColor: "var(--line)", color: "var(--body)" }}
                        aria-label={`Delete registration for ${r.name}`}
                        title={deletingId === r.id ? "Deleting registration" : "Delete registration"}
                      >
                        {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  )}
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