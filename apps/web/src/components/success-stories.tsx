"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { successStoryImages as stories } from "@/lib/stories";

const stats = [
  { value: 10000, suffix: "+", label: "Learners guided" },
  { value: 300, suffix: "+", label: "Visa approvals" },
  { value: 83, suffix: "%", label: "Course completion" },
  { value: 4.8, suffix: "/5", label: "Learner rating" },
];

export function SuccessStories() {
  const [active, setActive] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((a) => (a === null ? a : (a + 1) % stories.length));
      if (e.key === "ArrowLeft") setActive((a) => (a === null ? a : (a - 1 + stories.length) % stories.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a === null ? a : (a + 1) % stories.length)), 4000);
    return () => clearInterval(t);
  }, [paused, active]);

  const doubled = [...stories, ...stories];

  return (
    <section className="py-24 px-[clamp(20px,4.5vw,56px)] overflow-hidden" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "var(--brand-soft)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
              <span className="font-mono text-[11px] font-medium tracking-[0.4px] uppercase" style={{ color: "var(--brand-2)" }}>
                Success Stories
              </span>
            </div>
            <h2
              className="font-display font-semibold tracking-[-0.02em] text-balance leading-[1.12]"
              style={{ fontSize: "clamp(30px,3.5vw,44px)", color: "var(--ink)" }}
            >
              Real results from{" "}
              <span className="relative inline-block" style={{ color: "var(--brand-2)" }}>
                real learners.
                <svg
                  className="absolute -bottom-[6px] left-0 w-full h-[10px]"
                  viewBox="0 0 200 9"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3 6.5C50 2.5 110 2.5 197 6" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
                </svg>
              </span>
            </h2>
          </div>
          <Link
            href="/success-stories"
            className="group inline-flex items-center gap-2 text-[14.5px] font-medium shrink-0 pb-1 border-b-2 transition-all duration-300"
            style={{ color: "var(--brand-2)", borderColor: "var(--brand)" }}
          >
            View all stories
            <svg className="w-[14px] h-[14px] transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: "white", border: "1px solid var(--line)" }}
            >
              <div className="font-display font-bold leading-none tracking-[-0.03em]" style={{ color: "var(--ink)", fontSize: "clamp(24px,2.4vw,32px)" }}>
                {typeof s.value === "number" && s.value >= 100 ? s.value.toLocaleString("en-US") : s.value}
                <span className="font-semibold" style={{ color: "var(--brand)" }}>{s.suffix}</span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.3px] uppercase mt-2" style={{ color: "var(--body)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div
          className="fb-marquee relative overflow-hidden rounded-2xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{ maskImage: "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)" }}
        >
          <div className="fb-marquee-track flex gap-5 w-max py-1">
            {doubled.map((s, i) => (
              <button
                key={`${s.src}-${i}`}
                type="button"
                onClick={() => setActive(i % stories.length)}
                aria-label={`View ${s.alt}`}
                className="group w-[240px] sm:w-[300px] shrink-0 rounded-2xl overflow-hidden bg-white p-[5px] text-left cursor-zoom-in transition-all duration-300 hover:shadow-[0_24px_48px_-28px_rgba(18,32,67,0.35)]"
                style={{ border: "1px solid var(--line)" }}
              >
                <div className="aspect-[4/3] overflow-hidden rounded-[14px]">
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Story ${active + 1}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="absolute inset-0 bg-[rgba(13,22,38,0.85)] backdrop-blur-[6px]"
            onClick={() => setActive(null)}
          />
          <div className="fb-pop-up relative w-full max-w-[1000px]">
            <div className="relative aspect-[16/9] rounded-[22px] overflow-hidden bg-[#0d1626] border border-white/10" style={{ boxShadow: "0 50px 100px -40px rgba(0,0,0,0.7)" }}>
              <img
                src={stories[active].src}
                alt={stories[active].alt}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute -bottom-9 left-1/2 -translate-x-1/2 font-mono text-[11px] font-medium tracking-[0.4px] px-[12px] py-[6px] rounded-full text-white"
              style={{ background: "rgba(13,22,38,0.85)", backdropFilter: "blur(4px)" }}
            >
              {String(active + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close viewer"
            onClick={() => setActive(null)}
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-[var(--ink)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6L18 18" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Previous story"
            onClick={() => setActive((a) => (a === null ? a : (a - 1 + stories.length) % stories.length))}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 text-white backdrop-blur flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-[var(--ink)]"
          >
            <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L11 6M5 12L11 18" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next story"
            onClick={() => setActive((a) => (a === null ? a : (a + 1) % stories.length))}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 text-white backdrop-blur flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-[var(--ink)]"
          >
            <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
