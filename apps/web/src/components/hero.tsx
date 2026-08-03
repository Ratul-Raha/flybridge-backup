"use client";

import { useEffect, useRef } from "react";

const courseCards = [
  { title: "Study Visa Prep — US", meta: "12 lessons · 3h 40m", progress: "64%", color: "blue" },
  { title: "Work Permit Prep — Canada", meta: "9 lessons · 2h 10m", progress: "30%", color: "mint" },
  { title: "Spoken English", meta: "20 lessons · 5h 05m", progress: "82%", color: "peach" },
  { title: "Interview Readiness", meta: "7 lessons · 1h 55m", progress: "45%", color: "lav" },
];

const thumbColors: Record<string, { bg: string; fill: string }> = {
  blue: { bg: "var(--blue-bg)", fill: "#2F5FE0" },
  mint: { bg: "var(--mint-bg)", fill: "#188A5D" },
  peach: { bg: "var(--peach-bg)", fill: "#DB8A2E" },
  lav: { bg: "var(--lav-bg)", fill: "#6B4CE0" },
};

const floatCards = [
  {
    svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4L20 12L6 20V4Z" fill="#14B57E"/></svg>',
    title: "Step-by-step lessons",
    sub: "Beginner to job-ready",
    style: { top: "6%", left: "-8%" },
    iconBg: "var(--blue-bg)",
    delay: "0s",
  },
  {
    svg: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4H14V20H4V4Z" stroke="#188A5D" stroke-width="1.6"/><path d="M7 8H11M7 12H11M7 16H9" stroke="#188A5D" stroke-width="1.6" stroke-linecap="round"/></svg>',
    title: "Guides & checklists",
    sub: "Real documents, templated",
    style: { bottom: "10%", left: "-4%" },
    iconBg: "var(--mint-bg)",
    delay: "1.4s",
  },
  {
    svg: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#DB8A2E" stroke-width="1.6"/><path d="M4 12H20M12 4C14.5 6.5 14.5 17.5 12 20C9.5 17.5 9.5 6.5 12 4Z" stroke="#DB8A2E" stroke-width="1.4"/></svg>',
    title: "Learn anywhere",
    sub: "Phone, tablet or laptop",
    style: { top: "44%", right: "-12%" },
    iconBg: "var(--peach-bg)",
    delay: "2.6s",
  },
];

const stats = [
  {
    svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 20V18C17 15.79 15.21 14 13 14H7C4.79 14 3 15.79 3 18V20" stroke-linecap="round"/><circle cx="10" cy="7" r="4"/><path d="M21 20V18C20.99 16.11 19.72 14.47 17.94 14.06" stroke-linecap="round"/><path d="M15 4.13C16.78 4.55 18.05 6.19 18.05 8.08C18.05 9.97 16.78 11.61 15 12.03" stroke-linecap="round"/></svg>',
    value: 10000, label: "Learners",
  },
  {
    svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 9L15 12L10 15V9Z" fill="currentColor"/></svg>',
    value: 40, label: "Video lessons",
  },
  {
    svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3H14L19 8V21H6V3Z" stroke-linejoin="round"/><path d="M14 3V8H19" stroke-linejoin="round"/></svg>',
    value: 50, label: "Guides & templates",
  },
  {
    svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12H21M12 3C14.5 5.5 14.5 18.5 12 21C9.5 18.5 9.5 5.5 12 3Z" stroke-width="1.6"/></svg>',
    value: 3, label: "Countries",
  },
  {
    svg: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3L19 6V11C19 15.5 16 19.5 12 21C8 19.5 5 15.5 5 11V6L12 3Z" stroke-linejoin="round"/></svg>',
    value: null, label: "Trusted", text: "By learners & parents",
  },
];

function CourseCard({ card }: { card: typeof courseCards[0] }) {
  const tc = thumbColors[card.color];
  return (
    <div className="flex gap-[10px] items-center bg-white rounded-2xl p-[10px]" style={{ boxShadow: "0 6px 16px -10px rgba(18,32,67,0.18)" }}>
      <span className="w-[52px] h-[52px] rounded-xl flex items-center justify-center shrink-0" style={{ background: tc.bg }}>
        <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none">
          <path d="M6 4L20 12L6 20V4Z" fill={tc.fill} />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium truncate" style={{ color: "var(--ink)" }}>{card.title}</div>
        <div className="text-[10.5px] mt-[2px]" style={{ color: "var(--body)" }}>{card.meta}</div>
        <div className="h-[4px] rounded-full mt-[6px] overflow-hidden" style={{ background: "var(--line)" }}>
          <span className="block h-full rounded-full" style={{ width: card.progress, background: "var(--brand-2)" }} />
        </div>
      </div>
    </div>
  );
}

function CountUp({ value, suffix = "+" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            if (prefersReduced) { el.textContent = value.toLocaleString() + suffix; return; }
            let start = 0;
            const duration = 1200;
            const startTime = performance.now();
            function tick(now: number) {
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(eased * value);
              if (el) el.textContent = current.toLocaleString() + (progress >= 1 ? suffix : "");
              if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <span ref={ref}>0</span>;
}

export function Hero() {
  return (
    <>
      <section
        className="pt-[150px] px-[clamp(20px,4.5vw,56px)] pb-[70px] relative"
        style={{
          background:
            "linear-gradient(rgba(18,32,67,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.045) 1px, transparent 1px), radial-gradient(700px 420px at 88% 8%, rgba(15,169,104,0.08), transparent 60%), radial-gradient(600px 360px at 8% 90%, rgba(24,138,93,0.06), transparent 60%)",
          backgroundSize: "40px 40px, 40px 40px, auto, auto",
        }}
      >
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.92fr] gap-[50px] items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6" style={{ color: "var(--ink)" }}>
              <span className="w-[22px] h-[2px] shrink-0 rounded-full" style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-2))" }} />
              LEARN HERE · FLY ANYWHERE
            </div>

            <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.02em] max-w-[600px]" style={{ color: "var(--ink)", fontSize: "clamp(34px,4.5vw,54px)" }}>
              Turn your global dreams into reality in{" "}
              <span style={{ color: "var(--brand-2)" }}>easy and practical steps</span>
            </h1>

            <p className="mt-[22px] max-w-[480px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
              Practical, self-paced video courses that walk you through studying, working, and building a career abroad — one confident step at a time.
            </p>

            <div className="flex items-center gap-5 mt-[34px] flex-wrap">
              <a
                href="/programs"
                className="browse-btn inline-flex items-center gap-[9px] font-medium text-[15px] text-white rounded-full px-[26px] py-[15px]"
                style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(29,46,107,0.55)" }}
              >
                Browse programs
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#" className="inline-flex items-center gap-3 font-medium text-[15px]" style={{ color: "var(--ink)" }}>
                <span className="w-[42px] h-[42px] rounded-full flex items-center justify-center border border-line bg-white">
                  <svg className="w-[12px] h-[12px] ml-[2px]" viewBox="0 0 24 24" fill="var(--brand)">
                    <path d="M6 4L20 12L6 20V4Z" />
                  </svg>
                </span>
                See how it works
              </a>
            </div>

            <div className="flex items-center gap-4 mt-[44px]">
              <div className="flex">
                {[
                  { initials: "SR", gradient: "linear-gradient(135deg,#0FA968,#6B4CE0)" },
                  { initials: "TA", gradient: "linear-gradient(135deg,#188A5D,#2FBF8F)" },
                  { initials: "MH", gradient: "linear-gradient(135deg,#DB8A2E,#F2B25C)" },
                  { initials: "NP", gradient: "linear-gradient(135deg,#6B4CE0,#9C7BFF)" },
                ].map((a, i) => (
                  <span
                    key={a.initials}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-medium text-white border-[2.5px] border-white -ml-[10px] first:ml-0"
                    style={{ background: a.gradient }}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              <div>
                <div className="text-[14px] leading-[1.4]">
                  <span className="font-medium" style={{ color: "var(--ink)" }}>
                    <CountUp value={10000} />
                  </span>{" "}
                  <span style={{ color: "var(--body)" }}>learners preparing right now</span>
                </div>
                <div className="flex items-center gap-[5px] text-[12.5px] mt-[2px]" style={{ color: "#F2B25C" }}>
                  {"★★★★★"} <span className="font-medium" style={{ color: "var(--ink)" }}>4.9</span>
                  <span style={{ color: "var(--body)" }}> · 1,200+ reviews</span>
                </div>
              </div>
            </div>
          </div>

          <div className="scene relative flex justify-center items-center h-[560px]">
            <div
              className="absolute w-[380px] h-[380px] rounded-full top-[10%] right-0"
              style={{
                background: "radial-gradient(circle, rgba(15,169,104,0.16), transparent 70%)",
                filter: "blur(10px)",
              }}
            />

            <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] max-w-[640px] opacity-55" viewBox="0 0 640 260" fill="none">
              <rect x="40" y="120" width="34" height="140" fill="#DCE6FB" />
              <rect x="90" y="80" width="28" height="180" fill="#EAF1FF" />
              <rect x="135" y="140" width="40" height="120" fill="#DCE6FB" />
              <rect x="290" y="40" width="18" height="220" fill="#C9D8F7" />
              <circle cx="299" cy="30" r="8" fill="#C9D8F7" />
              <rect x="380" y="100" width="30" height="160" fill="#EAF1FF" />
              <rect x="430" y="60" width="26" height="200" fill="#DCE6FB" />
              <rect x="480" y="130" width="36" height="130" fill="#EAF1FF" />
              <rect x="540" y="90" width="24" height="170" fill="#DCE6FB" />
            </svg>

            {floatCards.map((fc) => (
              <div
                key={fc.title}
                className="float-card absolute bg-white rounded-2xl p-3 flex items-center gap-3 z-10 max-w-[220px]"
                style={{
                  ...fc.style,
                  boxShadow: "0 20px 40px -18px rgba(18,32,67,0.28)",
                  animation: `bob 5s ease-in-out infinite`,
                  animationDelay: fc.delay,
                }}
              >
                <span
                  className="fi w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: fc.iconBg }}
                  dangerouslySetInnerHTML={{ __html: fc.svg }}
                />
                <div>
                  <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>{fc.title}</div>
                  <div className="text-[10.5px] mt-[1px]" style={{ color: "var(--body)" }}>{fc.sub}</div>
                </div>
              </div>
            ))}

            <div
              className="phone relative z-[3]"
              style={{
                width: 260,
                height: 520,
                background: "var(--ink)",
                borderRadius: 38,
                padding: 12,
                boxShadow: "0 40px 70px -30px rgba(18,32,67,0.45), 0 0 0 2px rgba(18,32,67,0.06)",
              }}
            >
              <div
                className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[70px] h-[7px] rounded-[6px] z-[5]"
                style={{ background: "rgba(255,255,255,0.15)" }}
              />
              <div
                className="w-full h-full rounded-[28px] overflow-hidden relative flex flex-col"
                style={{ background: "var(--bg-soft)" }}
              >
                <div className="px-[18px] pt-[26px] pb-[10px] shrink-0">
                  <div className="text-[11px]" style={{ color: "var(--body)" }}>Continue learning</div>
                  <div className="text-[14.5px] font-medium mt-[2px]" style={{ color: "var(--ink)" }}>Your programs</div>
                </div>
                <div className="flex-1 overflow-hidden relative px-[14px] pb-[14px]">
                  <div className="flex flex-col gap-3 animate-scroll-reel hover:[animation-play-state:paused]">
                    {[...courseCards, ...courseCards].map((card, i) => (
                      <CourseCard key={i} card={card} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-[clamp(20px,4.5vw,56px)] -mt-[10px] relative z-10">
        <div className="max-w-[1320px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_22px_44px_-22px_rgba(18,32,67,0.3)]"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderColor: "rgba(18,32,67,0.08)",
                boxShadow: "0 18px 40px -26px rgba(18,32,67,0.28)",
              }}
            >
              <div
                className="absolute -top-8 -right-6 w-[110px] h-[110px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(15,169,104,0.18), transparent 65%)", filter: "blur(6px)" }}
              />
              <span
                className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-4"
                style={{ background: "var(--brand-soft)", boxShadow: "inset 0 0 0 1px rgba(15,169,104,0.12)" }}
              >
                <span style={{ color: "var(--brand-2)" }} dangerouslySetInnerHTML={{ __html: stat.svg }} />
              </span>
              <div className="relative">
                {stat.value ? (
                  <div
                    className="font-mono font-semibold text-[22px] leading-none"
                    style={{
                      backgroundImage: "linear-gradient(120deg, var(--ink), var(--brand-2))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    <CountUp value={stat.value} />
                  </div>
                ) : (
                  <div
                    className="font-mono font-semibold text-[15px] leading-none"
                    style={{
                      backgroundImage: "linear-gradient(120deg, var(--ink), var(--brand-2))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {stat.text}
                  </div>
                )}
                <div className="text-[12px] mt-[6px]" style={{ color: "var(--body)" }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .browse-btn {
          transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }
        .browse-btn:hover {
          background: var(--brand-2) !important;
          transform: translateY(-2px);
          box-shadow: 0 18px 30px -12px rgba(15,169,104,0.5);
        }
        .browse-btn:hover svg {
          transform: translateX(3px);
        }
        .browse-btn svg {
          transition: transform 0.25s ease;
        }
        .scene .play-circle:hover {
          border-color: var(--brand-2);
          background: var(--brand-soft);
        }
        .float-card .fi svg {
          width: 18px;
          height: 18px;
        }
        @media (max-width: 980px) {
          .scene { height: 460px; margin-top: 40px; }
          .float-card { display: none; }
        }
        @media (max-width: 560px) {
          section { padding-top: 120px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-reel { animation: none !important; }
          .float-card { animation: none !important; }
        }
      `}</style>
    </>
  );
}
