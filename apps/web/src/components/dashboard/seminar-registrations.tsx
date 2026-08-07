"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Users } from "lucide-react";
import { Avatar } from "@/components/dashboard/avatar";
import { ScreenError, ScreenLoading } from "@/components/dashboard/user/ui";

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

export function SeminarRegistrations({ seminarId }: { seminarId: string }) {
  const [seminar, setSeminar] = useState<SeminarInfo | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

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

  if (loading) return <ScreenLoading label="Loading registrations…" />;
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
      </div>

      {/* Table */}
      <div
        className="rounded-[14px] border bg-white overflow-hidden"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="hidden md:grid grid-cols-[minmax(0,1fr)_170px_250px_190px] gap-3 px-5 py-2.5 border-b bg-[var(--bg-soft)]" style={{ borderColor: "var(--line)" }}>
          {["Name", "Phone", "Email", "Registered"].map((c) => (
            <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              {c}
            </span>
          ))}
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
            {visible.map((r, idx) => (
              <div
                key={r.id}
                className={`group md:grid grid-cols-[minmax(0,1fr)_170px_250px_190px] md:items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${
                  idx > 0 ? "border-t" : ""
                }`}
                style={{ borderColor: "var(--line)" }}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={r.name} src={r.avatar} size={32} />
                  <span className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>
                    {r.name}
                  </span>
                </div>
                <span className="text-[12.5px] truncate md:mt-0" style={{ color: "var(--body)" }}>
                  {r.phone ?? "—"}
                </span>
                <span className="text-[12.5px] truncate" style={{ color: "var(--body)" }}>
                  {r.email}
                </span>
                <span className="text-[12.5px]" style={{ color: "var(--body)" }}>
                  {new Date(r.registeredAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
        Showing {visible.length} of {registrations.length} registrations
      </p>
    </div>
  );
}