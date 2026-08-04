import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { ProgramCard } from "@/components/program-card";
import { getProgram, programs } from "@/lib/programs";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import {
  BadgeCheck,
  Check,
  Clock,
  ShieldCheck,
  ShoppingCart,
  Star,
  ThumbsUp,
  Zap,
} from "lucide-react";
import type { CourseDetails, Review } from "./course-data";
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
  previewLessons,
  lessonCount,
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
  previewLessons: { title: string; duration: string }[];
  lessonCount: number;
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
                {lessonCount} LESSONS
              </span>
            </div>
            <div className="p-[22px]">
              <div className="font-mono text-[10.5px] font-medium tracking-[0.4px] mb-[8px]" style={{ color: "var(--lav-ink)" }}>
                PREVIEW THE CURRICULUM
              </div>
              <div className="space-y-[10px]">
                {previewLessons.map((row, i) => (
                  <div key={row.title} className="flex items-center gap-3 text-[12.5px]">
                    <span
                      className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center font-medium text-[11px] shrink-0"
                      style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-medium truncate" style={{ color: "var(--ink)" }}>
                      {row.title}
                    </span>
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--body)" }}>
                      {row.duration}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-[16px] pt-[14px] border-t border-line flex items-center justify-between">
                <span className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
                  + {lessonCount - previewLessons.length} more lessons
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

function BuyCard({ details }: { details: CourseDetails }) {
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

        <a
          href="#"
          className="mt-5 block w-full text-center rounded-full py-[14px] text-[14.5px] font-bold text-white transition-all duration-300 hover:-translate-y-[1px]"
          style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(29,46,107,0.55)" }}
        >
          Enroll now — {details.price}
        </a>
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
            {BLUEPRINT_FEATURES.map((f) => (
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

export default function ProgramPage({ params }: Props) {
  const program = getProgram(params.id);
  if (!program) notFound();

  const details = courseDetails[params.id];
  const previewLessons =
    details?.modules[0]?.lessons.slice(0, 3) ?? [
      { title: "ইংরেজি উচ্চারণের মূল ধ্বনি", duration: "08:12" },
      { title: "Stress ও intonation বোঝা", duration: "09:04" },
      { title: "Common vowel sounds", duration: "10:21" },
    ];
  const lessonCount = details
    ? details.modules.reduce((n, m) => n + m.lessons.length, 0)
    : 30;

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
        previewLessons={previewLessons}
        lessonCount={lessonCount}
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
            .filter((p) => p.slug !== params.id)
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
                    desc="From the first video to your approval — every resource is part of the same package."
                  />
                  <div className="rounded-2xl border border-line bg-white overflow-hidden">
                    {BLUEPRINT_FEATURES.map(({ icon: Icon, title, desc }, i) => (
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
                        key={o}
                        className={`flex items-start gap-3 px-5 py-4 ${i > 0 ? "border-t border-line" : ""}`}
                      >
                        <span
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-[1px]"
                          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                        >
                          <Check className="w-[12px] h-[12px]" strokeWidth={3} />
                        </span>
                        <span className="text-[14px] font-medium leading-[1.5]" style={{ color: "var(--ink)" }}>
                          {o}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curriculum */}
                <div id="curriculum">
                  <SectionHeading
                    eyebrow="CURRICULUM"
                    title="What is inside"
                    desc="Everything you need to prepare with confidence, in one place."
                  />
                  <div className="rounded-2xl border border-line bg-white overflow-hidden">
                    {[
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
                    ].map((item, i) => (
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
                <BuyCard details={details} />
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
            <a
              href="#buy"
              className="shrink-0 rounded-full px-6 py-3 text-[13.5px] font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              Enroll now
            </a>
          </div>
          <div className="h-[76px] md:hidden" />
        </>
      )}

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
