"use client";

import Link from "next/link";
import { Award } from "lucide-react";

export function ScholarshipsHero() {
  return (
    <section className="relative overflow-hidden pt-[clamp(120px,15vh,150px)] pb-[clamp(52px,7vw,84px)]">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(18,32,67,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.04) 1px, transparent 1px), radial-gradient(680px 420px at 12% 6%, rgba(15,169,104,0.1), transparent 60%), radial-gradient(560px 380px at 92% 88%, rgba(107,76,224,0.07), transparent 60%)",
          backgroundSize: "40px 40px, 40px 40px, auto, auto",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
        <span
          className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--brand-2)", boxShadow: "0 8px 20px -14px rgba(18,32,67,0.25)" }}
        >
          <span className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--brand)" }} />
          Scholarship board · Updated as they open
        </span>

        <h1
          className="mt-5 max-w-[760px] font-display font-semibold leading-[1.08] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px,4.2vw,48px)", color: "var(--ink)" }}
        >
          Funding is out there.
          <br />
          <span style={{ color: "var(--brand-2)" }}>Come claim yours.</span>
        </h1>

        <p
          className="mt-5 max-w-[560px] text-[15.5px] leading-[1.7]"
          style={{ color: "var(--body)" }}
        >
          Real scholarships from universities and institutions around the world —
          amounts, deadlines and who can apply. We show you the headline; the
          full story unlocks with one tap.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#board"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Award size={15} />
            Explore scholarships
          </a>
          <Link
            href="/login?mode=register&next=/dashboard/scholarships"
            className="rounded-full border px-7 py-3.5 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)]"
            style={{ borderColor: "var(--brand-2)", color: "var(--brand-2)" }}
          >
            Create free account
          </Link>
        </div>
      </div>
    </section>
  );
}