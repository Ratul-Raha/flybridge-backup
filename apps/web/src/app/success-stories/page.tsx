import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Success Stories | FlyBridge Education Group",
  description:
    "Real stories from real learners — students who studied, worked and built lives abroad with FlyBridge courses and guidance.",
};

const stories = [
  {
    quote:
      "FlyBridge gave me the structure and confidence I needed. The career preparation course helped me land a job in Toronto within three months of completing it.",
    name: "Sadia Rahman",
    location: "Dhaka, Bangladesh",
    destination: "Toronto, Canada",
    path: "Work Abroad",
    initials: "SR",
    color: "#188A5D",
  },
  {
    quote:
      "The Academic English course was exactly what I needed for my university application. I scored 7.5 on IELTS and got accepted to my dream program.",
    name: "Arun Patel",
    location: "Mumbai, India",
    destination: "Boston, USA",
    path: "Study Abroad",
    initials: "AP",
    color: "#2F5FE0",
  },
  {
    quote:
      "What sets FlyBridge apart is the practical focus. Every module had real-world applications. I finally feel prepared for my international career.",
    name: "Priya Sharma",
    location: "Kathmandu, Nepal",
    destination: "Vancouver, Canada",
    path: "Career Prep",
    initials: "PS",
    color: "#6B4CE0",
  },
  {
    quote:
      "I was overwhelmed by visa paperwork until I took the Work Permit Prep course. The checklists and templates made the whole process clear — I got my permit on the first try.",
    name: "Imran Hossain",
    location: "Dhaka, Bangladesh",
    destination: "Toronto, Canada",
    path: "Work Abroad",
    initials: "IH",
    color: "#DB8A2E",
  },
  {
    quote:
      "The Study Visa Prep course walked me through my visa interview step by step. The mock questions were eerily similar to the real ones — I was approved in two weeks.",
    name: "Nusrat Jahan",
    location: "Chittagong, Bangladesh",
    destination: "New York, USA",
    path: "Study Abroad",
    initials: "NJ",
    color: "#2F5FE0",
  },
  {
    quote:
      "My interview skills were holding me back. After Interview Readiness, I walked into every meeting with a framework — and it changed how people responded to me.",
    name: "Rafiq Ahmed",
    location: "Kolkata, India",
    destination: "Toronto, Canada",
    path: "Career Prep",
    initials: "RA",
    color: "#188A5D",
  },
];

const stats = [
  { value: "10,000+", label: "Learners guided" },
  { value: "3,200+", label: "Visa approvals" },
  { value: "92%", label: "Course completion" },
  { value: "40+", label: "Countries reached" },
];

const outcomes = [
  {
    title: "Accepted into university",
    desc: "Students in our Study Abroad track gain admission to partner universities across the US and Canada.",
    icon: <path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />,
  },
  {
    title: "Permits approved",
    desc: "Work permit and visa applications prepared with our templates clear review on the first submission.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  },
  {
    title: "Careers launched",
    desc: "Graduates of our Career Prep track land interviews — and offers — with confidence.",
    icon: <path d="M17 20V18C17 15.79 15.21 14 13 14H7C4.79 14 3 15.79 3 18V20M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />,
  },
];

export default function SuccessStoriesPage() {
  return (
    <>
      <Nav />
      <main>
        <section
          className="pt-[150px] pb-[80px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(47,95,224,0.06), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
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
                SUCCESS STORIES
              </div>

              <h1
                className="font-display text-display-lg font-semibold leading-[1.08] tracking-[-0.02em] text-balance"
                style={{ color: "var(--ink)" }}
              >
                Real stories from{" "}
                <span style={{ color: "var(--brand-2)" }}>real learners.</span>
              </h1>

              <p className="mt-[22px] max-w-[540px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                Thousands of students have studied, worked and built lives abroad with FlyBridge. Here are
                a few of the journeys that started with one course.
              </p>

              <div className="flex items-center gap-4 mt-[34px] flex-wrap">
                <a
                  href="/programs"
                  className="inline-flex items-center gap-[9px] font-medium text-[15px] text-white rounded-full px-[26px] py-[15px] transition-all duration-250 hover:translate-y-[-1px]"
                  style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(15,169,104,0.5)" }}
                >
                  Start your story
                  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <Link href="/partnership" className="inline-flex items-center gap-2 font-medium text-[15px]" style={{ color: "var(--ink)" }}>
                  See our partner network
                  <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[70px]">
          <div className="max-w-[1320px] mx-auto rounded-[28px] border border-line px-[24px] py-[38px]" style={{ background: "var(--bg-soft)" }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-[36px]">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center px-4">
                  <div className="flex items-baseline gap-[8px]">
                    <span className="font-display font-semibold text-[clamp(32px,3.6vw,44px)] leading-none tracking-[-0.03em]" style={{ color: "var(--ink)" }}>
                      {stat.value}
                    </span>
                    <span className="w-[7px] h-[7px] rounded-full self-center" style={{ background: "var(--brand)" }} />
                  </div>
                  <div className="font-mono text-[11px] font-medium tracking-[0.4px] uppercase mt-[12px]" style={{ color: "var(--body)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
              <div>
                <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                  LEARNER JOURNEYS
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em] max-w-[560px]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
                  From one course to a life abroad
                </h2>
              </div>
              <p className="text-[15px] max-w-[380px]" style={{ color: "var(--body)" }}>
                Every story below started with a single decision — and a single course.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {stories.map((s) => (
                <figure
                  key={s.name}
                  className="rounded-3xl border border-line bg-white p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--line)">
                      <path d="M11 6v5H6v5h5v5H6v-5H1v-5h5V6h5zm12 0v5h-5v5h5v5h-5v-5h-5v-5h5V6h5z" />
                    </svg>
                    <span
                      className="font-mono text-[10px] font-medium tracking-[0.4px] uppercase px-3 py-[6px] rounded-full border shrink-0"
                      style={{ color: "var(--body)", borderColor: "var(--line)" }}
                    >
                      {s.path}
                    </span>
                  </div>
                  <blockquote className="text-[14.5px] leading-[1.7] flex-1" style={{ color: "var(--ink)" }}>
                    &ldquo;{s.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 pt-6 border-t border-line">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-display font-semibold text-[12px] text-white"
                        style={{ background: s.color }}
                      >
                        {s.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>{s.name}</p>
                        <p className="font-mono text-[10.5px] tracking-[0.3px] mt-[2px] truncate" style={{ color: "var(--body)" }}>
                          {s.location} → {s.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px]">
          <div className="max-w-[1320px] mx-auto rounded-[32px] border border-line px-[clamp(20px,4.5vw,56px)] py-[70px]" style={{ background: "var(--bg-soft)" }}>
            <div className="mb-10">
              <div className="font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                WHAT LEARNERS ACHIEVE
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
                style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
              >
                Outcomes that keep compounding
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
              {outcomes.map((o) => (
                <div
                  key={o.title}
                  className="rounded-3xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--brand-soft)" }}>
                    <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {o.icon}
                    </svg>
                  </span>
                  <h3 className="font-display font-semibold text-[16px]" style={{ color: "var(--ink)" }}>{o.title}</h3>
                  <p className="text-[13.5px] leading-[1.65] mt-2" style={{ color: "var(--body)" }}>{o.desc}</p>
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
                  Your story starts now
                </div>
                <h2 className="font-display text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white text-balance mx-auto max-w-[640px]">
                  The next success story could be yours
                </h2>
                <p className="text-[16.5px] leading-[1.65] mx-auto max-w-[540px] mt-4 mb-10" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Pick a course, follow the roadmap, and take the first step toward your international future.
                </p>

                <a
                  href="/programs"
                  className="inline-flex items-center gap-[9px] font-medium text-[15px] rounded-full px-[28px] py-[14px] transition-all duration-250 hover:translate-y-[-1px]"
                  style={{ background: "#ffffff", color: "#0B5E46", boxShadow: "0 16px 28px -14px rgba(0,0,0,0.4)" }}
                >
                  Explore programs
                  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
