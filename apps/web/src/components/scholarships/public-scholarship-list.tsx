"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Lock, School } from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { LEVEL_LABELS, type PublicScholarship } from "./types";

function levelIcon(level: string) {
  return level === "school" ? School : GraduationCap;
}

function ScholarshipCard({ s }: { s: PublicScholarship }) {
  const flag = countryByCode(s.countryCode)?.flag ?? "";
  const Icon = levelIcon(s.level);

  return (
    <Link
      href={`/scholarships/${s.id}`}
      className="group flex h-full flex-col rounded-lg border bg-white p-5 transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_22px_44px_-24px_rgba(18,32,67,0.25)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 4px 18px -12px rgba(18,32,67,0.10)" }}
    >
      <span
        className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--brand-2)" }}
      >
        {s.institution}
      </span>

      <h3
        className="mt-2 line-clamp-2 font-display text-[16px] font-semibold leading-snug transition-colors duration-200 group-hover:text-brand-2"
        style={{ color: "var(--ink)" }}
      >
        {s.title || s.institution}
      </h3>

      {s.amount && (
        <div className="mt-2.5 text-[15px] font-semibold" style={{ color: "var(--brand-2)" }}>
          {s.amount}
        </div>
      )}

      <div
        className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium"
        style={{ color: "var(--body)" }}
      >
        {flag && <span className={`fi fi-${s.countryCode.toLowerCase()}`} />}
        <span>{s.country || "—"}</span>
        <span className="opacity-40">·</span>
        <span className="inline-flex items-center gap-1 capitalize">
          <Icon size={11} />
          {LEVEL_LABELS[s.level] ?? "Any level"}
        </span>
        {s.deadline && (
          <>
            <span className="opacity-40">·</span>
            <span>By {s.deadline}</span>
          </>
        )}
      </div>

      <div
        className="mt-auto flex items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: "var(--line)" }}
      >
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium"
          style={{ color: "var(--body)" }}
        >
          <Lock size={11} style={{ color: "var(--brand-2)" }} />
          Members only
        </span>
        <span
          className="inline-flex items-center gap-1 text-[13px] font-semibold transition-all duration-200 group-hover:gap-2"
          style={{ color: "var(--brand)" }}
        >
          See details
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}

function RegisterBand() {
  return (
    <div
      className="mt-12 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-lg border bg-white p-[clamp(22px,3.5vw,36px)] sm:flex-row sm:items-center"
      style={{ borderColor: "var(--line)", boxShadow: "0 14px 40px -28px rgba(18,32,67,0.22)" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
        >
          <Lock size={18} />
        </div>
        <div>
          <p className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            Full details are one free account away
          </p>
          <p
            className="mt-1 max-w-[480px] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--body)" }}
          >
            Complete descriptions, eligibility criteria and official apply links
            unlock the moment you join.
          </p>
        </div>
      </div>
      <Link
        href="/login?mode=register&next=/dashboard/scholarships"
        className="inline-flex shrink-0 items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
        style={{ background: "var(--brand)" }}
      >
        Create free account
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

export function PublicScholarshipList() {
  const [scholarships, setScholarships] = useState<PublicScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/public/scholarships", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json().catch(() => ({}));
      setScholarships(Array.isArray(data.scholarships) ? data.scholarships : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const s of scholarships) if (s.country) set.add(s.country);
    return set.size;
  }, [scholarships]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className="font-display font-medium tracking-[-0.02em] leading-[1.1]"
            style={{ fontSize: "clamp(24px,2.6vw,32px)", color: "var(--ink)" }}
          >
            Live scholarships
          </h2>
          <p className="text-[14px] mt-[6px]" style={{ color: "var(--body)" }}>
            Headlines only — the full write-up is for members.
          </p>
        </div>
        {!loading && scholarships.length > 0 && (
          <span
            className="font-mono text-[10.5px] font-medium tracking-[0.25em] uppercase rounded-full px-3.5 py-[7px]"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            {scholarships.length} live · {countries} countries
          </span>
        )}
      </div>

      {error && (
        <div
          className="mt-8 text-[12.5px] rounded-xl border px-4 py-3"
          style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="fb-shimmer rounded-lg border"
              style={{ borderColor: "var(--line)", height: 200 }}
            />
          ))}
        </div>
      ) : scholarships.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            No scholarships right now
          </p>
          <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>
            Check back soon — new opportunities are added as they open.
          </p>
        </div>
      ) : (
        <div id="board" className="mt-8 grid scroll-mt-[110px] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {scholarships.map((s) => (
            <ScholarshipCard key={s.id} s={s} />
          ))}
        </div>
      )}

      {!loading && scholarships.length > 0 && <RegisterBand />}
    </div>
  );
}