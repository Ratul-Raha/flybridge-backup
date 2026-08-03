import Link from "next/link";
import { programs } from "@/lib/programs";
import { ProgramCard } from "./program-card";

export function Programs() {
  return (
    <section id="programs" className="pt-[110px] px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
        <div>
          <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
            Popular programs
          </h2>
          <p className="text-[15px] mt-2" style={{ color: "var(--body)" }}>
            Pick a path based on where you&apos;re headed next.
          </p>
        </div>
        <Link href="/programs" className="view-all font-medium text-[14px] inline-flex items-center gap-[6px] group" style={{ color: "var(--brand-2)" }}>
          View all programs
          <svg className="w-[14px] h-[14px] transition-transform duration-250 group-hover:translate-x-[3px]" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {programs.map((p) => (
          <ProgramCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}
