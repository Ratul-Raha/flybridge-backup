import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getProgram, programs } from "@/lib/programs";
import { courseDetails } from "./course-data";

type Props = { params: { id: string } };

export function generateStaticParams() {
  return programs.map((p) => ({ id: p.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const program = getProgram(params.id);
  const details = courseDetails[params.id];
  return {
    title: `${details?.title ?? program?.title ?? "Program"} | FlyBridge Education Group`,
    description: details?.desc ?? program?.desc,
  };
}

const chevron = (
  <svg className="w-[9px] h-[9px] shrink-0 transition-transform duration-250" viewBox="0 0 24 24" fill="none">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const play = (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
    <path d="M6 4L20 12L6 20V4Z" fill="currentColor" />
  </svg>
);

const arrow = (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function CourseHero({
  badge,
  title,
  subtitle,
  desc,
  chips,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  desc: string;
  chips: string[];
}) {
  return (
      <section
        className="course-page-hero pt-[150px] px-[clamp(20px,4.5vw,56px)] pb-[70px] relative"
        style={{
        background:
          "radial-gradient(700px 420px at 88% 8%, rgba(15,169,104,0.08), transparent 60%), radial-gradient(600px 360px at 8% 90%, rgba(107,76,224,0.07), transparent 60%)",
      }}
    >
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.72fr] gap-[50px] items-center">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-medium mb-5">
            <Link href="/" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">
              Home
            </Link>
            <span style={{ color: "var(--body)" }}>/</span>
            <Link href="/#programs" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">
              Programs
            </Link>
            <span style={{ color: "var(--body)" }}>/</span>
            <span className="font-medium" style={{ color: "var(--brand-2)" }}>
              {badge}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
            style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
          >
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--lav-ink)" }} />
            {badge} · COURSE
          </div>

          <h1 className="font-display text-display-lg font-semibold leading-[1.08] tracking-[-0.02em] max-w-[620px]" style={{ color: "var(--ink)" }}>
            {title}
            {subtitle && (
              <>
                {" "}
                <span style={{ color: "var(--brand-2)" }}>{subtitle}</span>
              </>
            )}
          </h1>

          <p className="mt-[22px] max-w-[500px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
            {desc}
          </p>

          <div className="flex items-center gap-3 mt-[26px] flex-wrap">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-[6px] text-[12.5px] font-medium px-[12px] py-[6px] rounded-full border border-line bg-white"
                style={{ color: "var(--ink)" }}
              >
                <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
                {chip}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-[34px] flex-wrap">
            <a
              href="#"
              className="browse-btn inline-flex items-center gap-[9px] font-medium text-[15px] text-white rounded-full px-[26px] py-[15px]"
              style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(29,46,107,0.55)" }}
            >
              Enroll now
              {arrow}
            </a>
            <a
              href="#curriculum"
              className="inline-flex items-center gap-[9px] font-medium text-[15px] rounded-full px-[26px] py-[15px] border border-line bg-white"
              style={{ color: "var(--ink)" }}
            >
              {play}
              Preview the course
            </a>
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div className="w-full max-w-[420px] rounded-[24px] bg-white border border-line shadow-2xl overflow-hidden" style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.35)" }}>
            <div
              className="relative h-[180px] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(15,169,104,0.9), rgba(11,94,70,0.9))" }}
            >
              <span className="w-[62px] h-[62px] rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white cursor-pointer transition-transform duration-300 hover:scale-105">
                {play}
              </span>
              <span
                className="absolute bottom-[14px] right-[16px] font-mono text-[10.5px] font-medium tracking-[0.3px] text-white/90 bg-black/25 rounded-full px-[10px] py-[4px]"
              >
                30 LESSONS
              </span>
            </div>
            <div className="p-[22px]">
              <div className="font-mono text-[10.5px] font-medium tracking-[0.4px] mb-[8px]" style={{ color: "var(--lav-ink)" }}>
                PREVIEW THE CURRICULUM
              </div>
              <div className="space-y-[10px]">
                {[
                  { n: "1", t: "ইংরেজি উচ্চারণের মূল ধ্বনি", d: "08:12" },
                  { n: "2", t: "Stress ও intonation বোঝা", d: "09:04" },
                  { n: "3", t: "Common vowel sounds", d: "10:21" },
                ].map((row) => (
                  <div key={row.n} className="flex items-center gap-3 text-[12.5px]">
                    <span
                      className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center font-medium text-[11px] shrink-0"
                      style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
                    >
                      {row.n}
                    </span>
                    <span className="flex-1 font-medium truncate" style={{ color: "var(--ink)" }}>
                      {row.t}
                    </span>
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--body)" }}>
                      {row.d}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-[16px] pt-[14px] border-t border-line flex items-center justify-between">
                <span className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
                  + 27 more lessons
                </span>
                <span className="font-mono text-[11px] font-medium" style={{ color: "var(--brand-2)" }}>
                  FREE PREVIEW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="px-[clamp(20px,4.5vw,56px)] -mt-[10px]">
      <div
        className="max-w-[1320px] mx-auto bg-white border border-line rounded-[22px] flex flex-wrap shadow-xl overflow-hidden"
        style={{ boxShadow: "0 24px 50px -30px rgba(18,32,67,0.18)" }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex-1 min-w-[160px] flex items-center gap-3 px-[22px] py-[26px] border-r border-line last:border-r-0"
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-[17px]"
              style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
            >
              {stat.value}
            </span>
            <div>
              <div className="text-[14.5px] font-medium leading-[1.2]" style={{ color: "var(--ink)" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-9">
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-5"
        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
      >
        <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--brand-2)" }} />
        {eyebrow}
      </div>
      <h2 className="font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
        {title}
      </h2>
      {desc && (
        <p className="text-[15px] mt-2 max-w-[560px]" style={{ color: "var(--body)" }}>
          {desc}
        </p>
      )}
    </div>
  );
}

export default function ProgramPage({ params }: Props) {
  const program = getProgram(params.id);
  if (!program) notFound();

  const details = courseDetails[params.id];
  const chips = details
    ? [details.level, details.language, details.pace]
    : [program.badge, "Self-paced", "New lessons added regularly"];

  return (
    <>
      <Nav />

      <CourseHero
        badge={program.badge}
        title={details?.title ?? program.title}
        subtitle={details?.subtitle}
        desc={details?.desc ?? program.desc}
        chips={chips}
      />

      <StatsBar
        stats={
          details?.stats ?? [
            { value: "30", label: "Video lessons" },
            { value: "3", label: "PDF resources" },
            { value: "1", label: "Completion certificate" },
          ]
        }
      />

      {details ? (
        <>
          <section className="px-[clamp(20px,4.5vw,56px)] py-[90px] max-w-[1320px] mx-auto">
            <SectionHeading
              eyebrow="WHAT YOU WILL LEARN"
              title="Course outcomes"
              desc="By the end of this course you will be able to:"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.outcomes.map((o, i) => (
                <div
                  key={o}
                  className="flex items-start gap-3 rounded-[16px] bg-white border border-line p-[20px]"
                >
                  <span
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-medium shrink-0"
                    style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[15px] font-medium leading-[1.5]" style={{ color: "var(--ink)" }}>
                    {o}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto" id="curriculum">
            <SectionHeading
              eyebrow="CURRICULUM"
              title="What is inside"
              desc={`${details.modules.length} modules · ${details.modules.reduce((n, m) => n + m.lessons.length, 0)} video lessons · learn at your own pace.`}
            />
            <div className="space-y-3">
              {details.modules.map((module, i) => (
                <details
                  key={module.title}
                  className="group rounded-[16px] bg-white border border-line overflow-hidden open:shadow-lg"
                  open={i === 0}
                >
                  <summary className="flex items-center gap-3 px-[22px] py-[18px] cursor-pointer list-none select-none">
                    <span
                      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-medium text-[13px] shrink-0"
                      style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                        {module.title}
                      </span>
                      <span className="block text-[12px] mt-[2px] font-mono" style={{ color: "var(--body)" }}>
                        {module.lessons.length} lessons
                      </span>
                    </span>
                    <span className="transition-transform duration-250 group-open:rotate-180" style={{ color: "var(--body)" }}>
                      {chevron}
                    </span>
                  </summary>
                  <ul className="px-[22px] pb-[16px]">
                    {module.lessons.map((lesson, j) => (
                      <li
                        key={lesson.title}
                        className="flex items-center gap-3 py-[11px] border-t border-line text-[13.5px]"
                      >
                        <span
                          className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-soft)", color: "var(--body)" }}
                        >
                          {play}
                        </span>
                        <span className="flex-1 font-medium" style={{ color: "var(--ink)" }}>
                          <span className="font-mono text-[11px] mr-[10px]" style={{ color: "var(--body)" }}>
                            {i * module.lessons.length + j + 1}
                          </span>
                          {lesson.title}
                        </span>
                        <span className="font-mono text-[11.5px] shrink-0" style={{ color: "var(--body)" }}>
                          {lesson.duration}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto">
            <SectionHeading
              eyebrow="DOWNLOADS"
              title="PDF resources"
              desc="Downloadable materials that come with the course."
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {details.pdfs.map((pdf) => (
                <div
                  key={pdf.title}
                  className="rounded-[20px] bg-white border border-line p-[22px] flex flex-col transition-all duration-300 hover:-translate-y-[4px] hover:shadow-lg"
                >
                  <span
                    className="w-[44px] h-[44px] rounded-[12px] flex items-center justify-center mb-[16px]"
                    style={{ background: "var(--peach-bg)", color: "var(--peach-ink)" }}
                  >
                    <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeLinejoin="round" />
                      <path d="M14 2V8H20" strokeLinejoin="round" />
                      <path d="M9 13H15M9 17H15" strokeLinecap="round" />
                    </svg>
                  </span>
                  <h3 className="text-[15px] font-medium leading-[1.3]" style={{ color: "var(--ink)" }}>
                    {pdf.title}
                  </h3>
                  <p className="text-[12.5px] mt-[6px] leading-[1.5] flex-1" style={{ color: "var(--body)" }}>
                    {pdf.desc}
                  </p>
                  <div className="flex items-center justify-between mt-[16px] pt-[14px] border-t border-line">
                    <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
                      {pdf.pages} pages · {pdf.size}
                    </span>
                    <a
                      href="#"
                      className="text-[12.5px] font-medium inline-flex items-center gap-[5px]"
                      style={{ color: "var(--brand-2)" }}
                    >
                      Download {arrow}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto">
            <div
              className="rounded-[24px] overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, var(--lav-bg), var(--blue-bg))", border: "1px solid var(--line)" }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
                <div className="p-[36px] lg:p-[48px]">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
                    style={{ background: "rgba(255,255,255,0.7)", color: "var(--lav-ink)" }}
                  >
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: "var(--lav-ink)" }} />
                    CERTIFICATION
                  </div>
                  <h2 className="text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.15] tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                    {details.certificate.title}
                  </h2>
                  <p className="text-[15px] mt-[12px] max-w-[440px] leading-[1.6]" style={{ color: "var(--body)" }}>
                    {details.certificate.desc}
                  </p>
                  <a
                    href="#"
                    className="mt-[26px] inline-flex items-center gap-[9px] font-medium text-[14.5px] text-white rounded-full px-[24px] py-[13px]"
                    style={{ background: "var(--brand)" }}
                  >
                    Start learning
                    {arrow}
                  </a>
                </div>
                <div className="p-[36px] lg:p-[48px] flex justify-center">
                  <div className="w-full max-w-[380px] bg-white rounded-[16px] border border-line p-[28px] text-center shadow-xl">
                    <div className="flex items-center justify-center gap-2 mb-[18px]">
                      <svg className="w-[26px] h-[26px]" viewBox="0 0 40 40" fill="none">
                        <path d="M20 4L34 30H23L20 24L17 30H6L20 4Z" fill="url(#gradMark)" />
                        <defs>
                          <linearGradient id="gradMark" x1="6" y1="4" x2="34" y2="30">
                            <stop offset="0%" stopColor="#14B57E" />
                            <stop offset="100%" stopColor="#0B5E46" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="font-semibold text-[15px] tracking-[0.2px]" style={{ color: "var(--brand)" }}>
                        FlyBridge
                      </span>
                    </div>
                    <div className="font-mono text-[10px] tracking-[1.6px] mb-[14px]" style={{ color: "var(--body)" }}>
                      EDUCATION GROUP
                    </div>
                    <div className="w-[52px] h-[52px] rounded-full mx-auto mb-[14px] flex items-center justify-center text-white" style={{ background: "var(--lav-ink)" }}>
                      <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17L4 12" />
                      </svg>
                    </div>
                    <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                      Certificate of Completion
                    </div>
                    <div className="text-[12px] mt-[4px] leading-[1.5]" style={{ color: "var(--body)" }}>
                      awarded to
                    </div>
                    <div className="text-[16px] font-semibold mt-[10px]" style={{ color: "var(--brand-2)" }}>
                      Student Name
                    </div>
                    <div className="text-[12px] mt-[14px] leading-[1.5]" style={{ color: "var(--body)" }}>
                      for successfully completing
                    </div>
                    <div className="text-[13px] font-medium mt-[4px] px-[12px]" style={{ color: "var(--ink)" }}>
                      {details.title}
                    </div>
                    <div className="w-[160px] h-[1px] mx-auto mt-[18px]" style={{ background: "var(--line)" }} />
                    <div className="font-mono text-[10px] mt-[8px] tracking-[0.8px]" style={{ color: "var(--body)" }}>
                      VERIFIED · {new Date().getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="px-[clamp(20px,4.5vw,56px)] py-[90px] max-w-[1320px] mx-auto text-center">
          <SectionHeading
            eyebrow="COMING SOON"
            title="This course is being prepared"
            desc="Full curriculum, video lessons, and resources for this program are on the way. Check back soon."
          />
          <a
            href="/"
            className="inline-flex items-center gap-[9px] font-medium text-[15px] text-white rounded-full px-[26px] py-[15px]"
            style={{ background: "var(--brand)" }}
          >
            Back to programs
            {arrow}
          </a>
        </section>
      )}

      <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto">
        <div
          className="rounded-[24px] p-[40px] lg:p-[56px] text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
            boxShadow: "0 32px 60px -28px rgba(29,46,107,0.55)",
          }}
        >
          <h2 className="text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.15] tracking-[-0.01em] text-white max-w-[640px] mx-auto">
            {details ? "Ready to speak with confidence?" : "Ready to build your international future?"}
          </h2>
          <p className="text-[15px] mt-[12px] text-white/80 max-w-[520px] mx-auto leading-[1.6]">
            {details
              ? "Enroll today and unlock all 30 video lessons, 3 PDF resources, and your completion certificate."
              : "Explore our programs and start preparing for the opportunities waiting for you abroad."}
          </p>
          <a
            href="#"
            className="mt-[28px] inline-flex items-center gap-[9px] font-medium text-[15px] rounded-full px-[30px] py-[15px] bg-white"
            style={{ color: "var(--brand)" }}
          >
            Get started today
            {arrow}
          </a>
        </div>
      </section>

      <footer className="border-t border-line" style={{ background: "var(--bg-soft)" }}>
        <div className="max-w-[1320px] mx-auto px-[clamp(20px,4.5vw,56px)] py-[48px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-[10px]">
            <svg className="w-[30px] h-[30px]" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L34 30H23L20 24L17 30H6L20 4Z" fill="url(#gradFoot)" />
              <defs>
                <linearGradient id="gradFoot" x1="6" y1="4" x2="34" y2="30">
                  <stop offset="0%" stopColor="#14B57E" />
                  <stop offset="100%" stopColor="#0B5E46" />
                </linearGradient>
              </defs>
            </svg>
            <span className="flex flex-col leading-[1.05]">
              <span className="font-semibold text-[15px] tracking-[0.2px]" style={{ color: "var(--brand)" }}>
                FlyBridge
              </span>
              <span className="font-mono text-[8.5px] tracking-[1.6px] mt-[2px]" style={{ color: "var(--body)" }}>
                EDUCATION GROUP
              </span>
            </span>
          </div>
          <p className="font-mono text-[12px]" style={{ color: "var(--body)" }}>
            &copy; {new Date().getFullYear()} FlyBridge Education Group
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="text-[13px] font-medium" style={{ color: "var(--body)" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        summary::-webkit-details-marker { display: none; }
        .browse-btn {
          transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }
        .browse-btn:hover {
          background: var(--brand-2) !important;
          transform: translateY(-2px);
          box-shadow: 0 18px 30px -12px rgba(15,169,104,0.5);
        }
        .browse-btn svg {
          transition: transform 0.25s ease;
        }
        .browse-btn:hover svg {
          transform: translateX(3px);
        }
        @media (max-width: 560px) {
          .course-page-hero { padding-top: 120px !important; }
        }
      `}</style>
    </>
  );
}
