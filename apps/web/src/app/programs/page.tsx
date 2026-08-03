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

const features = [
  {
    title: "Self-paced video lessons",
    desc: "Learn on your own schedule with bite-sized, expert-led modules built around real applications.",
    icon: <path d="M6 4L20 12L6 20V4Z" />,
  },
  {
    title: "Real documents & templates",
    desc: "Every course ships with the actual forms, checklists and templates you'll need along the way.",
    icon: (<><path d="M4 4H14V20H4V4Z" /><path d="M7 8H11M7 12H11M7 16H9" /></>),
  },
  {
    title: "Guided from start to finish",
    desc: "From eligibility to post-arrival, courses map the entire journey so nothing slips through the cracks.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  },
  {
    title: "Support when you need it",
    desc: "Ask questions and get answers from people who have navigated the same path — and helped others do it.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
];

const tracks = [
  { label: "STUDY ABROAD", title: "Study pathways", desc: "Visa prep, university applications and documentation for the US, Canada and beyond." },
  { label: "WORK ABROAD", title: "Work pathways", desc: "Permits, eligibility and job-search groundwork for international careers." },
  { label: "ENGLISH", title: "English proficiency", desc: "Practical, confident communication for everyday life, interviews and exams." },
  { label: "CAREER PREP", title: "Career readiness", desc: "Interview frameworks, mock questions and professional delivery." },
];

export default function ProgramsPage() {
  return (
    <>
      <Nav />
      <main>
        <section
          className="pt-[150px] pb-[80px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(107,76,224,0.07), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[1320px] mx-auto">
            <div className="max-w-[720px]">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                PROGRAMS
              </div>

              <h1
                className="font-display text-display-lg font-semibold leading-[1.08] tracking-[-0.02em] text-balance"
                style={{ color: "var(--ink)" }}
              >
                Every step of the journey,{" "}
                <span style={{ color: "var(--brand-2)" }}>covered in one place.</span>
              </h1>

              <p className="mt-[22px] max-w-[540px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                Self-paced, practical courses that take you from where you are now to studying, working
                and building a life abroad — with real documents, templates and guidance at every stage.
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-[34px]">
                {tracks.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                    <div>
                      <div className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase" style={{ color: "var(--body)" }}>
                        {t.label}
                      </div>
                      <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
              <div>
                <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                  ALL PROGRAMS
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
                  Choose your path
                </h2>
              </div>
              <p className="text-[15px] max-w-[380px]" style={{ color: "var(--body)" }}>
                Four focused tracks, one goal: to make your international journey clear, practical and achievable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {programs.map((p) => (
                <ProgramCard key={p.slug} p={p} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px]">
          <div className="max-w-[1320px] mx-auto rounded-[32px] border border-line px-[clamp(20px,4.5vw,56px)] py-[70px]" style={{ background: "var(--bg-soft)" }}>
            <div className="mb-10">
              <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                WHAT&apos;S INSIDE
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
                style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
              >
                Built like a roadmap, not a lecture
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-3xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--brand-soft)" }}>
                    <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {f.icon}
                    </svg>
                  </span>
                  <h3 className="font-display font-semibold text-[16px]" style={{ color: "var(--ink)" }}>{f.title}</h3>
                  <p className="text-[13.5px] leading-[1.65] mt-2" style={{ color: "var(--body)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div
              className="rounded-[32px] p-10 md:p-16 text-center relative overflow-hidden"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0B5E46, #0E7A55 55%, #14B57E)",
                backgroundSize: "36px 36px, 36px 36px, auto",
              }}
            >
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />

              <div className="relative">
                <div className="font-mono text-mono-sm font-medium tracking-[0.2em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.75)" }}>
                  Not sure where to start?
                </div>
                <h2 className="font-display text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance mx-auto max-w-[640px]">
                  Talk to a counselor and get a personal roadmap
                </h2>
                <p className="text-[16.5px] leading-[1.65] mx-auto max-w-[540px] mt-4 mb-10" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Tell us where you want to go — we&apos;ll point you to the right course and the next step to take.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="tel:+17786768459"
                    className="inline-flex items-center gap-2.5 font-medium text-[15px] rounded-full px-[28px] py-[14px] transition-all duration-250 hover:translate-y-[-1px]"
                    style={{ background: "#ffffff", color: "#0B5E46", boxShadow: "0 16px 28px -14px rgba(0,0,0,0.4)" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call us
                  </a>
                  <Link
                    href="/success-stories"
                    className="inline-flex items-center gap-2.5 font-medium text-[15px] rounded-full px-[28px] py-[14px] border transition-all duration-250 hover:bg-white/10 hover:translate-y-[-1px]"
                    style={{ borderColor: "rgba(255,255,255,0.4)", color: "#ffffff" }}
                  >
                    See learner stories
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
