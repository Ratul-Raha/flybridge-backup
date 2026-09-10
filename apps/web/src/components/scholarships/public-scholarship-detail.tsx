"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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

function ShareButton({ s }: { s: PublicScholarship }) {
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
    <button
      type="button"
      onClick={copyLink}
      className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-[9px] text-[13px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
      style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--ink)" }}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}

export function PublicScholarshipDetail({ scholarship: s }: { scholarship: PublicScholarship }) {
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
      label: "Award",
      value: <span style={{ color: "var(--brand-2)" }}>{s.amount || "—"}</span>,
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
      {/* Top bar: breadcrumb + share */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12.5px] font-medium">
          <Link href="/scholarships" className="inline-flex items-center gap-2 font-semibold transition-colors duration-200 hover:opacity-70" style={{ color: "var(--brand)" }}>
            <ArrowLeft size={15} /> All scholarships
          </Link>
        </div>
        <ShareButton s={s} />
      </div>

      {/* Cover hero */}
      <div
        className="relative mt-6 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--line)", boxShadow: "0 24px 60px -32px rgba(18,32,67,0.28)" }}
      >
        {s.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.imageUrl}
              alt={s.title || s.institution}
              className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[380px]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg,rgba(18,32,67,0.06) 0%,rgba(18,32,67,0.25) 50%,rgba(10,20,42,0.82) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="h-[220px] w-full sm:h-[300px] lg:h-[360px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#E2F6EE,#CDEFFE)" }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-white"
              style={{ background: "linear-gradient(135deg,#0FA968,#18A97A)", boxShadow: "0 18px 40px -18px rgba(15,169,104,0.6)" }}
            >
              <Award size={34} />
            </div>
          </div>
        )}

        {/* Overlay content */}
        <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,4vw,36px)]">
          <span
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] backdrop-blur"
            style={{ color: "var(--brand-2)" }}
          >
            <Award size={12} />
            {s.institution}
          </span>

          <h1
            className="mt-3 font-display text-[clamp(24px,4vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
          >
            {s.title || s.institution}
          </h1>

          {s.amount && (
            <p className="mt-2 text-[clamp(16px,2vw,22px)] font-bold" style={{ color: "#7EF0BF" }}>
              {s.amount}
            </p>
          )}
        </div>
      </div>

      {/* Info strip */}
      <div
        className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4"
        style={{ borderColor: "var(--line)", background: "var(--line)" }}
      >
        {facts.map((f) => (
          <div key={f.label} className="bg-white px-5 py-4">
            <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--body)" }}>
              {f.label}
            </div>
            <div className="mt-1.5 text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {/* Locked details */}
      <div
        className="relative mt-6 select-none overflow-hidden rounded-2xl border bg-white"
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
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-10 text-center"
          style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(3px)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--brand-soft)" }}
          >
            <Lock size={20} style={{ color: "var(--brand)" }} />
          </div>
          <Link
            href={`/login?mode=register&next=${encodeURIComponent(`/dashboard/scholarships/${s.id}`)}`}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)", boxShadow: "0 14px 30px -16px rgba(15,169,104,0.55)" }}
          >
            See full details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
