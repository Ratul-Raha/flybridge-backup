"use client";

import { useState } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { ProgramCard } from "@/components/program-card";
import { programs } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Programs | FlyBridge Education Group",
  description:
    "Practical, self-paced courses covering study visas, work permits, English and interview readiness — every step of your journey abroad.",
};

const tracks = [
  { label: "Study abroad", desc: "Visa prep, university applications and documentation for the US, Canada and beyond." },
  { label: "Work abroad", desc: "Permits, eligibility and job-search groundwork for international careers." },
  { label: "English", desc: "Practical, confident communication for everyday life, interviews and exams." },
  { label: "Career prep", desc: "Interview frameworks, mock questions and professional delivery." },
];

const included = [
  {
    title: "Self-paced video lessons",
    desc: "Bite-sized, expert-led modules built around real applications — learn on your own schedule.",
  },
  {
    title: "Real documents & templates",
    desc: "Every course ships with the actual forms, checklists and templates you'll need along the way.",
  },
  {
    title: "Guided start to finish",
    desc: "From eligibility to post-arrival, courses map the entire journey so nothing slips through the cracks.",
  },
  {
    title: "Support when you need it",
    desc: "Ask questions and get answers from people who've navigated the same path — and helped others do it.",
  },
];

export default function ProgramsPage() {
  const [openTrack, setOpenTrack] = useState<number | null>(null);

  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="pt-[168px] pb-[96px] px-[clamp(20px,4.5vw,56px)]">
          <div className="max-w-[1320px] mx-auto">
            <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-end">
              <div className="max-w-[640px]">
                <div
                  className="font-mono text-[11.5px] font-medium tracking-[0.4px] uppercase mb-6 pb-2 border-b w-fit"
                  style={{ color: "var(--brand-2)", borderColor: "var(--line)" }}
                >
                  Programs
                </div>

                <h1
                  className="font-display text-display-lg font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
                  style={{ color: "var(--ink)" }}
                >
                  Every step of the journey, covered in one place.
                </h1>

                <p className="mt-6 max-w-[480px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                  Self-paced, practical courses that take you from where you are now to
                  studying, working and building a life abroad.
                </p>
              </div>

              {/* Track index — expandable orientation list */}
              <div className="lg:w-[300px] shrink-0">
                <div className="flex flex-col">
                  {tracks.map((t, i) => {
                    const open = openTrack === i;
                    return (
                      <div
                        key={t.label}
                        className="border-t last:border-b"
                        style={{ borderColor: "var(--line)" }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenTrack(open ? null : i)}
                          aria-expanded={open}
                          className="group flex w-full items-center justify-between gap-6 py-4 text-left transition-colors"
                        >
                          <span
                            className="text-[14.5px] font-medium transition-colors"
                            style={{ color: "var(--ink)" }}
                          >
                            {t.label}
                          </span>
                          <span
                            className={`w-[7px] h-[7px] rounded-full shrink-0 opacity-30 group-hover:opacity-100 transition-opacity ${
                              open ? "opacity-100" : ""
                            }`}
                            style={{ background: "var(--brand-2)" }}
                          />
                        </button>
                        {open && (
                          <p
                            className="pb-4 pr-6 text-[13px] leading-[1.65]"
                            style={{ color: "var(--body)" }}
                          >
                            {t.desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Program grid */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {programs.map((p) => (
                <ProgramCard key={p.slug} p={p} />
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto border-t" style={{ borderColor: "var(--line)" }}>
            <div className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 pt-14">
              <div>
                <div
                  className="font-mono text-[11.5px] font-medium tracking-[0.4px] uppercase mb-4"
                  style={{ color: "var(--brand-2)" }}
                >
                  What&apos;s inside
                </div>
                <h2
                  className="font-display font-semibold tracking-[-0.01em] leading-[1.2]"
                  style={{ fontSize: "clamp(24px,2.6vw,30px)", color: "var(--ink)" }}
                >
                  Built like a roadmap, not a lecture
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
                {included.map((f) => (
                  <div key={f.title} className="pt-6 border-t" style={{ borderColor: "var(--line)" }}>
                    <h3 className="font-display font-semibold text-[15.5px]" style={{ color: "var(--ink)" }}>
                      {f.title}
                    </h3>
                    <p className="text-[13.5px] leading-[1.65] mt-2" style={{ color: "var(--body)" }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[120px]">
          <div className="max-w-[1320px] mx-auto">
            <div
              className="rounded-[28px] px-[clamp(28px,6vw,72px)] py-[clamp(48px,7vw,80px)]"
              style={{ background: "var(--ink)" }}
            >
              <div className="max-w-[600px]">
                <div
                  className="font-mono text-[11px] font-medium tracking-[0.2em] uppercase mb-5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Not sure where to start?
                </div>
                <h2 className="font-display text-[clamp(26px,3vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em] text-white text-balance">
                  Talk to a counselor and get a personal roadmap
                </h2>
                <p className="text-[15.5px] leading-[1.65] mt-4 max-w-[440px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Tell us where you want to go — we&apos;ll point you to the right course and
                  the next step to take.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-10">
                  <a
                    href="tel:+17786768459"
                    className="inline-flex items-center gap-2.5 font-medium text-[14.5px] rounded-full px-[26px] py-[13px] transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand-2)", color: "#ffffff" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call us
                  </a>
                  <Link
                    href="/success-stories"
                    className="inline-flex items-center gap-1.5 font-medium text-[14.5px] transition-opacity hover:opacity-70"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    See learner stories
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}