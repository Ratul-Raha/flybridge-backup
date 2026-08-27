"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/**
 * NOTE ON DATA
 * Your old file pulled `successStoryImages` (just { src, alt }) from
 * "@/lib/stories". The new design needs a bit more per story — name,
 * program, country, a short quote, and a status badge — so this file
 * defines that richer shape locally as `stories`.
 *
 * Easiest path: move this `Story` type + the `stories` array into
 * "@/lib/stories.ts" (replacing the old `successStoryImages` export),
 * point `src` at your real photos, and swap in your real learners.
 * Everything below already reads from `stories`, so nothing else changes.
 */

type Story = {
  src: string;
  alt: string;
  name: string;
  program: string;
  country: string;
  flag: string;
  quote: string;
  badge: string;
};

const stories: Story[] = [
  {
    src: "/stories/success1.png",
    alt: "Mijanur Rahman in the UK",
    name: "Mijanur Rahman",
    program: "University for the Creative Arts",
    country: "UK",
    flag: "🇬🇧",
    quote: "Thanks to FlyBridge, I'm now studying at my dream university in the UK.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success2.png",
    alt: "Faiyaz in the USA",
    name: "Faiyaz",
    program: "Wichita State University",
    country: "USA",
    flag: "🇺🇸",
    quote: "FlyBridge made my dream of studying in the USA a reality. The guidance was exceptional!",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success3.png",
    alt: "Pabel in Cyprus",
    name: "Pabel",
    program: "Neapolis University Pafos",
    country: "Cyprus",
    flag: "🇨🇾",
    quote: "From university selection to visa approval, FlyBridge was with me every step of the way.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success4.png",
    alt: "Mahfuz Ahmed in Portugal",
    name: "Mahfuz Ahmed",
    program: "Work Permit",
    country: "Portugal",
    flag: "🇵🇹",
    quote: "The team's support and clear process helped me achieve my goal stress-free.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success5.png",
    alt: "Real Khan Mamun in the UK",
    name: "Real Khan Mamun",
    program: "",
    country: "UK",
    flag: "🇬🇧",
    quote: "I went from confused about where to apply to holding multiple offer letters with FlyBridge's guidance.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success6.png",
    alt: "Ahmed Taj in the UK",
    name: "Ahmed Taj",
    program: "University of Chester",
    country: "UK",
    flag: "🇬🇧",
    quote: "Thanks to FlyBridge, I'm now studying at my dream university in the UK.",
    badge: "Visa Approved",
  },
];

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left" ? <path d="M19 12H5M5 12L11 6M5 12L11 18" /> : <path d="M5 12H19M19 12L13 6M19 12L13 18" />}
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9.5 12l1.8 1.8L14.5 10" />
    </svg>
  );
}

export function SuccessStories() {
  const VISIBLE = 4; // cards visible per "page" on large screens
  const maxStart = Math.max(0, stories.length - VISIBLE);
  const [start, setStart] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => setStart(Math.min(Math.max(i, 0), maxStart));
  const next = () => goTo(start + 1 > maxStart ? 0 : start + 1);
  const prev = () => goTo(start === 0 ? maxStart : start - 1);

  // Auto-advance, pausing on hover
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setStart((s) => (s + 1 > maxStart ? 0 : s + 1)), 4500);
    return () => clearInterval(t);
  }, [paused, maxStart]);

  const dots = useMemo(() => Array.from({ length: maxStart + 1 }, (_, i) => i), [maxStart]);
  const avatarPreview = stories.slice(0, 5);

  return (
    <section className="py-24 px-[clamp(20px,4.5vw,56px)] overflow-hidden" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto">

        {/* Header */}
        <div className="mb-12">
          {/* Eyebrow + view all */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full" style={{ background: "var(--brand-soft)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />
              <span className="font-mono text-[11px] font-semibold tracking-[0.4px] uppercase" style={{ color: "var(--brand-2)" }}>
                Success Stories
              </span>
            </div>
            <Link
              href="/success-stories"
              className="group inline-flex items-center gap-1.5 text-[14px] font-semibold transition-all duration-300 hover:gap-2.5"
              style={{ color: "var(--brand-2)" }}
            >
              View all stories
              <ChevronIcon dir="right" />
            </Link>
          </div>

          {/* Title */}
          <h2 className="max-w-[820px] text-balance">
            <span className="block font-display font-medium tracking-[-0.01em] text-[clamp(18px,2.2vw,24px)] mb-3" style={{ color: "var(--body)" }}>
              Real results from
            </span>
            <span className="block font-display font-bold tracking-[-0.035em] leading-[1.03]" style={{ fontSize: "clamp(40px,5.2vw,62px)", color: "var(--ink)" }}>
              real learners<span style={{ color: "var(--brand)" }}>.</span>
            </span>
          </h2>

          {/* Intro + trust cluster */}
          <div className="mt-9 flex flex-col lg:flex-row lg:items-center justify-between gap-7 lg:gap-10">
            <p className="text-[15.5px] leading-relaxed max-w-[560px]" style={{ color: "var(--body)" }}>
              Discover how FlyBridge learners achieved their study abroad dreams and built brighter futures with the right guidance.
            </p>

            <div className="flex items-center gap-5 shrink-0">
              <div className="flex -space-x-3">
                {avatarPreview.map((s) => (
                  <img
                    key={s.src}
                    src={s.src}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    style={{ boxShadow: "0 2px 6px -2px rgba(18,32,67,0.3)" }}
                  />
                ))}
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center font-mono text-[10px] font-semibold"
                  style={{ background: "var(--brand)", color: "#fff" }}
                >
                  10k+
                </div>
              </div>
              <span className="w-px h-9 shrink-0" style={{ background: "var(--line)" }} />
              <div>
                <div className="flex items-center gap-[3px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#F59E0B" }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                  <span className="text-[13px] font-bold ml-1.5" style={{ color: "var(--ink)" }}>4.8/5</span>
                </div>
                <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                  Trusted by <span className="font-semibold" style={{ color: "var(--ink)" }}>10,000+</span> learners worldwide
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Story carousel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            type="button"
            aria-label="Previous stories"
            onClick={prev}
            className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white items-center justify-center transition-all duration-200 hover:shadow-md"
            style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
          >
            <ChevronIcon dir="left" />
          </button>

          <div className="overflow-x-auto lg:overflow-hidden -mx-1 px-1 no-scrollbar">
            <div
              ref={trackRef}
              className="flex gap-5 lg:transition-transform lg:duration-500 lg:ease-out"
              style={{ transform: `translateX(calc(-${start} * (100% / ${VISIBLE} + 20px / ${VISIBLE})))` }}
            >
              {stories.map((s) => (
                <div
                  key={s.src}
                  className="w-[240px] sm:w-[260px] lg:w-[calc((100%-60px)/4)] shrink-0 rounded-2xl overflow-hidden bg-white flex flex-col"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={s.src} alt={s.alt} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col h-[230px]">
                    <div className="font-display font-semibold text-[16px] tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                      {s.name}
                    </div>
                    {s.program && (
                      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>{s.program}</div>
                    )}
                    <div className="flex items-center gap-1.5 text-[12.5px] font-medium mt-1.5" style={{ color: "var(--brand-2)" }}>
                      <span>{s.flag}</span>
                      <span>{s.country}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed mt-3 line-clamp-3" style={{ color: "var(--ink)" }}>
                      &ldquo;{s.quote}&rdquo;
                    </p>
                    <div
                      className="inline-flex items-center gap-1.5 mt-auto pt-3 px-2.5 py-1 rounded-full font-mono text-[9.5px] font-medium tracking-[0.3px] uppercase"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-2)", alignSelf: "flex-start" }}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {s.badge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Next stories"
            onClick={next}
            className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white items-center justify-center transition-all duration-200 hover:shadow-md"
            style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
          >
            <ChevronIcon dir="right" />
          </button>
        </div>

        {/* Dots */}
        <div className="hidden lg:flex items-center justify-center gap-2 mt-8">
          {dots.map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === start ? 20 : 7,
                height: 7,
                background: i === start ? "var(--brand)" : "var(--line)",
              }}
            />
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div
          className="mt-14 relative overflow-hidden rounded-lg px-7 py-7 sm:px-9 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-9"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
            backgroundSize: "28px 28px, 28px 28px, auto",
            boxShadow: "0 30px 60px -30px rgba(11,94,70,0.55)",
          }}
        >
          <div className="absolute top-0 right-0 w-[260px] h-[260px] rounded-full blur-[90px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.12)" }} />

          <div className="relative flex items-center gap-4 lg:flex-1">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white"
              style={{ background: "rgba(255,255,255,0.14)" }}
            >
              <ShieldIcon />
            </div>
            <h3 className="font-display font-bold text-[22px] leading-tight text-white">
              Your success is our mission.
            </h3>
          </div>

          <p className="relative text-[13.5px] leading-relaxed max-w-[320px] text-white/80 hidden lg:block">
            We&apos;re more than consultants — we&apos;re your partners in building a global future.
          </p>

          <div className="relative hidden lg:block w-px self-stretch" style={{ background: "rgba(255,255,255,0.2)" }} />

          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 shrink-0">
            {[
              { value: "50+", label: "Countries" },
              { value: "300+", label: "Universities" },
              { value: "15+", label: "Years of Trust" },
              { value: "24/7", label: "Learner Support" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display font-bold text-[20px] text-white" style={{ lineHeight: 1.1 }}>{s.value}</div>
                <div className="text-[11px] mt-0.5 text-white/65">{s.label}</div>
              </div>
            ))}
          </div>

          <Link
            href="/contact"
            className="relative inline-flex items-center justify-center gap-2 shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium text-[#0B5E46] transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "#fff", boxShadow: "0 12px 24px -12px rgba(0,0,0,0.4)" }}
          >
            Start your journey today
            <ChevronIcon dir="right" />
          </Link>
        </div>

      </div>
    </section>
  );
}
