"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  ExternalLink,
  GraduationCap,
  School,
  CalendarClock,
  Settings2,
  Check,
  Share2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { countryByCode } from "@/lib/countries";

type ScholarshipItem = {
  id: string;
  institution: string;
  title: string;
  description: string;
  country: string;
  countryCode: string;
  level: string;
  amount: string;
  deadline: string;
  eligibility: string;
  applyUrl: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
};

const LEVELS = ["all", "any", "undergraduate", "graduate", "postgraduate", "school"] as const;

const LEVEL_LABELS: Record<string, string> = {
  any: "Any level",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
  postgraduate: "Postgraduate",
  school: "School",
};

function levelIcon(level: string) {
  return level === "school" ? School : GraduationCap;
}

function ShareButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/scholarships/${id}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      title={copied ? "Copied!" : "Copy public link"}
      aria-label={copied ? "Copied!" : "Copy public link"}
      onClick={copyLink}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
      style={{
        background: copied ? "rgba(15,169,104,0.12)" : "rgba(18,32,67,0.06)",
      }}
    >
      {copied ? (
        <Check size={14} style={{ color: "#0FA968" }} strokeWidth={2.5} />
      ) : (
        <Share2 size={14} style={{ color: "var(--body)" }} />
      )}
    </button>
  );
}

export function ScholarshipBrowser() {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const isStaff = user && (user.accountType === "admin" || user.accountType === "moderator");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/scholarships", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setScholarships(data.scholarships ?? []);
      } else {
        setError(data.error ?? "Failed to load");
      }
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scholarships.filter((s) => {
      if (levelFilter !== "all" && s.level !== levelFilter) return false;
      if (!q) return true;
      return (
        s.institution.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.amount.toLowerCase().includes(q)
      );
    });
  }, [scholarships, query, levelFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div
            className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[0.3em] uppercase"
            style={{ color: "var(--brand-2)" }}
          >
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand-2)" }} />
            Scholarships
          </div>
          <h1
            className="font-display font-semibold tracking-[-0.02em] mt-2"
            style={{ fontSize: "clamp(24px,3vw,28px)", color: "var(--ink)" }}
          >
            Fund your studies abroad
          </h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase mt-1.5" style={{ color: "var(--body)" }}>
            {scholarships.length} {scholarships.length === 1 ? "opportunity" : "opportunities"} · updated often
          </p>
        </div>

        {isStaff && (
          <Link
            href="/dashboard/scholarships/manage"
            className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase rounded-full border px-4 py-[9px] transition-all duration-200 hover:translate-y-[-1px]"
            style={{ borderColor: "var(--line)", background: "#fff", color: "var(--brand-2)" }}
          >
            <Settings2 size={13} />
            Manage
          </Link>
        )}
      </div>

      <div className="rounded-[14px] border bg-white p-3 flex flex-col md:flex-row gap-3" style={{ borderColor: "var(--line)" }}>
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
            placeholder="Search by institution, title or country…"
            className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === "all" ? "All levels" : LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          className="text-[12.5px] rounded-xl border px-4 py-3"
          style={{
            color: "#C0392B",
            borderColor: "rgba(192,57,43,0.25)",
            background: "rgba(192,57,43,0.06)",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
          Loading scholarships…
        </p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-[20px] border bg-white px-6 py-16 flex flex-col items-center text-center gap-2.5"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
            <Award size={20} style={{ color: "var(--brand)" }} />
          </div>
          <p className="font-display text-[16px] font-semibold mt-1" style={{ color: "var(--ink)" }}>
            {scholarships.length === 0 ? "No scholarships yet" : "Nothing matches your search"}
          </p>
          <p className="text-[13px] leading-[1.6] max-w-[400px]" style={{ color: "var(--body)" }}>
            {scholarships.length === 0
              ? "New scholarship opportunities will appear here — and you&#39;ll get a notification the moment one is published."
              : "Try a different keyword or level filter."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const Icon = levelIcon(s.level);
            const flag = countryByCode(s.countryCode)?.flag ?? "";
            return (
              <div
                key={s.id}
                className="group flex flex-col overflow-hidden rounded-lg border bg-white transition-all duration-300 hover:-translate-y-[2px]"
                style={{ borderColor: "var(--line)", boxShadow: "0 4px 20px -12px rgba(18,32,67,0.12)" }}
              >
                {s.imageUrl ? (
                  <div className="relative aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.imageUrl} alt={s.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="relative aspect-[16/9] flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(107,76,224,0.10), rgba(15,169,104,0.08))" }}
                  >
                    <Award size={34} style={{ color: "var(--brand-2)" }} />
                  </div>
                )}

                <div className="flex-1 flex flex-col px-5 pb-5 pt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 uppercase font-mono tracking-[0.12em]" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                      {LEVEL_LABELS[s.level] ?? "Any level"}
                    </span>
                    {s.deadline && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--body)" }}>
                        <CalendarClock size={12} />
                        By {s.deadline}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-semibold text-[16px] leading-tight tracking-[-0.01em] mt-3" style={{ color: "var(--ink)" }}>
                    {s.title || s.institution}
                  </h3>
                  <p className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>
                    {s.institution}
                  </p>

                  {s.amount && (
                    <div className="mt-2.5 text-[14px] font-semibold" style={{ color: "var(--brand-2)" }}>
                      {s.amount}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[12px] font-medium mt-1.5" style={{ color: "var(--brand-2)" }}>
                    {flag && <span className={`fi fi-${s.countryCode.toLowerCase()}`} />}
                    <span>{s.country || "—"}</span>
                  </div>

                  {s.description && (
                    <p className="text-[13px] leading-[1.6] mt-3 line-clamp-3" style={{ color: "var(--ink)" }}>
                      {s.description}
                    </p>
                  )}

                  {s.eligibility && (
                    <div className="mt-3">
                      <p className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase mb-1" style={{ color: "var(--body)" }}>
                        Eligibility
                      </p>
                      <p className="text-[12.5px] leading-[1.55] line-clamp-3" style={{ color: "var(--body)" }}>
                        {s.eligibility}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center gap-2 flex-wrap">
                    {s.applyUrl && (
                      <a
                        href={s.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full text-white text-[13px] font-medium px-5 py-[10px] transition-all duration-250 hover:translate-y-[-1px]"
                        style={{ background: "var(--brand)" }}
                      >
                        Apply now
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      {(s.description || s.eligibility) && (
                        <span className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--body)" }}>
                          <Icon size={12} />
                          Details
                        </span>
                      )}
                      <ShareButton id={s.id} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}