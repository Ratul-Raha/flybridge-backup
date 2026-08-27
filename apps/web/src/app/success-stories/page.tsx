import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { HeroVideo, VideoGallery, type StoryVideo } from "@/components/story-video";

export const metadata: Metadata = {
  title: "Success Stories | FlyBridge",
  description:
    "Real stories from real learners — students who studied, worked and built lives abroad with FlyBridge courses and guidance.",
};

type Learner = {
  src: string;
  name: string;
  program: string;
  country: string;
  flag: string;
  quote: string;
  badge: string;
};

const learners: Learner[] = [
  {
    src: "/stories/success1.png",
    name: "Mijanur Rahman",
    program: "University for the Creative Arts",
    country: "UK",
    flag: "🇬🇧",
    quote: "Thanks to FlyBridge, I'm now studying at my dream university in the UK.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success2.png",
    name: "Faiyaz",
    program: "Wichita State University",
    country: "USA",
    flag: "🇺🇸",
    quote: "FlyBridge made my dream of studying in the USA a reality. The guidance was exceptional!",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success3.png",
    name: "Pabel",
    program: "Neapolis University Pafos",
    country: "Cyprus",
    flag: "🇨🇾",
    quote: "From university selection to visa approval, FlyBridge was with me every step of the way.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success4.png",
    name: "Mahfuz Ahmed",
    program: "Work Permit",
    country: "Portugal",
    flag: "🇵🇹",
    quote: "The team's support and clear process helped me achieve my goal stress-free.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success5.png",
    name: "Real Khan Mamun",
    program: "",
    country: "UK",
    flag: "🇬🇧",
    quote: "I went from confused about where to apply to holding multiple offer letters with FlyBridge's guidance.",
    badge: "Visa Approved",
  },
  {
    src: "/stories/success6.png",
    name: "Ahmed Taj",
    program: "University of Chester",
    country: "UK",
    flag: "🇬🇧",
    quote: "Thanks to FlyBridge, I'm now studying at my dream university in the UK.",
    badge: "Visa Approved",
  },
];

const featuredVideo: StoryVideo = {
  title: "From Sylhet to UK — a study abroad journey",
  duration: "2:34",
  tag: "Study Abroad",
  initials: "IH",
  gradient: "linear-gradient(135deg,#2FBF8F,#188A5D 60%,#0B5E46)",
  src: "/videos/review_video.mp4",
  poster: "/videos/review_video_poster.jpg",
};

const videos: StoryVideo[] = [
  {
    title: "Landing a job in Toronto — a graduate's journey",
    duration: "3:41",
    tag: "Work Abroad",
    initials: "SR",
    gradient: "linear-gradient(135deg,#0FA968,#188A5D 60%,#0B5E46)",
  },
  {
    title: "Scored 7.5 on IELTS — a study path",
    duration: "3:12",
    tag: "Study Abroad",
    initials: "AP",
    gradient: "linear-gradient(135deg,#5E8AFF,#2F5FE0 60%,#17408F)",
  },
  {
    title: "Nailing the visa interview — a learner's tips",
    duration: "2:58",
    tag: "Study Abroad",
    initials: "NJ",
    gradient: "linear-gradient(135deg,#8A6BF2,#6B4CE0 60%,#4A2FB8)",
  },
  {
    title: "From nervous to hired — an interview story",
    duration: "4:05",
    tag: "Career Prep",
    initials: "RA",
    gradient: "linear-gradient(135deg,#E8A24B,#DB8A2E 60%,#B06218)",
  },
];

const outcomes = [
  {
    title: "Accepted into university",
    desc: "Students in our Study Abroad track gain admission to partner universities across the US, Canada and Europe.",
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
        {/* ── Hero ── */}
        <section
          className="pt-[150px] pb-[80px] px-[clamp(20px,4.5vw,56px)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(720px 440px at 90% 6%, rgba(15,169,104,0.09), transparent 62%), radial-gradient(620px 400px at 4% 92%, rgba(47,95,224,0.06), transparent 62%), radial-gradient(rgba(18,32,67,0.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 22px 22px",
          }}
        >
          <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-[50px] items-center">
            <div className="max-w-[640px]">
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

              <p className="mt-[22px] max-w-[500px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
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

              <div className="flex items-center gap-6 mt-[38px]">
                {[
                  { value: "10,000+", label: "Learners guided" },
                  { value: "50+", label: "University partners" },
                  { value: "83%", label: "Success rate" },
                  { value: "4.8/5", label: "Average rating" },
                ].map((s, i, arr) => (
                  <div key={s.label} className="flex items-center gap-6">
                    <div>
                      <div className="font-display font-semibold text-[26px] leading-none tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                        {s.value}
                      </div>
                      <div className="font-mono text-[10.5px] font-medium tracking-[0.4px] uppercase mt-[6px]" style={{ color: "var(--body)" }}>
                        {s.label}
                      </div>
                    </div>
                    {i < arr.length - 1 && <span className="w-[1px] h-[38px]" style={{ background: "var(--line)" }} />}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <HeroVideo video={featuredVideo} />
            </div>
          </div>
        </section>

        {/* ── Learner journeys ── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                  LEARNER JOURNEYS
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(28px,3.4vw,38px)", color: "var(--ink)" }}>
                  From one course to a life abroad
                </h2>
              </div>
              <p className="text-[15px] max-w-[360px] leading-relaxed" style={{ color: "var(--body)" }}>
                Every story below started with a single decision — and a single course.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {learners.map((l) => (
                <div
                  key={l.name}
                  className="rounded-lg border border-line bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={l.src} alt={l.name} loading="lazy" className="w-full h-full object-cover" />
                    <div
                      className="absolute top-3 left-3 font-mono text-[10px] font-medium tracking-[0.4px] uppercase px-3 py-1.5 rounded-full text-white"
                      style={{ background: "rgba(18,32,67,0.55)", backdropFilter: "blur(4px)" }}
                    >
                      {l.badge}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col">
                    <div className="font-display font-semibold text-[17px] tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                      {l.name}
                    </div>
                    {l.program && (
                      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--body)" }}>{l.program}</div>
                    )}
                    <div className="flex items-center gap-1.5 text-[12.5px] font-medium mt-2" style={{ color: "var(--brand-2)" }}>
                      <span>{l.flag}</span>
                      <span>{l.country}</span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed mt-3 line-clamp-3" style={{ color: "var(--ink)" }}>
                      &ldquo;{l.quote}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Video stories ── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                  VIDEO STORIES
                </div>
                <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(28px,3.4vw,38px)", color: "var(--ink)" }}>
                  More stories on video
                </h2>
              </div>
              <p className="text-[15px] max-w-[360px] leading-relaxed" style={{ color: "var(--body)" }}>
                Learners tell their own stories — how they prepared, what they learned and where they are now.
              </p>
            </div>

            <VideoGallery videos={videos} />
          </div>
        </section>

        {/* ── Outcomes ── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto rounded-lg border border-line px-[clamp(20px,4.5vw,56px)] py-[70px]" style={{ background: "var(--bg-soft)" }}>
            <div className="mb-10">
              <div className="flex items-center gap-2 font-mono text-[11.5px] font-medium tracking-[0.4px] mb-4" style={{ color: "var(--brand-2)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                WHAT LEARNERS ACHIEVE
              </div>
              <h2
                className="font-display font-semibold tracking-[-0.01em] max-w-[560px]"
                style={{ fontSize: "clamp(28px,3.4vw,38px)", color: "var(--ink)" }}
              >
                Outcomes that keep compounding
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
              {outcomes.map((o) => (
                <div
                  key={o.title}
                  className="rounded-lg border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-2/40"
                  style={{ boxShadow: "0 4px 20px -10px rgba(18,32,67,0.08)" }}
                >
                  <span className="w-11 h-11 rounded-lg flex items-center justify-center mb-5" style={{ background: "var(--brand-soft)" }}>
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

        {/* ── CTA ── */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div
              className="rounded-lg p-10 md:p-16 text-center relative overflow-hidden"
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
