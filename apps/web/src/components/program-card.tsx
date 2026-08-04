import Link from "next/link";
import type { ReactNode } from "react";
import type { Program } from "@/lib/programs";

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

export function ProgramCard({ p }: { p: Program }) {
  const content = (
    <>
      {/* Dimmed gradient background image */}
      {p.image && (
        <>
          <img
            src={p.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.35 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.15) 80%)",
            }}
          />
        </>
      )}

      <span
        className="relative font-mono text-[10.5px] font-medium tracking-[0.4px] px-[11px] py-[5px] rounded-full inline-block mb-[14px]"
        style={{ background: "rgba(255,255,255,0.7)", color: p.badgeColor }}
      >
        {p.badge}
      </span>
      {p.upcoming && (
        <span
          className="relative font-mono text-[10px] font-medium tracking-[0.4px] px-[9px] py-[5px] rounded-full inline-block ml-[6px] mb-[14px]"
          style={{ background: p.badgeColor, color: "#fff" }}
        >
          UPCOMING
        </span>
      )}
      <h3 className="relative text-[17.5px] font-medium leading-[1.3] max-w-[190px]" style={{ color: "var(--ink)" }}>
        {p.title}
      </h3>
      <p className="relative text-[12.5px] mt-2 max-w-[190px] leading-[1.5]" style={{ color: "var(--body)" }}>
        {p.desc}
      </p>

      {p.price ? (
        <div className="absolute left-[22px] right-[22px] bottom-[24px] flex items-end justify-between gap-3">
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
          <span
            className="inline-flex items-center gap-[5px] text-[12.5px] font-medium opacity-70 pb-[2px]"
            style={{ color: p.badgeColor }}
          >
            {p.upcoming ? "Coming soon" : (
              <>
                Explore course
                <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </span>
        </div>
      ) : (
        <span
          className="absolute left-[22px] bottom-[26px] inline-flex items-center gap-[5px] text-[12.5px] font-medium opacity-70"
          style={{ color: p.badgeColor }}
        >
          {p.upcoming ? "Coming soon" : (
            <>
              Explore course
              <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </span>
      )}

      {!p.image && (
        <span className="absolute right-[-18px] bottom-[-18px] w-[120px] h-[120px] flex items-center justify-center opacity-90 pointer-events-none">
          {decos[p.slug]}
        </span>
      )}
    </>
  );

  if (p.upcoming) {
    return (
      <div
        className="block rounded-[20px] p-[26px_22px_90px] relative overflow-hidden min-h-[230px] opacity-90"
        style={{ background: p.bg, boxShadow: "0 4px 20px -8px rgba(18,32,67,0.1)" }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/programs/${p.slug}`}
      className="block rounded-[20px] p-[26px_22px_90px] relative overflow-hidden min-h-[230px] transition-all duration-300 hover:-translate-y-[6px] group"
      style={{ background: p.bg, boxShadow: "0 4px 20px -8px rgba(18,32,67,0.1)" }}
    >
      {content}
    </Link>
  );
}
