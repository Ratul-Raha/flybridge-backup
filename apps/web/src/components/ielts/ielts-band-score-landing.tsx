import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getProgram } from "@/lib/programs";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseReview } from "@/lib/models/course-review";
import { readSession } from "@/lib/auth/session";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  Flag,
  Gift,
  GraduationCap,
  Infinity as InfinityIcon,
  Library,
  Monitor,
  Pencil,
  Percent,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import {
  courseDetails,
  type CourseBook,
  type CourseDetails,
  type CurriculumSection,
} from "@/app/programs/[slug]/course-data";
import { BengaliText } from "@/components/bengali-text";
import { WaitlistForm } from "@/components/programs/waitlist-form";
import {
  BandScoreMachineConsole,
  Countdown,
  CurriculumExplorer,
  HeroDealTimer,
  HeroDirectCtaButton,
  HeroVersionSelectorButton,
  HeroVersionSelectorDock,
  Reveal,
  SkillTabs,
  type CurriculumModuleItem,
  type HeroVersionOption,
} from "@/components/ielts/interactive";
import { LandingPixelEvents } from "@/components/ielts/landing-pixel-events";
import { DbCoursePage } from "@/app/ielts-band-score-machine/db-course-page";
import { publicCoursePricing } from "@/lib/course-discount";
import { hasFreePreview } from "@/lib/course-preview";
import { displayEnrollmentCount } from "@/lib/enrollment-display";
import { formatMoney } from "@/lib/pricing";

const SLUG = "ielts-band-score-machine";
const MOCK_TEST_COUNT = 15;
const LAUNCH_DATE = "2026-10-01T00:00:00+06:00";

export const dynamic = "force-dynamic";

/* ───────────────────────── helpers ───────────────────────── */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBn = (v: number | string) => String(v).replace(/\d/g, (d) => BN_DIGITS.charAt(Number(d)));
const fromBn = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

function parseAmount(s?: string): number | null {
  if (!s) return null;
  const m = fromBn(s)
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

type CourseCta = {
  courseId?: string;
  slug: string;
  enrolled: boolean;
  paid: boolean;
  hasDb?: boolean;
};

/** One object that decides what every CTA on the page says and where it goes. */
type Offer = {
  mode: "enrolled" | "buy" | "waitlist";
  href: string;
  label: string;
  price?: string;
  numericPrice?: number;
  originalPrice?: string;
  savings?: string;
  dealLabel?: string;
  dealNote?: string;
  endsAt?: string | null;
  previewHref?: string;
  scholarshipPercent: number;
  showWaitlistForm: boolean;
  slug: string;
  title: string;
  versionOptions?: HeroVersionOption[];
};

type HeroStudentAvatar = {
  name: string;
  avatar: string | null;
};

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

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
        type: "website",
        title,
        description,
        url: `/${SLUG}`,
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
  return { title: "Course | FlyBridge" };
}

/* ───────────────────────── page copy ─────────────────────────
 * All persuasion copy lives here so it can be edited in one place.
 * Facts (price, modules, FAQs, reviews, rating, stats) still come from course-data / the database.
 */

const N = toBn(MOCK_TEST_COUNT);

const COPY = {
  heroSupport:
    "৩০টি ইন্টারঅ্যাকটিভ লেসন, ১৫টি কম্পিউটার-বেসড মক টেস্ট আর ইনস্ট্যান্ট Writing & Speaking evaluation—সব এক সিস্টেমে।",

  systemTitle: "শিখুন, প্র্যাকটিস করুন, নিজেকে যাচাই করুন",
  systemDesc: "আলাদা কোর্স, আলাদা ফাইল আর আলাদা মক টেস্ট সাইট খুঁজে বেড়াতে হবে না।",

  mockTitle: `${N}টি মক টেস্ট, ঠিক মূল আইইএলটিএস পরীক্ষার স্ক্রিনের মতো`,
  mockDesc:
    "আমরা দিচ্ছি মূল আইইএলটিএস পরীক্ষার মতো ইন্টারফেস সহ কম্পিউটার-বেসড মক টেস্টের অভিজ্ঞতা, যাতে পরীক্ষার দিন স্ক্রিন দেখে চমকে না যান। টাইমার, নেভিগেশন, প্রশ্নের লেআউট, সব হাতের মুঠোয় আগেই চেনা হয়ে যাবে।",
  mockNote: "মক টেস্ট দিতে পারবেন ফোন, ট্যাব বা কম্পিউটার যেকোনো ডিভাইসে।",

  bookTitle: "সম্পূর্ণ কোর্সের একটি পিডিএফ বই",
  bookTicks: [
    "মডেল আনসার আর প্র্যাকটিস টেস্টসহ",
    "মোবাইল বা কম্পিউটার, যেখানে ইচ্ছা পড়ুন",
    "লাইফটাইম আপনার অ্যাকাউন্টে থাকবে",
  ],

  closeTitle: "মূল পরীক্ষার সময় ক্রিনটাও যেন চেনা লাগে।",
  closeWaitlist: "শুধুমাত্র যারা এখন ওয়েটলিস্টে জয়েন করবেন, তারাই ১৫% স্কলারশিপ পাবেন।",
  closeBuy: "একবার ভর্তি হলে লেসন আর মক টেস্ট সব আপনার, লাইফটাইম।",
  closeIncluded: "প্যাকেজে যা যা পাচ্ছেন",
};

const HERO_RIBBON: { label: string; sub: string; englishSub?: boolean }[] = [
  { label: "৪টি স্কিল", sub: "Speaking, Writing, Listening, Reading", englishSub: true },
  { label: "১৫টি ফুল মক টেস্ট", sub: "কোনো এক্সট্রা ফি নেই" },
  { label: "ফোন, ট্যাবলেট, ডেস্কটপ", sub: "নিজের সময়ে প্র্যাকটিস করুন" },
  { label: "লাইফটাইম অ্যাক্সেস", sub: "এনরোলমেন্টের পর সারাজীবন" },
];

const CORE_INCLUDES = [
  {
    icon: BookOpen,
    title: "30 Interactive Lessons",
    desc: "Step-by-step modules across all four skills.",
  },
  {
    icon: ClipboardList,
    title: "On-demand Practice & Quizzes",
    desc: "Regenerative drills after every lesson.",
  },
  {
    icon: Monitor,
    title: "15 Computer-Based Mock Tests",
    desc: "The real exam screen, before exam day.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracker",
    desc: "See what improved and what needs work.",
  },
  {
    icon: Sparkles,
    title: "Instant Writing & Speaking Evaluation",
    desc: "Band-level feedback on your answers.",
  },
];

const BONUS_INCLUDES = [
  { icon: FileText, title: "IELTS Free Resources" },
  { icon: GraduationCap, title: "Scholarship Information" },
  { icon: Pencil, title: "SOP Generator" },
  { icon: Users, title: "50+ University Network Access" },
  { icon: Library, title: "Access to Other Free Courses" },
  { icon: Percent, title: "10% Cashback on Every Referral" },
];

/* ───────────────────────── atoms ───────────────────────── */

const wrap = "max-w-[1240px] mx-auto px-[clamp(20px,4.5vw,56px)]";
const sectionY = "py-[clamp(64px,8vw,104px)]";

function Heading({
  title,
  desc,
  dark = false,
  className = "",
}: {
  title: string;
  desc?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2
        className="font-display font-semibold leading-[1.4] max-w-[720px]"
        style={{ fontSize: "clamp(26px,3.1vw,40px)", color: dark ? "#fff" : "var(--ib-ink)" }}
      >
        <BengaliText>{title}</BengaliText>
      </h2>
      {desc && (
        <p
          className="mt-4 text-[16.5px] leading-[1.9] max-w-[600px]"
          style={{ color: dark ? "#B7C4D6" : "var(--ib-body)" }}
        >
          <BengaliText>{desc}</BengaliText>
        </p>
      )}
    </div>
  );
}

function Cta({
  offer,
  tone = "light",
  full = false,
}: {
  offer: Offer;
  tone?: "light" | "dark";
  full?: boolean;
}) {
  const dark = tone === "dark";
  const className = `ib-cta group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-[15px] text-[16px] font-bold text-center leading-[1.4] ${
    full ? "w-full" : ""
  }`;
  const style = {
    background: dark ? "var(--ib-mint)" : "var(--ib-brand)",
    color: dark ? "#052117" : "#fff",
    boxShadow: dark
      ? "0 14px 30px -14px rgba(124,240,189,0.6)"
      : "0 14px 30px -14px rgba(20,133,90,0.7)",
  };

  if (offer.versionOptions?.length) {
    return (
      <HeroVersionSelectorButton
        versions={offer.versionOptions}
        label={offer.label}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Link
      href={offer.href}
      className={className}
      style={style}
    >
      {offer.mode === "enrolled" && <Play className="w-[14px] h-[14px]" fill="currentColor" />}
      <BengaliText>{offer.label}</BengaliText>
      {offer.mode !== "enrolled" && (
        <ArrowRight className="w-[16px] h-[16px] shrink-0" strokeWidth={2.4} />
      )}
    </Link>
  );
}

/**
 * The offer. Everything price-related lives here: the price, the waitlist scholarship
 * and the form or button. Deliberately box-less — just a flat price line, CTA and perks.
 */
function OfferCard({
  offer,
  note,
  dark = false,
  className = "",
  compact = false,
}: {
  offer: Offer;
  note?: string;
  dark?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const isWaitlist = offer.mode === "waitlist";
  const isEnrolled = offer.mode === "enrolled";
  const hasScholarship = isWaitlist && offer.scholarshipPercent > 0;
  const headline = offer.price;

  const ink = dark ? "#FFFFFF" : "var(--ib-ink)";
  const body = dark ? "#B7C4D6" : "var(--ib-body)";
  const muted = dark ? "#8FA0B8" : "var(--ib-muted)";
  const line = dark ? "rgba(255,255,255,0.14)" : "var(--ib-line)";

  return (
    <div className={className}>
      {isEnrolled ? (
        <div>
          <div
            className="font-display text-[20px] font-semibold leading-[1.5]"
            style={{ color: ink }}
          >
            <BengaliText>আপনি এই কোর্সে ভর্তি আছেন</BengaliText>
          </div>
          <p className="mt-2 mb-6 text-[14.5px] leading-[1.8]" style={{ color: body }}>
            <BengaliText>যেখানে থেমেছিলেন, সেখান থেকেই আবার শুরু করুন।</BengaliText>
          </p>
          <Cta offer={offer} tone={dark ? "dark" : "light"} full />
        </div>
      ) : compact ? (
        <div>
          <div className="flex items-end justify-between gap-x-4 gap-y-2 flex-wrap">
            <div>
              <div
                className="text-[12px] font-bold tracking-[0.08em] uppercase"
                style={{ color: muted }}
              >
                <BengaliText>কোর্স ফি</BengaliText>
              </div>
              <div className="mt-1 flex items-baseline gap-x-2.5 gap-y-1 flex-wrap">
                <span
                  className="font-display font-bold leading-none tabular-nums"
                  style={{ fontSize: "clamp(32px,4.2vw,44px)", color: ink }}
                >
                  <BengaliText>{headline}</BengaliText>
                </span>
                {offer.originalPrice && (
                  <s className="text-[15px] font-medium" style={{ color: muted }}>
                    {offer.originalPrice}
                  </s>
                )}
              </div>
            </div>
            {offer.savings && (
              <span
                className="mb-1 rounded-md px-2.5 py-1 text-[12px] font-bold whitespace-nowrap"
                style={{ background: "var(--ib-mint)", color: "#052117" }}
              >
                Save {offer.savings}
              </span>
            )}
          </div>

          {offer.dealLabel && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-bold tracking-[0.04em]"
                style={{
                  border: dark ? "1px solid rgba(255,255,255,0.24)" : "1px solid var(--ib-line)",
                  color: ink,
                }}
              >
                <Flag
                  className="h-[12px] w-[12px] shrink-0"
                  strokeWidth={2.6}
                  style={{ color: "var(--ib-brand-2)" }}
                />
                {offer.dealLabel}
              </span>
              {offer.dealNote && (
                <span className="text-[12.5px] font-medium leading-[1.6]" style={{ color: muted }}>
                  <BengaliText>{offer.dealNote}</BengaliText>
                </span>
              )}
            </div>
          )}

          {hasScholarship ? (
            <p
              className="mt-3 flex items-start gap-2 text-[13px] leading-[1.7]"
              style={{ color: body }}
            >
              <Gift
                className="mt-[2px] h-[14px] w-[14px] shrink-0"
                strokeWidth={2.2}
                style={{ color: "var(--ib-brand-2)" }}
              />
              <span>
                <span
                  className="font-bold"
                  style={{ color: dark ? "#A9F5D5" : "var(--ib-brand-2)" }}
                >
                  <BengaliText>{`${toBn(offer.scholarshipPercent)}% ওয়েটলিস্ট স্কলারশিপ — ওয়েটলিস্টে জয়েন করলেই`}</BengaliText>
                </span>
              </span>
            </p>
          ) : offer.price ? (
            <p className="mt-2.5 text-[13px]" style={{ color: muted }}>
              <BengaliText>লাইফটাইম অ্যাক্সেসসহ এককালীন ফি।</BengaliText>
            </p>
          ) : null}

          {note && (
            <p className="mt-2.5 text-[13px] leading-[1.7]" style={{ color: body }}>
              <BengaliText>{note}</BengaliText>
            </p>
          )}

          <div className="mt-4">
            {isWaitlist && offer.showWaitlistForm ? (
              <WaitlistForm
                slug={offer.slug}
                title={offer.title}
                discountPercent={offer.scholarshipPercent}
              />
            ) : (
              <Cta offer={offer} tone={dark ? "dark" : "light"} full />
            )}
          </div>

          <div
            className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-4"
            style={{ borderTop: `1px solid ${line}` }}
          >
            {["লাইফটাইম অ্যাক্সেস", `${toBn(MOCK_TEST_COUNT)}টি মক টেস্ট ফ্রি`].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium"
                style={{ color: body }}
              >
                <Check
                  className="h-[13px] w-[13px] shrink-0"
                  strokeWidth={3}
                  style={{ color: dark ? "#7CF0BD" : "var(--ib-brand)" }}
                />
                <BengaliText>{t}</BengaliText>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-baseline gap-x-3 flex-wrap">
            <span className="text-[13.5px] font-bold tracking-[0.06em]" style={{ color: muted }}>
              <BengaliText>কোর্স ফি</BengaliText>
            </span>
            {offer.originalPrice && (
              <s className="text-[15px] font-medium" style={{ color: muted }}>
                {offer.originalPrice}
              </s>
            )}
          </div>

          {headline && (
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span
                className="font-display font-bold leading-none tabular-nums"
                style={{ fontSize: "clamp(44px,5.4vw,56px)", color: ink }}
              >
                <BengaliText>{headline}</BengaliText>
              </span>
              {offer.savings && (
                <span
                  className="mb-2 rounded-md px-2.5 py-1 text-[12.5px] font-bold"
                  style={{ background: "var(--ib-mint)", color: "#052117" }}
                >
                  Save {offer.savings}
                </span>
              )}
            </div>
          )}

          {offer.dealLabel && (
            <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-bold tracking-[0.04em]"
                style={{
                  border: dark ? "1px solid rgba(255,255,255,0.24)" : "1px solid var(--ib-line)",
                  color: ink,
                }}
              >
                <Flag
                  className="h-[13px] w-[13px] shrink-0"
                  strokeWidth={2.6}
                  style={{ color: "var(--ib-brand-2)" }}
                />
                {offer.dealLabel}
              </span>
              {offer.dealNote && (
                <span className="text-[13px] font-medium leading-[1.6]" style={{ color: muted }}>
                  <BengaliText>{offer.dealNote}</BengaliText>
                </span>
              )}
            </div>
          )}

          {hasScholarship ? (
            <p
              className="mt-4 flex items-start gap-2.5 text-[14px] leading-[1.75]"
              style={{ color: body }}
            >
              <Gift
                className="mt-[2px] h-[16px] w-[16px] shrink-0"
                strokeWidth={2.2}
                style={{ color: "var(--ib-brand-2)" }}
              />
              <span>
                <span
                  className="font-bold"
                  style={{ color: dark ? "#A9F5D5" : "var(--ib-brand-2)" }}
                >
                  <BengaliText>{`${toBn(offer.scholarshipPercent)}% ওয়েটলিস্ট স্কলারশিপ — ওয়েটলিস্টে জয়েন করলেই`}</BengaliText>
                </span>
              </span>
            </p>
          ) : offer.price ? (
            <p className="mt-3 text-[13.5px]" style={{ color: muted }}>
              <BengaliText>লাইফটাইম অ্যাক্সেসসহ এককালীন ফি।</BengaliText>
            </p>
          ) : null}

          {note && (
            <p className="mt-3 text-[14px] leading-[1.75]" style={{ color: body }}>
              <BengaliText>{note}</BengaliText>
            </p>
          )}

          <div className="mt-7">
            {isWaitlist && offer.showWaitlistForm ? (
              <WaitlistForm
                slug={offer.slug}
                title={offer.title}
                discountPercent={offer.scholarshipPercent}
              />
            ) : (
              <Cta offer={offer} tone={dark ? "dark" : "light"} full />
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 pt-5" style={{ borderTop: `1px solid ${line}` }}>
            {["লাইফটাইম অ্যাক্সেস", `${toBn(MOCK_TEST_COUNT)}টি কম্পিউটার-বেসড মক টেস্ট, ফ্রি`].map(
              (t) => (
                <div
                  key={t}
                  className="flex items-start gap-2.5 text-[14px] leading-[1.7]"
                  style={{ color: body }}
                >
                  <Check
                    className="mt-[4px] h-[15px] w-[15px] shrink-0"
                    strokeWidth={3}
                    style={{ color: dark ? "#7CF0BD" : "var(--ib-brand)" }}
                  />
                  <BengaliText>{t}</BengaliText>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function LandingHeader({
  href,
  label,
  versions,
}: {
  href: string;
  label: string;
  versions?: HeroVersionOption[];
}) {
  return (
    <header className="ib-header">
      <div className="ib-header-inner">
        <Link
          href="/programs/ielts-band-score-machine"
          className="ib-wordmark"
          aria-label="IELTS Band Score Machine — home"
        >
          <span className="ib-wordmark-name">
            <span className="ib-wordmark-badge">IELTS</span>
            <span>Band Score Machine</span>
          </span>
        </Link>

        <nav className="ib-nav" aria-label="কোর্স নেভিগেশন">
          <a href="#ielts-hero">কোর্স সম্পর্কে</a>
          <a href="#included">কী পাচ্ছেন</a>
          <a href="#mock-tests">মক টেস্ট</a>
          <a href="#curriculum">কারিকুলাম</a>
          <Link href="/faq">FAQ</Link>
        </nav>

        {versions?.length ? (
          <HeroVersionSelectorButton
            versions={versions}
            label={label}
            className="ib-header-cta group"
            leadingDot
          />
        ) : (
          <Link href={href} className="ib-header-cta">
            <span className="ib-live-dot h-2 w-2 rounded-full bg-[#041E14]" aria-hidden="true" />
            <BengaliText>{label}</BengaliText>
            <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}

function HeroSingleOfferDock({ offer, note }: { offer: Offer; note?: string }) {
  const finePrint = offer.dealNote ?? note;

  return (
    <div id="enroll-options" className="mt-5 max-w-[560px] scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5B6B65]">
            One-time fee · Lifetime access
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2.5">
            <span className="font-display text-[30px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#0F1F1A] sm:text-[34px]">
              <BengaliText>{offer.price}</BengaliText>
            </span>
            {offer.originalPrice && (
              <s className="text-[14px] font-medium tabular-nums text-[#8A9690]">
                <BengaliText>{offer.originalPrice}</BengaliText>
              </s>
            )}
            {offer.savings && (
              <span className="rounded-full bg-[#E3F4EC] px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-[#0D7A55]">
                Save {offer.savings}
              </span>
            )}
          </div>
        </div>

        {offer.endsAt && <HeroDealTimer endsAt={offer.endsAt} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <HeroDirectCtaButton
          href={offer.href}
          label={offer.mode === "enrolled" ? offer.label : "এখনই ভর্তি হোন — Instant Access"}
          subPrice={offer.price}
          enrolled={offer.mode === "enrolled"}
          contentId={offer.slug}
          contentName={offer.title}
          numericPrice={offer.numericPrice}
        />

        {offer.previewHref && offer.mode !== "enrolled" && (
          <Link
            href={offer.previewHref}
            className="inline-flex min-h-[54px] items-center gap-2.5 rounded-[10px] px-5 text-[14.5px] font-medium text-[#0F1F1A] transition-colors hover:bg-white"
            style={{
              border: "1px solid #E4E8E4",
              background: "transparent",
            }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "#E3F4EC", color: "#0D7A55" }}
            >
              <Play className="h-3 w-3 ml-[1px]" fill="currentColor" />
            </span>
            <span>ফ্রি প্রিভিউ</span>
          </Link>
        )}
      </div>

      {finePrint && (
        <p className="mt-2 text-[12px] leading-[1.6] text-[#5B6B65]">
          <BengaliText>{finePrint}</BengaliText>
        </p>
      )}
    </div>
  );
}

function HeroEnrollmentProof({
  studentCount,
  studentAvatars,
}: {
  studentCount: number;
  studentAvatars: HeroStudentAvatar[];
}) {
  if (studentCount <= 0) return null;

  const avatarSlots =
    studentAvatars.length > 0
      ? studentAvatars.slice(0, 4)
      : [
          { name: "রাফি", avatar: null },
          { name: "তানজিলা", avatar: null },
          { name: "সাকিব", avatar: null },
          { name: "নুসরাত", avatar: null },
        ];

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3.5 border-t border-[#E4E8E4] pt-4">
      <div className="flex items-center -space-x-2" aria-hidden="true">
        {avatarSlots.map((s, idx) =>
          s.avatar ? (
            <img
              key={`${s.name}-${idx}`}
              src={s.avatar}
              alt=""
              loading="lazy"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-[#FAFAF7]"
            />
          ) : (
            <span
              key={`${s.name}-${idx}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[10.5px] font-bold text-[#041E14] ring-2 ring-[#FAFAF7]"
              style={{
                background:
                  idx % 2 === 0
                    ? "linear-gradient(135deg, #8FF6C8, #3CD58E)"
                    : "linear-gradient(135deg, #BAE6FD, #60A5FA)",
              }}
            >
              {Array.from(s.name.trim())[0] || "শি"}
            </span>
          ),
        )}
      </div>

      <p className="max-w-[430px] text-[13px] leading-[1.6] text-[#5B6B65]">
        <strong className="font-semibold text-[#0F1F1A]">
          <BengaliText>{`${toBn(studentCount)}+ শিক্ষার্থী`}</BengaliText>
        </strong>
        <BengaliText> ইতিমধ্যে প্রস্তুতি নিচ্ছেন। টিপস মুখস্থ নয়, আসল পরীক্ষার মতো প্র্যাকটিস।</BengaliText>
      </p>
    </div>
  );
}

function Hero({
  offer,
  versions,
  title,
  pricingNote,
  studentCount,
  studentAvatars,
}: {
  offer: Offer;
  versions?: HeroVersionOption[];
  title: string;
  pricingNote?: string;
  studentCount: number;
  studentAvatars: HeroStudentAvatar[];
}) {
  return (
    <section
      id="ielts-hero"
      className="relative overflow-hidden"
      aria-label={title}
      style={{
        background:
          "radial-gradient(800px 500px at 86% 18%, rgba(13,122,85,0.07), transparent 64%), #FAFAF7",
      }}
    >
      <div className="relative mx-auto max-w-[1160px] px-6 pb-10 pt-[104px] sm:pt-[118px] lg:pb-[48px]">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <h1
              className="font-display font-semibold tracking-[-0.035em] text-[#0F1F1A]"
              style={{ lineHeight: 1.12 }}
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-display text-[clamp(38px,4.5vw,52px)] font-black leading-none tracking-[-0.09em] text-[#E11D2E]">
                  IELTS
                </span>
                <span aria-hidden="true" className="h-10 w-[2px] bg-[#D8E3DC]" />
                <span className="flex flex-col leading-none">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#617068]">
                    Band Score
                  </span>
                  <span className="mt-1 font-display text-[clamp(26px,3.1vw,36px)] font-bold tracking-[-0.045em] text-[#0F1F1A]">
                    Machine
                  </span>
                </span>
              </span>
              <span className="mt-3 block text-balance text-[clamp(22px,2.6vw,30px)] font-semibold leading-[1.4] text-[#0D7A55]">
                <BengaliText>আপনার ব্যান্ড স্কোর বাড়বে সিস্টেমেটিক প্রসেসে</BengaliText>
              </span>
            </h1>

            <p className="mt-4 max-w-[540px] text-[16px] leading-[1.8] text-[#5B6B65] sm:text-[17px]">
              <BengaliText>
                প্রতিটি টপিক ভেঙে ভেঙে শেখানো সেলফ পেইসড এক্সপ্লেইনার লেসন, সাথে ১৫টি ফ্রী কম্পিউটার বেইজড মক টেস্ট, কুইজ, প্র্যাকটিস, বই, লাইভ ক্লাস। কোথায় নম্বর কাটছে, কীভাবে ঠিক করবেন—সব দেখতে পাবেন।
              </BengaliText>
            </p>

            {versions && versions.length > 0 ? (
              <HeroVersionSelectorDock versions={versions} />
            ) : (
              <>
                {offer.mode === "waitlist" && (
                  <div className="mt-4">
                    <Countdown target={LAUNCH_DATE} />
                  </div>
                )}

                {offer.mode === "buy" && offer.price ? (
                  <HeroSingleOfferDock offer={offer} note={pricingNote} />
                ) : (
                  <div className="mt-5 max-w-[560px]">
                    <OfferCard offer={offer} note={pricingNote} compact />
                  </div>
                )}
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#5B6B65]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#0D7A55]" strokeWidth={2.6} />
                <BengaliText>লাইভ সাপোর্ট</BengaliText>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#0D7A55]" strokeWidth={2.6} />
                <BengaliText>লাইফটাইম অ্যাক্সেস</BengaliText>
              </span>
            </div>

            <HeroEnrollmentProof
              studentCount={studentCount}
              studentAvatars={studentAvatars}
            />

            <Link
              href="/refund"
              aria-label="৩ দিনের মধ্যে ১০০% রিফান্ড — রিফান্ড পলিসি দেখুন"
              className="group mt-3 flex min-h-[60px] max-w-[500px] items-center justify-between gap-3 rounded-[6px] border border-[#A8DCC2] border-l-[4px] bg-[#E9F7EF] px-4 py-3 text-[#0D7A55] shadow-[0_6px_18px_rgba(13,122,85,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#0D7A55] hover:bg-[#DFF3E8] hover:shadow-[0_10px_24px_rgba(13,122,85,0.13)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-white">
                  <Check className="h-4 w-4" strokeWidth={2.8} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[13.5px] font-bold leading-tight">
                    <BengaliText>৩ দিনের মধ্যে ১০০% রিফান্ড</BengaliText>
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold underline decoration-[#0D7A55]/40 underline-offset-2">
                    <BengaliText>রিফান্ড পলিসি দেখুন</BengaliText>
                  </span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <Reveal delay={0.12}>
            <BandScoreMachineConsole />
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-[#E4E8E4] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {HERO_RIBBON.map((item) => (
              <div key={item.label}>
                <div className="font-display text-[15px] font-semibold text-[#0F1F1A]">
                  <BengaliText>{item.label}</BengaliText>
                </div>
                <div className="mt-0.5 text-[13px] leading-[1.5] text-[#5B6B65]">
                  {item.englishSub ? item.sub : <BengaliText>{item.sub}</BengaliText>}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── what you get ───────────────────────── */

function IncludedSection() {
  return (
    <section
      id="included"
      className="scroll-mt-24 py-[clamp(56px,7vw,84px)]"
      style={{ background: "#F7F9FC" }}
    >
      <div className={wrap}>
        <Reveal>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[680px]">
              <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#0F6B48]">
                What you get / 01
              </div>
              <h2
                className="mt-3 font-display font-semibold leading-[1.2] tracking-[-0.035em] text-[#122043]"
                style={{ fontSize: "clamp(30px,3.6vw,44px)" }}
              >
                Everything for Band 7+, in one place.
              </h2>
              <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.8] text-[#3A4761]">
                <BengaliText>মূল প্রস্তুতি আর ফ্রি বোনাস—সব একসাথে, কোনো কনফিউশন ছাড়াই।</BengaliText>
              </p>
            </div>
            <div className="shrink-0 rounded-full border border-[#E1E7EF] bg-white px-3.5 py-1.5 font-mono text-[11px] font-semibold text-[#64728A]">
              5 core · 6 bonuses
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-9 grid gap-4 lg:grid-cols-2">
            <div className="ib-card-motion rounded-[6px] border border-[#E6EBF1] bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-[#EEF2F7] pb-4">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#0F6B48]">
                    Core program / 05
                  </div>
                  <h3 className="mt-1.5 font-display text-[20px] font-semibold tracking-[-0.02em] text-[#122043]">
                    What the course includes
                  </h3>
                </div>
                <span className="rounded-full bg-[#F2F6F3] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#0F6B48]">
                  INCLUDED
                </span>
              </div>

              <ul className="mt-2 divide-y divide-[#F0F3F8]">
                {CORE_INCLUDES.map(({ title, desc }) => (
                  <li key={title} className="flex items-start gap-3 py-3.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E8F7F1] text-[#0F6B48]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-[14.5px] font-semibold leading-[1.4] text-[#122043]">
                        {title}
                      </div>
                      <div className="mt-0.5 text-[12.5px] leading-[1.6] text-[#7A8697]">
                        {desc}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ib-card-motion rounded-[6px] bg-[#0C1A33] p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7CF0BD]">
                    Bonus layer / 06
                  </div>
                  <h3 className="mt-1.5 font-display text-[20px] font-semibold tracking-[-0.02em]">
                    Free extras with enrollment
                  </h3>
                </div>
                <Gift className="h-5 w-5 shrink-0 text-[#7CF0BD]" strokeWidth={2.2} />
              </div>

              <ul className="mt-2 divide-y divide-white/10">
                {BONUS_INCLUDES.map(({ icon: Icon, title }) => (
                  <li
                    key={title}
                    className="flex items-center gap-3 py-3 text-[13.5px] text-white/75"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[#7CF0BD]">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ib-card-motion mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[#DCEEE5] bg-[#F2FAF6] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white text-[#0F6B48]">
                <InfinityIcon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E8D80]">
                  Included bonus
                </div>
                <div className="mt-1 font-display text-[18px] font-semibold tracking-[-0.02em] text-[#122043]">
                  Lifetime access
                </div>
              </div>
            </div>
            <p className="text-[12.5px] text-[#6E8D80]">
              One payment. Every future update included.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── the system: learn → practice → measure ───────────────────────── */

function SystemSection({
  lessonCount,
  moduleCount,
  hasBook,
}: {
  lessonCount: number;
  moduleCount: number;
  hasBook: boolean;
}) {
  const steps = [
    {
      icon: BookOpen,
      verb: "শিখুন",
      title: "সেলফ-পেসড এক্সপ্লেইনার লেসন",
      text: "প্রতিটা টপিক সহজ ভাষায় ভেঙে বোঝানো। নিজের সুবিধামত সময়ে দেখুন।",
      chip: `${toBn(moduleCount)} মডিউল, ${toBn(lessonCount)}টি লেসন`,
    },
    {
      icon: Pencil,
      verb: "প্র্যাকটিস করুন",
      title: "মডিউল শেষে চ্যালেঞ্জ",
      text: hasBook
        ? "প্রতিটি লেসনের সাথেই রয়েছে রিজেনারেটিভ কুইজ, প্রতিবার কুইজ দিন নতুন নতুন প্রশ্নে"
        : "যা শিখবেন, সাথে সাথে কাজে লাগান। প্রতিটা মডিউল শেষে একটা করে চ্যালেঞ্জ।",
      chip: hasBook ? "ডিজিটাল বইসহ" : "প্রতি মডিউলে একটা",
    },
    {
      icon: Monitor,
      verb: "নিজেকে যাচাই করুন",
      title: `${N}টি কম্পিউটার-বেসড মক টেস্ট`,
      text: "রিডিং, রাইটিং আর লিসেনিং। পরীক্ষার মতো টাইমার আর স্ক্রিনে, ঘরে বসেই।",
      chip: "প্যাকেজের সাথে ফ্রি",
    },
  ];

  return (
    <section className={sectionY} style={{ background: "#fff" }}>
      <div className={wrap}>
        <Reveal>
          <Heading title={COPY.systemTitle} desc={COPY.systemDesc} />
        </Reveal>

        <div className="mt-10 grid gap-3 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] md:items-center">
          {steps.map((s, i) => (
            <div key={s.verb} className="contents">
              <Reveal delay={0.12 + i * 0.18} className="h-full">
                <article className="ib-card-motion group h-full rounded-[6px] border border-[#E4E8E4] bg-[#FCFDFC] p-5 transition-colors hover:border-[#A8DCC2] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#0C1A33] font-display text-[16px] font-bold tabular-nums text-white"
                    >
                      {toBn(i + 1)}
                    </span>
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#89958E]">
                      Step 0{i + 1}
                    </span>
                  </div>
                  <h3
                    className="mt-5 font-display text-[22px] font-semibold leading-[1.4]"
                    style={{ color: "var(--ib-ink)" }}
                  >
                    <BengaliText>{s.verb}</BengaliText>
                  </h3>
                  <div className="mt-1 text-[14px] font-semibold" style={{ color: "var(--ib-brand-2)" }}>
                    <BengaliText>{s.title}</BengaliText>
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.8]" style={{ color: "var(--ib-body)" }}>
                    <BengaliText>{s.text}</BengaliText>
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "var(--ib-fog)", color: "var(--ib-ink)" }}
                  >
                    <s.icon
                      className="h-[14px] w-[14px]"
                      strokeWidth={2}
                      style={{ color: "var(--ib-brand-2)" }}
                    />
                    <BengaliText>{s.chip}</BengaliText>
                  </span>
                </article>
              </Reveal>
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center py-1" aria-hidden="true">
                  <ArrowRight
                    className="ib-step-arrow h-5 w-5 rotate-90 text-[#0D7A55] md:rotate-0"
                    style={{ animationDelay: `${i * 0.32}s` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── mock tests ───────────────────────── */

function MockSection({ offer }: { offer: Offer }) {
  return (
    <section
      id="mock-tests"
      className={`ib-dark ${sectionY}`}
      style={{ background: "var(--ib-navy)" }}
    >
      <div className={wrap}>
        <Reveal>
          <Heading title={COPY.mockTitle} desc={COPY.mockDesc} dark />
        </Reveal>
        <Reveal>
          <SkillTabs />
        </Reveal>
        <Reveal>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
            {offer.mode !== "enrolled" && <Cta offer={offer} tone="dark" />}
            <span
              className="inline-flex items-center gap-2 text-[14px]"
              style={{ color: "#9FB0C7" }}
            >
              <Monitor className="w-[16px] h-[16px]" style={{ color: "var(--ib-mint)" }} />
              <BengaliText>{COPY.mockNote}</BengaliText>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── curriculum ───────────────────────── */

function CurriculumSection({
  curriculum,
  details,
  offer,
  lessonCount,
  moduleCount,
}: {
  curriculum: CurriculumSection;
  details: CourseDetails;
  offer: Offer;
  lessonCount: number;
  moduleCount: number;
}) {
  const facts = [
    { k: "Format", v: "Self-paced explainers" },
    { k: "Level", v: details.level },
    { k: "Medium", v: details.language },
    { k: "Pace", v: details.pace },
    { k: "Access", v: "Lifetime" },
    { k: "Total content", v: `${moduleCount} modules · ${lessonCount} lessons` },
  ].filter((r) => r.v && r.v !== "—");

  const explorerModules: CurriculumModuleItem[] = curriculum.modules.map((m, i) => {
    const key: CurriculumModuleItem["skillKey"] = /speaking/i.test(m.title)
      ? "speaking"
      : /writing/i.test(m.title)
        ? "writing"
        : /listening/i.test(m.title)
          ? "listening"
          : /reading/i.test(m.title)
            ? "reading"
            : "general";

    return {
      number: String(i + 1).padStart(2, "0"),
      skillKey: key,
      skillTag: `${key} · module ${String(i + 1).padStart(2, "0")}`,
      title: m.title,
      lessonCount: m.lessonCount,
      capstone: m.capstone ?? "",
      lessons: m.items.map((item) => ({ title: item })),
    };
  });

  return (
    <section id="curriculum" className={sectionY} style={{ background: "#fff" }}>
      <div
        className={`${wrap} grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-12 lg:gap-16`}
      >
        <div className="lg:sticky lg:top-28 self-start">
          <Reveal>
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#0F6B48]">
              Curriculum / {String(moduleCount).padStart(2, "0")} modules
            </div>
            <h2
              className="mt-3 font-display font-semibold leading-[1.18] tracking-[-0.035em]"
              style={{ fontSize: "clamp(30px,3.4vw,42px)", color: "#122043" }}
            >
              Four skills.
              <br />
              One clear path.
            </h2>
            <p className="mt-4 text-[14.5px] leading-[1.85] text-[#5B6478]">
              <BengaliText>{curriculum.subtitle}</BengaliText>
            </p>

            {details.targetBand && (
              <div className="ib-card-motion mt-7 flex items-end justify-between gap-4 rounded-[6px] border border-[#E4E9F1] bg-[#F7F9FC] px-5 py-4">
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#64728A]">
                    Target band
                  </div>
                  <div className="mt-1 text-[13px] text-[#8A94A6]">IELTS</div>
                </div>
                <div className="font-display text-[32px] font-bold leading-none tracking-[-0.03em] text-[#122043]">
                  {details.targetBand.value.replace(/^Band\s*/i, "")}
                </div>
              </div>
            )}

            <dl className="mt-6 border-t border-[#E7EBF1]">
              {facts.map((r) => (
                <div
                  key={r.k}
                  className="flex items-start justify-between gap-6 border-b border-[#EEF2F7] py-3 text-[13.5px]"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8A94A6]">
                    {r.k}
                  </dt>
                  <dd className="max-w-[62%] text-right font-medium leading-[1.5] text-[#2C3A52]">
                    {r.v as string}
                  </dd>
                </div>
              ))}
            </dl>

            {offer.mode !== "enrolled" && (
              <div className="mt-6 hidden lg:block">
                <Cta offer={offer} full />
              </div>
            )}
          </Reveal>
        </div>

        <div>
          <Reveal delay={0.08}>
            <CurriculumExplorer modules={explorerModules} />

            {curriculum.note && (
              <p className="mt-6 text-[13.5px] leading-[1.85] text-[#7A8697]">
                <BengaliText>{curriculum.note}</BengaliText>
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HighlightsSection({
  details,
  lessonCount,
}: {
  details: CourseDetails;
  lessonCount: number;
}) {
  // Fallback only states things that are always true for this course.
  const highlights = details.highlights ?? [
    {
      title: `${toBn(lessonCount)}টি সেলফ-পেসড এক্সপ্লেইনার লেসন`,
      sub: "নিজের সময়মতো, নিজের গতিতে দেখুন",
    },
    { title: `${N}টি ফ্রি কম্পিউটার-বেসড মক টেস্ট`, sub: "রিডিং, রাইটিং আর লিসেনিং" },
    { title: "লাইফটাইম অ্যাক্সেস", sub: "আপনার সুবিধামত সময়ে কোর্স করুন" },
  ];
  return (
    <section className={sectionY} style={{ background: "#fff" }}>
      <div className={wrap}>
        <Reveal>
          <Heading title="কোর্সে যা শিখবেন" desc={details.highlightsDesc} />
        </Reveal>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
          {highlights.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.1} className="flex">
              <div className="flex items-start gap-4">
                <span
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--ib-fog)" }}
                >
                  <Check
                    className="w-[16px] h-[16px]"
                    strokeWidth={3}
                    style={{ color: "var(--ib-brand-2)" }}
                  />
                </span>
                <div>
                  <h3
                    className="font-display text-[17px] font-semibold leading-[1.5]"
                    style={{ color: "var(--ib-ink)" }}
                  >
                    <BengaliText>{item.title}</BengaliText>
                  </h3>
                  <p
                    className="mt-1.5 text-[15px] leading-[1.8]"
                    style={{ color: "var(--ib-body)" }}
                  >
                    <BengaliText>{item.sub}</BengaliText>
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── book ───────────────────────── */

function BookBand({ book }: { book: CourseBook }) {
  return (
    <section className="py-[clamp(52px,7vw,88px)]" style={{ background: "#F2F6F3" }}>
      <div className={wrap}>
        <Reveal>
          <div className="ib-card-motion mx-auto grid max-w-[1080px] overflow-hidden rounded-[6px] border border-[#DDE7E0] bg-white md:grid-cols-[0.78fr_1.22fr]">
            <div className="relative isolate flex min-h-[360px] items-center justify-center overflow-hidden bg-[#0C1A33] p-8 sm:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-[#0D7A55]/30 blur-3xl"
              />
              <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-[4px] border border-white/15 bg-white/[0.08] px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80">
                <FileText className="h-3.5 w-3.5 text-[#7CF0BD]" />
                Companion PDF
              </span>
              <Image
                src={book.image}
                alt={book.title}
                width={900}
                height={1200}
                sizes="(max-width: 768px) 190px, 220px"
                className="relative z-[1] w-[170px] rounded-[6px] shadow-[0_28px_55px_-25px_rgba(0,0,0,0.75)] transition-transform duration-500 hover:scale-[1.025] sm:w-[200px]"
              />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-2 text-[10px] font-medium text-white/55">
                <span>READ · REVISE · PRACTISE</span>
                <span className="font-mono text-[#7CF0BD]">PDF / 01</span>
              </div>
            </div>

            <div className="p-6 sm:p-9 lg:p-10">
              <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#0D7A55]">
                A complete study companion
              </div>
              <h2
                className="mt-2 font-display text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.32] tracking-[-0.025em] text-[#0F1F1A]"
              >
                <BengaliText>{COPY.bookTitle}</BengaliText>
              </h2>
              <p className="mt-3 max-w-[600px] text-[14.5px] leading-[1.8] text-[#5B6B65]">
                <BengaliText>{book.desc}</BengaliText>
              </p>

              <ul className="mt-5 divide-y divide-[#E8ECE9] border-y border-[#E8ECE9]">
                {COPY.bookTicks.map((item, index) => (
                  <li key={item} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 font-mono text-[10px] font-semibold tabular-nums text-[#0D7A55]">
                      0{index + 1}
                    </span>
                    <span className="text-[13.5px] font-medium leading-[1.6] text-[#24332B]">
                      <BengaliText>{item}</BengaliText>
                    </span>
                  </li>
                ))}
              </ul>

              {book.includedNote && (
                <div className="mt-5 flex items-start gap-2.5 border-l-[3px] border-[#0D7A55] bg-[#E9F5EE] px-3.5 py-3 text-[12px] font-semibold leading-[1.55] text-[#0D7A55]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
                  <BengaliText>{book.includedNote}</BengaliText>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── refund policy ───────────────────────── */

function RefundSection() {
  const facts = [
    { value: "৩ দিন", label: "রিফান্ড উইন্ডো" },
    { value: "১০০%", label: "টাকা ফেরত" },
    { value: "৭–১৫", label: "কার্যদিবসে টাকা পাবেন" },
  ];

  return (
    <section id="refund" className={sectionY} style={{ background: "var(--ib-fog)" }}>
      <div className={wrap}>
        <Reveal>
          <div
            className="ib-card-motion rounded-[6px] p-[clamp(28px,4vw,44px)] relative overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid var(--ib-line)",
              boxShadow: "0 30px 60px -40px rgba(12,26,51,0.25)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-10 md:gap-14 items-start">
              <div>
                <div
                  className="text-[14px] font-semibold mb-3"
                  style={{ color: "var(--ib-brand-2)" }}
                >
                  <BengaliText>রিফান্ড পলিসি</BengaliText>
                </div>
                <h2
                  className="font-display font-semibold leading-[1.4]"
                  style={{ fontSize: "clamp(26px,3.1vw,38px)", color: "var(--ib-ink)" }}
                >
                  <BengaliText>কোর্সটা ভালো না লাগলে ৩ দিনে ১০০% টাকা ফেরত</BengaliText>
                </h2>
                <p className="mt-4 text-[16px] leading-[1.9]" style={{ color: "var(--ib-body)" }}>
                  <BengaliText>
                    কেনার ৩ দিনের মধ্যে যেকোনো কারণে কোর্সটা যদি আপনার পছন্দ না হয়, রিফান্ড দাবি
                    করলেই পুরো টাকা ফেরত পাবেন।
                  </BengaliText>
                </p>
                <div className="mt-7 grid grid-cols-3 gap-4">
                  {facts.map((f) => (
                    <div
                      key={f.label}
                      className="ib-card-motion rounded-[6px] px-3.5 py-4 text-center"
                      style={{ background: "var(--ib-fog)", border: "1px solid var(--ib-line)" }}
                    >
                      <div
                        className="font-display text-[clamp(20px,2.6vw,28px)] font-bold leading-none tabular-nums"
                        style={{ color: "var(--ib-brand-2)" }}
                      >
                        <BengaliText>{f.value}</BengaliText>
                      </div>
                      <div
                        className="mt-2 text-[12.5px] leading-[1.5]"
                        style={{ color: "var(--ib-muted)" }}
                      >
                        <BengaliText>{f.label}</BengaliText>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/refund"
                  className="inline-flex items-center gap-2 mt-8 text-[15px] font-bold"
                  style={{ color: "var(--ib-brand-2)" }}
                >
                  <BengaliText>সম্পূর্ণ রিফান্ড পলিসি দেখুন</BengaliText>
                  <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.4} />
                </Link>
              </div>

              <div
                className="ib-card-motion rounded-[6px] px-6 py-7 flex flex-col gap-5"
                style={{ border: "1px dashed var(--ib-line)", background: "var(--ib-fog)" }}
              >
                <div className="flex items-start gap-3">
                  <Check
                    className="w-[18px] h-[18px] mt-[2px] shrink-0"
                    strokeWidth={3}
                    style={{ color: "var(--ib-brand)" }}
                  />
                  <p className="text-[15px] leading-[1.8]" style={{ color: "var(--ib-ink)" }}>
                    <BengaliText>
                      কেনার <span className="font-bold">৩ দিনের মধ্যে</span> রিফান্ড দাবি করুন।
                    </BengaliText>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check
                    className="w-[18px] h-[18px] mt-[2px] shrink-0"
                    strokeWidth={3}
                    style={{ color: "var(--ib-brand)" }}
                  />
                  <p className="text-[15px] leading-[1.8]" style={{ color: "var(--ib-ink)" }}>
                    <BengaliText>
                      এপ্রুভালের পর <span className="font-bold">১০০% টাকা</span> ফেরত পাবেন।
                    </BengaliText>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check
                    className="w-[18px] h-[18px] mt-[2px] shrink-0"
                    strokeWidth={3}
                    style={{ color: "var(--ib-brand)" }}
                  />
                  <p className="text-[15px] leading-[1.8]" style={{ color: "var(--ib-ink)" }}>
                    <BengaliText>
                      আপনার একাউন্টে রিফান্ড যেতে <span className="font-bold">৭–১৫ কার্যদিবস</span>{" "}
                      লাগে।
                    </BengaliText>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── closing offer ───────────────────────── */

const PAYMENT_COLORS: Record<string, string> = {
  bKash: "#E2136E",
  Nagad: "#F5821F",
  Rocket: "#8C3494",
  Stripe: "#635BFF",
};

function ClosingSection({ details, offer }: { details: CourseDetails; offer: Offer }) {
  const features = details.features ?? BLUEPRINT_FEATURES;
  const pricing = details.pricing;
  const heading = details.cta?.title ?? COPY.closeTitle;
  const sub = details.cta?.desc ?? (offer.mode === "waitlist" ? COPY.closeWaitlist : COPY.closeBuy);

  return (
    <section
      id="waitlist"
      className={`ib-dark ${sectionY}`}
      style={{ background: "var(--ib-navy)" }}
    >
      <div
        className={`${wrap} grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] gap-12 lg:gap-20 items-start`}
      >
        <div>
          <Reveal>
            <Heading title={heading} desc={sub} dark />
          </Reveal>

          <h3 className="mt-12 mb-2 text-[15px] font-semibold" style={{ color: "var(--ib-mint)" }}>
            <BengaliText>{COPY.closeIncluded}</BengaliText>
          </h3>
          <Reveal delay={0.1}>
            <ul>
              {features.map(({ icon: Icon, title, desc }) => (
                <li
                  key={title}
                  className="closing-feature flex items-start gap-4 py-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Icon
                    className="w-[20px] h-[20px] mt-[5px] shrink-0"
                    strokeWidth={1.9}
                    style={{ color: "var(--ib-mint)" }}
                  />
                  <div className="min-w-0">
                    <div className="font-display text-[16.5px] font-semibold leading-[1.55] text-white">
                      <BengaliText>{title}</BengaliText>
                    </div>
                    <p className="mt-1 text-[14.5px] leading-[1.8]" style={{ color: "#9FB0C7" }}>
                      <BengaliText>{desc}</BengaliText>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:sticky lg:top-28">
          <Reveal>
            <OfferCard offer={offer} note={pricing?.note} dark />

            {pricing?.includedLine && (
              <p
                className="mt-5 text-[13.5px] leading-[1.75] text-center"
                style={{ color: "#9FB0C7" }}
              >
                <BengaliText>{pricing.includedLine}</BengaliText>
              </p>
            )}

            {pricing?.paymentMethods?.length ? (
              <div className="mt-7">
                {pricing.paymentLabel && (
                  <div className="text-[13px] mb-3 text-center" style={{ color: "#9FB0C7" }}>
                    <BengaliText>{pricing.paymentLabel}</BengaliText>
                  </div>
                )}
                <div className="flex justify-center gap-2.5 flex-wrap">
                  {pricing.paymentMethods
                    .filter((name) => name !== "Stripe")
                    .map((name) => (
                      <span
                        key={name}
                        className="rounded-xl px-5 py-2.5 text-[14px] font-extrabold bg-white"
                        style={{ color: PAYMENT_COLORS[name] ?? "#334155" }}
                      >
                        {name}
                      </span>
                    ))}
                </div>
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── page ───────────────────────── */

const dateFmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("bn-BD", { month: "short", day: "numeric", year: "numeric" });

const getCourseReviewsCached = unstable_cache(
  async (courseId: string) => {
    const reviews = await CourseReview.find({ course: courseId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return reviews.map((r: any) => ({
      id: r._id.toString(),
      rating: r.rating,
      text: r.text,
      userName: r.user?.name ?? "একজন শিক্ষার্থী",
      userAvatar: r.user?.avatar ?? null,
      date: dateFmt(r.createdAt),
    }));
  },
  ["ielts-course-reviews"],
  { revalidate: 60 },
);

export default async function IeltsFullReadinessLandingPage() {
  const program = getProgram(SLUG);

  await connectDb();

  const course = await Course.findOne({
    slug: SLUG,
    $or: [{ published: true }, { upcoming: true }],
  });

  // One session read for the whole request.
  const session = await readSession();
  const userId = session?.userId;

  /* ---- DB-only course (no static program entry) ---- */
  if (!program) {
    if (!course) notFound();

    const [enrolledDoc, reviewItems, userReviewDoc] = await Promise.all([
      userId
        ? CourseEnrollment.exists({ user: userId, course: course._id, status: "active" })
        : null,
      getCourseReviewsCached(course._id.toString()),
      userId ? CourseReview.findOne({ course: course._id, user: userId }).lean() : null,
    ]);

    return (
      <DbCoursePage
        course={course}
        enrolled={Boolean(enrolledDoc)}
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

  /* ---- Static program landing page ---- */
  const details = courseDetails[SLUG];
  const lessonCount = details ? details.modules.reduce((n, m) => n + m.lessons.length, 0) : 30;
  const moduleCount = details ? details.modules.length : 6;

  const liveCourse = program.hasDb ? course : null;
  const livePricing = liveCourse ? publicCoursePricing(liveCourse) : null;

  const [enrolledDoc, liveReviews] = await Promise.all([
    liveCourse && userId
      ? CourseEnrollment.exists({ user: userId, course: liveCourse._id, status: "active" })
      : null,
    liveCourse ? getCourseReviewsCached(liveCourse._id.toString()) : [],
  ]);

  const cta: CourseCta | undefined = liveCourse
    ? {
        courseId: liveCourse._id.toString(),
        slug: liveCourse.slug,
        enrolled: Boolean(enrolledDoc),
        paid: (liveCourse.price ?? 0) > 0,
        hasDb: true,
      }
    : undefined;

  const liveReviewItems = liveReviews as any[];

  /* ---- Version chooser: English and Bangla are separate DB courses ---- */
  const versionSlugs = ["ielts-band-score-machine-en", "ielts-band-score-machine-bn"];
  const versionCourses = await Course.find({
    slug: { $in: versionSlugs },
    $or: [{ published: true }, { upcoming: true }],
  }).lean();
  const versionCourseIds = versionCourses.map((version) => version._id);

  const allBsmCourseIds = [...(course ? [course._id] : []), ...versionCourseIds];
  const [versionEnrollments, rawStudentCount, recentEnrollments] = await Promise.all([
    userId && versionCourseIds.length > 0
      ? CourseEnrollment.find({
          user: userId,
          course: { $in: versionCourseIds },
          status: "active",
        })
          .select("course")
          .lean()
      : [],
    allBsmCourseIds.length > 0
      ? CourseEnrollment.countDocuments({
          course: { $in: allBsmCourseIds },
          status: "active",
        })
      : 0,
    allBsmCourseIds.length > 0
      ? CourseEnrollment.find({
          course: { $in: allBsmCourseIds },
          status: "active",
        })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("user", "name avatar")
          .lean()
      : [],
  ]);

  const studentCount = displayEnrollmentCount(SLUG, rawStudentCount);
  const seenAvatars = new Set<string>();
  const studentAvatars: HeroStudentAvatar[] = [];
  for (const row of recentEnrollments) {
    const u = row.user as { _id?: { toString(): string }; name?: string | null; avatar?: string | null } | null;
    const key = u?._id?.toString() ?? u?.name ?? "";
    if (key && seenAvatars.has(key)) continue;
    if (key) seenAvatars.add(key);
    studentAvatars.push({
      name: u?.name?.trim() || "শিক্ষার্থী",
      avatar: u?.avatar ?? null,
    });
    if (studentAvatars.length >= 4) break;
  }

  const enrolledVersionIds = new Set(
    versionEnrollments.map((enrollment) => enrollment.course.toString()),
  );

  const versionOptions: HeroVersionOption[] = versionSlugs
    .map((versionSlug): HeroVersionOption | null => {
      const version = versionCourses.find((item) => item.slug === versionSlug);
      if (!version) return null;

      const pricing = publicCoursePricing(version);
      const enrolled = enrolledVersionIds.has(version._id.toString());
      const upcoming = version.upcoming === true;
      const isBangla = versionSlug.endsWith("-bn");
      const language = isBangla ? "Bangla" : "English";
      const numericPrice =
        pricing.price != null ? pricing.price : (version.price ?? 0);
      const price =
        pricing.price != null
          ? pricing.price > 0
            ? formatMoney(pricing.price, "BDT")
            : "Free"
          : (version.price ?? 0) > 0
            ? formatMoney(version.price ?? 0, version.currency ?? "USD")
            : "Free";

      return {
        slug: version.slug,
        title: `${language} Version`,
        language,
        languageLabelBn: isBangla ? "বাংলা ভার্সন" : "English Version",
        languageNote: isBangla
          ? "বাংলায় সহজ ব্যাখ্যা + ফুল এক্সাম সিস্টেম"
          : "Full English instruction + Mock System",
        price,
        numericPrice: numericPrice > 0 ? numericPrice : undefined,
        originalPrice: pricing.originalPrice ?? undefined,
        savings:
          pricing.discounted && pricing.savings > 0
            ? `৳${pricing.savings.toLocaleString("en-US")}`
            : undefined,
        discountLabel: pricing.discountLabel,
        endsAt: pricing.endsAt,
        href: enrolled
          ? `/dashboard/courses/${version.slug}/learn`
          : `/programs/${version.slug}/checkout`,
        previewHref:
          !upcoming && !enrolled && hasFreePreview(version)
            ? `/dashboard/courses/${version.slug}/learn`
            : undefined,
        enrolled,
        upcoming,
      };
    })
    .filter((version): version is HeroVersionOption => Boolean(version));

  const hasVersionOptions = versionOptions.length > 0;
  const primaryVersion =
    versionOptions.find((v) => !v.upcoming) ?? versionOptions[0];

  /* ---- Offer: the single source of truth for every CTA ---- */
  const waitlistEnabled = course?.waitlistEnabled === true;
  const scholarshipPercent = waitlistEnabled ? (course?.wishlistDiscountPercent ?? 0) : 0;
  const isLive = Boolean(cta?.hasDb && liveCourse && !liveCourse.upcoming);
  const mode: Offer["mode"] = hasVersionOptions
    ? "buy"
    : cta?.enrolled
      ? "enrolled"
      : isLive
        ? "buy"
        : "waitlist";
  const showWaitlistForm = !hasVersionOptions;

  const price = hasVersionOptions
    ? undefined
    : livePricing?.price != null && livePricing.price > 0
      ? formatMoney(livePricing.price, "BDT")
      : (details?.price ?? details?.pricing?.price);
  const originalPrice = hasVersionOptions
    ? undefined
    : (livePricing?.originalPrice ?? details?.originalPrice);
  const savings = hasVersionOptions
    ? undefined
    : livePricing?.discounted
      ? `BDT ${livePricing.savings.toLocaleString("en-US")}`
      : details?.savings;
  const numericOfferPrice = parseAmount(price) ?? primaryVersion?.numericPrice;

  const offer: Offer = {
    mode,
    href: hasVersionOptions
      ? "#enroll-options"
      : mode === "enrolled"
        ? `/dashboard/courses/${cta?.slug}/learn`
        : mode === "buy"
          ? `/programs/${SLUG}/checkout`
          : showWaitlistForm
            ? "#waitlist"
            : (details?.pricing?.ctaHref ?? "/programs"),
    label: hasVersionOptions
      ? "কোর্সে ভর্তি হোন"
      : mode === "enrolled"
        ? "ক্লাসে ফিরে যান"
        : mode === "buy"
          ? "এখনই ভর্তি হোন"
          : scholarshipPercent > 0
            ? `ওয়েটলিস্টে জয়েন করে ${toBn(scholarshipPercent)}% স্কলারশিপ নিন`
            : "Join the waitlist",
    price,
    numericPrice: numericOfferPrice,
    originalPrice,
    savings,
    dealLabel: hasVersionOptions ? undefined : (livePricing?.discountLabel ?? details?.dealLabel),
    dealNote: hasVersionOptions ? undefined : details?.dealNote,
    endsAt: hasVersionOptions ? undefined : livePricing?.endsAt,
    previewHref:
      !hasVersionOptions && isLive && !cta?.enrolled && liveCourse && hasFreePreview(liveCourse)
        ? `/dashboard/courses/${SLUG}/learn`
        : undefined,
    scholarshipPercent: hasVersionOptions ? 0 : scholarshipPercent,
    showWaitlistForm,
    slug: SLUG,
    title: details?.title ?? program.title,
    versionOptions: hasVersionOptions ? versionOptions : undefined,
  };

  /* ---- Structured data ---- */
  const amount = parseAmount(price) ?? primaryVersion?.numericPrice ?? null;
  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: offer.title,
    description: details?.desc ?? program.desc,
    inLanguage: "bn",
    provider: { "@type": "Organization", name: "FlyBridge Education Group" },
    offers:
      amount !== null
        ? {
            "@type": "Offer",
            category: "Paid",
            price: amount,
            priceCurrency: /\$|USD/i.test(price ?? "") ? "USD" : "BDT",
            availability:
              mode === "waitlist" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
          }
        : undefined,
    // Only real, DB-backed ratings — never the static sample reviews.
    aggregateRating:
      liveCourse && (liveCourse.averageRating ?? 0) > 0 && liveReviewItems.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: liveCourse.averageRating,
            reviewCount: liveCourse.reviewCount ?? liveReviewItems.length,
          }
        : undefined,
  };
  const isEnrolled = mode === "enrolled";
  return (
    <div className="ib-page ielts-landing">
      <JsonLd data={courseLd} />
      <LandingPixelEvents
        contentId={SLUG}
        contentName={details?.title ?? program.title}
        value={numericOfferPrice}
        currency="BDT"
      />
      <LandingHeader
        href={offer.href}
        label={offer.label}
        versions={hasVersionOptions ? versionOptions : undefined}
      />

      <Hero
        offer={offer}
        versions={hasVersionOptions ? versionOptions : undefined}
        title={details?.title ?? program.title}
        pricingNote={details?.pricing?.note}
        studentCount={studentCount}
        studentAvatars={studentAvatars}
      />

      <IncludedSection />

      {details ? (
        <>
          <SystemSection
            lessonCount={lessonCount}
            moduleCount={moduleCount}
            hasBook={Boolean(details.book)}
          />

          <MockSection offer={offer} />

          {details.curriculum ? (
            <CurriculumSection
              curriculum={details.curriculum}
              details={details}
              offer={offer}
              lessonCount={lessonCount}
              moduleCount={moduleCount}
            />
          ) : (
            <HighlightsSection details={details} lessonCount={lessonCount} />
          )}

          {details.book && <BookBand book={details.book} />}

          {!isEnrolled && <ClosingSection details={details} offer={offer} />}
        </>
      ) : (
        <section className={`${wrap} py-[96px] text-center`}>
          <Heading
            className="mx-auto [&_h2]:mx-auto [&_p]:mx-auto"
            title="এই কোর্সটা এখনো প্রস্তুত হচ্ছে"
            desc="ভিডিও লেসন, রিসোর্স আর ফুল কারিকুলাম রেডি হলেই এখানে দেখতে পাবেন।"
          />
          <Link
            href="/programs"
            className="ib-cta mt-8 inline-flex items-center gap-2.5 font-bold text-[15px] text-white rounded-full px-7 py-[14px]"
            style={{ background: "var(--ib-brand)" }}
          >
            <BengaliText>প্রোগ্রামে ফিরে যান</BengaliText>
            <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.4} />
          </Link>
        </section>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
         .ib-page {
          --ib-ink: #0C1A33;
          --ib-navy: #0A1428;
          --ib-navy-2: #12213D;
          --ib-fog: #F0F4F8;
          --ib-line: #D9E1EB;
          --ib-body: #3A4761;
          --ib-muted: #64728A;
          --ib-brand: #14855A;
          --ib-brand-2: #0F6B48;
          --ib-mint: #7CF0BD;
          --ielts-red: #E31837;
          --ib-mark: #FFE066;
          --ib-focus: #1F5C8A;
          /* keep shared components (reviews, related cards) on their expected tokens */
          --body: #39445A;
          --line: #DDE2EC;
          color: var(--ib-body);
          background: #fff;
        }

        .ielts-landing {
          --font-display: var(--font-plus-jakarta-sans), var(--font-anek-bangla), sans-serif;
          --font-body: var(--font-plus-jakarta-sans), var(--font-anek-bangla), sans-serif;
          --font-mono: var(--font-plus-jakarta-sans), var(--font-anek-bangla), sans-serif;
        }

        .ib-header {
          position: absolute;
          z-index: 20;
          inset: 0 0 auto;
          padding: 17px clamp(20px, 5vw, 76px);
          border-bottom: 1px solid rgba(228, 232, 228, 0.9);
          background: rgba(250, 250, 247, 0.92);
          backdrop-filter: blur(14px);
        }

        .ib-header-inner {
          display: flex;
          width: min(100%, 1280px);
          min-height: 43px;
          align-items: center;
          justify-content: space-between;
          gap: 26px;
          margin: 0 auto;
        }

        .ib-wordmark {
          display: inline-flex;
          flex: 0 0 auto;
          flex-direction: column;
          gap: 3px;
          color: #0F1F1A;
          line-height: 1;
          text-decoration: none;
        }

        .ib-wordmark-name {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 18px;
          font-weight: 750;
          letter-spacing: -0.04em;
        }

        .ib-wordmark-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 7px;
          border-radius: 6px;
          background: var(--ielts-red);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.04em;
          line-height: 1;
        }

        .ib-hero-highlight {
          position: relative;
          display: inline;
          padding-block: 0.08em;
          padding-inline: 0.03em;
          background: linear-gradient(120deg, #9BF8D0 0%, #63E6AC 50%, #3CD58E 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
          color: transparent;
        }

        .ib-hero-cta:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
        }

        .ib-hero-cta:active {
          transform: translateY(0) scale(0.99);
        }

        @keyframes ibSheen {
          0% { transform: translateX(-130%) skewX(-18deg); }
          36%, 100% { transform: translateX(220%) skewX(-18deg); }
        }

        .ib-cta-sheen {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.38) 50%,
            transparent 100%
          );
          width: 46%;
          animation: ibSheen 4.4s ease-in-out infinite;
        }

        .ib-wordmark-name i {
          color: var(--ib-mint);
          font-style: normal;
        }

        .ib-wordmark-course {
          color: rgba(255, 255, 255, 0.59);
          font-size: 8px;
          font-weight: 650;
          letter-spacing: 0.19em;
        }

        .ib-wordmark-course i {
          padding: 2px 3px;
          border-radius: 2px;
          color: #fff;
          background: var(--ielts-red);
          font-style: normal;
          letter-spacing: 0.09em;
        }

        .ib-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(17px, 2.5vw, 34px);
        }

        .ib-nav a {
          color: rgba(15, 31, 26, 0.68);
          font-family: var(--font-plus-jakarta-sans), var(--font-anek-bangla), sans-serif;
          font-size: 13px;
          text-decoration: none;
          transition: color 160ms ease;
        }

        .ib-nav a:hover {
          color: #0D7A55;
        }

        .ib-header-cta {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 17px;
          border-radius: 12px;
          color: #fff;
          background: #0D7A55;
          font-family: var(--font-plus-jakarta-sans), var(--font-anek-bangla), sans-serif;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition:
            transform 170ms ease,
            background 170ms ease,
            box-shadow 170ms ease;
        }

        .ib-header-cta:hover {
          transform: translateY(-2px);
          background: #095F42;
          box-shadow: 0 11px 28px rgba(13, 122, 85, 0.2);
        }

        @media (max-width: 980px) {
          .ib-header {
            padding-inline: clamp(18px, 4vw, 42px);
          }
          .ib-nav {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .ib-header {
            padding: 12px 18px;
          }
          .ib-header-inner {
            min-height: 42px;
            gap: 10px;
          }
          .ib-wordmark-name {
            font-size: 15px;
            gap: 5px;
          }
          .ib-wordmark-badge {
            font-size: 11.5px;
            padding: 2.5px 6px;
          }
          .ib-header-cta {
            min-height: 39px;
            padding-inline: 12px;
            border-radius: 10px;
            font-size: 12px;
          }
          .ib-header-cta svg {
            width: 14px;
            height: 14px;
          }
        }

        @media (max-width: 420px) {
          .ib-header {
            padding: 10px 14px;
          }
          .ib-wordmark-name {
            font-size: 13.5px;
          }
          .ib-wordmark-badge {
            font-size: 10.5px;
            padding: 2px 5px;
          }
          .ib-header-cta {
            min-height: 36px;
            padding-inline: 10px;
            gap: 5px;
            font-size: 11.5px;
          }
          .ib-header-cta .ib-live-dot {
            display: none;
          }
        }

        /* the scholarship is the only thing on the page that gets the highlighter */
        .ib-mark {
          background: linear-gradient(180deg, transparent 12%, var(--ib-mark) 12%, var(--ib-mark) 90%, transparent 90%);
          color: #2A2100;
          padding: 0 0.35em;
          border-radius: 2px;
          -webkit-box-decoration-break: clone;
          box-decoration-break: clone;
        }

        .ib-cta { transition: transform .2s ease, filter .2s ease; }
        .ib-cta:hover { transform: translateY(-1px); filter: brightness(0.95); }

        .ib-acc details { border-top: 1px solid var(--ib-line); }
        .ib-acc details:last-child { border-bottom: 1px solid var(--ib-line); }
        .ib-acc summary { cursor: pointer; list-style: none; }
        .ib-acc summary::-webkit-details-marker { display: none; }
        .ib-chev { transition: transform .2s ease; }
        .ib-acc details[open] > summary .ib-chev { transform: rotate(180deg); }

        /* ── ambient animation: live dots, micro-interactions ── */
        @keyframes ibPulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
        @keyframes ibPop { from { transform: scale(.96); } to { transform: scale(1); } }
        @keyframes ibSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes ibFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes ibStepPulse { 0%, 100% { opacity: .45; scale: .9; } 50% { opacity: 1; scale: 1.08; } }

        .ib-live-dot, .ib-dot { animation: ibPulse 1.6s ease-in-out infinite; }
        .ib-anim-in { animation: ibSlide .4s cubic-bezier(.22,1,.36,1) both; }
        .ib-float { animation: ibFloat 7s ease-in-out infinite; }
        .ib-float:hover { animation-play-state: paused; }
        .ib-step-arrow { animation: ibStepPulse 1.45s ease-in-out infinite; }
        .ib-card-motion {
          transition: transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-color .32s ease;
        }
        @media (hover: hover) {
          .ib-card-motion:hover {
            transform: translateY(-3px);
            box-shadow: 0 18px 36px -26px rgba(15,31,26,0.24);
          }
        }
        .ib-opt {
          transition: transform .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
        }
        .ib-opt:hover { transform: translateX(3px); }
        .ib-opt:active { transform: scale(.985); }
        .ib-opt[data-on="true"] { animation: ibPop .22s ease; }

        .ib-acc summary { border-radius: 12px; transition: background .2s ease, padding-left .2s ease; margin-left: -8px; padding-left: 8px; }
        .ib-acc summary:hover { background: var(--ib-fog); }
        .closing-feature { transition: transform .2s ease, background .2s ease; border-radius: 12px; padding-left: 16px; padding-right: 16px; margin-left: -16px; margin-right: -16px; }
        .closing-feature:hover { transform: translateX(4px); }

        .ib-page a:focus-visible,
        .ib-page button:focus-visible,
        .ib-page summary:focus-visible {
          outline: 2px solid var(--ib-focus);
          outline-offset: 3px;
          border-radius: 6px;
        }
        .ib-dark a:focus-visible,
        .ib-dark button:focus-visible,
        .ib-dark summary:focus-visible { outline-color: var(--ib-mint); }

        @media (prefers-reduced-motion: reduce) {
          .ib-cta, .ib-hero-cta, .ib-chev { transition: none; }
          .ib-cta:hover, .ib-hero-cta:hover { transform: none; }
          .ib-live-dot, .ib-dot, .ib-anim-in, .ib-opt, .ib-float, .ib-step-arrow, .ib-cta-sheen { animation: none !important; transition: none !important; }
          .ib-card-motion { transition: none !important; }
          .ib-card-motion:hover { transform: none; }
          .ib-opt:hover, .ib-opt:active { transform: none; }
          .ib-acc summary, .closing-feature { transition: none; }
          .ib-acc summary:hover { background: transparent; }
          .closing-feature:hover { transform: none; }
        }
      `,
        }}
      />
    </div>
  );
}
