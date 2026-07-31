import Link from "next/link";
import type { ReactNode } from "react";
import { programs } from "@/lib/programs";

const decos: Record<string, ReactNode> = {
  "study-visa-prep-us": (
    <svg viewBox="0 0 100 100" fill="none">
      <rect x="20" y="35" width="8" height="45" fill="#2F5FE0" opacity="0.25" />
      <rect x="34" y="20" width="8" height="60" fill="#2F5FE0" opacity="0.35" />
      <rect x="48" y="42" width="8" height="38" fill="#2F5FE0" opacity="0.25" />
      <rect x="62" y="28" width="8" height="52" fill="#2F5FE0" opacity="0.4" />
    </svg>
  ),
  "work-permit-prep-canada": (
    <svg viewBox="0 0 100 100" fill="none">
      <path d="M15 80 L35 30 L50 55 L65 20 L85 80 Z" fill="#188A5D" opacity="0.3" />
    </svg>
  ),
  "obocheton-mone-ilish-level-01": (
    <svg viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="45" r="26" fill="#6B4CE0" opacity="0.22" />
      <path d="M32 65 L44 78 L44 65 Z" fill="#6B4CE0" opacity="0.22" />
    </svg>
  ),
  "interview-readiness": (
    <svg viewBox="0 0 100 100" fill="none">
      <rect x="25" y="30" width="50" height="35" rx="6" fill="#DB8A2E" opacity="0.22" />
      <rect x="42" y="65" width="16" height="14" fill="#DB8A2E" opacity="0.22" />
    </svg>
  ),
};

export function Programs() {
  return (
    <section className="pt-[110px] px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
        <div>
          <h2 className="font-extrabold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
            Popular programs
          </h2>
          <p className="text-[15px] mt-2" style={{ color: "var(--body)" }}>
            Pick a path based on where you&apos;re headed next.
          </p>
        </div>
        <a href="#" className="view-all font-semibold text-[14px] inline-flex items-center gap-[6px]" style={{ color: "var(--brand-2)" }}>
          View all programs
          <svg className="w-[14px] h-[14px] transition-transform duration-250 group-hover:translate-x-[3px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {programs.map((p) => (
          <Link
            key={p.slug}
            href={`/programs/${p.slug}`}
            className="block rounded-[20px] p-[26px_22px_90px] relative overflow-hidden min-h-[230px] transition-all duration-300 hover:-translate-y-[6px] group"
            style={{ background: p.bg, boxShadow: "0 4px 20px -8px rgba(18,32,67,0.1)" }}
          >
            <span
              className="font-mono text-[10.5px] font-semibold tracking-[0.4px] px-[11px] py-[5px] rounded-full inline-block mb-[14px]"
              style={{ background: "rgba(255,255,255,0.7)", color: p.badgeColor }}
            >
              {p.badge}
            </span>
            <h3 className="text-[17.5px] font-bold leading-[1.3] max-w-[190px]" style={{ color: "var(--ink)" }}>
              {p.title}
            </h3>
            <p className="text-[12.5px] mt-2 max-w-[190px] leading-[1.5]" style={{ color: "var(--body)" }}>
              {p.desc}
            </p>
            <span
              className="absolute left-[22px] bottom-[26px] inline-flex items-center gap-[5px] text-[12.5px] font-semibold opacity-70 group-hover:opacity-100 group-hover:translate-x-[2px] transition-all duration-250"
              style={{ color: p.badgeColor }}
            >
              Explore course
              <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="absolute right-[-18px] bottom-[-18px] w-[120px] h-[120px] flex items-center justify-center opacity-90 pointer-events-none">
              {decos[p.slug]}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
