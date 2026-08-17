import type { Metadata } from "next";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { Nav } from "@/components/nav";
import { ProgramCard } from "@/components/program-card";
import { DbCourseCard, type DbCourse } from "@/components/programs/db-course-card";
import { TrackAccordion } from "@/components/programs/track-accordion";
import { programs } from "@/lib/programs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Programs | FlyBridge",
};

const included = [
  {
    title: "Self-paced video lessons",
    desc: "Bite-sized, expert-led modules built around real applications — learn on your own schedule.",
  },
  {
    title: "Real documents & templates",
    desc: "Every course ships with the actual forms, checklists and templates you'll need along the way.",
  },
  {
    title: "Guided start to finish",
    desc: "From eligibility to post-arrival, courses map the entire journey so nothing slips through the cracks.",
  },
  {
    title: "Support when you need it",
    desc: "Ask questions and get answers from people who've navigated the same path — and helped others do it.",
  },
];

async function getPublishedCourses(): Promise<DbCourse[]> {
  await connectDb();
  const courses = await Course.find({ published: true }).sort({ createdAt: -1 });
  return courses.map((c) => ({
    id: c._id.toString(),
    slug: c.slug,
    title: c.title,
    badge: c.badge ?? "",
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    price: c.price ?? 0,
    currency: c.currency ?? "BDT",
    image: c.image ?? null,
    level: c.level ?? "",
    modules: (c.modules ?? []).map((m) => ({
      title: m.title,
      lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
    })),
  }));
}

export default async function ProgramsPage() {
  const dbCourses = await getPublishedCourses();
  const hasDbCourses = dbCourses.length > 0;

  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section className="pt-[168px] pb-[96px] px-[clamp(20px,4.5vw,56px)]">
          <div className="max-w-[1320px] mx-auto">
            <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-end">
              <div className="max-w-[640px]">
                <div
                  className="font-mono text-[11.5px] font-medium tracking-[0.4px] uppercase mb-6 pb-2 border-b w-fit"
                  style={{ color: "var(--brand-2)", borderColor: "var(--line)" }}
                >
                  Programs
                </div>

                <h1
                  className="font-display text-display-lg font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
                  style={{ color: "var(--ink)" }}
                >
                  Every step of the journey, covered in one place.
                </h1>

                <p className="mt-6 max-w-[480px] text-[16.5px] leading-[1.65]" style={{ color: "var(--body)" }}>
                  Self-paced, practical courses that take you from where you are now to
                  studying, working and building a life abroad.
                </p>
              </div>

              <TrackAccordion />
            </div>
          </div>
        </section>

        {/* Program grid */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {hasDbCourses
                ? dbCourses.map((c) => <DbCourseCard key={c.id} course={c} />)
                : programs.map((p) => <ProgramCard key={p.slug} p={p} />)}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px]">
          <div className="max-w-[1320px] mx-auto border-t" style={{ borderColor: "var(--line)" }}>
            <div className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16 pt-14">
              <div>
                <div
                  className="font-mono text-[11.5px] font-medium tracking-[0.4px] uppercase mb-4"
                  style={{ color: "var(--brand-2)" }}
                >
                  What&apos;s inside
                </div>
                <h2
                  className="font-display font-semibold tracking-[-0.01em] leading-[1.2]"
                  style={{ fontSize: "clamp(24px,2.6vw,30px)", color: "var(--ink)" }}
                >
                  Built like a roadmap, not a lecture
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
                {included.map((f) => (
                  <div key={f.title} className="pt-6 border-t" style={{ borderColor: "var(--line)" }}>
                    <h3 className="font-display font-semibold text-[15.5px]" style={{ color: "var(--ink)" }}>
                      {f.title}
                    </h3>
                    <p className="text-[13.5px] leading-[1.65] mt-2" style={{ color: "var(--body)" }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[120px]">
          <div className="max-w-[1320px] mx-auto">
            <div
              className="rounded-[28px] px-[clamp(28px,6vw,72px)] py-[clamp(48px,7vw,80px)]"
              style={{ background: "var(--ink)" }}
            >
              <div className="max-w-[600px]">
                <div
                  className="font-mono text-[11px] font-medium tracking-[0.2em] uppercase mb-5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Not sure where to start?
                </div>
                <h2 className="font-display text-[clamp(26px,3vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em] text-white text-balance">
                  Talk to a counselor and get a personal roadmap
                </h2>
                <p className="text-[15.5px] leading-[1.65] mt-4 max-w-[440px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Tell us where you want to go — we&apos;ll point you to the right course and
                  the next step to take.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-10">
                  <a
                    href="tel:+17786768459"
                    className="inline-flex items-center gap-2.5 font-medium text-[14.5px] rounded-full px-[26px] py-[13px] transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand-2)", color: "#ffffff" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Call us
                  </a>
                  <a
                    href="/success-stories"
                    className="inline-flex items-center gap-1.5 font-medium text-[14.5px] transition-opacity hover:opacity-70"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    See learner stories
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
