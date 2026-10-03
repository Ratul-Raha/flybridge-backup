import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { Nav } from "@/components/nav";
import { StoryAvatars } from "@/components/story-avatars";
import { ProgramCard } from "@/components/program-card";
import { DbCourseCard, type DbCourse } from "@/components/programs/db-course-card";
import { TrackAccordion } from "@/components/programs/track-accordion";
import { staticProgramsWithoutDbCourse } from "@/lib/programs";
import { displayEnrollmentCount } from "@/lib/enrollment-display";
import { getTotalUsers, formatUsersFull } from "@/lib/site-stats";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { publicCoursePricing } from "@/lib/course-discount";
import { courseDetails } from "./[slug]/course-data";

export const revalidate = 60;

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

async function getPublishedCoursesUncached(): Promise<DbCourse[]> {
  try {
    await connectDb();
    const courses = await Course.find({
      $or: [{ published: true }, { upcoming: true }],
    }).sort({ createdAt: -1 });

    const enrollCounts = await CourseEnrollment.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);
    const enrollMap = new Map(enrollCounts.map((r) => [r._id.toString(), r.count as number]));

    return courses
      .map((c) => {
        const itemId = c._id.toString();
        const pricing = publicCoursePricing(c);

        return {
          id: itemId,
          slug: c.slug,
          title: c.title,
          badge: c.badge ?? "",
          subtitle: c.subtitle ?? "",
          description: c.description ?? "",
          price: c.price ?? 0,
          currency: c.currency ?? "USD",
          prices: pricing.prices,
          originalPrice: pricing.configured
          ? (pricing.originalPrice ?? undefined)
          : (courseDetails[c.slug]?.originalPrice ?? undefined),
          discountLabel: pricing.discountLabel,
          discountEndsAt: pricing.endsAt,
          image: c.image ?? null,
          level: c.level ?? "",
          upcoming: c.upcoming ?? false,
          enrollmentCount: displayEnrollmentCount(c.slug, enrollMap.get(itemId) ?? 0),
          modules: (c.modules ?? []).map((m) => ({
            title: m.title,
            lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
          })),
        };
      })
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  } catch {
    return [];
  }
}

const getPublishedCourses = unstable_cache(getPublishedCoursesUncached, ["published-courses"], {
  revalidate: 60,
});

export default async function ProgramsPage() {
  const dbCourses = await getPublishedCourses();
  const totalUsers = await getTotalUsers();
  const visiblePrograms = staticProgramsWithoutDbCourse(dbCourses);
  const programCount = visiblePrograms.length + dbCourses.length;

  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <section
          className="relative pt-[160px] pb-[80px] px-[clamp(20px,4.5vw,56px)] overflow-hidden"
          style={{
            background:
              "radial-gradient(860px 540px at 85% 2%, rgba(15,169,104,0.16), transparent 62%), radial-gradient(720px 480px at 4% 96%, rgba(47,95,224,0.13), transparent 60%), radial-gradient(680px 460px at 98% 90%, rgba(107,76,224,0.12), transparent 62%), radial-gradient(520px 380px at 2% 4%, rgba(219,138,46,0.12), transparent 60%), linear-gradient(180deg, #F2F7EE -6%, #FFFFFF 48%)",
          }}
        >
          <div className="programs-hero-grid" aria-hidden="true" />
          <div className="programs-hero-blob programs-blob-a" aria-hidden="true" />
          <div className="programs-hero-blob programs-blob-b" aria-hidden="true" />

          <div className="max-w-[1320px] mx-auto relative z-[1]">
            <div className="grid lg:grid-cols-[1fr_auto] lg:items-center gap-12 lg:gap-20">
              <div className="max-w-[660px]">
                <div
                  className="inline-flex items-center gap-2.5 rounded-full border px-4 py-[9px] mb-8"
                  style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.8)" }}
                >
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand)" }} />
                  <span
                    className="font-mono text-[10.5px] font-semibold tracking-[0.28em] uppercase"
                    style={{ color: "var(--brand-2)" }}
                  >
                    Learning tracks
                  </span>
                  <span
                    className="font-mono text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-[3px] rounded-full"
                    style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                  >
                    4 pathways
                  </span>
                </div>

                <h1
                  className="font-display font-semibold leading-[1.1] tracking-[-0.02em] text-balance"
                  style={{ fontSize: "clamp(36px,4.4vw,52px)", color: "var(--ink)" }}
                >
                  Every step of the journey,{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(92deg, var(--brand) 8%, var(--brand-2) 60%, rgba(47,95,224,0.95) 112%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    covered in one place.
                  </span>
                </h1>

                <p className="mt-6 max-w-[480px] text-[16.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                  Self-paced, practical courses that take you from where you are now to
                  studying, working and building a life abroad.
                </p>

                <div className="flex items-center gap-[18px] mt-9">
                  <StoryAvatars sizeClass="w-11 h-11" />
                  <div>
                    <div className="text-[15px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                      {formatUsersFull(totalUsers)} learners
                    </div>
                    <div className="text-[12px] mt-[5px]" style={{ color: "var(--body)" }}>
                      already building their journey abroad
                    </div>
                  </div>
                </div>
              </div>

              <TrackAccordion />
            </div>
          </div>
        </section>

        <style>{`
          .programs-hero-grid {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(18,32,67,0.055) 1px, transparent 1px),
              linear-gradient(90deg, rgba(18,32,67,0.055) 1px, transparent 1px);
            background-size: 44px 44px;
            -webkit-mask-image: radial-gradient(130% 100% at 50% 20%, rgba(0,0,0,0.9), transparent 74%);
            mask-image: radial-gradient(130% 100% at 50% 20%, rgba(0,0,0,0.9), transparent 74%);
          }
          .programs-hero-blob {
            position: absolute;
            border-radius: 9999px;
            filter: blur(72px);
            opacity: 0.5;
            pointer-events: none;
            animation: programs-hero-drift 14s ease-in-out infinite alternate;
          }
          .programs-blob-a { width: 420px; height: 420px; top: -8%; right: 10%; background: rgba(15,169,104,0.28); }
          .programs-blob-b { width: 460px; height: 460px; bottom: -10%; left: -6%; background: rgba(47,95,224,0.20); opacity: 0.4; animation-delay: -6s; }
          @keyframes programs-hero-drift {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(24px, -18px) scale(1.07); }
          }
          @media (prefers-reduced-motion: reduce) {
            .programs-hero-blob { animation: none; }
          }
        `}</style>

        {/* Program grid */}
        <section id="programs" className="px-[clamp(20px,4.5vw,56px)] pb-[100px] pt-[36px] scroll-mt-8">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-11">
              <div className="max-w-[640px]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand-2)" }} />
                  <span
                    className="font-mono text-[10.5px] font-semibold tracking-[0.3em] uppercase"
                    style={{ color: "var(--brand-2)" }}
                  >
                    Programs &amp; courses
                  </span>
                </div>
                <h2
                  className="font-display font-semibold tracking-[-0.02em] leading-[1.1] text-balance"
                  style={{ fontSize: "clamp(26px,3vw,38px)", color: "var(--ink)" }}
                >
                  Find your{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(92deg, var(--brand) 8%, var(--brand-2) 60%, rgba(47,95,224,0.95) 112%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    program &amp; course
                  </span>
                </h2>
                <p className="text-[14.5px] mt-[10px] max-w-[520px]" style={{ color: "var(--body)" }}>
                  Everything you need for study abroad and work abroad — all in one place.
                </p>
              </div>

              <div
                className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] uppercase rounded-full border px-4 py-[9px] shrink-0"
                style={{ borderColor: "var(--line)", background: "#fff", color: "var(--brand-2)" }}
              >
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand)" }} />
                {programCount} programs
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {visiblePrograms.map((p) => (
                <ProgramCard key={p.slug} p={p} />
              ))}
              {dbCourses.map((c) => (
                <DbCourseCard key={c.id} course={c} />
              ))}
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
              className="rounded-lg px-[clamp(28px,6vw,72px)] py-[clamp(48px,7vw,80px)]"
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
