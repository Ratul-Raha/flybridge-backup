"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarClock,
  Check,
  ExternalLink,
  GraduationCap,
  School,
  Settings2,
  Share2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { countryByCode } from "@/lib/countries";

const LEVEL_LABELS: Record<string, string> = {
  any: "Any level",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
  postgraduate: "Postgraduate",
  school: "School",
};

export type ScholarshipDetailData = {
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
};

export function ScholarshipDetailView({ scholarship: s }: { scholarship: ScholarshipDetailData }) {
  const { user } = useAuth();
  const isStaff = user && (user.accountType === "admin" || user.accountType === "moderator");
  const flag = countryByCode(s.countryCode)?.flag ?? "";
  const Icon = s.level === "school" ? School : GraduationCap;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/scholarships/${s.id}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: s.title || s.institution,
          text: `Check out this scholarship: ${s.title || s.institution}`,
          url,
        });
        return;
      } catch {
        /* user cancelled or share failed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/dashboard/scholarships"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-200 hover:text-brand-2"
          style={{ color: "var(--brand)" }}
        >
          <ArrowLeft size={14} /> All scholarships
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-[8px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 hover:translate-y-[-1px]"
            style={{
              borderColor: "var(--line)",
              background: "#fff",
              color: copied ? "#0FA968" : "var(--brand-2)",
            }}
          >
            {copied ? <Check size={13} /> : <Share2 size={13} />}
            {copied ? "Copied!" : "Share"}
          </button>
          {isStaff && (
            <Link
              href="/dashboard/scholarships/manage"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-[8px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 hover:translate-y-[-1px]"
              style={{ borderColor: "var(--line)", background: "#fff", color: "var(--brand-2)" }}
            >
              <Settings2 size={13} /> Manage
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "var(--line)", boxShadow: "0 20px 50px -32px rgba(18,32,67,0.25)" }}>
        {s.imageUrl ? (
          <div className="relative h-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.imageUrl} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="relative h-[120px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(107,76,224,0.10), rgba(15,169,104,0.08))" }}
          >
            <Award size={36} style={{ color: "var(--brand-2)" }} />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            <Award size={12} />
            {s.institution}
          </span>

          <h1
            className="mt-4 font-display text-[clamp(24px,3vw,32px)] font-semibold leading-[1.2] tracking-[-0.02em]"
            style={{ color: "var(--ink)" }}
          >
            {s.title || s.institution}
          </h1>

          <div
            className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-4"
            style={{ borderColor: "var(--line)", background: "var(--line)" }}
          >
            {[
              {
                label: "Country",
                value: s.country ? (
                  <span className="inline-flex items-center gap-1.5">
                    {flag && <span className={`fi fi-${s.countryCode.toLowerCase()}`} />}
                    {s.country}
                  </span>
                ) : (
                  "—"
                ),
              },
              { label: "Amount", value: s.amount || "—" },
              {
                label: "Level",
                value: (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <Icon size={13} />
                    {LEVEL_LABELS[s.level] ?? "Any level"}
                  </span>
                ),
              },
              {
                label: "Deadline",
                value: s.deadline ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={13} />
                    {s.deadline}
                  </span>
                ) : (
                  "—"
                ),
              },
            ].map((f) => (
              <div key={f.label} className="bg-white px-4 py-3.5">
                <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--body)" }}>
                  {f.label}
                </div>
                <div className="mt-1.5 text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          {s.description && (
            <div className="mt-7">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
                Description
              </p>
              <p className="mt-3 text-[14.5px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--body)" }}>
                {s.description}
              </p>
            </div>
          )}

          {s.eligibility && (
            <div className="mt-7">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
                Eligibility
              </p>
              <p className="mt-3 text-[14.5px] leading-[1.75] whitespace-pre-line" style={{ color: "var(--body)" }}>
                {s.eligibility}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {s.applyUrl ? (
              <a
                href={s.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                Apply now
                <ExternalLink size={14} />
              </a>
            ) : (
              <span
                className="inline-flex items-center rounded-full border px-7 py-3.5 text-[14px] font-semibold"
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
              >
                Apply link coming soon
              </span>
            )}
            <Link
              href="/dashboard/scholarships"
              className="inline-flex items-center gap-1.5 rounded-full border px-7 py-3.5 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              Browse all
              <ArrowLeft size={14} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}