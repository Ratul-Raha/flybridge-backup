"use client";

import { useState } from "react";
import { StoryAvatars } from "./story-avatars";

const courseCards = [
  { title: "Study Visa Prep — US", meta: "12 lessons · 3h 40m", progress: "64%", color: "blue" },
  { title: "Work Permit Blueprint - Canada", meta: "9 lessons · 2h 10m", progress: "30%", color: "mint" },
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

export function Hero({ userCount = 10000 }: { userCount?: number }) {
  const [videoOpen, setVideoOpen] = useState(false);
  return (
    <>
      <section
        className="hero-section pt-[52px] px-[clamp(20px,4.5vw,56px)] pb-[70px] relative"
        style={{
          background:
            "radial-gradient(860px 540px at 82% 2%, rgba(15,169,104,0.07), transparent 62%), radial-gradient(720px 480px at 6% 92%, rgba(47,95,224,0.06), transparent 60%), radial-gradient(680px 460px at 96% 88%, rgba(107,76,224,0.06), transparent 62%), radial-gradient(520px 380px at 0% 6%, rgba(219,138,46,0.06), transparent 60%), linear-gradient(180deg, #F2F7EE -6%, #FFFFFF 46%)",
        }}
      >
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="hero-blob hero-blob-a" aria-hidden="true" />
        <div className="hero-blob hero-blob-b" aria-hidden="true" />
        <div className="hero-blob hero-blob-c" aria-hidden="true" />

        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.92fr] gap-[50px] items-center relative z-[1]">
          <div>
            <p className="relative inline-block mb-[28px]" style={{ color: "var(--brand-2)" }}>
              <span className="tag-text font-mono font-medium tracking-[0.12em] uppercase text-[12.5px]" style={{ color: "var(--brand-2)" }}>
                Learn here, fly anywhere
              </span>
              <svg className="tag-plane w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 12l19-8-6 18-4-6-9-4z" fill="var(--brand-2)" stroke="var(--brand-2)" strokeWidth="1" strokeLinejoin="round" />
                <path d="M11 16l4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </p>

            <h1 className="font-display font-semibold leading-[1.16] tracking-[-0.02em] max-w-[620px]" style={{ color: "var(--ink)", fontSize: "clamp(34px,4.2vw,48px)" }}>
              Your Complete{" "}
              <span
                style={{
                  background: "linear-gradient(92deg, var(--brand) 8%, var(--brand-2) 60%, rgba(47,95,224,0.95) 112%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Blueprint
              </span>
              {" "}
              <br className="hidden md:block" />
              <span className="text-balance">to Studying and Working Abroad</span>
            </h1>

            <p className="mt-[18px] max-w-[500px] text-justify text-[15px] leading-[1.9]" style={{ color: "var(--body)" }}>
              Master every step with expert-led video courses, live Q&amp;A sessions, immersive
              seminars, and an interactive software system built to guide your entire journey from
              application to arrival.
            </p>

            <div className="mt-[32px] flex flex-col gap-6">
              <div className="flex items-center gap-[10px] sm:gap-4 flex-wrap sm:flex-nowrap">
                <a
                  href="/programs"
                  className="browse-btn inline-flex items-center gap-[7px] sm:gap-[9px] font-medium text-[12.5px] sm:text-[15px] text-white rounded-full px-[15px] sm:px-[26px] py-[10px] sm:py-[14px] whitespace-nowrap"
                  style={{ background: "var(--brand)" }}
                >
                  Browse programs
                  <svg className="w-[12px] h-[12px] sm:w-[15px] sm:h-[15px]" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>

                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="inline-flex items-center gap-[7px] sm:gap-[9px] font-medium text-[12.5px] sm:text-[15px] rounded-full pl-[5px] sm:pl-[6px] pr-[14px] sm:pr-[24px] py-[8.5px] sm:py-[10px] border border-line bg-white whitespace-nowrap transition-all duration-250 hover:border-brand-2/50 hover:shadow-md"
                  style={{ color: "var(--ink)" }}
                >
                  <span
                    className="w-[24px] h-[24px] sm:w-[34px] sm:h-[34px] rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    <svg className="w-[9px] h-[9px] sm:w-[13px] sm:h-[13px] ml-[1px]" viewBox="0 0 24 24" fill="none">
                      <path d="M6 4L20 12L6 20V4Z" fill="var(--brand)" />
                    </svg>
                  </span>
                  See how it works
                </button>
              </div>

              <div className="flex items-center gap-3.5">
                <StoryAvatars />
                <div>
                  <div className="text-[14.5px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                    {userCount.toLocaleString()}+
                  </div>
                  <div className="text-[11.5px] mt-[4px]" style={{ color: "var(--body)" }}>
                    people have already joined
                  </div>
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

      <style>{`
        .hero-grid-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(18,32,67,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(18,32,67,0.055) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: radial-gradient(130% 100% at 50% 18%, rgba(0,0,0,0.9), transparent 74%);
          mask-image: radial-gradient(130% 100% at 50% 18%, rgba(0,0,0,0.9), transparent 74%);
        }
        .hero-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(72px);
          opacity: 0.32;
          pointer-events: none;
          animation: hero-blob-drift 14s ease-in-out infinite alternate;
        }
        .hero-blob-a { width: 380px; height: 380px; top: -6%; right: 6%; background: rgba(15,169,104,0.22); }
        .hero-blob-b { width: 480px; height: 480px; bottom: -14%; left: -8%; background: rgba(47,95,224,0.16); animation-delay: -5s; }
        .hero-blob-c { width: 360px; height: 360px; bottom: 2%; right: -6%; background: rgba(107,76,224,0.15); animation-delay: -9s; }
        @keyframes hero-blob-drift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(26px, -18px) scale(1.07); }
        }
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
          .hero-section { padding-top: 120px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-reel { animation: none !important; }
          .float-card { animation: none !important; }
          .hero-blob { animation: none !important; }
        }
        .tag-plane {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translate(-22px, -50%);
          animation: tag-plane-fly 6.5s ease-in-out forwards;
        }
        .tag-text {
          display: inline-block;
          opacity: 1;
          animation: tag-reveal 6.5s ease-in-out forwards;
        }
        @keyframes tag-plane-fly {
          0% { left: 0%; transform: translate(-22px, 0) rotate(0deg); opacity: 0; }
          6% { opacity: 1; }
          33% { left: 100%; transform: translate(-17px, 0) rotate(0deg); }
          36% { left: 100%; transform: translate(-17px, -10px) rotate(-45deg); }
          52% { left: 100%; transform: translate(-17px, -420px) rotate(-45deg); opacity: 1; }
          62% { left: 100%; transform: translate(-17px, -900px) rotate(-45deg); opacity: 0; }
          100% { left: 100%; transform: translate(-17px, -900px) rotate(-45deg); opacity: 0; }
        }
        @keyframes tag-reveal {
          0% { clip-path: inset(0 100% 0 0); opacity: 0; }
          8% { opacity: 1; }
          33% { clip-path: inset(0 0% 0 0); }
          100% { clip-path: inset(0 0% 0 0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tag-plane, .tag-text { animation: none; }
        }
      `}</style>

      {videoOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Intro video"
        >
          <div
            className="absolute inset-0 bg-[rgba(18,32,67,0.75)] backdrop-blur-[4px]"
            onClick={() => setVideoOpen(false)}
          />
          <div
            className="fb-pop-up relative w-full max-w-[980px] rounded-[24px] overflow-hidden bg-black border border-white/10"
            style={{ boxShadow: "0 50px 100px -40px rgba(0,0,0,0.7)" }}
          >
            <video
              src="/videos/intro.mp4"
              controls
              autoPlay
              playsInline
              className="w-full aspect-video"
            />
          </div>
          <button
            type="button"
            aria-label="Close video"
            onClick={() => setVideoOpen(false)}
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 text-white backdrop-blur flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-[var(--ink)]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6L18 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
