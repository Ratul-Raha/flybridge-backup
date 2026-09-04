import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { ProgramCard } from "@/components/program-card";
import { DbCourseCard, type DbCourse } from "@/components/programs/db-course-card";
import { getProgram, programs } from "@/lib/programs";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseReview } from "@/lib/models/course-review";
import { readSession } from "@/lib/auth/session";
import {
  BadgeCheck,
  BookOpen,
  Check,
  Clock,
  Lock,
  Maximize2,
  Pause,
  ShieldCheck,
  Star,
  ThumbsUp,
  Volume2,
  Zap,
} from "lucide-react";
import type { CourseDoc } from "@/lib/models/course";
import { CheckoutForm } from "@/components/programs/checkout-form";
import type { CourseDetails, Review } from "./course-data";
import { courseDetails } from "./course-data";
import { BengaliText } from "@/components/bengali-text";
import { ReviewForm } from "@/components/programs/review-form";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

type CourseCta = {
  courseId?: string;
  slug: string;
  enrolled: boolean;
  paid: boolean;
  hasDb?: boolean;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const program = getProgram(params.slug);
  const details = courseDetails[params.slug];
  const title = `${details?.title ?? program?.title ?? "Program"} | FlyBridge Education Group`;
  const description = details?.desc ?? program?.desc;

  let image = program?.image;
  if (!image && program?.hasDb) {
    try {
      await connectDb();
      const course = await Course.findOne({
        slug: params.slug,
        $or: [{ published: true }, { upcoming: true }],
      }).select("image");
      image = (course?.image as string | undefined) ?? undefined;
    } catch {
      /* fall back to default og image */
    }
  }

  if (program || details) {
    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url: `/programs/${params.slug}`,
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : undefined,
      },
    };
  }
  return {
    title: "Course | FlyBridge",
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
            <BengaliText>{title}</BengaliText>
            {subtitle && <> <BengaliText>{subtitle}</BengaliText></>}
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
            {cta?.enrolled ? (
              <Link
                href={`/dashboard/courses/${cta.slug}/learn`}
                className="browse-btn inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full px-[30px] py-[15px] flex-1 sm:flex-none sm:min-w-[190px]"
                style={{ background: "var(--brand)" }}
              >
                Open Player
                {play}
              </Link>
            ) : cta?.hasDb ? (
              <Link
                href={`/programs/${cta.slug}/checkout`}
                className="browse-btn inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full px-[30px] py-[15px] flex-1 sm:flex-none sm:min-w-[190px]"
                style={{ background: "var(--brand)" }}
              >
                Enroll now
                {arrow}
              </Link>
            ) : (
              <span
                className="inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white/50 rounded-full px-[30px] py-[15px] flex-1 sm:flex-none sm:min-w-[190px] cursor-not-allowed"
                style={{ background: "var(--brand)", opacity: 0.5 }}
              >
                Enroll now
                {arrow}
              </span>
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
            className="w-full max-w-[430px] rounded-lg bg-[#101B31] overflow-hidden"
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

type ReviewItem = {
  id: string;
  rating: number;
  text: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
  updatedAt: string;
};

function DbCoursePage({
  course,
  enrolled,
  reviews,
  totalReviews,
  userReview,
}: {
  course: CourseDoc & { _id: import("mongoose").Types.ObjectId };
  enrolled: boolean;
  reviews: ReviewItem[];
  totalReviews: number;
  userReview: { id: string; rating: number; text: string } | null;
}) {
  const lessonCount = (course.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const moduleCount = (course.modules ?? []).length;
  const isFree = (course.price ?? 0) <= 0;

  const checkoutCourse = {
    courseId: course._id.toString(),
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle ?? "",
    description: course.description ?? "",
    image: course.image ?? null,
    badge: course.badge ?? "COURSE",
    price: course.price ?? 0,
    currency: course.currency ?? "USD",
    level: course.level ?? "",
    language: course.language ?? "",
    pace: course.pace ?? "",
    upcoming: course.upcoming === true,
  };

  return (
    <div className="checkout-page">
      <Nav />

      {/* Breadcrumb */}
      <div className="px-[clamp(20px,4.5vw,56px)] pt-[120px] pb-4 max-w-[1320px] mx-auto">
        <div className="flex items-center gap-2 text-[12.5px] font-medium">
          <Link href="/" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">Home</Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <Link href="/programs" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">Programs</Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <span style={{ color: "var(--brand-2)" }}>{checkoutCourse.badge}</span>
        </div>
      </div>

      {/* Main checkout grid */}
      <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
        {enrolled ? (
          <div className="max-w-[560px] mx-auto">
            <div
              className="rounded-lg border border-line bg-white p-8 sm:p-10 text-center"
              style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.12)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(15,169,104,0.1)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0FA968" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h2 className="font-display text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
                You&apos;re enrolled in this course
              </h2>
              <p className="text-[14px] mt-2 mb-8" style={{ color: "var(--body)" }}>
                {lessonCount} lessons across {moduleCount} modules ready for you.
              </p>
              <Link
                href={`/dashboard/courses/${checkoutCourse.slug}/learn`}
                className="inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full px-[30px] py-[15px] hover:opacity-90 transition-opacity"
                style={{ background: "var(--brand)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
                </svg>
                Open Player
              </Link>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">

          {/* Left — product + form */}
          <div className="space-y-8">
            {/* Product card */}
            <div className="rounded-lg border border-line bg-white overflow-hidden">
              <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                <div
                  className="relative h-[180px] sm:h-full sm:min-h-[180px] flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--brand-soft)" }}
                >
                  {checkoutCourse.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={checkoutCourse.image}
                        alt={checkoutCourse.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(18,32,67,0.18), transparent 50%)" }} />
                    </>
                  ) : (
                    <BookOpen size={36} className="text-white/40" />
                  )}
                </div>
                <div className="p-5 sm:p-6 flex flex-col justify-center">
                  <span
                    className="font-mono text-[10px] font-semibold tracking-[0.3em] mb-2 inline-block w-fit"
                    style={{ color: "var(--brand-2)" }}
                  >
                    {checkoutCourse.badge.toUpperCase()}
                  </span>
                  <h1 className="font-display text-[19px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
                    <BengaliText>{checkoutCourse.title}</BengaliText>
                    {checkoutCourse.subtitle && <> <BengaliText>{checkoutCourse.subtitle}</BengaliText></>}
                  </h1>
                  {(checkoutCourse.level || checkoutCourse.language) && (
                    <div className="mt-2 flex items-center gap-2 text-[12px] font-medium" style={{ color: "var(--body)" }}>
                      {checkoutCourse.level && <span>{checkoutCourse.level}</span>}
                      {checkoutCourse.language && <>{checkoutCourse.level && <span>·</span>}<span>{checkoutCourse.language}</span></>}
                    </div>
                  )}
                  {checkoutCourse.description && (
                    <p className="mt-2 text-[13px] leading-[1.6] line-clamp-2" style={{ color: "var(--body)" }}>
                      {checkoutCourse.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkout form */}
            <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
              <CheckoutForm course={checkoutCourse} />
            </div>
          </div>

          {/* Right — order summary (sticky) */}
          <aside className="lg:sticky lg:top-24">
            <div
              className="rounded-lg border border-line bg-white overflow-hidden"
              style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.18)" }}
            >
              <div className="p-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-5" style={{ color: "var(--body)" }}>
                  Order summary
                </p>

                {/* Line item */}
                <div className="flex gap-4 pb-5 border-b" style={{ borderColor: "var(--line)" }}>
                  <div
                    className="w-[64px] h-[64px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    {checkoutCourse.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={checkoutCourse.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={20} className="text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                      <BengaliText>{checkoutCourse.title}</BengaliText>
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                      {checkoutCourse.badge}
                    </p>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="py-4 space-y-2.5 border-b" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span style={{ color: "var(--body)" }}>Subtotal</span>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>
                      {isFree ? "Free" : `${checkoutCourse.currency} ${checkoutCourse.price.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span style={{ color: "var(--body)" }}>Tax</span>
                    <span className="font-medium" style={{ color: "var(--ink)" }}>0.00</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4">
                  <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>Total</span>
                  <span className="text-[22px] font-bold leading-none" style={{ color: "var(--ink)" }}>
                    {isFree ? "Free" : `${checkoutCourse.currency} ${checkoutCourse.price.toLocaleString()}`}
                  </span>
                </div>

                {checkoutCourse.upcoming && (
                  <div
                    className="mt-4 text-center text-[13px] font-medium py-2.5 rounded-xl"
                    style={{ background: "rgba(111,76,224,0.08)", color: "#6B4CE0" }}
                  >
                    This course is coming soon — join the waitlist to be notified.
                  </div>
                )}
              </div>

              {/* What's included */}
              <div className="px-6 pb-6 pt-5 border-t" style={{ borderColor: "var(--line)" }}>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: "var(--body)" }}>
                  What&apos;s included
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Instant access after enrollment",
                    `${moduleCount} modules · ${lessonCount} lessons`,
                    "Lifetime access — learn at your own pace",
                    "Certificate of completion",
                    "Live support from instructors",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px]">
                      <span
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[1px]"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        <Check className="w-[10px] h-[10px]" strokeWidth={3} />
                      </span>
                      <span style={{ color: "var(--ink)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust badges */}
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: Lock, label: "SSL Encrypted" },
                    { icon: ShieldCheck, label: "30-day guarantee" },
                    { icon: Zap, label: "Instant access" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-[10.5px] font-medium leading-tight" style={{ color: "var(--body)" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
        )}
      </section>

      {/* Course Books */}
      {(course.books ?? []).length > 0 && (
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
          <SectionHeading
            eyebrow="COURSE MATERIALS"
            title="Books & reading materials"
            desc="Included with this course — download and study at your own pace"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(course.books ?? []).map((book, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-xl border p-5 bg-white transition hover:shadow-md"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex w-10 h-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    <BookOpen size={18} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold leading-tight truncate" style={{ color: "var(--ink)" }}>
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--body)" }}>
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={book.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium rounded-lg border px-4 py-2 transition-all duration-200 hover:border-brand-2 hover:text-brand-2"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                  Download PDF
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews section */}
      <section id="reviews" className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
        <SectionHeading
          eyebrow="RATINGS & REVIEWS"
          title="What students say"
          desc={totalReviews > 0 ? `Showing ${totalReviews} review${totalReviews === 1 ? "" : "s"}` : "Be the first to review this course."}
        />

        {totalReviews > 0 && (
          <div className="mb-8 flex items-center gap-4 p-5 rounded-lg border bg-white" style={{ borderColor: "var(--line)" }}>
            <div className="text-center pr-6 border-r" style={{ borderColor: "var(--line)" }}>
              <div className="text-[36px] font-bold leading-none" style={{ color: "var(--ink)" }}>
                {(course.averageRating ?? 0).toFixed(1)}
              </div>
              <div className="mt-2">
                <Stars value={course.averageRating ?? 0} size={14} />
              </div>
              <div className="text-[12px] mt-1.5" style={{ color: "var(--body)" }}>
                {totalReviews} review{totalReviews === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[12px]">
                    <span className="w-3 text-right" style={{ color: "var(--body)" }}>{star}</span>
                    <Star className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} strokeWidth={1.5} />
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#F59E0B" }} />
                    </div>
                    <span className="w-6 text-right" style={{ color: "var(--body)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review form */}
        <div className="mb-8">
          <ReviewForm courseId={course._id.toString()} existingReview={userReview} />
        </div>

        {/* Review list */}
        {reviews.length > 0 && (
          <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            {reviews.map((review, i) => (
              <div key={review.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--line)" }}>
                <ReviewCard review={{
                  name: review.userName,
                  rating: review.rating,
                  date: new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                  text: review.text,
                  helpful: 0,
                  verified: false,
                }} />
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .checkout-page {
          --body: #39445A;
          --line: #DDE2EC;
        }
      `}</style>
    </div>
  );
}

export default async function ProgramPage({ params }: Props) {
  const program = getProgram(params.slug);

  await connectDb();

  const course = await Course.findOne({
    slug: params.slug,
    $or: [{ published: true }, { upcoming: true }],
  });

  if (!program) {
    if (!course) notFound();
    const session = await readSession();
    const enrolled =
      session?.userId &&
      (await CourseEnrollment.exists({
        user: session.userId,
        course: course._id,
        status: "active",
      }));

    const [reviews, userReviewDoc] = await Promise.all([
      CourseReview.find({ course: course._id })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      session?.userId
        ? CourseReview.findOne({ course: course._id, user: session.userId }).lean()
        : null,
    ]);

    const reviewItems = reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      text: r.text,
      userName: (r.user as any)?.name ?? "Anonymous",
      userAvatar: (r.user as any)?.avatar ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return (
      <DbCoursePage
        course={course}
        enrolled={Boolean(enrolled)}
        reviews={reviewItems}
        totalReviews={course.reviewCount ?? 0}
        userReview={userReviewDoc ? { id: userReviewDoc._id.toString(), rating: userReviewDoc.rating, text: userReviewDoc.text } : null}
      />
    );
  }

  const details = courseDetails[params.slug];
  const lessonCount = details
    ? details.modules.reduce((n, m) => n + m.lessons.length, 0)
    : 30;

  let cta: CourseCta | undefined;
  if (program.hasDb && course) {
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
      hasDb: true,
    };
  }

  const sessionForReviews = await readSession();
  const [liveReviews, userReviewDoc] = program.hasDb && course
    ? await Promise.all([
        CourseReview.find({ course: course._id })
          .populate("user", "name avatar")
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        sessionForReviews?.userId
          ? CourseReview.findOne({ course: course._id, user: sessionForReviews.userId }).lean()
          : null,
      ])
    : [[], null];
  const liveReviewItems = liveReviews.map((r: any) => ({
    id: r._id.toString(),
    rating: r.rating,
    text: r.text,
    userName: r.user?.name ?? "Anonymous",
    userAvatar: r.user?.avatar ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const otherDbCourses = (
    await Course.find({
      slug: { $ne: params.slug },
      $or: [{ published: true }, { upcoming: true }],
    })
      .sort({ createdAt: -1 })
      .limit(4)
  ).map((c) => ({
    id: c._id.toString(),
    slug: c.slug,
    title: c.title,
    badge: c.badge ?? "",
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    price: c.price ?? 0,
    currency: c.currency ?? "USD",
    image: c.image ?? null,
    level: c.level ?? "",
    upcoming: c.upcoming ?? false,
    averageRating: c.averageRating ?? 0,
    modules: (c.modules ?? []).map((m) => ({
      title: m.title,
      lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
    })),
  })) as DbCourse[];

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
            .filter((p) => p.slug !== params.slug && !p.hasDb)
            .map((p) => (
              <ProgramCard key={p.slug} p={p} />
            ))}
          {otherDbCourses.map((c) => (
            <DbCourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {details ? (
        <>
          {/* Product section */}
          <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto">
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
                  <div className="rounded-lg border border-line bg-white overflow-hidden">
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
                    <div className="rounded-lg border border-line bg-white overflow-hidden">
                      <div className="grid sm:grid-cols-[220px_1fr] gap-6 p-6 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={details.book.image}
                          alt={details.book.title}
                          className="w-full max-w-[220px] mx-auto rounded-lg aspect-[3/4] object-cover"
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
                  <div className="rounded-lg border border-line bg-white overflow-hidden">
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
                  <div className="rounded-lg border border-line bg-white overflow-hidden">
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
          </section>

          {/* Reviews */}
          {program.hasDb && course ? (
            <section id="reviews" className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
              <SectionHeading
                eyebrow="RATINGS & REVIEWS"
                title="What students say"
                desc={
                  liveReviewItems.length > 0
                    ? `Showing ${liveReviewItems.length} review${liveReviewItems.length === 1 ? "" : "s"}`
                    : "Be the first to review this course."
                }
              />

              {liveReviewItems.length > 0 && (
                <div className="mb-8 flex items-center gap-4 p-5 rounded-lg border bg-white" style={{ borderColor: "var(--line)" }}>
                  <div className="text-center pr-6 border-r" style={{ borderColor: "var(--line)" }}>
                    <div className="text-[36px] font-bold leading-none" style={{ color: "var(--ink)" }}>
                      {(course.averageRating ?? 0).toFixed(1)}
                    </div>
                    <div className="mt-2">
                      <Stars value={course.averageRating ?? 0} size={14} />
                    </div>
                    <div className="text-[12px] mt-1.5" style={{ color: "var(--body)" }}>
                      {liveReviewItems.length} review{liveReviewItems.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = liveReviewItems.filter((r) => Math.round(r.rating) === star).length;
                      const pct = liveReviewItems.length > 0 ? (count / liveReviewItems.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-[12px]">
                          <span className="w-3 text-right" style={{ color: "var(--body)" }}>{star}</span>
                          <Star className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} strokeWidth={1.5} />
                          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#F59E0B" }} />
                          </div>
                          <span className="w-6 text-right" style={{ color: "var(--body)" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <ReviewForm
                  courseId={course._id.toString()}
                  existingReview={userReviewDoc ? { id: userReviewDoc._id.toString(), rating: userReviewDoc.rating, text: userReviewDoc.text } : null}
                />
              </div>

              {liveReviewItems.length > 0 && (
                <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
                  {liveReviewItems.map((review, i) => (
                    <div key={review.id} className={i > 0 ? "border-t" : ""} style={{ borderColor: "var(--line)" }}>
                      <ReviewCard review={{
                        name: review.userName,
                        rating: review.rating,
                        date: new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                        text: review.text,
                        helpful: 0,
                        verified: false,
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : details.reviews?.length ? (
            <section id="reviews" className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
              <SectionHeading
                eyebrow="RATINGS & REVIEWS"
                title="What students say"
                desc="Real experiences from enrollees who prepared their study visa application with the Blueprint."
              />
              <div className="rounded-lg border border-line bg-white overflow-hidden">
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
