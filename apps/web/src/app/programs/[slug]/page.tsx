import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { type DbCourse } from "@/components/programs/db-course-card";
import {
  RelatedProgramCard,
  type RelatedProgram,
} from "@/components/programs/related-program-card";
import { getProgram, staticProgramsWithoutDbCourse } from "@/lib/programs";
import { displayEnrollmentCount } from "@/lib/enrollment-display";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { priceTextFor, cleanPrices, formatMoney } from "@/lib/pricing";
import { publicCoursePricing } from "@/lib/course-discount";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseReview } from "@/lib/models/course-review";
import { readSession } from "@/lib/auth/session";
import {
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Eye,
  Lock,
  Maximize2,
  Pause,
  ShieldCheck,
  Star,
  Target,
  Volume2,
  Zap,
} from "lucide-react";
import type { CourseDoc } from "@/lib/models/course";
import { CheckoutForm } from "@/components/programs/checkout-form";
import { WaitlistForm } from "@/components/programs/waitlist-form";
import {
  courseDetails,
  type ComparisonSection,
  type CurriculumSection,
  type Faq,
  type PricingSection,
  type StepsSection,
  type TargetBand,
} from "./course-data";
import { BengaliText } from "@/components/bengali-text";
import { ReviewsSection, type ReviewItem } from "@/components/programs/reviews-section";

type Props = { params: { slug: string } };

export const dynamic = "force-dynamic";

type CourseCta = {
  courseId?: string;
  slug: string;
  enrolled: boolean;
  paid: boolean;
  hasDb?: boolean;
};

const getReviewsCached = unstable_cache(
  async (courseId: string) => {
    const reviews = await CourseReview.find({ course: courseId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      text: r.text,
      userName: (r.user as any)?.name ?? "Anonymous",
      userAvatar: (r.user as any)?.avatar ?? null,
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    })) as ReviewItem[];
  },
  ["program-course-reviews"],
  { revalidate: 60 },
);

const getOtherDbCoursesCached = unstable_cache(
  async (slug: string) => {
    const [otherEnrollCounts, dbCourses] = await Promise.all([
      CourseEnrollment.aggregate([{ $group: { _id: "$course", count: { $sum: 1 } } }]),
      Course.find({
        slug: { $ne: slug },
        $or: [{ published: true }, { upcoming: true }],
      })
        .sort({ createdAt: -1 })
        .limit(4),
    ]);
    const enrollMap = new Map(otherEnrollCounts.map((r) => [r._id.toString(), r.count as number]));
    return dbCourses.map((c) => {
      const courseId = c._id.toString();
      const pricing = publicCoursePricing(c);
      return {
        id: courseId,
        slug: c.slug,
        title: c.title,
        badge: c.badge ?? "",
        subtitle: c.subtitle ?? "",
        description: c.description ?? "",
        price: c.price ?? 0,
        currency: c.currency ?? "USD",
        prices: pricing.prices,
        originalPrice: pricing.originalPrice ?? undefined,
        image: c.image ?? null,
        level: c.level ?? "",
        upcoming: c.upcoming ?? false,
        averageRating: c.averageRating ?? 0,
        enrollmentCount: displayEnrollmentCount(c.slug, enrollMap.get(courseId) ?? 0),
        modules: (c.modules ?? []).map((m) => ({
          title: m.title,
          lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
        })),
      } as DbCourse;
    });
  },
  ["program-other-courses"],
  { revalidate: 60 },
);

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
    <path
      d="M5 12H19M19 12L13 6M19 12L13 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-7">
      <div
        className="font-mono text-[11.5px] font-medium tracking-[0.35em] mb-[10px]"
        style={{ color: "var(--brand-2)" }}
      >
        {eyebrow}
      </div>
      <h2
        className="font-semibold tracking-[-0.01em]"
        style={{ fontSize: "clamp(24px,2.6vw,30px)", color: "var(--ink)" }}
      >
        <BengaliText>{title}</BengaliText>
      </h2>
      {desc && (
        <p className="text-[15px] mt-2 max-w-[560px]" style={{ color: "var(--body)" }}>
          <BengaliText>{desc}</BengaliText>
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
  moduleCount,
  chips,
  cta,
  heroPill,
  titleAccent,
  targetBand,
  heroCta,
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
  moduleCount: number;
  chips?: string[];
  cta?: CourseCta;
  heroPill?: string;
  titleAccent?: string;
  targetBand?: TargetBand;
  heroCta?: { label: string; href: string };
}) {
  return (
    <section
      className="course-page-hero pt-[150px] px-[clamp(20px,4.5vw,56px)] pb-[70px] relative"
      style={{ background: "#fff" }}
    >
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.72fr] gap-[50px] items-center">
        <div>
          <div className="flex items-center gap-2 text-[12.5px] font-medium mb-6">
            <Link
              href="/"
              style={{ color: "var(--body)" }}
              className="hover:text-brand-2 transition-colors"
            >
              Home
            </Link>
            <span style={{ color: "var(--body)" }}>/</span>
            <Link
              href="/programs"
              style={{ color: "var(--body)" }}
              className="hover:text-brand-2 transition-colors"
            >
              Programs
            </Link>
            <span style={{ color: "var(--body)" }}>/</span>
            <span style={{ color: "var(--brand-2)" }}>{badge}</span>
          </div>

          {heroPill && (
            <div
              className="inline-flex items-center gap-2 rounded-full border px-[15px] py-[8px] mb-5"
              style={{
                background: "var(--brand-soft)",
                borderColor: "rgba(20,181,126,0.35)",
              }}
            >
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ background: "var(--brand-2)" }}
              />
              <BengaliText>
                <span className="text-[12.5px] font-semibold" style={{ color: "var(--brand-2)" }}>
                  {heroPill}
                </span>
              </BengaliText>
            </div>
          )}

          <p
            className="font-mono text-[11.5px] font-medium tracking-[0.35em] mb-[14px]"
            style={{ color: "var(--brand-2)" }}
          >
            {badge.toUpperCase()} · COURSE
          </p>

          <h1
            className="font-display font-semibold leading-[1.1] tracking-[-0.02em] max-w-[560px]"
            style={{ color: "var(--ink)", fontSize: "clamp(28px,3.4vw,40px)" }}
          >
            <BengaliText>{title}</BengaliText>
            {titleAccent && (
              <BengaliText>
                {" "}
                <span
                  style={{
                    background:
                      "linear-gradient(92deg, var(--brand) 8%, var(--brand-2) 60%, rgba(47,95,224,0.95) 112%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {titleAccent}
                </span>
              </BengaliText>
            )}
            {subtitle && (
              <>
                {" "}
                <BengaliText>{subtitle}</BengaliText>
              </>
            )}
          </h1>

          {rating && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13.5px]">
              <Stars value={rating.average} />
              <span className="font-semibold" style={{ color: "var(--ink)" }}>
                {rating.average}
              </span>
              <span
                className="font-medium underline underline-offset-2"
                style={{ color: "var(--body)" }}
              >
                ({rating.count} reviews)
              </span>
            </a>
          )}

          {price && (
            <div className="mt-[22px] pt-[20px] border-t border-line">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-[32px] font-bold leading-none"
                  style={{ color: "var(--ink)" }}
                >
                  {price}
                </span>
                {originalPrice && (
                  <span
                    className="text-[16px] font-medium line-through"
                    style={{ color: "var(--body)", opacity: 0.65 }}
                  >
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
                <div
                  className="mt-[10px] flex items-center gap-1.5 text-[13px] font-medium"
                  style={{ color: "var(--brand-2)" }}
                >
                  <Clock className="w-4 h-4" />
                  {access} · One-time payment
                </div>
              )}
            </div>
          )}

          <p
            className="mt-[18px] max-w-[460px] text-[15px] leading-[1.7]"
            style={{ color: "var(--body)" }}
          >
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
            ) : heroCta ? (
              <a
                href={heroCta.href}
                className="browse-btn inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full px-[30px] py-[15px] flex-1 sm:flex-none sm:min-w-[190px]"
                style={{ background: "var(--brand)" }}
              >
                <BengaliText>{heroCta.label}</BengaliText>
                {arrow}
              </a>
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

          <div
            className="flex items-center gap-4 mt-5 flex-wrap text-[12.5px] font-medium"
            style={{ color: "var(--body)" }}
          >
            {(chips ?? ["Instant access", "Live support"]).map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check
                  className="w-3.5 h-3.5"
                  strokeWidth={3}
                  style={{ color: "var(--brand-2)" }}
                />
                <BengaliText>{t}</BengaliText>
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-7">
          {targetBand && (
            <div
              className="relative w-[168px] h-[168px] rounded-full flex items-center justify-center shrink-0"
              style={{
                background:
                  "radial-gradient(circle at 32% 22%, #16335C 0%, #0B2545 55%, #080B10 100%)",
                border: "1.5px solid rgba(20,181,126,0.55)",
                boxShadow: "0 28px 54px -26px rgba(8,11,16,0.75)",
              }}
            >
              <div
                className="absolute inset-[9px] rounded-full"
                style={{ border: "1px solid rgba(20,181,126,0.28)" }}
              />
              <div className="text-center">
                <div
                  className="font-mono text-[10px] font-bold tracking-[0.24em]"
                  style={{ color: "#8CA0B8" }}
                >
                  {targetBand.label}
                </div>
                <div className="font-display text-[34px] font-semibold text-white leading-tight mt-[2px]">
                  {targetBand.value}
                </div>
                <div
                  className="mx-auto my-[7px] h-px w-8"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                />
                <div
                  className="font-mono text-[10px] tracking-[0.2em]"
                  style={{ color: "#8CA0B8" }}
                >
                  {targetBand.sub}
                </div>
              </div>
            </div>
          )}
          <div
            className="w-full max-w-[430px] rounded-lg bg-[#101B31] overflow-hidden"
            style={{ boxShadow: "0 36px 70px -30px rgba(7,14,31,0.65)" }}
          >
            {/* Player screen */}
            <div
              className="relative h-[200px]"
              style={{
                background: "linear-gradient(160deg, #0E2A4E 0%, #14524C 55%, #0B5E46 120%)",
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
                  {lessonCount} LESSONS · {moduleCount} MODULES
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
                <span className="text-[11.5px] font-medium text-white/75">Intro video · 01:24</span>
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

const STEP_ICONS = [Eye, Target, Zap];

const PAYMENT_COLORS: Record<string, string> = {
  bKash: "#E2136E",
  Nagad: "#F5821F",
  Rocket: "#8C3494",
  Stripe: "#635BFF",
};

function HeroStatStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] pt-[6px] pb-[6px]">
      <div className="max-w-[1320px] mx-auto">
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden"
          style={{ background: "#22304F" }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-6" style={{ background: "var(--ink)" }}>
              <div
                className="font-display text-[30px] font-semibold leading-none"
                style={{ color: "var(--brand-2)" }}
              >
                {stat.value}
              </div>
              <div className="text-[13px] mt-[7px] leading-snug" style={{ color: "#B7C4D6" }}>
                <BengaliText>{stat.label}</BengaliText>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection({ problem }: { problem: { title: string; desc: string } }) {
  return (
    <div className="border-y py-12 text-center" style={{ borderColor: "var(--line)" }}>
      <h2
        className="font-display font-semibold leading-[1.35] mx-auto max-w-[780px]"
        style={{ fontSize: "clamp(23px,2.8vw,31px)", color: "var(--ink)" }}
      >
        <BengaliText>{problem.title}</BengaliText>
      </h2>
      <p
        className="mt-5 mx-auto max-w-[780px] text-[15px] leading-[1.85]"
        style={{ color: "var(--body)" }}
      >
        <BengaliText>{problem.desc}</BengaliText>
      </p>
    </div>
  );
}

function StepsSection({ steps }: { steps: StepsSection }) {
  return (
    <div>
      <SectionHeading eyebrow="HOW IT WORKS" title={steps.title} desc={steps.subtitle} />
      <div className="grid sm:grid-cols-3 gap-5">
        {steps.cards.map((card, i) => {
          const Icon = STEP_ICONS[i % STEP_ICONS.length];
          return (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-6"
              style={{ borderColor: "var(--line)" }}
            >
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
              </span>
              <h3
                className="font-display text-[16px] font-semibold leading-[1.35]"
                style={{ color: "var(--ink)" }}
              >
                <BengaliText>{card.title}</BengaliText>
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                <BengaliText>{card.desc}</BengaliText>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DarkCurriculum({ curriculum }: { curriculum: CurriculumSection }) {
  return (
    <section
      id="curriculum"
      className="px-[clamp(20px,4.5vw,56px)] py-[80px]"
      style={{ background: "var(--ink)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          {curriculum.label && (
            <span
              className="inline-flex items-center gap-2 rounded-full border px-[16px] py-[7px] mb-5"
              style={{
                background: "rgba(20,181,126,0.12)",
                borderColor: "rgba(20,181,126,0.32)",
                color: "var(--brand-2)",
              }}
            >
              <span
                className="w-[6px] h-[6px] rounded-full"
                style={{ background: "var(--brand-2)" }}
              />
              <span className="font-mono text-[10.5px] font-semibold tracking-[0.28em] uppercase">
                <BengaliText>{curriculum.label}</BengaliText>
              </span>
            </span>
          )}
          <h2
            className="font-display font-semibold text-white leading-[1.2]"
            style={{ fontSize: "clamp(25px,3vw,36px)" }}
          >
            <BengaliText>{curriculum.title}</BengaliText>
          </h2>
          <p className="mt-3 text-[15px]" style={{ color: "#8CA0B8" }}>
            <BengaliText>{curriculum.subtitle}</BengaliText>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {curriculum.modules.map((m, i) => (
            <div
              key={m.title}
              className="rounded-2xl p-6 md:p-8"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center font-bold text-[15px] shrink-0"
                  style={{ background: "var(--brand)", color: "#052117" }}
                >
                  {i + 1}
                </span>
                <span className="font-display font-semibold text-[17px] text-white">
                  <BengaliText>{m.title}</BengaliText>
                  <span className="font-medium text-[13px] ml-2" style={{ color: "#8CA0B8" }}>
                    · <BengaliText>{m.lessonCount}</BengaliText>
                  </span>
                </span>
              </div>
              <ul className="flex flex-col gap-[13px]">
                {m.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-[1.6]"
                    style={{ color: "#C4D0DE" }}
                  >
                    <span
                      className="mt-[8px] w-[5px] h-[5px] rounded-full shrink-0"
                      style={{ background: "var(--brand-2)" }}
                    />
                    <BengaliText>{item}</BengaliText>
                  </li>
                ))}
                <li
                  className="flex items-start gap-2.5 text-[14px] font-semibold leading-[1.6]"
                  style={{ color: "var(--brand-2)" }}
                >
                  <Check className="w-4 h-4 mt-[2px] shrink-0" strokeWidth={3} />
                  <BengaliText>ক্যাপস্টোন: {m.capstone}</BengaliText>
                </li>
              </ul>
            </div>
          ))}
        </div>

        {curriculum.note && (
          <div
            className="mt-9 rounded-2xl px-6 md:px-8 py-6"
            style={{
              background: "rgba(20,181,126,0.06)",
              border: "1px solid rgba(20,181,126,0.25)",
            }}
          >
            <p className="text-[14.5px] leading-[1.7]" style={{ color: "#C4D0DE" }}>
              <BengaliText>{curriculum.note}</BengaliText>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ComparisonSection({ comparison }: { comparison: ComparisonSection }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[80px]">
      <div className="max-w-[1000px] mx-auto">
        <h2
          className="text-center font-display font-semibold mb-10"
          style={{ fontSize: "clamp(23px,2.8vw,32px)", color: "var(--ink)" }}
        >
          <BengaliText>{comparison.title}</BengaliText>
        </h2>
        <div
          className="rounded-2xl border overflow-hidden bg-white"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="grid grid-cols-2">
            <div
              className="px-5 md:px-8 py-6"
              style={{ background: "var(--bg-soft)", borderRight: "1px solid var(--line)" }}
            >
              <span
                className="text-[13px] font-bold tracking-[0.3px]"
                style={{ color: "var(--body)" }}
              >
                <BengaliText>{comparison.leftLabel}</BengaliText>
              </span>
            </div>
            <div className="px-5 md:px-8 py-6" style={{ background: "rgba(20,181,126,0.10)" }}>
              <span
                className="text-[13px] font-bold tracking-[0.3px]"
                style={{ color: "var(--brand-2)" }}
              >
                <BengaliText>{comparison.rightLabel}</BengaliText>
              </span>
            </div>
          </div>
          {comparison.rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              <div
                className="px-5 md:px-8 py-5 text-[14px] leading-[1.6]"
                style={{ borderRight: "1px solid var(--line)", color: "var(--body)" }}
              >
                <BengaliText>{row.left}</BengaliText>
              </div>
              <div
                className="px-5 md:px-8 py-5 text-[14px] font-medium leading-[1.6]"
                style={{ color: "var(--ink)", background: "rgba(20,181,126,0.04)" }}
              >
                <BengaliText>{row.right}</BengaliText>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ pricing }: { pricing: PricingSection }) {
  return (
    <section
      id="pricing"
      className="px-[clamp(20px,4.5vw,56px)] py-[90px] text-center"
      style={{ background: "linear-gradient(160deg, #122043 0%, #080B10 100%)" }}
    >
      <div className="max-w-[640px] mx-auto">
        <h2
          className="font-display font-semibold text-white leading-[1.25]"
          style={{ fontSize: "clamp(25px,3vw,34px)" }}
        >
          <BengaliText>{pricing.title}</BengaliText>
        </h2>
        {pricing.subtitle && (
          <p className="mt-3 text-[15px]" style={{ color: "#8CA0B8" }}>
            <BengaliText>{pricing.subtitle}</BengaliText>
          </p>
        )}

        <div
          className="mt-10 mx-auto max-w-[420px] rounded-3xl px-8 py-11"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(20,181,126,0.32)",
          }}
        >
          <div
            className="font-display font-semibold text-white"
            style={{ fontSize: "clamp(28px,4vw,40px)" }}
          >
            <BengaliText>{pricing.price}</BengaliText>
          </div>
          {pricing.note && (
            <div className="mt-2 mb-8 text-[14px]" style={{ color: "#8CA0B8" }}>
              <BengaliText>{pricing.note}</BengaliText>
            </div>
          )}
          <a
            href={pricing.ctaHref}
            className="browse-btn w-full inline-flex items-center justify-center gap-2.5 font-semibold text-[15px] rounded-full px-8 py-[17px]"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            <BengaliText>{pricing.ctaLabel}</BengaliText>
            {arrow}
          </a>
          {pricing.includedLine && (
            <>
              <div className="my-6 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="text-[13px]" style={{ color: "#8CA0B8" }}>
                <BengaliText>{pricing.includedLine}</BengaliText>
              </div>
            </>
          )}
        </div>

        {pricing.paymentMethods?.length ? (
          <div className="mt-11">
            {pricing.paymentLabel && (
              <div className="text-[13px] mb-4 tracking-[0.3px]" style={{ color: "#8CA0B8" }}>
                <BengaliText>{pricing.paymentLabel}</BengaliText>
              </div>
            )}
            <div className="flex justify-center gap-4 flex-wrap">
              {pricing.paymentMethods.map((name) => (
                <span
                  key={name}
                  className="rounded-xl px-6 py-3 text-[15px] font-extrabold"
                  style={{ background: "#fff", color: PAYMENT_COLORS[name] ?? "#334155" }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <section id="faq" className="px-[clamp(20px,4.5vw,56px)] py-[80px]">
      <div className="max-w-[800px] mx-auto">
        <h2
          className="text-center font-display font-semibold mb-10"
          style={{ fontSize: "clamp(23px,2.8vw,32px)", color: "var(--ink)" }}
        >
          <BengaliText>সচরাচর জিজ্ঞাসা</BengaliText>
        </h2>
        <div className="flex flex-col gap-3.5">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="faq-item rounded-2xl border bg-white px-6 md:px-7 py-5"
              style={{ borderColor: "var(--line)" }}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer">
                <span
                  className="font-display font-semibold text-[16px] leading-[1.4]"
                  style={{ color: "var(--ink)" }}
                >
                  <BengaliText>{faq.q}</BengaliText>
                </span>
                <ChevronDown
                  className="faq-chev w-5 h-5 shrink-0 transition-transform duration-200"
                  style={{ color: "var(--brand-2)" }}
                />
              </summary>
              <p className="mt-3 text-[14.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                <BengaliText>{faq.a}</BengaliText>
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function RefundPolicySection() {
  const facts = [
    { value: "৩ দিন", label: "রিফান্ড উইন্ডো" },
    { value: "১০০%", label: "টাকা ফেরত" },
    { value: "৭–১৫", label: "কার্যদিবসে টাকা পাবেন" },
  ];

  return (
    <section
      id="refund"
      className="px-[clamp(20px,4.5vw,56px)] py-[80px]"
      style={{ background: "var(--bg-soft)" }}
    >
      <div className="max-w-[1000px] mx-auto">
        <div
          className="rounded-2xl border bg-white p-8 md:p-12"
          style={{ borderColor: "var(--line)", boxShadow: "0 30px 60px -40px rgba(18,32,67,0.22)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-10 md:gap-14 items-start">
            <div>
              <SectionHeading
                eyebrow="REFUND POLICY"
                title="কোর্সটা ভালো না লাগলে ৩ দিনে ১০০% টাকা ফেরত"
                desc="কেনার ৩ দিনের মধ্যে যেকোনো কারণে কোর্সটা যদি আপনার পছন্দ না হয়, রিফান্ড দাবি করলেই পুরো টাকা ফেরত পাবেন। কোনো ঝামেলা নেই, কোনো প্রশ্ন নেই।"
              />
              <div className="grid grid-cols-3 gap-4">
                {facts.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-xl px-3 py-4 text-center"
                    style={{
                      background: "var(--brand-soft)",
                      border: "1px solid rgba(20,181,126,0.25)",
                    }}
                  >
                    <div
                      className="font-display text-[clamp(20px,2.4vw,28px)] font-bold leading-none"
                      style={{ color: "var(--brand-2)" }}
                    >
                      <BengaliText>{f.value}</BengaliText>
                    </div>
                    <div
                      className="mt-2 text-[12.5px] leading-[1.5]"
                      style={{ color: "var(--body)" }}
                    >
                      <BengaliText>{f.label}</BengaliText>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/refund"
                className="inline-flex items-center gap-2 mt-8 text-[14.5px] font-semibold"
                style={{ color: "var(--brand-2)" }}
              >
                <BengaliText>সম্পূর্ণ রিফান্ড পলিসি দেখুন</BengaliText>
                {arrow}
              </Link>
            </div>

            <div
              className="rounded-2xl px-6 py-7 flex flex-col gap-5"
              style={{ border: "1px dashed var(--line)", background: "var(--brand-soft)" }}
            >
              {[
                "কেনার ৩ দিনের মধ্যে রিফান্ড দাবি করুন",
                "অনুমোদনের পর ১০০% টাকা ফেরত পাবেন",
                "টাকা ফেরত আসতে ৭–১৫ কার্যদিবস লাগে",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <span
                    className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 mt-[2px]"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    <Check className="w-[11px] h-[11px]" strokeWidth={3} />
                  </span>
                  <p className="text-[15px] leading-[1.7]" style={{ color: "var(--ink)" }}>
                    <BengaliText>{t}</BengaliText>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta({
  cta,
  pricing,
}: {
  cta: { title: string; desc: string };
  pricing?: PricingSection;
}) {
  return (
    <section
      id="waitlist"
      className="px-[clamp(20px,4.5vw,56px)] py-[90px] text-center"
      style={{ background: "var(--ink)" }}
    >
      <div className="max-w-[720px] mx-auto">
        <h2
          className="font-display font-semibold text-white leading-[1.3]"
          style={{ fontSize: "clamp(25px,3.4vw,38px)" }}
        >
          <BengaliText>{cta.title}</BengaliText>
        </h2>
        <p className="mt-4 text-[16px]" style={{ color: "var(--brand-2)" }}>
          <BengaliText>{cta.desc}</BengaliText>
        </p>
        <a
          href={pricing?.ctaHref ?? "/programs"}
          className="browse-btn mt-10 inline-flex items-center gap-2.5 font-semibold text-[16px] rounded-full px-11 py-[18px]"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          <BengaliText>{pricing?.ctaLabel ?? "Browse programs"}</BengaliText>
          {arrow}
        </a>
        {pricing?.includedLine && (
          <div className="mt-7 text-[13px]" style={{ color: "#64748B" }}>
            <BengaliText>{pricing.includedLine}</BengaliText>
          </div>
        )}
      </div>
    </section>
  );
}

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
  const canAccessMaterials = isFree || enrolled;
  const pricing = publicCoursePricing(course);

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
    prices: pricing.prices,
    originalPrice: pricing.configured
      ? (pricing.originalPrice ?? undefined)
      : (courseDetails[course.slug]?.originalPrice ?? undefined),
    discountLabel: pricing.discountLabel,
    level: course.level ?? "",
    language: course.language ?? "",
    pace: course.pace ?? "",
    upcoming: course.upcoming === true,
    waitlistEnabled: course.waitlistEnabled === true,
    wishlistDiscountPercent: course.wishlistDiscountPercent ?? 0,
  };

  return (
    <div className="checkout-page">
      <Nav />

      {/* Breadcrumb */}
      <div className="px-[clamp(20px,4.5vw,56px)] pt-[120px] pb-4 max-w-[1320px] mx-auto">
        <div className="flex items-center gap-2 text-[12.5px] font-medium">
          <Link
            href="/"
            style={{ color: "var(--body)" }}
            className="hover:text-brand-2 transition-colors"
          >
            Home
          </Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <Link
            href="/programs"
            style={{ color: "var(--body)" }}
            className="hover:text-brand-2 transition-colors"
          >
            Programs
          </Link>
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
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0FA968"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h2
                className="font-display text-[22px] font-semibold"
                style={{ color: "var(--ink)" }}
              >
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
                        <Image
                          src={checkoutCourse.image}
                          alt={checkoutCourse.title}
                          fill
                          sizes="200px"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(18,32,67,0.18), transparent 50%)",
                          }}
                        />
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
                    <h1
                      className="font-display text-[19px] font-semibold leading-[1.3]"
                      style={{ color: "var(--ink)" }}
                    >
                      <BengaliText>{checkoutCourse.title}</BengaliText>
                      {checkoutCourse.subtitle && (
                        <>
                          {" "}
                          <BengaliText>{checkoutCourse.subtitle}</BengaliText>
                        </>
                      )}
                    </h1>
                    {(checkoutCourse.level || checkoutCourse.language) && (
                      <div
                        className="mt-2 flex items-center gap-2 text-[12px] font-medium"
                        style={{ color: "var(--body)" }}
                      >
                        {checkoutCourse.level && <span>{checkoutCourse.level}</span>}
                        {checkoutCourse.language && (
                          <>
                            {checkoutCourse.level && <span>·</span>}
                            <span>{checkoutCourse.language}</span>
                          </>
                        )}
                      </div>
                    )}
                    {checkoutCourse.description && (
                      <p
                        className="mt-2 text-[13px] leading-[1.6] line-clamp-2"
                        style={{ color: "var(--body)" }}
                      >
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
                  <p
                    className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-5"
                    style={{ color: "var(--body)" }}
                  >
                    Order summary
                  </p>

                  {/* Line item */}
                  <div className="flex gap-4 pb-5 border-b" style={{ borderColor: "var(--line)" }}>
                    <div
                      className="w-[64px] h-[64px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: "var(--brand-soft)" }}
                    >
                      {checkoutCourse.image ? (
                        <Image
                          src={checkoutCourse.image}
                          alt=""
                          width={128}
                          height={128}
                          sizes="64px"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen size={20} className="text-white/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[14px] font-semibold leading-snug"
                        style={{ color: "var(--ink)" }}
                      >
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
                        {isFree ? "Free" : priceTextFor(checkoutCourse, "BDT")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span style={{ color: "var(--body)" }}>Tax</span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>
                        0.00
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      Total
                    </span>
                    <span
                      className="text-[22px] font-bold leading-none"
                      style={{ color: "var(--ink)" }}
                    >
                      {isFree ? "Free" : priceTextFor(checkoutCourse, "BDT")}
                    </span>
                  </div>

                  {checkoutCourse.upcoming &&
                    (checkoutCourse.waitlistEnabled ? (
                      <div className="mt-5" id="waitlist">
                        <WaitlistForm
                          slug={checkoutCourse.slug}
                          title={checkoutCourse.title}
                          discountPercent={checkoutCourse.wishlistDiscountPercent}
                        />
                      </div>
                    ) : (
                      <div
                        className="mt-4 text-center text-[13px] font-medium py-2.5 rounded-xl"
                        style={{ background: "rgba(111,76,224,0.08)", color: "#6B4CE0" }}
                      >
                        This course is coming soon — join the waitlist to be notified.
                      </div>
                    ))}
                </div>

                {/* What's included */}
                <div className="px-6 pb-6 pt-5 border-t" style={{ borderColor: "var(--line)" }}>
                  <p
                    className="text-[11.5px] font-semibold uppercase tracking-[0.08em] mb-3"
                    style={{ color: "var(--body)" }}
                  >
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
                      { icon: Lock, label: "SSL Encrypted", href: undefined },
                      { icon: ShieldCheck, label: "3-day refund policy", href: "/refund" },
                      { icon: Zap, label: "Instant access", href: undefined },
                    ].map(({ icon: Icon, label, href }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5">
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        {href ? (
                          <a
                            href={href}
                            className="text-[10.5px] font-medium leading-tight underline underline-offset-2"
                            style={{ color: "var(--body)" }}
                          >
                            {label}
                          </a>
                        ) : (
                          <span
                            className="text-[10.5px] font-medium leading-tight"
                            style={{ color: "var(--body)" }}
                          >
                            {label}
                          </span>
                        )}
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
                    <h3
                      className="text-[14px] font-semibold leading-tight truncate"
                      style={{ color: "var(--ink)" }}
                    >
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--body)" }}>
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
                {canAccessMaterials ? (
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium rounded-lg border px-4 py-2 transition-all duration-200 hover:border-brand-2 hover:text-brand-2"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 18 15 15" />
                    </svg>
                    Download PDF
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium rounded-lg border px-4 py-2"
                    style={{
                      color: "var(--body)",
                      borderColor: "var(--line)",
                      cursor: "not-allowed",
                    }}
                  >
                    <Lock size={13} />
                    Enroll to download
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews section */}
      <ReviewsSection
        courseId={course._id.toString()}
        reviews={reviews}
        totalReviews={totalReviews}
        averageRating={course.averageRating ?? 0}
        userReview={userReview}
      />

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

  if (program?.hidden) notFound();

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
      getReviewsCached(course._id.toString()),
      session?.userId
        ? CourseReview.findOne({ course: course._id, user: session.userId }).lean()
        : null,
    ]);

    const reviewItems = reviews;

    return (
      <DbCoursePage
        course={course}
        enrolled={Boolean(enrolled)}
        reviews={reviewItems}
        totalReviews={course.reviewCount ?? 0}
        userReview={
          userReviewDoc
            ? {
                id: userReviewDoc._id.toString(),
                rating: userReviewDoc.rating,
                text: userReviewDoc.text,
              }
            : null
        }
      />
    );
  }

  const details = courseDetails[params.slug];
  const lessonCount = details ? details.modules.reduce((n, m) => n + m.lessons.length, 0) : 30;
  const moduleCount = details ? details.modules.length : 0;

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
  const [liveReviews, userReviewDoc] =
    program.hasDb && course
      ? await Promise.all([
          getReviewsCached(course._id.toString()),
          sessionForReviews?.userId
            ? CourseReview.findOne({ course: course._id, user: sessionForReviews.userId }).lean()
            : null,
        ])
      : [[], null];
  const liveReviewItems = liveReviews;

  const otherDbCourses = await getOtherDbCoursesCached(params.slug);

  const relatedPrograms: RelatedProgram[] = [
    ...staticProgramsWithoutDbCourse(otherDbCourses)
      .filter((p) => p.slug !== params.slug)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        badge: p.badge,
        badgeColor: p.badgeColor,
        bg: p.bg,
        image: p.image ?? null,
        sub: p.upcoming ? "Coming soon" : (p.price ?? "Explore course"),
        originalSub: p.upcoming ? undefined : p.originalPrice,
      })),
    ...otherDbCourses.map((c) => ({
      slug: c.slug,
      title: c.title,
      badge: c.badge || "COURSE",
      badgeColor: "var(--brand)",
      bg: "var(--brand-soft)",
      image: c.image,
      sub: c.upcoming
        ? "Coming soon"
        : c.prices?.BDT != null && c.prices.BDT > 0
          ? formatMoney(c.prices.BDT, "BDT")
          : c.subtitle || c.description || "Explore course",
      originalSub: c.upcoming ? undefined : c.originalPrice,
    })),
  ].slice(0, 6);

  return (
    <div className="course-page">
      <Nav />

      <CourseHero
        badge={program.badge}
        title={details?.title ?? program.title}
        subtitle={details?.subtitle}
        desc={details?.desc ?? program.desc}
        price={details?.price ?? details?.pricing?.price}
        originalPrice={details?.originalPrice}
        savings={details?.savings}
        access={details?.access}
        rating={
          details?.rating
            ? { average: details.rating.average, count: details.rating.count }
            : undefined
        }
        lessonCount={lessonCount}
        moduleCount={moduleCount}
        chips={details?.chips}
        cta={cta}
        heroPill={details?.heroPill}
        titleAccent={details?.titleAccent}
        targetBand={details?.targetBand}
        heroCta={details?.heroCta}
      />

      {details?.heroStats?.length ? <HeroStatStrip stats={details.heroStats} /> : null}

      {details ? (
        <>
          {/* Product + sidebar rail */}
          <section className="px-[clamp(20px,4.5vw,56px)] pb-[90px] max-w-[1320px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-12 items-start">
              <div className="space-y-12 min-w-0">
                {/* Facilities */}
                {!details.heroStats?.length && (
                  <div className="border-y border-line py-6 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                    {details.stats.map((stat) => (
                      <div key={stat.label} className="flex items-baseline gap-2.5">
                        <span
                          className="font-mono text-[22px] font-medium leading-none"
                          style={{ color: "var(--ink)" }}
                        >
                          {stat.value}
                        </span>
                        <span className="text-[13px]" style={{ color: "var(--body)" }}>
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Problem */}
                {details.problem && <ProblemSection problem={details.problem} />}

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
                    {(details.features ?? BLUEPRINT_FEATURES).map(
                      ({ icon: Icon, title, desc }, i) => (
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
                            <h3
                              className="text-[14.5px] font-semibold leading-[1.3]"
                              style={{ color: "var(--ink)" }}
                            >
                              {title}
                            </h3>
                            <p
                              className="text-[13px] mt-[5px] leading-[1.55]"
                              style={{ color: "var(--body)" }}
                            >
                              {desc}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Steps */}
                {details.steps && <StepsSection steps={details.steps} />}

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
                        <Image
                          src={details.book.image}
                          alt={details.book.title}
                          width={440}
                          height={586}
                          sizes="220px"
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
                          <h3
                            className="font-display text-[17px] font-semibold leading-snug"
                            style={{ color: "var(--ink)" }}
                          >
                            {details.book.title}
                          </h3>
                          <p
                            className="text-[13.5px] leading-[1.7]"
                            style={{ color: "var(--body)" }}
                          >
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
                          <div
                            className="text-[14px] font-medium leading-[1.5]"
                            style={{ color: "var(--ink)" }}
                          >
                            {o.title}
                          </div>
                          {o.desc && (
                            <div
                              className="text-[13px] mt-[3px] leading-[1.6]"
                              style={{ color: "var(--body)" }}
                            >
                              {o.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curriculum (simple highlights) */}
                {!details.curriculum && (
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
                      {(
                        details.highlights ?? [
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
                        ]
                      ).map((item, i) => (
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
                            <div
                              className="text-[14.5px] font-medium leading-[1.3]"
                              style={{ color: "var(--ink)" }}
                            >
                              {item.title}
                            </div>
                            <div
                              className="text-[12.5px] mt-[2px]"
                              style={{ color: "var(--body)" }}
                            >
                              {item.sub}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar — other programs */}
              <aside className="lg:sticky lg:top-[100px] flex flex-col gap-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div
                      className="font-mono text-[10.5px] font-semibold tracking-[0.3em] mb-2"
                      style={{ color: "var(--brand-2)" }}
                    >
                      EXPLORE
                    </div>
                    <h3
                      className="font-display font-semibold leading-[1.2]"
                      style={{ fontSize: "20px", color: "var(--ink)" }}
                    >
                      Other programs you may like
                    </h3>
                  </div>
                  <Link
                    href="/programs"
                    className="view-all font-semibold text-[13px] inline-flex items-center gap-[5px] shrink-0 mb-[2px]"
                    style={{ color: "var(--brand-2)" }}
                  >
                    View all
                    <svg
                      className="w-[13px] h-[13px] transition-transform duration-250 group-hover:translate-x-[3px]"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 12H19M19 12L13 6M19 12L13 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  {relatedPrograms.map((p) => (
                    <RelatedProgramCard key={p.slug} p={p} />
                  ))}
                </div>
              </aside>
            </div>
          </section>

          {details.curriculum && <DarkCurriculum curriculum={details.curriculum} />}

          {details.comparison && <ComparisonSection comparison={details.comparison} />}

          {/* Reviews */}
          {program.hasDb && course ? (
            <ReviewsSection
              courseId={course._id.toString()}
              reviews={liveReviewItems}
              totalReviews={liveReviewItems.length}
              averageRating={course.averageRating ?? 0}
              userReview={
                userReviewDoc
                  ? {
                      id: userReviewDoc._id.toString(),
                      rating: userReviewDoc.rating,
                      text: userReviewDoc.text,
                    }
                  : null
              }
            />
          ) : details.reviews?.length ? (
            <ReviewsSection
              reviews={(details.reviews ?? []).map((review, i) => ({
                id: `${review.name}-${i}`,
                userName: review.name,
                rating: review.rating,
                text: review.text,
                date: review.date,
                helpful: review.helpful,
                verified: review.verified,
              }))}
              totalReviews={details.reviews?.length ?? 0}
              averageRating={details.rating?.average ?? 0}
            />
          ) : null}

          {details.slug === "ielts-band-score-machine" && <RefundPolicySection />}

          {details.pricing && <PricingSection pricing={details.pricing} />}

          {details.faqs?.length ? <FaqSection faqs={details.faqs} /> : null}

          {details.cta && details.pricing && (
            <FinalCta cta={details.cta} pricing={details.pricing} />
          )}
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
        details.faq-item summary { list-style: none; }
        details.faq-item[open] .faq-chev { transform: rotate(180deg); }
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
