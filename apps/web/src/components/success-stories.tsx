"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { successStoryImages as stories } from "@/lib/stories";

const stats = [
  { value: 10000, suffix: "+", label: "Learners guided" },
  { value: 3200, suffix: "+", label: "Visa approvals" },
  { value: 92, suffix: "%", label: "Course completion" },
];

function CountUp({ start, target, suffix }: { start: boolean; target: number; suffix: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / 1500, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);

  return (
    <>
      {val.toLocaleString("en-US")}
      <span style={{ color: "var(--brand)" }}>{suffix}</span>
    </>
  );
}

export function SuccessStories() {
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          ob.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

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
    <section className="pt-[110px] pb-[100px] px-[clamp(20px,4.5vw,56px)] overflow-hidden" style={{ background: "var(--bg-soft)" }}>
      <div ref={ref} className="max-w-[1320px] mx-auto">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
          <div className="max-w-[560px]">
            <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
              SUCCESS STORIES
            </div>
            <h2
              className="font-display font-semibold tracking-[-0.01em] text-balance"
              style={{ fontSize: "clamp(28px,3.2vw,38px)", lineHeight: 1.2, color: "var(--ink)" }}
            >
              Real results from{" "}
              <span className="relative inline-block" style={{ color: "var(--brand-2)" }}>
                real learners.
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
          </div>
          <Link
            href="/success-stories"
            className="inline-flex items-center gap-2 text-[14.5px] font-medium shrink-0"
            style={{ color: "var(--brand-2)" }}
          >
            View all stories
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </Link>
        </div>

        <div className="flex items-center gap-6 md:gap-10 flex-wrap">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6 md:gap-10">
              {i > 0 && <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "rgba(18,32,67,0.18)" }} />}
              <div>
                <div className="font-display font-semibold leading-none tracking-[-0.02em]" style={{ color: "var(--ink)", fontSize: "clamp(26px,2.6vw,34px)" }}>
                  <CountUp start={shown} target={s.value} suffix={s.suffix} />
                </div>
                <div className="font-mono text-[9.5px] tracking-[0.3px] uppercase mt-[6px]" style={{ color: "var(--body)" }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-6 md:gap-10">
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "rgba(18,32,67,0.18)" }} />
            <div>
              <div className="font-display font-semibold leading-none tracking-[-0.02em]" style={{ color: "var(--ink)", fontSize: "clamp(26px,2.6vw,34px)" }}>
                4.9/
                <span style={{ color: "var(--brand)" }}>5</span>
              </div>
              <div className="font-mono text-[9.5px] tracking-[0.3px] uppercase mt-[6px]" style={{ color: "var(--body)" }}>
                Learner rating
              </div>
            </div>
          </div>
        </div>

        <div
          className="fb-marquee relative mt-12 -mx-[clamp(20px,4.5vw,56px)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="fb-marquee-track flex gap-5 md:gap-6 w-max px-[clamp(20px,4.5vw,56px)]">
            {doubled.map((s, i) => (
              <button
                key={`${s.src}-${i}`}
                type="button"
                onClick={() => setActive(i % stories.length)}
                aria-label={`View ${s.alt}`}
                className="group w-[260px] sm:w-[320px] shrink-0 rounded-2xl overflow-hidden border border-line bg-white p-[6px] text-left cursor-zoom-in transition-shadow duration-300 hover:shadow-[0_28px_45px_-30px_rgba(18,32,67,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/60"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-xl">
                  <img
                    src={s.src}
                    alt={s.alt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                </div>
              </button>
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[clamp(40px,6vw,90px)] z-10"
            style={{ background: "linear-gradient(90deg, var(--bg-soft), transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[clamp(40px,6vw,90px)] z-10"
            style={{ background: "linear-gradient(270deg, var(--bg-soft), transparent)" }}
          />
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