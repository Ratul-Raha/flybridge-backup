import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { ProgramCard } from "@/components/program-card";
import { getProgram, programs } from "@/lib/programs";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { readSession } from "@/lib/auth/session";
import { CourseEnrollButton } from "@/components/programs/course-enroll-button";
import {
  BadgeCheck,
  Check,
  Clock,
  Maximize2,
  Pause,
  ShieldCheck,
  ShoppingCart,
  Star,
  ThumbsUp,
  Volume2,
  Zap,
} from "lucide-react";
import type { CourseDetails, Review } from "./course-data";
import { courseDetails } from "./course-data";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

type CourseCta = {
  courseId: string;
  slug: string;
  enrolled: boolean;
  paid: boolean;
};

export function generateMetadata({ params }: Props): Metadata {
  const program = getProgram(params.slug);
  const details = courseDetails[params.slug];
  return {
    title: `${details?.title ?? program?.title ?? "Program"} | FlyBridge Education Group`,
    description: details?.desc ?? program?.desc,
  };
}

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

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{
            width: size,
            height: size,
            color: i < filled ? "#F59E0B" : "#DCE1EA",
            fill: i < filled ? "#F59E0B" : "transparent",
          }}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function SectionHeading({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-7">
      <div className="font-mono text-[11.5px] font-medium tracking-[0.35em] mb-[10px]" style={{ color: "var(--brand-2)" }}>
        {eyebrow}
      </div>
      <h2 className="font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(24px,2.6vw,30px)", color: "var(--ink)" }}>
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

function CourseHero({
  badge,
  title,
  subtitle,
  desc,
  price,
  originalPrice,
  savings,
  access,
  rating,
  lessonCount,
  cta,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  desc: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  access?: string;
  rating?: { average: number; count: number };
  lessonCount: number;
  cta?: CourseCta;
}) {
  return (
    <section
      className="course-page-hero pt-[150px] px-[clamp(20px,4.5vw,56px)] pb-[70px] relative"
      style={{ background: "#fff" }}
    >
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.72fr] gap-[50px] items-center">
        <div>
          <div className="flex items-center gap-2 text-[12.5px] font-medium mb-6">
            <Link href="/" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">
              Home
            </Link>
            <span style={{ color: "var(--body)" }}>/</span>
            <Link href="/programs" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">
              Programs
            </Link>
            <span style={{ color: "var(--body)" }}>/</span>
            <span style={{ color: "var(--brand-2)" }}>{badge}</span>
          </div>

          <p className="font-mono text-[11.5px] font-medium tracking-[0.35em] mb-[14px]" style={{ color: "var(--brand-2)" }}>
            {badge.toUpperCase()} · COURSE
          </p>

          <h1 className="font-display font-semibold leading-[1.1] tracking-[-0.02em] max-w-[560px]" style={{ color: "var(--ink)", fontSize: "clamp(28px,3.4vw,40px)" }}>
            {title}
            {subtitle && <> {subtitle}</>}
          </h1>

          {rating && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13.5px]">
              <Stars value={rating.average} />
              <span className="font-semibold" style={{ color: "var(--ink)" }}>
                {rating.average}
              </span>
              <span className="font-medium underline underline-offset-2" style={{ color: "var(--body)" }}>
                ({rating.count} reviews)
              </span>
            </a>
          )}

          {price && (
            <div className="mt-[22px] pt-[20px] border-t border-line">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[32px] font-bold leading-none" style={{ color: "var(--ink)" }}>
                  {price}
                </span>
                {originalPrice && (
                  <span className="text-[16px] font-medium line-through" style={{ color: "var(--body)", opacity: 0.65 }}>
                    {originalPrice}
                  </span>
                )}
                {savings && (
                  <span
                    className="text-[12px] font-bold text-white rounded-md px-2.5 py-1"
                    style={{ background: "#0F9D58" }}
                  >
                    {savings} OFF
                  </span>
                )}
              </div>
              {access && (
                <div className="mt-[10px] flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--brand-2)" }}>
                  <Clock className="w-4 h-4" />
                  {access} · One-time payment
                </div>
              )}
            </div>
          )}

          <p className="mt-[18px] max-w-[460px] text-[15px] leading-[1.7]" style={{ color: "var(--body)" }}>
            {desc}
          </p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {cta ? (
              <CourseEnrollButton
                courseId={cta.courseId}
                slug={cta.slug}
                enrolled={cta.enrolled}
                paid={cta.paid}
              />
            ) : (
              <>
                <a
                  href="#buy"
                  className="browse-btn inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full px-[30px] py-[15px] flex-1 sm:flex-none sm:min-w-[190px]"
                  style={{ background: "var(--brand)" }}
                >
                  Enroll now
                  {arrow}
                </a>
                <a
                  href="#buy"
                  className="inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] rounded-full px-[26px] py-[15px] border border-line bg-white flex-1 sm:flex-none"
                  style={{ color: "var(--ink)" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to cart
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 mt-5 flex-wrap text-[12.5px] font-medium" style={{ color: "var(--body)" }}>
            {["Instant access", "Live support", "Verified certificate"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" strokeWidth={3} style={{ color: "var(--brand-2)" }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div
            className="w-full max-w-[430px] rounded-[24px] bg-[#101B31] overflow-hidden"
            style={{ boxShadow: "0 36px 70px -30px rgba(7,14,31,0.65)" }}
          >
            {/* Player screen */}
            <div
              className="relative h-[200px]"
              style={{
                background:
                  "linear-gradient(160deg, #0E2A4E 0%, #14524C 55%, #0B5E46 120%)",
              }}
            >
              {/* subtle glow */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 72% 24%, rgba(255,255,255,0.16), transparent 42%)",
                }}
              />
              {/* top row */}
              <div className="absolute top-0 inset-x-0 flex items-center justify-between px-[18px] pt-[16px]">
                <span className="flex items-center gap-[7px] font-mono text-[10px] font-semibold tracking-[0.28em] text-white/80">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#FF6B5E] inline-block" />
                  PREVIEW
                </span>
                <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-white/85 bg-white/10 border border-white/15 rounded-full px-[10px] py-[4px]">
                  {lessonCount} LESSONS
                </span>
              </div>

              {/* center play */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="relative flex items-center justify-center group cursor-pointer">
                  <span className="absolute w-[92px] h-[92px] rounded-full bg-white/10" />
                  <span className="absolute w-[68px] h-[68px] rounded-full bg-white/15 group-hover:bg-white/25 transition-colors duration-300" />
                  <span className="relative w-[48px] h-[48px] rounded-full bg-white text-[#0B5E46] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.55)]">
                    {play}
                  </span>
                </span>
              </div>

              {/* center label */}
              <div className="absolute bottom-[34px] inset-x-0 text-center">
                <span className="text-[11.5px] font-medium text-white/75">
                  Intro video · 01:24
                </span>
              </div>
            </div>

            {/* Controls bar */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="w-[30px] h-[30px] rounded-[8px] bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Pause className="w-[13px] h-[13px]" />
                </span>
                <div className="flex-1">
                  <div className="relative h-[5px] rounded-full bg-white/12 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: "22%",
                        background: "linear-gradient(90deg, #2EE6A8, #0F9D58)",
                      }}
                    />
                    <span
                      className="absolute top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full bg-white shadow-md"
                      style={{ left: "22%", transform: "translate(-50%, -50%)" }}
                    />
                  </div>
                  <div className="flex justify-between mt-[7px] font-mono text-[10px] text-white/60">
                    <span>01:24</span>
                    <span>08:12</span>
                  </div>
                </div>
                <span className="text-white/70 flex items-center gap-[10px] shrink-0">
                  <Volume2 className="w-[15px] h-[15px]" />
                  <Maximize2 className="w-[14px] h-[14px]" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuyCard({ details, cta }: { details: CourseDetails; cta?: CourseCta }) {
  return (
    <div
      className="rounded-[24px] bg-white border border-line overflow-hidden"
      style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.28)" }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] font-bold tracking-[0.4px] px-2.5 py-1 rounded-full"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            INTRO OFFER
          </span>
          {details.savings && (
            <span className="text-[11.5px] font-bold" style={{ color: "#0F9D58" }}>
              Save {details.savings}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end gap-2.5 flex-wrap">
          <span className="text-[38px] font-extrabold leading-none" style={{ color: "var(--ink)" }}>
            {details.price}
          </span>
          {details.originalPrice && (
            <span className="text-[16px] font-medium line-through mb-1" style={{ color: "var(--body)", opacity: 0.6 }}>
              {details.originalPrice}
            </span>
          )}
        </div>
        {details.access && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: "var(--brand-2)" }}>
            <Clock className="w-3.5 h-3.5" />
            {details.access} · One-time payment
          </p>
        )}

        {cta ? (
          <div className="mt-5">
            <CourseEnrollButton
              courseId={cta.courseId}
              slug={cta.slug}
              enrolled={cta.enrolled}
              paid={cta.paid}
              block
            />
          </div>
        ) : (
          <a
            href="#"
            className="mt-5 block w-full text-center rounded-full py-[14px] text-[14.5px] font-bold text-white transition-all duration-300 hover:-translate-y-[1px]"
            style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(29,46,107,0.55)" }}
          >
            Enroll now — {details.price}
          </a>
        )}
        <a
          href="#"
          className="mt-3 flex items-center justify-center gap-[8px] w-full rounded-full py-[13px] text-[14px] font-semibold border border-line bg-white transition-colors hover:bg-[var(--bg-soft)]"
          style={{ color: "var(--ink)" }}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to cart
        </a>

        <div className="mt-6 pt-5 border-t border-line">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
            What&apos;s included
          </p>
          <ul className="mt-3.5 space-y-2.5">
            {(details.features ?? BLUEPRINT_FEATURES).map((f) => (
              <li key={f.title} className="flex items-start gap-2.5 text-[13px]">
                <span
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[1px]"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                >
                  <Check className="w-[10px] h-[10px]" strokeWidth={3} />
                </span>
                <span className="font-medium leading-snug" style={{ color: "var(--ink)" }}>
                  {f.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-5 border-t border-line grid grid-cols-3 gap-2 text-center">
          {[
            { icon: ShieldCheck, label: "Live support" },
            { icon: BadgeCheck, label: "Verified certificate" },
            { icon: Zap, label: "Instant access" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-medium leading-tight" style={{ color: "var(--body)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px] text-white shrink-0"
          style={{ background: "var(--lav-ink)" }}
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              {review.name}
            </span>
            {review.verified && (
              <span
                className="inline-flex items-center gap-[3px] text-[10px] font-semibold px-1.5 py-[2px] rounded-full"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <BadgeCheck className="w-3 h-3" />
                VERIFIED BUYER
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-[3px]">
            <Stars value={review.rating} size={13} />
            <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
              {review.date}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3.5 text-[14px] leading-[1.65]" style={{ color: "var(--body)" }}>
        {review.text}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
        <ThumbsUp className="w-3.5 h-3.5" />
        {review.helpful} found this helpful
      </div>
    </div>
  );
}

export default async function ProgramPage({ params }: Props) {
  const program = getProgram(params.slug);
  if (!program) notFound();

  const details = courseDetails[params.slug];
  const lessonCount = details
    ? details.modules.reduce((n, m) => n + m.lessons.length, 0)
    : 30;

  await connectDb();
  const course = await Course.findOne({ slug: params.slug, published: true });
  let cta: CourseCta | undefined;
  if (course) {
    const session = await readSession();
    const enrolled =
      session?.userId &&
      (await CourseEnrollment.exists({
        user: session.userId,
        course: course._id,
        status: "active",
      }));
    cta = {
      courseId: course._id.toString(),
      slug: course.slug,
      enrolled: Boolean(enrolled),
      paid: (course.price ?? 0) > 0,
    };
  }

  return (
    <div className="course-page">
      <Nav />

      <CourseHero
        badge={program.badge}
        title={details?.title ?? program.title}
        subtitle={details?.subtitle}
        desc={details?.desc ?? program.desc}
        price={details?.price}
        originalPrice={details?.originalPrice}
        savings={details?.savings}
        access={details?.access}
        rating={
          details?.rating
            ? { average: details.rating.average, count: details.rating.count }
            : undefined
        }
        lessonCount={lessonCount}
        cta={cta}
      />

      {/* Other programs */}
      <section className="px-[clamp(20px,4.5vw,56px)] pt-[20px] pb-[70px] max-w-[1320px] mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-9">
          <div>
            <h2 className="font-display font-semibold tracking-[-0.01em]" style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}>
              Other programs you may like
            </h2>
            <p className="text-[15px] mt-2" style={{ color: "var(--body)" }}>
              More ways to build your international future.
            </p>
          </div>
          <Link href="/programs" className="view-all font-medium text-[14px] inline-flex items-center gap-[6px] group" style={{ color: "var(--brand-2)" }}>
            View all programs
            <svg className="w-[14px] h-[14px] transition-transform duration-250 group-hover:translate-x-[3px]" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs
            .filter((p) => p.slug !== params.slug)
            .map((p) => (
              <ProgramCard key={p.slug} p={p} />
            ))}
        </div>
      </section>

      {details ? (
        <>
          {/* Product section */}
          <section id="buy" className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
              <div className="space-y-12">
                {/* Facilities */}
                <div className="border-y border-line py-6 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {details.stats.map((stat) => (
                    <div key={stat.label} className="flex items-baseline gap-2.5">
                      <span className="font-mono text-[22px] font-medium leading-none" style={{ color: "var(--ink)" }}>
                        {stat.value}
                      </span>
                      <span className="text-[13px]" style={{ color: "var(--body)" }}>
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* What's included */}
                <div>
                  <SectionHeading
                    eyebrow="WHAT'S INCLUDED"
                    title="Everything in this program"
                    desc={
                      details.featuresDesc ??
                      "From the first video to your approval — every resource is part of the same package."
                    }
                  />
                  <div className="rounded-2xl border border-line bg-white overflow-hidden">
                    {(details.features ?? BLUEPRINT_FEATURES).map(({ icon: Icon, title, desc }, i) => (
                      <div
                        key={title}
                        className={`flex items-start gap-4 px-5 py-4 ${i > 0 ? "border-t border-line" : ""}`}
                      >
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                        >
                          <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                        </span>
                        <div>
                          <h3 className="text-[14.5px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
                            {title}
                          </h3>
                          <p className="text-[13px] mt-[5px] leading-[1.55]" style={{ color: "var(--body)" }}>
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course book */}
                {details.book && (
                  <div>
                    <SectionHeading
                      eyebrow="COURSE BOOK"
                      title="The book is included in this program"
                      desc={details.book.desc}
                    />
                    <div className="rounded-2xl border border-line bg-white overflow-hidden">
                      <div className="grid sm:grid-cols-[220px_1fr] gap-6 p-6 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={details.book.image}
                          alt={details.book.title}
                          className="w-full max-w-[220px] mx-auto rounded-xl aspect-[3/4] object-cover"
                          style={{ boxShadow: "0 22px 44px -20px rgba(18,32,67,0.45)" }}
                        />
                        <div className="flex flex-col gap-3">
                          <span
                            className="w-fit font-mono text-[10px] font-bold tracking-[0.3em] px-2.5 py-1 rounded-full"
                            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                          >
                            INCLUDED WITH COURSE
                          </span>
                          <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                            {details.book.title}
                          </h3>
                          <p className="text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                            {details.book.includedNote}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Outcomes */}
                <div>
                  <SectionHeading
                    eyebrow="WHAT YOU WILL LEARN"
                    title="Course outcomes"
                    desc="By the end of this course you will be able to:"
                  />
                  <div className="rounded-2xl border border-line bg-white overflow-hidden">
                    {details.outcomes.map((o, i) => (
                      <div
                        key={o.title}
                        className={`flex items-start gap-3 px-5 py-4 ${i > 0 ? "border-t border-line" : ""}`}
                      >
                        <span
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-[1px]"
                          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                        >
                          <Check className="w-[12px] h-[12px]" strokeWidth={3} />
                        </span>
                        <div>
                          <div className="text-[14px] font-medium leading-[1.5]" style={{ color: "var(--ink)" }}>
                            {o.title}
                          </div>
                          {o.desc && (
                            <div className="text-[13px] mt-[3px] leading-[1.6]" style={{ color: "var(--body)" }}>
                              {o.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curriculum */}
                <div id="curriculum">
                  <SectionHeading
                    eyebrow="CURRICULUM"
                    title="What is inside"
                    desc={
                      details.highlightsDesc ??
                      "Everything you need to prepare with confidence, in one place."
                    }
                  />
                  <div className="rounded-2xl border border-line bg-white overflow-hidden">
                    {(details.highlights ?? [
                      {
                        title: "10 Videos",
                        sub: "Step-by-step video lessons, at your own pace",
                      },
                      {
                        title: "Frequent Live Q&A session",
                        sub: "Ask questions directly and get expert answers",
                      },
                      {
                        title: "Resources",
                        sub: "Templates, checklists & practical tools included",
                      },
                    ]).map((item, i) => (
                      <div
                        key={item.title}
                        className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? "border-t border-line" : ""}`}
                      >
                        <span
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                        >
                          <Check className="w-[12px] h-[12px]" strokeWidth={3} />
                        </span>
                        <div>
                          <div className="text-[14.5px] font-medium leading-[1.3]" style={{ color: "var(--ink)" }}>
                            {item.title}
                          </div>
                          <div className="text-[12.5px] mt-[2px]" style={{ color: "var(--body)" }}>
                            {item.sub}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky purchase box */}
              <aside className="lg:sticky lg:top-24">
                <BuyCard details={details} cta={cta} />
              </aside>
            </div>
          </section>

          {/* Reviews */}
          {details.reviews?.length ? (
            <section id="reviews" className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
              <SectionHeading
                eyebrow="RATINGS & REVIEWS"
                title="What students say"
                desc="Real experiences from enrollees who prepared their study visa application with the Blueprint."
              />
              <div className="rounded-2xl border border-line bg-white overflow-hidden">
                {details.reviews.map((review, i) => (
                  <div key={review.name} className={i > 0 ? "border-t border-line" : ""}>
                    <ReviewCard review={review} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
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

      {/* Mobile sticky buy bar */}
      {details && (
        <>
          <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-line px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-extrabold leading-none" style={{ color: "var(--ink)" }}>
                  {details.price}
                </span>
                {details.originalPrice && (
                  <span className="text-[12px] line-through" style={{ color: "var(--body)", opacity: 0.6 }}>
                    {details.originalPrice}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--brand-2)" }}>
                <Clock className="w-3 h-3" />
                {details.access}
              </div>
            </div>
            {cta ? (
              <div className="shrink-0 w-[150px]">
                <CourseEnrollButton
                  courseId={cta.courseId}
                  slug={cta.slug}
                  enrolled={cta.enrolled}
                  paid={cta.paid}
                  block
                />
              </div>
            ) : (
              <a
                href="#buy"
                className="shrink-0 rounded-full px-6 py-3 text-[13.5px] font-bold text-white"
                style={{ background: "var(--brand)" }}
              >
                Enroll now
              </a>
            )}
          </div>
          <div className="h-[76px] md:hidden" />
        </>
      )}

      <style>{`
        .course-page {
          --body: #39445A;
          --line: #DDE2EC;
        }
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
    </div>
  );
}
