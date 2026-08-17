import Link from "next/link";
import { programs } from "@/lib/programs";
import { ProgramCard } from "./program-card";

export function Programs() {
  return (
    <section id="programs" className="pt-[110px] px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div className="max-w-[560px]">
          <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
            PROGRAMS & COURSES
          </div>
          <h2
            className="font-display font-semibold tracking-[-0.01em] text-balance"
            style={{ fontSize: "clamp(26px,3vw,36px)", lineHeight: 1.15, color: "var(--ink)" }}
          >
            Start with the{" "}
            <span className="relative inline-block" style={{ color: "var(--brand-2)" }}>
              right program.
              <svg
                className="absolute -bottom-[5px] left-0 w-full h-[8px]"
                viewBox="0 0 200 9"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path d="M3 6.5C50 2.5 110 2.5 197 6" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
              </svg>
            </span>
          </h2>
          <p className="text-[15.5px] mt-[10px]" style={{ color: "var(--body)" }}>
            Pick a path based on where you&apos;re headed next — each one comes with everything you need to get there.
          </p>
        </div>
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-[14.5px] font-medium shrink-0 group"
          style={{ color: "var(--brand-2)" }}
        >
          View all programs
          <svg
            className="w-[13px] h-[13px] transition-transform duration-250 group-hover:translate-x-[3px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12H19M19 12L13 6M19 12L13 18" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {programs
          .filter((p) => !p.hasDb)
          .map((p) => (
            <ProgramCard key={p.slug} p={p} />
          ))}
      </div>
    </section>
  );
}
