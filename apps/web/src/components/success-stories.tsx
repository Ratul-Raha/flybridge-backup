"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const stories = [
  {
    src: "/stories/success1.png",
    alt: "FlyBridge learner success story",
    tag: "Work Abroad",
    tagColor: "#14B57E",
  },
  {
    src: "/stories/success2.png",
    alt: "FlyBridge learner success story",
    tag: "Study Abroad",
    tagColor: "#2F5FE0",
  },
  {
    src: "/stories/success3.png",
    alt: "FlyBridge learner success story",
    tag: "Career Prep",
    tagColor: "#6B4CE0",
  },
];

const STAT_TARGET = 10000;
const STAT_DURATION = 1800;

function CountUpStat() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / STAT_DURATION, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setCount(Math.round(eased * STAT_TARGET));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="flex items-baseline gap-[12px]">
      <span className="font-display font-semibold leading-none tracking-[-0.03em]" style={{ fontFamily: "var(--font-hand)", fontSize: "clamp(76px,8vw,110px)", color: "var(--ink)" }}>
        {count.toLocaleString("en-US")}
        <span style={{ color: "var(--brand)" }}>+</span>
      </span>
      <span className="font-mono text-[11px] font-medium tracking-[0.4px] uppercase" style={{ color: "var(--body)" }}>
        Learners guided
      </span>
    </div>
  );
}

export function SuccessStories() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const goTo = useCallback((next: number) => {
    setIndex(((next % stories.length) + stories.length) % stories.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!paused.current) goTo(index + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [index, goTo]);

  return (
    <section className="pt-[110px] pb-[100px] px-[clamp(20px,4.5vw,56px)] overflow-hidden" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
        <div>
          <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
            SUCCESS STORIES
          </div>
          <h2
            className="font-display font-semibold tracking-[-0.01em] text-balance"
            style={{ fontFamily: "var(--font-hand)", fontSize: "clamp(40px,4.6vw,56px)", lineHeight: 1.15, color: "var(--ink)" }}
          >
            Real results from{" "}
            <span style={{ color: "var(--brand-2)" }}>real learners.</span>
          </h2>
          <p className="mt-[18px] max-w-[440px] text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
            A look at what happens after the course — offers, acceptances and new careers, shared straight from our learners.
          </p>

          <div className="mt-[44px]">
            <CountUpStat />
          </div>

          <Link href="/success-stories" className="inline-flex items-center gap-2 font-medium text-[15px] mt-[34px]" style={{ fontFamily: "var(--font-hand)", fontSize: "26px", color: "var(--brand-2)" }}>
            Read all stories
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </Link>
        </div>

        <div
          className="relative max-w-[520px] mx-auto w-full aspect-[4/3]"
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
        >
          {stories.map((s, i) => (
            <div
              key={s.src}
              className="absolute inset-0 rounded-3xl overflow-hidden border border-line bg-white transition-opacity duration-700"
              style={{
                opacity: i === index ? 1 : 0,
                zIndex: i === index ? 1 : 0,
                boxShadow: "0 24px 44px -20px rgba(18,32,67,0.32)",
                pointerEvents: i === index ? "auto" : "none",
              }}
            >
              <img
                src={s.src}
                alt={s.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <span
                className="absolute top-4 left-4 font-mono text-[10px] font-medium tracking-[0.4px] uppercase px-[11px] py-[6px] rounded-full text-white"
                style={{ background: "rgba(18,32,67,0.55)", backdropFilter: "blur(4px)" }}
              >
                {s.tag}
              </span>
              <span
                className="absolute bottom-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 4px 10px -3px rgba(18,32,67,0.25)" }}
              >
                <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={s.tagColor} strokeWidth="2" />
                  <path d="M8 12.5L11 15.5L16 9" stroke={s.tagColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ))}

          <button
            aria-label="Previous story"
            onClick={() => goTo(index - 1)}
            className="absolute left-[-4px] top-1/2 -translate-y-1/2 z-[2] w-[44px] h-[44px] rounded-full bg-white border border-line flex items-center justify-center transition-all duration-250 hover:border-brand-2/50 hover:shadow-md"
            style={{ boxShadow: "0 8px 18px -8px rgba(18,32,67,0.28)" }}
          >
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L11 6M5 12L11 18" />
            </svg>
          </button>
          <button
            aria-label="Next story"
            onClick={() => goTo(index + 1)}
            className="absolute right-[-4px] top-1/2 -translate-y-1/2 z-[2] w-[44px] h-[44px] rounded-full bg-white border border-line flex items-center justify-center transition-all duration-250 hover:border-brand-2/50 hover:shadow-md"
            style={{ boxShadow: "0 8px 18px -8px rgba(18,32,67,0.28)" }}
          >
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2] flex items-center gap-2">
            {stories.map((s, i) => (
              <button
                key={s.src}
                aria-label={`Go to story ${i + 1}`}
                onClick={() => goTo(i)}
                className="h-[6px] rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 24 : 6,
                  background: i === index ? "#fff" : "rgba(255,255,255,0.6)",
                  boxShadow: "0 1px 4px rgba(18,32,67,0.25)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
