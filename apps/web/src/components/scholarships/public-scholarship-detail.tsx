"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarClock,
  Check,
  GraduationCap,
  Lock,
  School,
  Share2,
} from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { LEVEL_LABELS, type PublicScholarship } from "./types";

export function PublicScholarshipDetail({ scholarship: s }: { scholarship: PublicScholarship }) {
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

  const flag = countryByCode(s.countryCode)?.flag ?? "";
  const Icon = s.level === "school" ? School : GraduationCap;

  const facts = [
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
    {
      label: "Amount",
      value: s.amount || "—",
    },
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
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 hover:opacity-70"
          style={{ color: "var(--brand)" }}
        >
          <ArrowLeft size={15} /> All scholarships
        </Link>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-[8px] text-[13px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
          style={{
            borderColor: "var(--line)",
            color: copied ? "#0FA968" : "var(--ink)",
          }}
        >
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          {copied ? "Link copied!" : "Share"}
        </button>
      </div>

      <div
        className="mt-6 overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="p-[clamp(20px,4vw,36px)]">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            <Award size={12} />
            {s.institution}
          </span>

          <h1
            className="mt-5 font-display text-[clamp(26px,4vw,38px)] font-semibold leading-[1.12] tracking-[-0.02em]"
            style={{ color: "var(--ink)" }}
          >
            {s.title || s.institution}
          </h1>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-4"
            style={{ borderColor: "var(--line)", background: "var(--line)" }}
          >
            {facts.map((f) => (
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
        </div>
      </div>

      <div
        className="relative mt-6 select-none overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <div aria-hidden="true" className="p-[clamp(20px,4vw,36px)]">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
            Full description
          </p>
          <div className="mt-4 space-y-3">
            <div className="h-3 w-full rounded" style={{ background: "var(--line)" }} />
            <div className="h-3 w-11/12 rounded" style={{ background: "var(--line)" }} />
            <div className="h-3 w-4/5 rounded" style={{ background: "var(--line)" }} />
            <div className="h-3 w-full rounded" style={{ background: "var(--line)" }} />
            <div className="h-3 w-2/3 rounded" style={{ background: "var(--line)" }} />
          </div>

          <p className="mt-7 font-mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
            Eligibility
          </p>
          <div className="mt-4 space-y-3">
            <div className="h-3 w-10/12 rounded" style={{ background: "var(--line)" }} />
            <div className="h-3 w-3/4 rounded" style={{ background: "var(--line)" }} />
            <div className="h-3 w-9/12 rounded" style={{ background: "var(--line)" }} />
          </div>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg px-6 py-10 text-center"
          style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(3px)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--brand-soft)" }}
          >
            <Lock size={20} style={{ color: "var(--brand)" }} />
          </div>
          <p className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
            Full details for members
          </p>
          <p className="max-w-[440px] text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
            The complete description, eligibility criteria and official
            application link unlock with a free account.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/login?mode=register&next=${encodeURIComponent(`/dashboard/scholarships/${s.id}`)}`}
              className="rounded-full px-6 py-3 text-[13.5px] font-semibold text-white transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Create free account
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(`/dashboard/scholarships/${s.id}`)}`}
              className="rounded-full border px-6 py-3 text-[13.5px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)]"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}