import Link from "next/link";
import type { ReactNode } from "react";
import type { Program } from "@/lib/programs";

const decos: Record<string, ReactNode> = {
  "study-visa-prep-us": (
    <svg viewBox="0 0 100 100" fill="none" width={110} height={110}>
      <rect x="20" y="35" width="8" height="45" fill="#2F5FE0" opacity="0.25" />
      <rect x="34" y="20" width="8" height="60" fill="#2F5FE0" opacity="0.35" />
      <rect x="48" y="42" width="8" height="38" fill="#2F5FE0" opacity="0.25" />
      <rect x="62" y="28" width="8" height="52" fill="#2F5FE0" opacity="0.4" />
    </svg>
  ),
  "work-permit-prep-canada": (
    <svg viewBox="0 0 100 100" fill="none" width={110} height={110}>
      <path d="M15 80 L35 30 L50 55 L65 20 L85 80 Z" fill="#188A5D" opacity="0.3" />
    </svg>
  ),
  "obocheton-mone-ilish-level-01": (
    <svg viewBox="0 0 100 100" fill="none" width={110} height={110}>
      <circle cx="50" cy="45" r="26" fill="#6B4CE0" opacity="0.22" />
      <path d="M32 65 L44 78 L44 65 Z" fill="#6B4CE0" opacity="0.22" />
    </svg>
  ),
  "interview-readiness": (
    <svg viewBox="0 0 100 100" fill="none" width={110} height={110}>
      <rect x="25" y="30" width="50" height="35" rx="6" fill="#DB8A2E" opacity="0.22" />
      <rect x="42" y="65" width="16" height="14" fill="#DB8A2E" opacity="0.22" />
    </svg>
  ),
};

export function ProgramCard({ p }: { p: Program }) {
  const badge = (
    <span
      className="font-mono text-[10px] font-semibold tracking-[0.4px] px-[11px] py-[5px] rounded-full inline-block"
      style={{ background: "rgba(255,255,255,0.92)", color: p.badgeColor }}
    >
      {p.badge}
    </span>
  );

  const upcomingTag = p.upcoming ? (
    <span
      className="font-mono text-[10px] font-semibold tracking-[0.4px] px-[9px] py-[5px] rounded-full inline-block"
      style={{ background: p.badgeColor, color: "#fff" }}
    >
      UPCOMING
    </span>
  ) : null;

  const media = (
    <div
      className="relative h-[178px] flex items-center justify-center overflow-hidden"
      style={{ background: p.bg }}
    >
      {p.image ? (
        <>
          <img
            src={p.image}
            alt={p.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(18,32,67,0.34), rgba(18,32,67,0.06) 42%)" }}
          />
        </>
      ) : (
        <span className="flex items-center justify-center opacity-90 pointer-events-none">
          {decos[p.slug]}
        </span>
      )}
      <span className="absolute left-3.5 top-3.5">{badge}</span>
    </div>
  );

  const footer = p.price ? (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div
          className="font-mono text-[10px] font-medium tracking-[0.3px]"
          style={{ color: "var(--brand-2)" }}
        >
          INTRO OFFER
        </div>
        <div
          className="font-display font-bold leading-none mt-[4px]"
          style={{ fontSize: "23px", color: "var(--ink)" }}
        >
          {p.price}
        </div>
      </div>
      {p.upcoming ? (
        <span className="text-[12.5px] font-medium" style={{ color: p.badgeColor }}>
          Coming soon
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-[5px] text-[12.5px] font-medium"
          style={{ color: p.badgeColor }}
        >
          Explore course
          <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  ) : (
    <span className="inline-flex items-center gap-[5px] text-[12.5px] font-medium" style={{ color: p.badgeColor }}>
      {p.upcoming ? "Coming soon" : (
        <>
          Explore course
          <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      )}
    </span>
  );

  const body = (
    <>
      {media}
      <div className="flex flex-col flex-1 gap-2.5 p-5">
        <h3 className="font-display text-[16.5px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
          {p.title}
        </h3>
        <p className="text-[12.5px] leading-[1.55]" style={{ color: "var(--body)" }}>
          {p.desc}
        </p>
        <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--line)" }}>
          {footer}
        </div>
      </div>
    </>
  );

  if (p.upcoming) {
    return (
      <div
        className="flex flex-col overflow-hidden rounded-[20px] border bg-white"
        style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -12px rgba(18,32,67,0.12)" }}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/programs/${p.slug}`}
      className="flex flex-col overflow-hidden rounded-[20px] border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.12)" }}
    >
      {body}
    </Link>
  );
}