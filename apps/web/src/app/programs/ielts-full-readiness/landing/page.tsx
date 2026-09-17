import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { type DbCourse } from "@/components/programs/db-course-card";
import { RelatedProgramCardLanding, type RelatedProgramLanding } from "@/components/programs/related-program-card-landing";
import { getProgram, programs } from "@/lib/programs";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { formatPriceText, cleanPrices } from "@/lib/pricing";
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
  FileText,
  Gift,
  GraduationCap,
  Lock,
  Mic,
  ShieldCheck,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { CourseDoc } from "@/lib/models/course";
import { CheckoutForm } from "@/components/programs/checkout-form";
import {
  courseDetails,
  type ComparisonSection,
  type CourseBook,
  type CourseDetails,
  type CourseFeature,
  type CurriculumSection,
  type Faq,
  type PricingSection,
  type StepsSection,
  type TargetBand,
} from "../../[slug]/course-data";
import { BengaliText } from "@/components/bengali-text";
import { ReviewsSection, type ReviewItem } from "@/components/programs/reviews-section";
import { WaitlistForm } from "@/components/programs/waitlist-form";
import { WISHLIST_DISCOUNT_PERCENT } from "@/lib/wishlist";

const SLUG = "ielts-full-readiness";

export const dynamic = "force-dynamic";

type CourseCta = {
  courseId?: string;
  slug: string;
  enrolled: boolean;
  paid: boolean;
  hasDb?: boolean;
};

export async function generateMetadata(): Promise<Metadata> {
  const program = getProgram(SLUG);
  const details = courseDetails[SLUG];
  const title = `${details?.title ?? program?.title ?? "Program"} | FlyBridge Education Group`;
  const description = details?.desc ?? program?.desc;

  let image = program?.image;
  if (!image && program?.hasDb) {
    try {
      await connectDb();
      const course = await Course.findOne({
        slug: SLUG,
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
        url: `/programs/${SLUG}/landing`,
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

const check = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 6L9 17l-5-5"
      stroke="#2E9E6B"
      strokeWidth="2.5"
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
            color: i < filled ? "#7CF0BD" : "#27354D",
            fill: i < filled ? "#7CF0BD" : "transparent",
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

function Pill({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "darkgreen";
}) {
  const styles =
    tone === "green"
      ? {
          background: "rgba(46,158,107,0.1)",
          border: "1px solid rgba(46,158,107,0.35)",
          color: "#0A3D2E",
        }
      : {
          background: "rgba(124,240,189,0.1)",
          border: "1px solid rgba(124,240,189,0.35)",
          color: "var(--brand-2)",
        };
  return (
    <span
      className="font-bengali inline-flex items-center gap-2 rounded-full px-[16px] py-[8px] font-semibold text-[13px] tracking-[0.02em]"
      style={styles}
    >
      {children}
    </span>
  );
}

function TargetBadge({ targetBand }: { targetBand: TargetBand }) {
  return (
    <div
      className="relative w-[196px] h-[196px] rounded-full flex items-center justify-center shrink-0 mx-auto"
      style={{
        background:
          "radial-gradient(circle at 32% 22%, #16335C 0%, #0B2545 55%, #080B10 100%)",
        border: "1.5px solid rgba(124,240,189,0.45)",
        boxShadow: "0 30px 60px -28px rgba(8,11,16,0.85)",
      }}
    >
      <div
        className="absolute inset-[10px] rounded-full"
        style={{ border: "1px solid rgba(124,240,189,0.22)" }}
      />
      <div className="absolute inset-[-14px] rounded-full" style={{ border: "1px solid rgba(124,240,189,0.1)" }} />
      <div className="text-center">
        <div
          className="font-mono text-[10px] font-bold tracking-[0.24em]"
          style={{ color: "#8CA0B8" }}
        >
          <BengaliText>{targetBand.label}</BengaliText>
        </div>
        <div className="font-display text-[40px] font-semibold text-white leading-tight mt-[4px]">
          {targetBand.value}
        </div>
        <div
          className="mx-auto my-[9px] h-px w-9"
          style={{ background: "rgba(255,255,255,0.22)" }}
        />
        <div
          className="font-mono text-[10px] tracking-[0.2em]"
          style={{ color: "#8CA0B8" }}
        >
          <BengaliText>{targetBand.sub}</BengaliText>
        </div>
      </div>
    </div>
  );
}

const FACILITY_ICONS: Record<string, typeof GraduationCap> = {
  lvl: GraduationCap,
  lang: BookOpen,
  pace: Clock,
  access: Users,
};

function SnapshotCard({
  level,
  language,
  pace,
  access,
  lessonCount,
  moduleCount,
}: {
  level: string;
  language: string;
  pace: string;
  access?: string;
  lessonCount: number;
  moduleCount: number;
}) {
  const rows: { icon: typeof GraduationCap; label: string; value: string }[] = [
    { icon: FACILITY_ICONS.lvl, label: "LEVEL", value: level },
    { icon: FACILITY_ICONS.lang, label: "LANGUAGE", value: language },
    { icon: FACILITY_ICONS.pace, label: "PACE", value: pace },
    ...(access ? [{ icon: FACILITY_ICONS.access, label: "ACCESS", value: access }] : []),
    {
      icon: FileText,
      label: "CONTENT",
      value: `${moduleCount} modules · ${lessonCount} lessons`,
    },
  ].filter((r) => Boolean(r.value));

  return (
    <div
      className="w-full max-w-[400px] mx-auto rounded-[14px] p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="font-mono text-[10px] font-semibold tracking-[0.28em]" style={{ color: "#8CA0B8" }}>
          COURSE SNAPSHOT
        </span>
        <span className="font-display text-[9.5px] text-white/90 border border-white/15 rounded-full px-2.5 py-[3px]">
          {lessonCount} LESSONS
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 rounded-xl px-3.5 py-[10px]"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <span
              className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0"
              style={{ background: "rgba(124,240,189,0.12)" }}
            >
              <r.icon className="w-[15px] h-[15px]" style={{ color: "var(--brand-2)" }} strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[8.5px] font-semibold tracking-[0.24em]" style={{ color: "#64748B" }}>
                {r.label}
              </span>
              <span className="block text-[13px] font-medium truncate" style={{ color: "#E6EDF5" }}>
                <BengaliText>{r.value}</BengaliText>
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseHero({
  slug,
  badge,
  title,
  subtitle,
  desc,
  level,
  language,
  pace,
  price,
  originalPrice,
  savings,
  access,
  rating,
  lessonCount,
  moduleCount,
  cta,
  heroPill,
  titleAccent,
  targetBand,
  heroCta,
  heroStats,
  waitlistTarget,
}: {
  slug: string;
  badge: string;
  title: string;
  subtitle?: string;
  desc: string;
  level?: string;
  language?: string;
  pace?: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  access?: string;
  rating?: { average: number; count: number };
  lessonCount: number;
  moduleCount: number;
  cta?: CourseCta;
  heroPill?: string;
  titleAccent?: string;
  targetBand?: TargetBand;
  heroCta?: { label: string; href: string };
  heroStats?: { value: string; label: string }[];
  waitlistTarget: string;
}) {
  const linkHref =
    cta?.enrolled
      ? `/dashboard/courses/${cta.slug}/learn`
      : cta?.hasDb
        ? `/programs/${slug}/checkout`
        : waitlistTarget;

  return (
    <section className="course-page-hero relative overflow-hidden" style={{ background: "#fff" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 82% -12%, rgba(46,158,107,0.20), transparent), radial-gradient(ellipse 720px 520px at -6% 100%, rgba(31,92,138,0.30), transparent), linear-gradient(160deg, #0B2545 0%, #080B10 72%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[5px]"
        style={{ background: "linear-gradient(90deg, #2E9E6B, #1F5C8A)" }}
      />

      <div className="relative max-w-[1320px] mx-auto px-[clamp(20px,4.5vw,56px)] pt-[150px] pb-[56px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12.5px] font-medium mb-9">
          <Link href="/" style={{ color: "#8CA0B8" }} className="hover:text-white transition-colors">
            Home
          </Link>
          <span style={{ color: "#5B6B7F" }}>/</span>
          <Link href="/programs" style={{ color: "#8CA0B8" }} className="hover:text-white transition-colors">
            Programs
          </Link>
          <span style={{ color: "#5B6B7F" }}>/</span>
          <span style={{ color: "var(--brand-2)" }}>{badge}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-[48px] items-start">
          {/* Left */}
          <div>
            {heroPill && (
              <div
                className="inline-flex items-center gap-2 rounded-full px-[15px] py-[8px] mb-6"
                style={{
                  background: "rgba(124,240,189,0.12)",
                  border: "1px solid rgba(124,240,189,0.35)",
                }}
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#7CF0BD" }} />
                <BengaliText>
                  <span className="text-[12.5px] font-semibold" style={{ color: "#7CF0BD" }}>
                    {heroPill}
                  </span>
                </BengaliText>
              </div>
            )}

            <p className="font-mono text-[11.5px] font-medium tracking-[0.35em] mb-[14px]" style={{ color: "#7CF0BD" }}>
              {badge.toUpperCase()} · COURSE
            </p>

            <h1
              className="font-display font-semibold leading-[1.14] tracking-[-0.02em] max-w-[620px]"
              style={{ color: "#fff", fontSize: "clamp(30px,3.6vw,48px)" }}
            >
              <BengaliText>{title}</BengaliText>
              {titleAccent && (
                <BengaliText>
                  {" "}
                  <span style={{ color: "#7CF0BD" }}>{titleAccent}</span>
                </BengaliText>
              )}
              {subtitle && (
                <>
                  {" "}
                  <BengaliText>
                    <span style={{ color: "#8CA0B8", fontSize: "0.72em" }}>— {subtitle}</span>
                  </BengaliText>
                </>
              )}
            </h1>

            {rating && (
              <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-[13.5px]">
                <Stars value={rating.average} />
                <span className="font-semibold" style={{ color: "#fff" }}>
                  {rating.average}
                </span>
                <span className="font-medium underline underline-offset-2" style={{ color: "#8CA0B8" }}>
                  ({rating.count} reviews)
                </span>
              </a>
            )}

            {price && (
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <span className="text-[30px] font-bold leading-none" style={{ color: "#fff" }}>
                  {price}
                </span>
                {originalPrice && (
                  <span className="text-[16px] font-medium line-through" style={{ color: "#64748B" }}>
                    {originalPrice}
                  </span>
                )}
                {savings && (
                  <span className="text-[12px] font-bold rounded-md px-2.5 py-1" style={{ background: "#2E9E6B", color: "#052117" }}>
                    {savings} OFF
                  </span>
                )}
              </div>
            )}

            <p className="mt-[20px] max-w-[560px] text-[15.5px] leading-[1.8]" style={{ color: "#B7C4D6" }}>
              <BengaliText>{desc}</BengaliText>
            </p>

            <div className="flex items-center gap-4 mt-8 flex-wrap">
              {cta?.enrolled ? (
                <Link
                  href={`/dashboard/courses/${cta.slug}/learn`}
                  className="browse-btn inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] rounded-full px-[30px] py-[15px]"
                  style={{ background: "var(--brand)", color: "#052117" }}
                >
                  Open Player
                  {play}
                </Link>
              ) : cta?.hasDb ? (
                <Link
                  href={`/programs/${slug}/checkout`}
                  className="browse-btn inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] rounded-full px-[30px] py-[15px]"
                  style={{ background: "var(--brand)", color: "#052117" }}
                >
                  Enroll now
                  {arrow}
                </Link>
              ) : (
                <>
                  <Link
                    href={linkHref}
                    className="browse-btn inline-flex items-center justify-center gap-2.5 font-bold text-[15.5px] rounded-full px-[30px] py-[15px]"
                    style={{ background: "var(--brand)", color: "#052117", boxShadow: "0 14px 30px -12px rgba(46,158,107,0.7)" }}
                  >
                    <BengaliText>{heroCta?.label ?? "Join the waitlist"}</BengaliText>
                    {arrow}
                  </Link>
                  <a
                    href="#curriculum"
                    className="inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] rounded-full px-[26px] py-[14px] transition-colors duration-200 hover:bg-white/10"
                    style={{ border: "1.5px solid rgba(255,255,255,0.35)", color: "#fff" }}
                  >
                    <BengaliText>কোর্সে কী কী আছে দেখো</BengaliText>
                  </a>
                </>
              )}
            </div>

            {!cta?.enrolled && !cta?.hasDb && (
              <div
                className="mt-5 inline-flex items-center gap-2.5 rounded-full px-4 py-2.5"
                style={{ background: "rgba(124,240,189,0.12)", border: "1px solid rgba(124,240,189,0.35)" }}
              >
                <Gift className="w-[15px] h-[15px]" style={{ color: "#7CF0BD" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#7CF0BD" }}>
                  <BengaliText>
                    ওয়েটলিস্টে জয়েন করলেই {WISHLIST_DISCOUNT_PERCENT}% ছাড়
                  </BengaliText>
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-6 flex-wrap text-[13px] font-medium" style={{ color: "#8CA0B8" }}>
              {["Instant access", "Live support", "Verified certificate"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="w-[16px] h-[16px] rounded-full flex items-center justify-center" style={{ background: "rgba(124,240,189,0.14)" }}>
                    <Check className="w-[9px] h-[9px]" strokeWidth={3.5} style={{ color: "#7CF0BD" }} />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — target band + snapshot */}
          <div className="flex flex-col gap-7 lg:pt-2">
            {targetBand && <TargetBadge targetBand={targetBand} />}
            <SnapshotCard
              level={level ?? (cta?.hasDb ? "—" : "")}
              language={language ?? ""}
              pace={pace ?? ""}
              access={access}
              lessonCount={lessonCount}
              moduleCount={moduleCount}
            />
          </div>
        </div>

        {/* Stats cards */}
        {heroStats?.length ? (
          <div className="mt-[56px] grid grid-cols-2 lg:grid-cols-4 gap-4">
            {heroStats.map((stat, i) => (
              <div
                key={stat.label}
                className="fb-reveal relative rounded-[14px] px-6 py-[24px] overflow-hidden transition-transform duration-300 hover:-translate-y-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, #2E9E6B, #7CF0BD)" }}
                />
                <div
                  className="font-mono text-[9px] font-bold tracking-[0.26em] mb-3"
                  style={{ color: "#5B6B7F" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="font-display text-[34px] font-semibold leading-none" style={{ color: "#7CF0BD" }}>
                  {stat.value}
                </div>
                <div className="text-[13.5px] mt-[9px] leading-snug" style={{ color: "#B7C4D6" }}>
                  <BengaliText>{stat.label}</BengaliText>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const STEP_ICONS = [Eye, Check, Zap];

function StepsSection({ steps }: { steps: StepsSection }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[76px]">
      <div className="max-w-[1320px] mx-auto">
        <div className="text-center max-w-[720px] mx-auto mb-14">
          <Pill tone="green">কেমন কাজ করে</Pill>
          <h2
            className="font-display font-semibold leading-[1.35] mt-6"
            style={{ fontSize: "clamp(24px,2.8vw,34px)", color: "var(--ink)" }}
          >
            <BengaliText>{steps.title}</BengaliText>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.cards.map((card, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <div
                key={card.title}
                className="fb-card fb-reveal rounded-[14px] p-8"
                style={{
                  border: "1px solid var(--line)",
                  background: "#fff",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 18px 44px -26px rgba(11,37,69,0.35)",
                }}
              >
                <span
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 font-mono text-[11px] font-bold tracking-[0.2em] mb-6"
                  style={{ background: "rgba(46,158,107,0.1)", color: "#0A3D2E" }}
                >
                  STEP 0{i + 1}
                </span>
                <span
                  className="w-[50px] h-[50px] rounded-xl flex items-center justify-center mb-6"
                  style={{ background: "rgba(46,158,107,0.1)" }}
                >
                  <Icon className="w-[24px] h-[24px]" strokeWidth={1.8} style={{ color: "#0A3D2E" }} />
                </span>
                <h3 className="font-display text-[18px] font-semibold leading-[1.3]" style={{ color: "var(--ink)" }}>
                  <BengaliText>{card.title}</BengaliText>
                </h3>
                <p className="mt-3 text-[14px] leading-[1.75]" style={{ color: "var(--body)" }}>
                  <BengaliText>{card.desc}</BengaliText>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({
  features,
  desc,
}: {
  features: CourseFeature[];
  desc?: string;
}) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] pb-[76px]">
      <div className="max-w-[1320px] mx-auto">
        <div className="text-center max-w-[720px] mx-auto mb-14">
          <Pill tone="green">সাথে কী কী পাবে</Pill>
          <h2
            className="font-display font-semibold leading-[1.3] mt-6"
            style={{ fontSize: "clamp(24px,2.8vw,34px)", color: "var(--ink)" }}
          >
            <BengaliText>একটাই প্যাকেজে সবকিছু</BengaliText>
          </h2>
          {desc && (
            <p className="mt-4 text-[15px] leading-[1.8]" style={{ color: "var(--body)" }}>
              <BengaliText>{desc}</BengaliText>
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc: fdesc }) => (
            <div
              key={title}
              className="fb-card fb-reveal rounded-[14px] p-7"
              style={{ border: "1px solid var(--line)", background: "#fff" }}
            >
              <span
                className="w-[46px] h-[46px] rounded-xl flex items-center justify-center mb-5"
                style={{ background: "var(--brand-soft)" }}
              >
                <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} style={{ color: "var(--brand-2)" }} />
              </span>
              <h3 className="font-display text-[16.5px] font-semibold leading-[1.35]" style={{ color: "var(--ink)" }}>
                <BengaliText>{title}</BengaliText>
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.75]" style={{ color: "var(--body)" }}>
                <BengaliText>{fdesc}</BengaliText>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection({ problem }: { problem: { title: string; desc: string } }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[80px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[840px] mx-auto text-center">
        <Pill tone="green">সমস্যাটা আসলে কী</Pill>
        <h2
          className="font-display font-semibold leading-[1.4] mt-8"
          style={{ fontSize: "clamp(24px,2.9vw,34px)", color: "var(--ink)" }}
        >
          <BengaliText>{problem.title}</BengaliText>
        </h2>
        <p className="mt-6 text-[16.5px] leading-[1.9]" style={{ color: "var(--body)" }}>
          <BengaliText>{problem.desc}</BengaliText>
        </p>
      </div>
    </section>
  );
}

const OUTCOME_CHECK = (
  <span
    className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 mt-[2px]"
    style={{ background: "rgba(46,158,107,0.12)" }}
  >
    <Check className="w-[13px] h-[13px]" strokeWidth={3} style={{ color: "#0A3D2E" }} />
  </span>
);

function OutcomesSection({ details }: { details: CourseDetails }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[76px]" style={{ background: "#fff" }}>
      <div className="max-w-[1320px] mx-auto">
        <div className="text-center max-w-[720px] mx-auto mb-14">
          <Pill tone="green">কোর্স শেষে যা পারবে</Pill>
          <h2
            className="font-display font-semibold leading-[1.3] mt-6"
            style={{ fontSize: "clamp(24px,2.8vw,34px)", color: "var(--ink)" }}
          >
            <BengaliText>পরীক্ষার দিন তুমি প্রস্তুত</BengaliText>
          </h2>
          <p className="mt-4 text-[15px]" style={{ color: "var(--body)" }}>
            <BengaliText>Course outcomes — কোর্স শেষে তুমি যা যা করতে পারবে</BengaliText>
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {details.outcomes.map((o) => (
            <div
              key={o.title}
              className="fb-card fb-reveal flex items-start gap-4 rounded-xl px-6 py-5"
              style={{ border: "1px solid var(--line)", background: "#fff" }}
            >
              {OUTCOME_CHECK}
              <div>
                <div className="text-[14.5px] font-medium leading-[1.6]" style={{ color: "var(--ink)" }}>
                  <BengaliText>{o.title}</BengaliText>
                </div>
                {o.desc && (
                  <div className="text-[13px] mt-[4px] leading-[1.65]" style={{ color: "var(--body)" }}>
                    <BengaliText>{o.desc}</BengaliText>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookSection({ book }: { book: CourseBook }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[80px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-14 items-center">
        <div>
          <Pill tone="green">নতুন সংযোজন</Pill>
          <h2
            className="font-display font-semibold leading-[1.35] mt-6"
            style={{ fontSize: "clamp(24px,2.8vw,34px)", color: "var(--ink)" }}
          >
            <BengaliText>প্রতিটা লেসন, কাগজেও পাবে</BengaliText>
          </h2>
          <p className="mt-5 text-[15.5px] leading-[1.85]" style={{ color: "var(--body)" }}>
            <BengaliText>{book.desc}</BengaliText>
          </p>
          <div className="mt-7 flex flex-col gap-3">
            {[
              "প্রতিটা ভিডিও লেসনের সাথে মিলিয়ে বানানো",
              "সম্পূর্ণ মডেল আনসার আর ফুল প্র্যাকটিস টেস্ট",
              "মোবাইলে পড়ার জন্য পারফেক্ট ডিজাইন",
              "একবার কিনলেই চিরকালের জন্য তোমার",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>
                {check}
                <BengaliText>{t}</BengaliText>
              </div>
            ))}
          </div>
          {book.includedNote && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mt-7 text-[12.5px] font-semibold"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <Check className="w-[13px] h-[13px]" strokeWidth={3} />
              <BengaliText>{book.includedNote}</BengaliText>
            </span>
          )}
        </div>

        {/* Book cover art */}
        <div className="fb-float relative w-full max-w-[360px] mx-auto h-[440px]">
          {/* ambient glow */}
          <div
            className="absolute -inset-6 rounded-[28px]"
            style={{ background: "radial-gradient(ellipse at 55% 35%, rgba(46,158,107,0.26), transparent 70%)" }}
          />
          {/* ground shadow */}
          <div
            className="absolute left-[46px] right-[-6px] bottom-[-20px] h-10 rounded-full"
            style={{ background: "rgba(11,37,69,0.3)", filter: "blur(20px)" }}
          />
          {/* page edges */}
          <div
            className="absolute top-[16px] bottom-[16px] right-[20px] w-[20px] rounded-r-[6px]"
            style={{ background: "linear-gradient(90deg,#E9E3D7,#FDFAF1)", boxShadow: "-8px 0 16px rgba(11,37,69,0.16)" }}
          />
          <div
            className="absolute top-[10px] bottom-[10px] right-[32px] w-[8px] rounded-r-[3px]"
            style={{ background: "linear-gradient(90deg,#D8D0C0,#EFE9DC)" }}
          />
          {/* back cover */}
          <div
            className="absolute inset-0 rounded-[10px]"
            style={{
              background: "linear-gradient(160deg,#0F2F52,#080B10)",
              border: "1px solid rgba(124,240,189,0.15)",
              transform: "translate(10px,12px)",
            }}
          />
          {/* front cover */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-[10px]"
            style={{
              background: "linear-gradient(155deg,#143458 0%,#0B2545 55%,#080B10 100%)",
              border: "1px solid rgba(124,240,189,0.32)",
              boxShadow: "0 36px 80px -26px rgba(11,37,69,0.6)",
            }}
          >
            {/* spine */}
            <div
              className="absolute top-0 bottom-0 left-0 w-[26px] flex items-center justify-center"
              style={{ background: "linear-gradient(180deg,#081527,#05080D)", borderRight: "1px solid rgba(124,240,189,0.16)" }}
            >
              <span
                className="font-mono text-[8px] font-bold tracking-[0.3em]"
                style={{ color: "#7CF0BD", writingMode: "vertical-rl" }}
              >
                FLYBRIDGE EDUCATION GROUP
              </span>
            </div>

            {/* cover content */}
            <div className="flex-1 flex flex-col pl-[40px] pr-6 pt-6 pb-6">
              <div className="flex items-center gap-2">
                <span className="w-[26px] h-[5px] rounded-full" style={{ background: "linear-gradient(90deg,#2E9E6B,#7CF0BD)" }} />
                <span className="font-mono text-[9px] font-bold tracking-[0.24em]" style={{ color: "#7CF0BD" }}>
                  FLYBRIDGE
                </span>
              </div>
              <div className="font-display font-semibold text-white leading-[1.22] mt-5" style={{ fontSize: "27px" }}>
                <BengaliText>{book.title}</BengaliText>
              </div>
              <div className="text-[12.5px] mt-2" style={{ color: "#8CA0B8" }}>
                <BengaliText>সম্পূর্ণ Companion বই</BengaliText>
              </div>

              <div className="mt-auto">
                <div
                  className="rounded-lg px-3.5 py-2 inline-flex items-center gap-2"
                  style={{ background: "rgba(46,158,107,0.12)", border: "1px solid rgba(46,158,107,0.3)" }}
                >
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: "#7CF0BD" }} />
                  <span className="font-mono text-[8.5px] font-bold tracking-[0.22em]" style={{ color: "#7CF0BD" }}>
                    INCLUDED WITH EVERY PLAN
                  </span>
                </div>
              </div>
            </div>

            {/* bottom band */}
            <div className="h-[5px] w-full shrink-0" style={{ background: "linear-gradient(90deg,#2E9E6B,#7CF0BD)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightsGrid({ details }: { details: CourseDetails }) {
  const highlights = details.highlights ?? [
    { title: "10 Videos", sub: "Step-by-step video lessons, at your own pace" },
    { title: "Frequent Live Q&A session", sub: "Ask questions directly and get expert answers" },
    { title: "Resources", sub: "Templates, checklists & practical tools included" },
  ];
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[76px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto">
        <div className="text-center max-w-[720px] mx-auto mb-14">
          <Pill tone="green">কারিকুলাম</Pill>
          <h2
            className="font-display font-semibold leading-[1.3] mt-6"
            style={{ fontSize: "clamp(24px,2.8vw,34px)", color: "var(--ink)" }}
          >
            <BengaliText>What is inside</BengaliText>
          </h2>
          {(details.highlightsDesc ?? details.highlights) && (
            <p className="mt-4 text-[15px]" style={{ color: "var(--body)" }}>
              <BengaliText>{details.highlightsDesc ?? "Everything you need to prepare with confidence, in one place."}</BengaliText>
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <div key={item.title} className="fb-card fb-reveal rounded-[14px] p-7" style={{ border: "1px solid var(--line)", background: "#fff" }}>
              <span
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-5"
                style={{ background: "var(--brand-soft)" }}
              >
                <Check className="w-[20px] h-[20px]" strokeWidth={3} style={{ color: "var(--brand-2)" }} />
              </span>
              <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                {item.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CurriculumSection({ curriculum }: { curriculum: CurriculumSection }) {
  return (
    <section
      id="curriculum"
      className="px-[clamp(20px,4.5vw,56px)] py-[96px] relative overflow-hidden"
      style={{ background: "#080B10" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 760px 420px at 12% 0%, rgba(46,158,107,0.12), transparent), radial-gradient(ellipse 640px 420px at 95% 100%, rgba(31,92,138,0.2), transparent)",
        }}
      />
      <div className="relative max-w-[1120px] mx-auto">
        <div className="text-center mb-16">
          {curriculum.label && (
            <Pill tone="darkgreen">
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand-2)" }} />
              <BengaliText>{curriculum.label}</BengaliText>
            </Pill>
          )}
          <h2
            className="font-display font-semibold text-white leading-[1.25] mt-6"
            style={{ fontSize: "clamp(26px,3vw,38px)" }}
          >
            <BengaliText>{curriculum.title}</BengaliText>
          </h2>
          <p className="mt-4 text-[16px]" style={{ color: "#8CA0B8" }}>
            <BengaliText>{curriculum.subtitle}</BengaliText>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {curriculum.modules.map((m, i) => (
            <div
              key={m.title}
              className="fb-card fb-reveal rounded-[14px] p-7 md:p-9"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <div className="flex items-center gap-4 mb-7">
                <span
                  className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center font-bold text-[16px] shrink-0"
                  style={{ background: "#2E9E6B", color: "#052117" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[17.5px] text-white leading-snug">
                    <BengaliText>{m.title}</BengaliText>
                  </div>
                  <div className="font-medium text-[12.5px] mt-0.5" style={{ color: "#8CA0B8" }}>
                    <BengaliText>{m.lessonCount}</BengaliText>
                  </div>
                </div>
              </div>
              <ul className="flex flex-col gap-[13px]">
                {m.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] leading-[1.65]"
                    style={{ color: "#C4D0DE" }}
                  >
                    <span className="mt-[9px] w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#7CF0BD" }} />
                    <BengaliText>{item}</BengaliText>
                  </li>
                ))}
                <li
                  className="flex items-start gap-3 text-[14px] font-semibold leading-[1.65]"
                  style={{ color: "#7CF0BD" }}
                >
                  <Check className="w-[16px] h-[16px] mt-[2px] shrink-0" strokeWidth={3} />
                  <BengaliText>ক্যাপস্টোন: {m.capstone}</BengaliText>
                </li>
              </ul>
            </div>
          ))}
        </div>

        {curriculum.note && (
          <div
            className="mt-8 rounded-xl px-7 md:px-9 py-6 flex gap-4 items-start"
            style={{ background: "rgba(46,158,107,0.08)", border: "1px solid rgba(46,158,107,0.3)" }}
          >
            <span className="w-[6px] h-[6px] rounded-full mt-[9px] shrink-0" style={{ background: "#7CF0BD" }} />
            <p className="text-[14.5px] leading-[1.8]" style={{ color: "#C4D0DE" }}>
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
    <section className="px-[clamp(20px,4.5vw,56px)] py-[80px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center max-w-[720px] mx-auto mb-12">
          <Pill tone="green">তুলনা দেখো</Pill>
          <h2
            className="font-display font-semibold leading-[1.35] mt-6"
            style={{ fontSize: "clamp(24px,2.8vw,32px)", color: "var(--ink)" }}
          >
            <BengaliText>{comparison.title}</BengaliText>
          </h2>
        </div>
        <div className="fb-reveal rounded-[14px] overflow-hidden" style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "0 24px 60px -32px rgba(11,37,69,0.35)" }}>
          <div className="grid grid-cols-2">
            <div className="px-6 md:px-8 py-6" style={{ background: "#F8FAFC", borderRight: "1px solid var(--line)" }}>
              <span className="text-[12.5px] font-bold tracking-[0.02em]" style={{ color: "#64748B" }}>
                <BengaliText>{comparison.leftLabel}</BengaliText>
              </span>
            </div>
            <div className="px-6 md:px-8 py-6" style={{ background: "rgba(46,158,107,0.08)" }}>
              <span className="text-[12.5px] font-bold tracking-[0.02em]" style={{ color: "#0A3D2E" }}>
                <BengaliText>{comparison.rightLabel}</BengaliText>
              </span>
            </div>
          </div>
          {comparison.rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2" style={{ borderTop: "1px solid var(--line)" }}>
              <div
                className="px-6 md:px-8 py-5 text-[14px] leading-[1.65]"
                style={{ borderRight: "1px solid var(--line)", color: "#64748B", background: i % 2 ? "#FAFBFC" : "#fff" }}
              >
                <BengaliText>{row.left}</BengaliText>
              </div>
              <div
                className="px-6 md:px-8 py-5 text-[14px] font-semibold leading-[1.65]"
                style={{ color: "#0F172A", background: i % 2 ? "rgba(46,158,107,0.05)" : "rgba(46,158,107,0.02)" }}
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
      className="px-[clamp(20px,4.5vw,56px)] py-[96px] text-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0B2545 0%, #080B10 100%)" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 700px 420px at 50% -8%, rgba(46,158,107,0.16), transparent)" }}
      />
      <div className="relative max-w-[640px] mx-auto">
        <Pill tone="darkgreen">
          <span className="w-[6px] h-[6px] rounded-full" style={{ background: "var(--brand-2)" }} />
          <BengaliText>আর্লি-বার্ড</BengaliText>
        </Pill>
        <h2
          className="font-display font-semibold text-white leading-[1.25] mt-6"
          style={{ fontSize: "clamp(26px,3vw,36px)" }}
        >
          <BengaliText>{pricing.title}</BengaliText>
        </h2>
        {pricing.subtitle && (
          <p className="mt-4 text-[15.5px]" style={{ color: "#8CA0B8" }}>
            <BengaliText>{pricing.subtitle}</BengaliText>
          </p>
        )}

        <div
          className="fb-reveal mt-12 mx-auto max-w-[420px] rounded-[18px] px-8 py-12"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(124,240,189,0.35)",
            boxShadow: "0 36px 80px -40px rgba(46,158,107,0.5)",
          }}
        >
          <div
            className="font-display font-semibold text-white"
            style={{ fontSize: "clamp(30px,4vw,42px)" }}
          >
            <BengaliText>{pricing.price}</BengaliText>
          </div>
          {pricing.note && (
            <div className="mt-3 mb-9 text-[14px]" style={{ color: "#8CA0B8" }}>
              <BengaliText>{pricing.note}</BengaliText>
            </div>
          )}
          <a
            href={pricing.ctaHref}
            className="browse-btn w-full inline-flex items-center justify-center gap-2.5 font-bold text-[15.5px] rounded-full px-8 py-[16px]"
            style={{ background: "#2E9E6B", color: "#052117", boxShadow: "0 14px 30px -12px rgba(46,158,107,0.7)" }}
          >
            <BengaliText>{pricing.ctaLabel}</BengaliText>
            {arrow}
          </a>
          {pricing.includedLine && (
            <>
              <div className="my-7 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="text-[13px]" style={{ color: "#8CA0B8" }}>
                <BengaliText>{pricing.includedLine}</BengaliText>
              </div>
            </>
          )}
        </div>

        {pricing.paymentMethods?.length ? (
          <div className="mt-12">
            {pricing.paymentLabel && (
              <div className="text-[13px] mb-5 tracking-[0.3px]" style={{ color: "#8CA0B8" }}>
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

const PAYMENT_COLORS: Record<string, string> = {
  bKash: "#E2136E",
  Nagad: "#F5821F",
  Rocket: "#8C3494",
  Stripe: "#635BFF",
};

function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <section id="faq" className="px-[clamp(20px,4.5vw,56px)] py-[84px]" style={{ background: "#fff" }}>
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <Pill tone="green">যেকোনো প্রশ্ন</Pill>
          <h2
            className="font-display font-semibold mt-6"
            style={{ fontSize: "clamp(26px,3vw,34px)", color: "var(--ink)" }}
          >
            <BengaliText>সচরাচর জিজ্ঞাসা</BengaliText>
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="faq-item rounded-xl px-7 py-6 transition-colors duration-200"
              style={{ border: "1px solid var(--line)", background: "#fff" }}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer">
                <span
                  className="font-display font-semibold text-[16px] leading-[1.45]"
                  style={{ color: "var(--ink)" }}
                >
                  <BengaliText>{faq.q}</BengaliText>
                </span>
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <ChevronDown
                    className="faq-chev w-[17px] h-[17px] transition-transform duration-200"
                    style={{ color: "var(--brand-2)" }}
                  />
                </span>
              </summary>
              <p className="mt-4 text-[14.5px] leading-[1.8]" style={{ color: "var(--body)" }}>
                <BengaliText>{faq.a}</BengaliText>
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({
  cta,
  pricing,
  slug,
  title,
}: {
  cta: { title: string; desc: string };
  pricing?: PricingSection;
  slug: string;
  title: string;
}) {
  return (
    <section
      id="waitlist"
      className="px-[clamp(20px,4.5vw,56px)] py-[96px] text-center relative overflow-hidden"
      style={{ background: "#080B10" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 720px 460px at 50% -6%, rgba(46,158,107,0.18), transparent), radial-gradient(ellipse 560px 340px at 92% 110%, rgba(31,92,138,0.22), transparent)",
        }}
      />
      <div className="relative max-w-[720px] mx-auto">
        <span className="w-[10px] h-[10px] rounded-full mx-auto mb-7 inline-flex" style={{ background: "#7CF0BD", boxShadow: "0 0 0 6px rgba(124,240,189,0.12)" }} />
        <h2
          className="font-display font-semibold text-white leading-[1.3]"
          style={{ fontSize: "clamp(27px,3.4vw,40px)" }}
        >
          <BengaliText>{cta.title}</BengaliText>
        </h2>
        <p className="mt-5 text-[16px] leading-[1.8]" style={{ color: "#B7C4D6" }}>
          <BengaliText>{cta.desc}</BengaliText>
        </p>

        <div className="mt-10 mx-auto max-w-[460px]">
          <div
            className="flex items-center gap-3.5 rounded-[14px] px-5 py-4 text-left"
            style={{ background: "rgba(124,240,189,0.1)", border: "1.5px solid rgba(124,240,189,0.4)" }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(124,240,189,0.16)" }}
            >
              <Gift className="w-5 h-5" style={{ color: "#7CF0BD" }} />
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold tracking-[0.24em]" style={{ color: "#7CF0BD" }}>
                WISHLIST DISCOUNT
              </div>
              <div className="font-display text-[16px] font-semibold text-white mt-0.5">
                <BengaliText>জয়েন করলেই {WISHLIST_DISCOUNT_PERCENT}% ছাড়</BengaliText>
              </div>
              <div className="text-[12.5px] leading-snug mt-0.5" style={{ color: "#B7C4D6" }}>
                <BengaliText>
                  কোর্সে ভর্তি হলে {WISHLIST_DISCOUNT_PERCENT}% ছাড় — শুধু ওয়েটলিস্ট মেম্বারদের জন্য।
                </BengaliText>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <WaitlistForm slug={slug} title={title} />
        </div>

        {pricing?.includedLine && (
          <div className="mt-8 text-[13px]" style={{ color: "#64748B" }}>
            <BengaliText>{pricing.includedLine}</BengaliText>
          </div>
        )}
      </div>
    </section>
  );
}

function RelatedProgramsSection({ programs }: { programs: RelatedProgramLanding[] }) {
  if (!programs.length) return null;
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[84px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-11">
          <div>
            <div
              className="font-mono text-[11px] font-semibold tracking-[0.32em] mb-2"
              style={{ color: "var(--brand-2)" }}
            >
              EXPLORE MORE
            </div>
            <h2
              className="font-display font-semibold leading-[1.2]"
              style={{ fontSize: "clamp(22px,2.6vw,30px)", color: "var(--ink)" }}
            >
              <BengaliText>অন্যান্য প্রোগ্রাম</BengaliText>
            </h2>
          </div>
          <Link
            href="/programs"
            className="view-all font-semibold text-[13.5px] inline-flex items-center gap-[6px] shrink-0 mb-[3px]"
            style={{ color: "var(--brand-2)" }}
          >
            View all
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((p) => (
            <RelatedProgramCardLanding key={p.slug} p={p} />
          ))}
        </div>
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
    prices: cleanPrices(course.prices),
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={checkoutCourse.image}
                          alt={checkoutCourse.title}
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={checkoutCourse.image}
                          alt=""
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
                        {isFree
                          ? "Free"
                          : formatPriceText(checkoutCourse)}
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
                      {isFree
                        ? "Free"
                        : formatPriceText(checkoutCourse)}
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
                        <span
                          className="text-[10.5px] font-medium leading-tight"
                          style={{ color: "var(--body)" }}
                        >
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
                    style={{ color: "var(--body)", borderColor: "var(--line)", cursor: "not-allowed" }}
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

export default async function IeltsFullReadinessLandingPage() {
  const program = getProgram(SLUG);

  await connectDb();

  const course = await Course.findOne({
    slug: SLUG,
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
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

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

  const details = courseDetails[SLUG];
  const lessonCount = details ? details.modules.reduce((n, m) => n + m.lessons.length, 0) : 30;
  const moduleCount = details ? details.modules.length : 6;

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
    date: new Date(r.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));

  const otherEnrollCounts = await CourseEnrollment.aggregate([
    { $group: { _id: "$course", count: { $sum: 1 } } },
  ]);
  const otherEnrollmentMap = new Map(
    otherEnrollCounts.map((r) => [r._id.toString(), r.count as number])
  );

  const otherDbCourses = (
    await Course.find({
      slug: { $ne: SLUG },
      $or: [{ published: true }, { upcoming: true }],
    })
      .sort({ createdAt: -1 })
      .limit(4)
  ).map((c) => {
    const courseId = c._id.toString();
    return {
      id: courseId,
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
      enrollmentCount: otherEnrollmentMap.get(courseId) ?? 0,
      modules: (c.modules ?? []).map((m) => ({
        title: m.title,
        lessons: (m.lessons ?? []).map((l) => ({ title: l.title })),
      })),
    };
  }) as DbCourse[];

  const relatedPrograms: RelatedProgramLanding[] = [
    ...programs
      .filter((p) => p.slug !== SLUG && !p.hasDb)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        badge: p.badge,
        badgeColor: p.badgeColor,
        bg: p.bg,
        image: p.image ?? null,
        sub: p.upcoming ? "Coming soon" : p.price ?? "Explore course",
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
        : c.price > 0
          ? `${c.currency} ${c.price.toLocaleString()}`
          : c.subtitle || c.description || "Explore course",
    })),
  ].slice(0, 6);

  return (
    <div className="course-page ielts-landing">
      <Nav />

      <CourseHero
        slug={SLUG}
        badge={program.badge}
        title={details?.title ?? program.title}
        subtitle={details?.subtitle}
        desc={details?.desc ?? program.desc}
        level={details?.level}
        language={details?.language}
        pace={details?.pace}
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
        moduleCount={moduleCount}
        cta={cta}
        heroPill={details?.heroPill}
        titleAccent={details?.titleAccent}
        targetBand={details?.targetBand}
        heroCta={details?.heroCta}
        heroStats={details?.heroStats}
        waitlistTarget={details?.pricing?.ctaHref ?? "#waitlist"}
      />

      {details ? (
        <>
          {/* Problem */}
          {details.problem && <ProblemSection problem={details.problem} />}

          {/* Steps + Features */}
          <section className="px-[clamp(20px,4.5vw,56px)] pb-[80px] max-w-[1320px] mx-auto">
            {details.steps && <StepsSection steps={details.steps} />}
            <FeaturesSection
              features={details.features ?? BLUEPRINT_FEATURES}
              desc={details.featuresDesc}
            />
          </section>

          {/* Book */}
          {details.book && <BookSection book={details.book} />}

          {/* Outcomes */}
          {details.outcomes.length > 0 && <OutcomesSection details={details} />}

          {/* Curriculum (dark) or highlights */}
          {details.curriculum ? (
            <CurriculumSection curriculum={details.curriculum} />
          ) : (
            <HighlightsGrid details={details} />
          )}

          {/* Comparison */}
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

          {details.pricing && <PricingSection pricing={details.pricing} />}

          {details.faqs?.length ? <FaqSection faqs={details.faqs} /> : null}

          {details.cta && details.pricing && (
            <FinalCta cta={details.cta} pricing={details.pricing} slug={SLUG} title={details.title} />
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

      <RelatedProgramsSection programs={relatedPrograms} />

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
          box-shadow: 0 18px 30px -12px rgba(46,158,107,0.55);
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