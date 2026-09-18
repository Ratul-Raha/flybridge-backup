import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import {
  RelatedProgramCardLanding,
  type RelatedProgramLanding,
} from "@/components/programs/related-program-card-landing";
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
  ChevronDown,
  Check,
  Clock,
  Gift,
  Headphones,
  Infinity as InfinityIcon,
  Lock,
  MessageCircle,
  Monitor,
  Pencil,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import type { CourseDoc } from "@/lib/models/course";
import { CheckoutForm } from "@/components/programs/checkout-form";
import {
  courseDetails,
  type CourseBook,
  type CourseDetails,
  type CourseFeature,
  type CurriculumSection,
  type Faq,
  type PricingSection,
  type TargetBand,
} from "../programs/[slug]/course-data";
import { BengaliText } from "@/components/bengali-text";
import { ReviewsSection, type ReviewItem } from "@/components/programs/reviews-section";
import { WaitlistForm } from "@/components/programs/waitlist-form";

const SLUG = "ielts-band-score-machine";
const MOCK_TEST_COUNT = 15;
/** Optional Messenger / WhatsApp link, e.g. https://m.me/yourpage — the "ask us" link only renders when set. */
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL;

export const dynamic = "force-dynamic";

/* ───────────────────────── helpers ───────────────────────── */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBn = (v: number | string) => String(v).replace(/\d/g, (d) => BN_DIGITS.charAt(Number(d)));
const fromBn = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

function parseAmount(s?: string): number | null {
  if (!s) return null;
  const m = fromBn(s).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** "৳২,৯৯৯" + 20 → "৳২,৩৯৯". Keeps the currency prefix and digit style of the source price. */
function scholarshipPrice(price: string | undefined, percent: number): string | null {
  const amount = parseAmount(price);
  if (!price || amount === null || percent <= 0) return null;
  const discounted = Math.round(amount * (1 - percent / 100));
  const prefix = fromBn(price).match(/^[^\d]*/)?.[0] ?? "";
  const formatted = discounted.toLocaleString("en-IN");
  return prefix + (/[০-৯]/.test(price) ? toBn(formatted) : formatted);
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
  originalPrice?: string;
  savings?: string;
  scholarshipPercent: number;
  scholarshipPrice: string | null;
  showWaitlistForm: boolean;
  slug: string;
  title: string;
};

type RelatedDbCourse = {
  slug: string;
  title: string;
  badge?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string | null;
  upcoming?: boolean;
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

/* ───────────────────────── atoms ───────────────────────── */

const arrow = (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const playIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4L20 12L6 20V4Z" />
  </svg>
);

const check = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
    <path d="M20 6L9 17l-5-5" stroke="#2E9E6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Partial fills are exact: 4.6 shows 4.6 stars, not 5. */
function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const row = (color: string, fill: string) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="shrink-0" style={{ width: size, height: size, color, fill }} strokeWidth={1.5} />
    ));
  return (
    <span className="relative inline-flex" role="img" aria-label={`${value} / 5`}>
      <span className="inline-flex gap-[2px]">{row("#27354D", "transparent")}</span>
      <span className="absolute inset-y-0 left-0 inline-flex gap-[2px] overflow-hidden" style={{ width: `${pct}%` }}>
        {row("#7CF0BD", "#7CF0BD")}
      </span>
    </span>
  );
}

function SectionIntro({
  kicker,
  title,
  desc,
  align = "left",
}: {
  kicker?: string;
  title: string;
  desc?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center mx-auto" : ""}`} style={align === "center" ? { maxWidth: 640 } : undefined}>
      {kicker && (
        <div className="text-[14px] font-semibold mb-3" style={{ color: "var(--brand-2)" }}>
          <BengaliText>{kicker}</BengaliText>
        </div>
      )}
      <h2 className="font-semibold leading-[1.4]" style={{ fontSize: "clamp(24px,2.6vw,32px)", color: "var(--ink)" }}>
        <BengaliText>{title}</BengaliText>
      </h2>
      {desc && (
        <p
          className="text-[15.5px] mt-3 leading-[1.85]"
          style={{ color: "var(--body)", maxWidth: 580, marginInline: align === "center" ? "auto" : undefined }}
        >
          <BengaliText>{desc}</BengaliText>
        </p>
      )}
    </div>
  );
}

function PrimaryCta({
  offer,
  className = "",
  compact = false,
}: {
  offer: Offer;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={offer.href}
      className={`browse-btn inline-flex items-center justify-center gap-2.5 font-bold rounded-full text-center leading-[1.4] ${
        compact ? "text-[14.5px] px-6 py-[13px]" : "text-[16px] px-[30px] py-[16px]"
      } ${className}`}
      style={{ background: "var(--brand)", color: "#052117", boxShadow: "0 14px 30px -12px rgba(46,158,107,0.7)" }}
    >
      {offer.mode === "enrolled" && playIcon}
      <BengaliText>{offer.label}</BengaliText>
      {offer.mode !== "enrolled" && arrow}
    </Link>
  );
}

/** The waitlist scholarship — the single most important offer while the course is pre-launch. */
function ScholarshipCard({ offer, className = "" }: { offer: Offer; className?: string }) {
  if (offer.mode !== "waitlist" || offer.scholarshipPercent <= 0) return null;
  return (
    <div
      className={`flex items-center gap-4 rounded-[16px] px-5 py-4 text-left ${className}`}
      style={{ background: "rgba(124,240,189,0.1)", border: "1.5px solid rgba(124,240,189,0.45)" }}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: "rgba(124,240,189,0.18)" }}
      >
        <Gift className="w-[22px] h-[22px]" style={{ color: "#7CF0BD" }} />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold" style={{ color: "#7CF0BD" }}>
          <BengaliText>ওয়েটলিস্ট স্কলারশিপ</BengaliText>
        </div>
        <div className="font-display text-[18px] font-semibold text-white leading-[1.45] mt-0.5">
          <BengaliText>
            {toBn(offer.scholarshipPercent)}% স্কলারশিপ
            {offer.scholarshipPrice ? ` — মাত্র ${offer.scholarshipPrice}` : ""}
          </BengaliText>
        </div>
        <div className="text-[13.5px] leading-[1.6] mt-0.5" style={{ color: "#B7C4D6" }}>
          <BengaliText>শুধু যারা এখন ওয়েটলিস্টে জয়েন করবে, তারাই পাবে।</BengaliText>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function PackageCard({
  targetBand,
  level,
  language,
  pace,
  lessonCount,
  moduleCount,
}: {
  targetBand?: TargetBand;
  level?: string;
  language?: string;
  pace?: string;
  lessonCount: number;
  moduleCount: number;
}) {
  const rows = [
    { label: "ফরম্যাট", value: "সেলফ-পেসড এক্সপ্লেইনার" },
    { label: "লেভেল", value: level },
    { label: "মাধ্যম", value: language },
    { label: "গতি", value: pace },
    { label: "অ্যাক্সেস", value: "লাইফটাইম" },
    { label: "মোট কনটেন্ট", value: `${toBn(moduleCount)} মডিউল, ${toBn(lessonCount)} লেসন` },
  ].filter((r) => r.value && r.value !== "—");

  return (
    <div
      className="w-full max-w-[420px] mx-auto rounded-[18px] p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="text-[14px] font-semibold text-white mb-4 px-1">
        <BengaliText>প্যাকেজে যা পাচ্ছ</BengaliText>
      </div>

      {targetBand && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 mb-3"
          style={{
            background: "linear-gradient(135deg, rgba(46,158,107,0.22), rgba(31,92,138,0.3))",
            border: "1px solid rgba(124,240,189,0.3)",
          }}
        >
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium" style={{ color: "#D5DFEC" }}>
              <BengaliText>{targetBand.label}</BengaliText>
            </div>
            <div className="text-[12.5px] mt-0.5" style={{ color: "#9DB0C6" }}>
              <BengaliText>{targetBand.sub}</BengaliText>
            </div>
          </div>
          <div className="font-display text-[36px] font-semibold text-white leading-none">{targetBand.value}</div>
        </div>
      )}

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-3"
        style={{ background: "rgba(124,240,189,0.08)", border: "1px dashed rgba(124,240,189,0.45)" }}
      >
        <span
          className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(124,240,189,0.16)" }}
        >
          <Monitor className="w-[19px] h-[19px]" style={{ color: "#7CF0BD" }} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-white leading-[1.5]">
            <BengaliText>{toBn(MOCK_TEST_COUNT)}টি কম্পিউটার-বেসড মক টেস্ট</BengaliText>
          </div>
          <div className="text-[13px]" style={{ color: "#9DB0C6" }}>
            <BengaliText>রিডিং, রাইটিং, লিসেনিং</BengaliText>
          </div>
        </div>
        <span className="text-[12.5px] font-bold rounded-md px-2.5 py-1 shrink-0" style={{ background: "#2E9E6B", color: "#052117" }}>
          <BengaliText>ফ্রি</BengaliText>
        </span>
      </div>

      <div>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between gap-4 py-[11px] text-[14px]"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span style={{ color: "#9DB0C6" }}>
              <BengaliText>{r.label}</BengaliText>
            </span>
            <span className="font-medium text-right" style={{ color: "#E6EDF5" }}>
              <BengaliText>{r.value as string}</BengaliText>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseHero({
  badge,
  title,
  desc,
  details,
  offer,
  lessonCount,
  moduleCount,
}: {
  badge: string;
  title: string;
  desc: string;
  details?: CourseDetails;
  offer: Offer;
  lessonCount: number;
  moduleCount: number;
}) {
  const rating = details?.rating;
  const heroStats = details?.heroStats;
  const chips = [
    { icon: InfinityIcon, label: "লাইফটাইম অ্যাক্সেস" },
    { icon: Monitor, label: `${toBn(MOCK_TEST_COUNT)}টি ফ্রি কম্পিউটার-বেসড মক টেস্ট` },
    offer.mode === "waitlist"
      ? { icon: Clock, label: "নিজের গতিতে শেখো" }
      : { icon: Zap, label: "ইনস্ট্যান্ট অ্যাক্সেস" },
  ];

  return (
    <section className="course-page-hero relative overflow-hidden" style={{ background: "#080B10" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 82% -12%, rgba(46,158,107,0.20), transparent), radial-gradient(ellipse 720px 520px at -6% 100%, rgba(31,92,138,0.30), transparent), linear-gradient(160deg, #0B2545 0%, #080B10 72%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[5px]" style={{ background: "linear-gradient(90deg, #2E9E6B, #1F5C8A)" }} />

      <div className="relative max-w-[1320px] mx-auto px-[clamp(20px,4.5vw,56px)] pt-[108px] sm:pt-[128px] pb-[56px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-8">
          <Link href="/" style={{ color: "#8CA0B8" }} className="hover:text-white transition-colors">
            হোম
          </Link>
          <span style={{ color: "#5B6B7F" }}>/</span>
          <Link href="/programs" style={{ color: "#8CA0B8" }} className="hover:text-white transition-colors">
            প্রোগ্রাম
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-[44px] items-start">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-[15px] py-[7px] mb-5"
              style={{ background: "rgba(124,240,189,0.12)", border: "1px solid rgba(124,240,189,0.35)" }}
            >
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#7CF0BD" }} />
              <span className="text-[13.5px] font-semibold" style={{ color: "#7CF0BD" }}>
                <BengaliText>{details?.heroPill ?? badge}</BengaliText>
              </span>
            </div>

            <h1
              className="font-display font-semibold leading-[1.3] max-w-[640px]"
              style={{ color: "#fff", fontSize: "clamp(28px,3.4vw,44px)" }}
            >
              <BengaliText>{title}</BengaliText>
              {details?.titleAccent && (
                <>
                  {" "}
                  <BengaliText>
                    <span style={{ color: "#7CF0BD" }}>{details.titleAccent}</span>
                  </BengaliText>
                </>
              )}
            </h1>
            {details?.subtitle && (
              <p className="mt-3 text-[17px] leading-[1.6] max-w-[560px]" style={{ color: "#B7C4D6" }}>
                <BengaliText>{details.subtitle}</BengaliText>
              </p>
            )}

            {rating && (
              <a href="#reviews" className="mt-5 inline-flex items-center gap-2 text-[14px]">
                <Stars value={rating.average} />
                <span className="font-semibold text-white">{toBn(rating.average)}</span>
                <span className="font-medium underline underline-offset-2" style={{ color: "#9DB0C6" }}>
                  <BengaliText>({toBn(rating.count)} জন লিখেছে)</BengaliText>
                </span>
              </a>
            )}

            <p className="mt-5 max-w-[560px] text-[16px] leading-[1.85]" style={{ color: "#B7C4D6" }}>
              <BengaliText>{desc}</BengaliText>
            </p>

            {offer.price && offer.mode !== "enrolled" && (
              <div className="mt-6">
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-[34px] font-bold leading-none text-white">{offer.price}</span>
                  {offer.originalPrice && (
                    <span className="text-[17px] font-medium line-through" style={{ color: "#94A3B8" }}>
                      {offer.originalPrice}
                    </span>
                  )}
                  {offer.savings && (
                    <span className="text-[13px] font-bold rounded-md px-2.5 py-1" style={{ background: "#2E9E6B", color: "#052117" }}>
                      <BengaliText>{offer.savings} সাশ্রয়</BengaliText>
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[13.5px]" style={{ color: "#9DB0C6" }}>
                  <BengaliText>লাইফটাইম অ্যাক্সেস — মেয়াদ শেষ হওয়ার ঝামেলা নেই</BengaliText>
                </div>
              </div>
            )}

            {/* Waitlist: scholarship + inline capture. Otherwise: one big button. */}
            {offer.mode === "waitlist" && offer.showWaitlistForm ? (
              <div className="mt-7 max-w-[520px]">
                <ScholarshipCard offer={offer} className="mb-4" />
                <WaitlistForm slug={offer.slug} title={offer.title} discountPercent={offer.scholarshipPercent} />
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-7 flex-wrap">
                <PrimaryCta offer={offer} />
                {offer.mode !== "enrolled" && (
                  <a
                    href="#curriculum"
                    className="inline-flex items-center justify-center font-semibold text-[15px] rounded-full px-[26px] py-[14px] transition-colors duration-200 hover:bg-white/10"
                    style={{ border: "1.5px solid rgba(255,255,255,0.35)", color: "#fff" }}
                  >
                    <BengaliText>কোর্সে কী আছে দেখো</BengaliText>
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-x-5 gap-y-2 mt-7 flex-wrap text-[13.5px] font-medium" style={{ color: "#9DB0C6" }}>
              {chips.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5">
                  <t.icon className="w-[15px] h-[15px]" style={{ color: "#7CF0BD" }} strokeWidth={2} />
                  <BengaliText>{t.label}</BengaliText>
                </span>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="lg:pt-2">
            <PackageCard
              targetBand={details?.targetBand}
              level={details?.level}
              language={details?.language}
              pace={details?.pace}
              lessonCount={lessonCount}
              moduleCount={moduleCount}
            />
          </div>
        </div>

        {heroStats?.length ? (
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="fb-reveal rounded-[14px] px-5 py-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div className="font-display text-[32px] font-semibold leading-none text-white">{stat.value}</div>
                <div className="text-[13.5px] mt-2.5 leading-[1.55]" style={{ color: "#9DB0C6" }}>
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

/* ───────────────────────── mock tests ───────────────────────── */

function MockTestWindow() {
  const bars = [92, 100, 84, 96, 70, 100, 88, 60];
  return (
    <div
      aria-hidden
      className="rounded-2xl overflow-hidden w-full"
      style={{ background: "#0B1220", border: "1px solid #1E2A3F", boxShadow: "0 40px 80px -40px rgba(11,37,69,0.75)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0F1A2E", borderBottom: "1px solid #1E2A3F" }}>
        <div className="flex gap-1.5">
          {["#3B4A63", "#3B4A63", "#3B4A63"].map((c, i) => (
            <span key={i} className="w-[9px] h-[9px] rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="text-[12.5px] font-semibold" style={{ color: "#B7C4D6" }}>
          Mock Test 01 · Reading
        </div>
        <div className="text-[13px] font-bold tabular-nums" style={{ color: "#7CF0BD" }}>
          59:12
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px" style={{ background: "#1E2A3F" }}>
        <div className="p-5" style={{ background: "#0B1220" }}>
          <div className="text-[12px] font-semibold mb-3.5" style={{ color: "#8CA0B8" }}>
            Passage 1
          </div>
          <div className="flex flex-col gap-[9px]">
            {bars.map((w, i) => (
              <span key={i} className="h-[7px] rounded-full" style={{ width: `${w}%`, background: "#1E2A3F" }} />
            ))}
          </div>
        </div>
        <div className="p-5" style={{ background: "#0B1220" }}>
          <div className="text-[12px] font-semibold mb-3.5" style={{ color: "#8CA0B8" }}>
            Questions 1–5
          </div>
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className="w-[13px] h-[13px] rounded-full shrink-0"
                  style={{ border: "1.5px solid #3B4A63", background: i === 1 ? "#7CF0BD" : "transparent" }}
                />
                <span className="h-[7px] rounded-full" style={{ width: `${[78, 64, 86, 54][i]}%`, background: "#1E2A3F" }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-4 py-3 flex-wrap" style={{ background: "#0F1A2E", borderTop: "1px solid #1E2A3F" }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <span
            key={i}
            className="w-[22px] h-[22px] rounded-[5px] text-[10.5px] font-semibold flex items-center justify-center tabular-nums"
            style={{
              background: i < 4 ? "rgba(124,240,189,0.18)" : "transparent",
              border: `1px solid ${i < 4 ? "rgba(124,240,189,0.5)" : "#2A3A55"}`,
              color: i < 4 ? "#7CF0BD" : "#8CA0B8",
            }}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function MockTestSection({ offer }: { offer: Offer }) {
  const skills = [
    { icon: BookOpen, title: "রিডিং", text: "স্ক্রিনে প্যাসেজ পড়ো, স্ক্রিনেই উত্তর দাও।" },
    { icon: Pencil, title: "রাইটিং", text: "কিবোর্ডে টাইপ করে লেখো, ঠিক কম্পিউটার-বেসড পরীক্ষার মতো।" },
    { icon: Headphones, title: "লিসেনিং", text: "হেডফোন লাগিয়ে শোনো, স্ক্রিনেই উত্তর দাও।" },
  ];
  return (
    <section id="mock-tests" className="px-[clamp(20px,4.5vw,56px)] py-[84px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,520px)] gap-14 items-center">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold mb-5"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            <Gift className="w-[15px] h-[15px]" />
            <BengaliText>প্যাকেজের সাথে সম্পূর্ণ ফ্রি</BengaliText>
          </span>
          <h2 className="font-display font-semibold leading-[1.4]" style={{ fontSize: "clamp(26px,3vw,38px)", color: "var(--ink)" }}>
            <BengaliText>{toBn(MOCK_TEST_COUNT)}টি ফুল মক টেস্ট। বিশ্বের সেরা কম্পিউটার-বেসড মক টেস্ট অভিজ্ঞতা।</BengaliText>
          </h2>
          <p className="mt-4 text-[16px] leading-[1.9] max-w-[560px]" style={{ color: "var(--body)" }}>
            <BengaliText>
              কম্পিউটারে IELTS দেবে? তাহলে প্র্যাকটিসটাও কম্পিউটারেই হোক। টাইমার, স্ক্রিন আর নেভিগেশন — পরীক্ষার হলে যেভাবে দেবে, ঘরে বসে সেভাবেই অভ্যস্ত হও।
            </BengaliText>
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {skills.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-[14px] p-5 bg-white" style={{ border: "1px solid var(--line)" }}>
                <span className="w-[40px] h-[40px] rounded-xl flex items-center justify-center mb-3.5" style={{ background: "var(--brand-soft)" }}>
                  <Icon className="w-[20px] h-[20px]" strokeWidth={1.9} style={{ color: "var(--brand-2)" }} />
                </span>
                <h3 className="font-display text-[16.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  <BengaliText>{title}</BengaliText>
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.75]" style={{ color: "var(--body)" }}>
                  <BengaliText>{text}</BengaliText>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
            <Monitor className="w-[15px] h-[15px]" style={{ color: "var(--brand-2)" }} />
            <BengaliText>মক টেস্ট দিতে ডেস্কটপ বা ল্যাপটপ লাগবে।</BengaliText>
          </div>

          <div className="mt-8">
            <PrimaryCta offer={offer} />
          </div>
        </div>

        <MockTestWindow />
      </div>
    </section>
  );
}

/* ───────────────────────── features / book / curriculum ───────────────────────── */

function FeaturesGrid({ features, desc }: { features: CourseFeature[]; desc?: string }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[84px]" style={{ background: "#fff" }}>
      <div className="max-w-[1320px] mx-auto">
        <SectionIntro kicker="প্যাকেজে যা আছে" title="একবার এনরোল করলেই সবকিছু একসাথে" desc={desc} align="center" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {features.map(({ icon: Icon, title, desc: fdesc }) => (
            <div key={title} className="fb-card fb-reveal rounded-[16px] p-7" style={{ border: "1px solid var(--line)", background: "#fff" }}>
              <span className="w-[46px] h-[46px] rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--brand-soft)" }}>
                <Icon className="w-[22px] h-[22px]" strokeWidth={1.9} style={{ color: "var(--brand-2)" }} />
              </span>
              <h3 className="font-display text-[17px] font-semibold leading-[1.5]" style={{ color: "var(--ink)" }}>
                <BengaliText>{title}</BengaliText>
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.8]" style={{ color: "var(--body)" }}>
                <BengaliText>{fdesc}</BengaliText>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HighlightsGrid({
  details,
  lessonCount,
}: {
  details: CourseDetails;
  lessonCount: number;
}) {
  // Fallback only states things that are always true for this course.
  const highlights = details.highlights ?? [
    { title: `${toBn(lessonCount)}টি সেলফ-পেসড এক্সপ্লেইনার লেসন`, sub: "নিজের সময়মতো, নিজের গতিতে দেখো" },
    { title: `${toBn(MOCK_TEST_COUNT)}টি ফ্রি কম্পিউটার-বেসড মক টেস্ট`, sub: "রিডিং, রাইটিং আর লিসেনিং" },
    { title: "লাইফটাইম অ্যাক্সেস", sub: "যতবার ইচ্ছা, যখন ইচ্ছা ফিরে আসো" },
  ];
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[76px]" style={{ background: "#fff" }}>
      <div className="max-w-[1320px] mx-auto">
        <SectionIntro
          kicker="কোর্সে কী আছে"
          title="যা শিখবে, সব গোছানো"
          desc={details.highlightsDesc}
          align="center"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {highlights.map((item) => (
            <div key={item.title} className="fb-card fb-reveal rounded-[16px] p-7" style={{ border: "1px solid var(--line)", background: "#fff" }}>
              <span className="w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--brand-soft)" }}>
                <Check className="w-[20px] h-[20px]" strokeWidth={3} style={{ color: "var(--brand-2)" }} />
              </span>
              <h3 className="font-display text-[17px] font-semibold leading-[1.5]" style={{ color: "var(--ink)" }}>
                <BengaliText>{item.title}</BengaliText>
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.8]" style={{ color: "var(--body)" }}>
                <BengaliText>{item.sub}</BengaliText>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CurriculumGrid({ curriculum, offer }: { curriculum: CurriculumSection; offer: Offer }) {
  return (
    <section
      id="curriculum"
      className="px-[clamp(20px,4.5vw,56px)] py-[92px] relative overflow-hidden"
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
        <div className="text-center mb-14">
          {curriculum.label && (
            <div className="text-[14px] font-semibold mb-3" style={{ color: "#7CF0BD" }}>
              <BengaliText>{curriculum.label}</BengaliText>
            </div>
          )}
          <h2 className="font-display font-semibold text-white leading-[1.4]" style={{ fontSize: "clamp(26px,3vw,38px)" }}>
            <BengaliText>{curriculum.title}</BengaliText>
          </h2>
          <p className="mt-4 text-[16.5px] leading-[1.8]" style={{ color: "#9DB0C6" }}>
            <BengaliText>{curriculum.subtitle}</BengaliText>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {curriculum.modules.map((m, i) => (
            <div
              key={m.title}
              className="fb-card fb-reveal rounded-[16px] p-7 md:p-9"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <div className="flex items-center gap-4 mb-6">
                {/* Modules are a real sequence, so numbering earns its place here. */}
                <span
                  className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center font-bold text-[16px] shrink-0"
                  style={{ background: "#2E9E6B", color: "#052117" }}
                >
                  {toBn(i + 1)}
                </span>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[18px] text-white leading-[1.5]">
                    <BengaliText>{m.title}</BengaliText>
                  </div>
                  <div className="font-medium text-[13.5px] mt-0.5" style={{ color: "#9DB0C6" }}>
                    <BengaliText>{m.lessonCount}</BengaliText>
                  </div>
                </div>
              </div>
              <ul className="flex flex-col gap-[13px]">
                {m.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14.5px] leading-[1.75]" style={{ color: "#C4D0DE" }}>
                    <span className="mt-[11px] w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "#7CF0BD" }} />
                    <BengaliText>{item}</BengaliText>
                  </li>
                ))}
                <li className="flex items-start gap-3 text-[14.5px] font-semibold leading-[1.75]" style={{ color: "#7CF0BD" }}>
                  <Check className="w-[16px] h-[16px] mt-[5px] shrink-0" strokeWidth={3} />
                  <BengaliText>মডিউল শেষে চ্যালেঞ্জ: {m.capstone}</BengaliText>
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
            <span className="w-[6px] h-[6px] rounded-full mt-[12px] shrink-0" style={{ background: "#7CF0BD" }} />
            <p className="text-[15px] leading-[1.85]" style={{ color: "#C4D0DE" }}>
              <BengaliText>{curriculum.note}</BengaliText>
            </p>
          </div>
        )}

        <div className="mt-12 text-center">
          <PrimaryCta offer={offer} />
        </div>
      </div>
    </section>
  );
}

function BookBonus({ book }: { book: CourseBook }) {
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[72px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1040px] mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10 md:gap-14 items-center">
        {/* Flat digital cover — this is a PDF, so no hardcover art */}
        <div
          className="relative w-[200px] md:w-[220px] aspect-[3/4] mx-auto rounded-[12px] flex flex-col overflow-hidden"
          style={{
            background: "linear-gradient(155deg,#143458 0%,#0B2545 55%,#080B10 100%)",
            border: "1px solid rgba(124,240,189,0.32)",
            boxShadow: "0 30px 60px -28px rgba(11,37,69,0.6)",
          }}
        >
          <div className="flex-1 flex flex-col p-5">
            <span className="w-[26px] h-[5px] rounded-full" style={{ background: "linear-gradient(90deg,#2E9E6B,#7CF0BD)" }} />
            <div className="font-display font-semibold text-white leading-[1.45] mt-4 text-[19px]">
              <BengaliText>{book.title}</BengaliText>
            </div>
            <div className="mt-auto text-[12.5px] font-semibold" style={{ color: "#7CF0BD" }}>
              <BengaliText>ডিজিটাল প্র্যাকটিস বই</BengaliText>
            </div>
          </div>
          <div className="h-[5px] w-full" style={{ background: "linear-gradient(90deg,#2E9E6B,#7CF0BD)" }} />
        </div>

        <div>
          <div className="text-[14px] font-semibold mb-3" style={{ color: "var(--brand-2)" }}>
            <BengaliText>বোনাস</BengaliText>
          </div>
          <h2 className="font-display font-semibold leading-[1.45]" style={{ fontSize: "clamp(23px,2.6vw,32px)", color: "var(--ink)" }}>
            <BengaliText>প্রতিটা লেসনের সাথে মিলিয়ে বই</BengaliText>
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.9]" style={{ color: "var(--body)" }}>
            <BengaliText>{book.desc}</BengaliText>
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {[
              "মডেল আনসার আর প্র্যাকটিস টেস্ট সহ",
              "মোবাইল বা কম্পিউটার, যেখানে ইচ্ছা পড়ো",
              "লাইফটাইম তোমার অ্যাকাউন্টে থাকবে",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                {check}
                <BengaliText>{t}</BengaliText>
              </div>
            ))}
          </div>
          {book.includedNote && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mt-6 text-[13.5px] font-semibold"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
            >
              <Check className="w-[13px] h-[13px]" strokeWidth={3} />
              <BengaliText>{book.includedNote}</BengaliText>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── pricing / faq / final cta ───────────────────────── */

const PAYMENT_COLORS: Record<string, string> = {
  bKash: "#E2136E",
  Nagad: "#F5821F",
  Rocket: "#8C3494",
  Stripe: "#635BFF",
};

function PricingCard({
  pricing,
  offer,
  lessonCount,
  moduleCount,
  hasBook,
}: {
  pricing: PricingSection;
  offer: Offer;
  lessonCount: number;
  moduleCount: number;
  hasBook: boolean;
}) {
  const price = offer.price ?? pricing.price;
  const included = [
    "লাইফটাইম অ্যাক্সেস",
    `${toBn(MOCK_TEST_COUNT)}টি কম্পিউটার-বেসড মক টেস্ট — ফ্রি`,
    `${toBn(moduleCount)} মডিউল, ${toBn(lessonCount)}টি সেলফ-পেসড লেসন`,
    ...(hasBook ? ["ডিজিটাল প্র্যাকটিস বই — ফ্রি"] : []),
  ];
  return (
    <section
      id="pricing"
      className="px-[clamp(20px,4.5vw,56px)] py-[92px] text-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0B2545 0%, #080B10 100%)" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 700px 420px at 50% -8%, rgba(46,158,107,0.16), transparent)" }}
      />
      <div className="relative max-w-[640px] mx-auto">
        <div className="text-[14px] font-semibold mb-3" style={{ color: "#7CF0BD" }}>
          <BengaliText>{offer.mode === "waitlist" && offer.scholarshipPercent > 0 ? "ওয়েটলিস্ট স্কলারশিপ" : "কোর্স ফি"}</BengaliText>
        </div>
        <h2 className="font-display font-semibold text-white leading-[1.4]" style={{ fontSize: "clamp(26px,3vw,36px)" }}>
          <BengaliText>{pricing.title}</BengaliText>
        </h2>
        {pricing.subtitle && (
          <p className="mt-4 text-[16px] leading-[1.8]" style={{ color: "#9DB0C6" }}>
            <BengaliText>{pricing.subtitle}</BengaliText>
          </p>
        )}

        <div
          className="fb-reveal mt-10 mx-auto max-w-[440px] rounded-[18px] px-7 py-10 text-left"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(124,240,189,0.35)",
            boxShadow: "0 36px 80px -40px rgba(46,158,107,0.5)",
          }}
        >
          <div className="text-center">
            <div className="flex items-end justify-center gap-3 flex-wrap">
              <span className="font-display font-semibold text-white leading-none" style={{ fontSize: "clamp(34px,4.4vw,46px)" }}>
                <BengaliText>{price}</BengaliText>
              </span>
              {offer.originalPrice && (
                <span className="text-[18px] font-medium line-through pb-1" style={{ color: "#94A3B8" }}>
                  {offer.originalPrice}
                </span>
              )}
            </div>
            {offer.savings && (
              <span className="inline-block mt-3 text-[13px] font-bold rounded-md px-2.5 py-1" style={{ background: "#2E9E6B", color: "#052117" }}>
                <BengaliText>{offer.savings} সাশ্রয়</BengaliText>
              </span>
            )}
            {pricing.note && (
              <div className="mt-3 text-[14px] leading-[1.7]" style={{ color: "#9DB0C6" }}>
                <BengaliText>{pricing.note}</BengaliText>
              </div>
            )}
          </div>

          <ScholarshipCard offer={offer} className="mt-6" />

          <ul className="mt-7 flex flex-col gap-3">
            {included.map((t) => (
              <li key={t} className="flex items-start gap-3 text-[14.5px] leading-[1.7]" style={{ color: "#E6EDF5" }}>
                <Check className="w-[16px] h-[16px] mt-[5px] shrink-0" strokeWidth={3} style={{ color: "#7CF0BD" }} />
                <BengaliText>{t}</BengaliText>
              </li>
            ))}
          </ul>

          <PrimaryCta offer={offer} className="w-full mt-8" />

          {pricing.includedLine && (
            <>
              <div className="my-6 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="text-[13.5px] leading-[1.7] text-center" style={{ color: "#9DB0C6" }}>
                <BengaliText>{pricing.includedLine}</BengaliText>
              </div>
            </>
          )}
        </div>

        {pricing.paymentMethods?.length ? (
          <div className="mt-10">
            {pricing.paymentLabel && (
              <div className="text-[13.5px] mb-4" style={{ color: "#9DB0C6" }}>
                <BengaliText>{pricing.paymentLabel}</BengaliText>
              </div>
            )}
            <div className="flex justify-center gap-3 flex-wrap">
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
    <section id="faq" className="px-[clamp(20px,4.5vw,56px)] py-[84px]" style={{ background: "#fff" }}>
      <div className="max-w-[800px] mx-auto">
        <SectionIntro kicker="প্রশ্ন থাকলে" title="সবাই যা জানতে চায়" align="center" />
        <div className="flex flex-col gap-3.5 mt-8">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="faq-item rounded-xl px-6 py-5 transition-colors duration-200"
              style={{ border: "1px solid var(--line)", background: "#fff" }}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="font-display font-semibold text-[16.5px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                  <BengaliText>{faq.q}</BengaliText>
                </span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--brand-soft)" }}>
                  <ChevronDown className="faq-chev w-[17px] h-[17px] transition-transform duration-200" style={{ color: "var(--brand-2)" }} />
                </span>
              </summary>
              <p className="mt-4 text-[15px] leading-[1.9]" style={{ color: "var(--body)" }}>
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
  offer,
}: {
  cta: { title: string; desc: string };
  pricing?: PricingSection;
  offer: Offer;
}) {
  return (
    <section
      id="waitlist"
      className="px-[clamp(20px,4.5vw,56px)] py-[92px] text-center relative overflow-hidden"
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
        <h2 className="font-display font-semibold text-white leading-[1.4]" style={{ fontSize: "clamp(27px,3.4vw,40px)" }}>
          <BengaliText>{cta.title}</BengaliText>
        </h2>
        <p className="mt-5 text-[16.5px] leading-[1.9]" style={{ color: "#B7C4D6" }}>
          <BengaliText>{cta.desc}</BengaliText>
        </p>

        {offer.mode === "waitlist" && offer.showWaitlistForm ? (
          <div className="mt-9 mx-auto max-w-[480px]">
            <ScholarshipCard offer={offer} className="mb-5" />
            <WaitlistForm slug={offer.slug} title={offer.title} discountPercent={offer.scholarshipPercent} />
          </div>
        ) : (
          <div className="mt-9">
            <PrimaryCta offer={offer} />
          </div>
        )}

        {SUPPORT_URL && (
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 text-[14.5px] font-medium hover:text-white transition-colors"
            style={{ color: "#B7C4D6" }}
          >
            <MessageCircle className="w-[16px] h-[16px]" style={{ color: "#7CF0BD" }} />
            <BengaliText>কিছু জানার আছে? আমাদের মেসেজ করো</BengaliText>
          </a>
        )}

        {pricing?.includedLine && (
          <div className="mt-8 text-[13.5px]" style={{ color: "#94A3B8" }}>
            <BengaliText>{pricing.includedLine}</BengaliText>
          </div>
        )}
      </div>
    </section>
  );
}

/** Mobile-only bar so the CTA is always one tap away. */
function StickyCta({ offer }: { offer: Offer }) {
  const shown =
    offer.mode === "waitlist" && offer.scholarshipPrice
      ? { label: `স্কলারশিপ প্রাইস`, price: offer.scholarshipPrice }
      : offer.mode !== "enrolled" && offer.price
        ? { label: "কোর্স ফি", price: offer.price }
        : null;
  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3 flex items-center gap-3"
      style={{ background: "rgba(8,11,16,0.94)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.12)" }}
    >
      {shown && (
        <div className="shrink-0 leading-tight">
          <div className="text-[12px]" style={{ color: "#9DB0C6" }}>
            <BengaliText>{shown.label}</BengaliText>
          </div>
          <div className="text-[19px] font-bold text-white">{shown.price}</div>
        </div>
      )}
      <PrimaryCta offer={offer} compact className="flex-1 min-w-0" />
    </div>
  );
}

function RelatedProgramsSection({ programs }: { programs: RelatedProgramLanding[] }) {
  if (!programs.length) return null;
  return (
    <section className="px-[clamp(20px,4.5vw,56px)] py-[84px]" style={{ background: "var(--bg-soft)" }}>
      <div className="max-w-[1320px] mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-11">
          <div>
            <div className="text-[14px] font-semibold mb-2" style={{ color: "var(--brand-2)" }}>
              <BengaliText>আরও দেখতে পারো</BengaliText>
            </div>
            <h2 className="font-display font-semibold leading-[1.4]" style={{ fontSize: "clamp(22px,2.6vw,30px)", color: "var(--ink)" }}>
              <BengaliText>অন্যান্য প্রোগ্রাম</BengaliText>
            </h2>
          </div>
          <Link
            href="/programs"
            className="view-all font-semibold text-[14px] inline-flex items-center gap-[6px] shrink-0 mb-[3px]"
            style={{ color: "var(--brand-2)" }}
          >
            সব দেখো
            {arrow}
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

/* ───────────────────────── DB-only course (no static program entry) ───────────────────────── */

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
  const priceText = isFree ? "ফ্রি" : formatPriceText(checkoutCourse);

  return (
    <div className="checkout-page">
      <Nav />

      <div className="px-[clamp(20px,4.5vw,56px)] pt-[120px] pb-4 max-w-[1320px] mx-auto">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <Link href="/" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">
            হোম
          </Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <Link href="/programs" style={{ color: "var(--body)" }} className="hover:text-brand-2 transition-colors">
            প্রোগ্রাম
          </Link>
          <span style={{ color: "var(--body)" }}>/</span>
          <span style={{ color: "var(--brand-2)" }}>{checkoutCourse.badge}</span>
        </div>
      </div>

      <section className="px-[clamp(20px,4.5vw,56px)] pb-[100px] max-w-[1320px] mx-auto">
        {enrolled ? (
          <div className="max-w-[560px] mx-auto">
            <div
              className="rounded-lg border border-line bg-white p-8 sm:p-10 text-center"
              style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.12)" }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(15,169,104,0.1)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0FA968" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h2 className="font-display text-[22px] font-semibold leading-[1.5]" style={{ color: "var(--ink)" }}>
                তুমি এই কোর্সে ভর্তি আছো
              </h2>
              <p className="text-[14.5px] mt-2 mb-8 leading-[1.8]" style={{ color: "var(--body)" }}>
                {toBn(moduleCount)} মডিউলে {toBn(lessonCount)} লেসন তোমার জন্য রেডি।
              </p>
              <Link
                href={`/dashboard/courses/${checkoutCourse.slug}/learn`}
                className="inline-flex items-center justify-center gap-[9px] font-semibold text-[15px] text-white rounded-full px-[30px] py-[15px] hover:opacity-90 transition-opacity"
                style={{ background: "var(--brand)" }}
              >
                {playIcon}
                ক্লাসে যাও
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start">
            <div className="space-y-8">
              <div className="rounded-lg border border-line bg-white overflow-hidden">
                <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                  <div
                    className="relative h-[180px] sm:h-full sm:min-h-[180px] flex items-center justify-center overflow-hidden"
                    style={{ background: "var(--brand-soft)" }}
                  >
                    {checkoutCourse.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={checkoutCourse.image} alt={checkoutCourse.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(18,32,67,0.18), transparent 50%)" }} />
                      </>
                    ) : (
                      <BookOpen size={36} className="text-white/40" />
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col justify-center">
                    <span className="text-[12px] font-semibold mb-2 inline-block w-fit" style={{ color: "var(--brand-2)" }}>
                      {checkoutCourse.badge}
                    </span>
                    <h1 className="font-display text-[20px] font-semibold leading-[1.45]" style={{ color: "var(--ink)" }}>
                      <BengaliText>{checkoutCourse.title}</BengaliText>
                      {checkoutCourse.subtitle && (
                        <>
                          {" "}
                          <BengaliText>{checkoutCourse.subtitle}</BengaliText>
                        </>
                      )}
                    </h1>
                    {(checkoutCourse.level || checkoutCourse.language) && (
                      <div className="mt-2 flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--body)" }}>
                        {checkoutCourse.level && <span>{checkoutCourse.level}</span>}
                        {checkoutCourse.level && checkoutCourse.language && <span>·</span>}
                        {checkoutCourse.language && <span>{checkoutCourse.language}</span>}
                      </div>
                    )}
                    {checkoutCourse.description && (
                      <p className="mt-2 text-[14px] leading-[1.7] line-clamp-2" style={{ color: "var(--body)" }}>
                        {checkoutCourse.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
                <CheckoutForm course={checkoutCourse} />
              </div>
            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-lg border border-line bg-white overflow-hidden" style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.18)" }}>
                <div className="p-6">
                  <p className="text-[13px] font-semibold mb-5" style={{ color: "var(--body)" }}>
                    অর্ডার সামারি
                  </p>

                  <div className="flex gap-4 pb-5 border-b" style={{ borderColor: "var(--line)" }}>
                    <div className="w-[64px] h-[64px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--brand-soft)" }}>
                      {checkoutCourse.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={checkoutCourse.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={20} className="text-white/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                        <BengaliText>{checkoutCourse.title}</BengaliText>
                      </p>
                      <p className="text-[12.5px] mt-1" style={{ color: "var(--body)" }}>
                        {checkoutCourse.badge}
                      </p>
                    </div>
                  </div>

                  <div className="py-4 space-y-2.5 border-b" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center justify-between text-[14px]">
                      <span style={{ color: "var(--body)" }}>সাবটোটাল</span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{priceText}</span>
                    </div>
                    <div className="flex items-center justify-between text-[14px]">
                      <span style={{ color: "var(--body)" }}>ট্যাক্স</span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>০.০০</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>মোট</span>
                    <span className="text-[22px] font-bold leading-none" style={{ color: "var(--ink)" }}>{priceText}</span>
                  </div>

                  {checkoutCourse.upcoming && (
                    <div className="mt-4 text-center text-[13.5px] font-medium py-2.5 px-3 rounded-xl leading-[1.7]" style={{ background: "rgba(111,76,224,0.08)", color: "#6B4CE0" }}>
                      এই কোর্সটা শিগগিরই আসছে — নোটিফিকেশন পেতে ওয়েটলিস্টে যুক্ত হও।
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 pt-5 border-t" style={{ borderColor: "var(--line)" }}>
                  <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--body)" }}>
                    যা যা পাবে
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "ভর্তির সাথে সাথেই অ্যাক্সেস",
                      `${toBn(moduleCount)} মডিউল, ${toBn(lessonCount)} লেসন`,
                      "লাইফটাইম অ্যাক্সেস — নিজের গতিতে শেখো",
                      "কোর্স সম্পন্নের সার্টিফিকেট",
                      "ইনস্ট্রাক্টরদের লাইভ সাপোর্ট",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-[1.6]">
                        <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[3px]" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                          <Check className="w-[10px] h-[10px]" strokeWidth={3} />
                        </span>
                        <BengaliText>
                          <span style={{ color: "var(--ink)" }}>{item}</span>
                        </BengaliText>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-6 pb-6">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { icon: Lock, label: "SSL এনক্রিপ্টেড" },
                      { icon: ShieldCheck, label: "৩০ দিনের গ্যারান্টি" },
                      { icon: Zap, label: "তাৎক্ষণিক অ্যাক্সেস" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5">
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[12px] font-medium leading-tight" style={{ color: "var(--body)" }}>
                          <BengaliText>{label}</BengaliText>
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

      {(course.books ?? []).length > 0 && (
        <section className="px-[clamp(20px,4.5vw,56px)] pb-[70px] max-w-[1320px] mx-auto">
          <SectionIntro kicker="কোর্সের বই" title="বই ও রিডিং ম্যাটেরিয়াল" desc="কোর্সের সাথে ফ্রি — নিজের সময়মতো ডাউনলোড করে পড়ো" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(course.books ?? []).map((book, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border p-5 bg-white transition hover:shadow-md" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex w-10 h-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)" }}>
                    <BookOpen size={18} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14.5px] font-semibold leading-tight truncate" style={{ color: "var(--ink)" }}>
                      {book.title}
                    </h3>
                    {book.description && (
                      <p className="text-[12.5px] mt-0.5 truncate" style={{ color: "var(--body)" }}>
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
                    className="inline-flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-lg border px-4 py-2 transition-all duration-200 hover:border-brand-2 hover:text-brand-2"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 18 15 15" />
                    </svg>
                    ডাউনলোড PDF
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1.5 text-[13px] font-medium rounded-lg border px-4 py-2" style={{ color: "var(--body)", borderColor: "var(--line)", cursor: "not-allowed" }}>
                    <Lock size={13} />
                    ভর্তি হলে পাবে
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection
        courseId={course._id.toString()}
        reviews={reviews}
        totalReviews={totalReviews}
        averageRating={course.averageRating ?? 0}
        userReview={userReview}
      />

      <style>{`
        .checkout-page { --body: #39445A; --line: #DDE2EC; }
      `}</style>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

const dateFmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("bn-BD", { month: "short", day: "numeric", year: "numeric" });

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

    const [enrolledDoc, reviews, userReviewDoc] = await Promise.all([
      userId ? CourseEnrollment.exists({ user: userId, course: course._id, status: "active" }) : null,
      CourseReview.find({ course: course._id }).populate("user", "name avatar").sort({ createdAt: -1 }).limit(20).lean(),
      userId ? CourseReview.findOne({ course: course._id, user: userId }).lean() : null,
    ]);

    const reviewItems = reviews.map((r: any) => ({
      id: r._id.toString(),
      rating: r.rating,
      text: r.text,
      userName: r.user?.name ?? "একজন শিক্ষার্থী",
      userAvatar: r.user?.avatar ?? null,
      date: dateFmt(r.createdAt),
    }));

    return (
      <DbCoursePage
        course={course}
        enrolled={Boolean(enrolledDoc)}
        reviews={reviewItems}
        totalReviews={course.reviewCount ?? 0}
        userReview={userReviewDoc ? { id: userReviewDoc._id.toString(), rating: userReviewDoc.rating, text: userReviewDoc.text } : null}
      />
    );
  }

  /* ---- Static program landing page ---- */
  const details = courseDetails[SLUG];
  const lessonCount = details ? details.modules.reduce((n, m) => n + m.lessons.length, 0) : 30;
  const moduleCount = details ? details.modules.length : 6;

  const liveCourse = program.hasDb ? course : null;

  const [enrolledDoc, liveReviews, userReviewDoc, otherDbCourses] = await Promise.all([
    liveCourse && userId ? CourseEnrollment.exists({ user: userId, course: liveCourse._id, status: "active" }) : null,
    liveCourse
      ? CourseReview.find({ course: liveCourse._id }).populate("user", "name avatar").sort({ createdAt: -1 }).limit(20).lean()
      : [],
    liveCourse && userId ? CourseReview.findOne({ course: liveCourse._id, user: userId }).lean() : null,
    Course.find({ slug: { $ne: SLUG }, $or: [{ published: true }, { upcoming: true }] })
      .sort({ createdAt: -1 })
      .limit(4)
      .select("slug title badge subtitle description price currency image upcoming")
      .lean<RelatedDbCourse[]>(),
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

  const liveReviewItems = (liveReviews as any[]).map((r) => ({
    id: r._id.toString(),
    rating: r.rating,
    text: r.text,
    userName: r.user?.name ?? "একজন শিক্ষার্থী",
    userAvatar: r.user?.avatar ?? null,
    date: dateFmt(r.createdAt),
  }));

  /* ---- Offer: the single source of truth for every CTA ---- */
  const waitlistEnabled = course?.waitlistEnabled === true;
  const scholarshipPercent = waitlistEnabled ? course?.wishlistDiscountPercent ?? 0 : 0;
  const isLive = Boolean(cta?.hasDb && liveCourse && !liveCourse.upcoming);
  const mode: Offer["mode"] = cta?.enrolled ? "enrolled" : isLive ? "buy" : "waitlist";
  const showWaitlistForm = waitlistEnabled;

  const price = details?.price ?? details?.pricing?.price;
  const offer: Offer = {
    mode,
    href:
      mode === "enrolled"
        ? `/dashboard/courses/${cta?.slug}/learn`
        : mode === "buy"
          ? `/programs/${SLUG}/checkout`
          : showWaitlistForm
            ? "#waitlist"
            : (details?.pricing?.ctaHref ?? "/programs"),
    label:
      mode === "enrolled"
        ? "ক্লাসে ফিরে যাও"
        : mode === "buy"
          ? "এখনই ভর্তি হও"
          : (details?.heroCta?.label ??
            (scholarshipPercent > 0
              ? `ওয়েটলিস্টে জয়েন করে ${toBn(scholarshipPercent)}% স্কলারশিপ নাও`
              : "ওয়েটলিস্টে নাম লেখাও")),
    price,
    originalPrice: details?.originalPrice,
    savings: details?.savings,
    scholarshipPercent,
    scholarshipPrice: scholarshipPrice(price, scholarshipPercent),
    showWaitlistForm,
    slug: SLUG,
    title: details?.title ?? program.title,
  };

  /* ---- Related programs ---- */
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
        sub: p.upcoming ? "শিগগিরই আসছে" : p.price ?? "কোর্স দেখো",
      })),
    ...otherDbCourses.map((c) => ({
      slug: c.slug,
      title: c.title,
      badge: c.badge || "কোর্স",
      badgeColor: "var(--brand)",
      bg: "var(--brand-soft)",
      image: c.image ?? null,
      sub: c.upcoming
        ? "শিগগিরই আসছে"
        : (c.price ?? 0) > 0
          ? `${c.currency ?? ""} ${(c.price ?? 0).toLocaleString()}`.trim()
          : c.subtitle || c.description || "কোর্স দেখো",
    })),
  ].slice(0, 6);

  /* ---- Structured data ---- */
  const amount = parseAmount(price);
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
            availability: mode === "waitlist" ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
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
  const faqLd = details?.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: details.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  const isEnrolled = mode === "enrolled";

  return (
    <div className="course-page ielts-landing pb-[84px] lg:pb-0">
      <JsonLd data={courseLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <Nav />

      <CourseHero
        badge={program.badge}
        title={details?.title ?? program.title}
        desc={details?.desc ?? program.desc}
        details={details}
        offer={offer}
        lessonCount={lessonCount}
        moduleCount={moduleCount}
      />

      {details ? (
        <>
          <MockTestSection offer={offer} />

          <FeaturesGrid features={details.features ?? BLUEPRINT_FEATURES} desc={details.featuresDesc} />

          {details.curriculum ? (
            <CurriculumGrid curriculum={details.curriculum} offer={offer} />
          ) : (
            <HighlightsGrid details={details} lessonCount={lessonCount} />
          )}

          {details.book && <BookBonus book={details.book} />}

          {liveCourse ? (
            <ReviewsSection
              courseId={liveCourse._id.toString()}
              reviews={liveReviewItems}
              totalReviews={liveReviewItems.length}
              averageRating={liveCourse.averageRating ?? 0}
              userReview={userReviewDoc ? { id: userReviewDoc._id.toString(), rating: userReviewDoc.rating, text: userReviewDoc.text } : null}
            />
          ) : details.reviews?.length ? (
            <ReviewsSection
              reviews={details.reviews.map((review, i) => ({
                id: `${review.name}-${i}`,
                userName: review.name,
                rating: review.rating,
                text: review.text,
                date: review.date,
                helpful: review.helpful,
                verified: review.verified,
              }))}
              totalReviews={details.reviews.length}
              averageRating={details.rating?.average ?? 0}
            />
          ) : null}

          {!isEnrolled && details.pricing && (
            <PricingCard
              pricing={details.pricing}
              offer={offer}
              lessonCount={lessonCount}
              moduleCount={moduleCount}
              hasBook={Boolean(details.book)}
            />
          )}

          {details.faqs?.length ? <FaqSection faqs={details.faqs} /> : null}

          {!isEnrolled && details.cta && <FinalCta cta={details.cta} pricing={details.pricing} offer={offer} />}
        </>
      ) : (
        <section className="px-[clamp(20px,4.5vw,56px)] py-[90px] max-w-[1320px] mx-auto text-center">
          <SectionIntro
            kicker="শিগগিরই আসছে"
            title="এই কোর্সটা এখনো প্রস্তুত হচ্ছে"
            desc="ভিডিও লেসন, রিসোর্স আর ফুল কারিকুলাম রেডি হলেই এখানে দেখতে পাবে। একটু পরে আবার দেখো।"
            align="center"
          />
          <a
            href="/programs"
            className="inline-flex items-center gap-[9px] font-medium text-[15px] text-white rounded-full px-[26px] py-[15px]"
            style={{ background: "var(--brand)" }}
          >
            প্রোগ্রামে ফিরে যাও
            {arrow}
          </a>
        </section>
      )}

      <RelatedProgramsSection programs={relatedPrograms} />

      <StickyCta offer={offer} />

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
          background: #7CF0BD !important;
          transform: translateY(-2px);
          box-shadow: 0 18px 30px -12px rgba(46,158,107,0.55);
        }
        .browse-btn svg { transition: transform 0.25s ease; }
        .browse-btn:hover svg { transform: translateX(3px); }
        @media (prefers-reduced-motion: reduce) {
          .browse-btn, .browse-btn svg { transition: none; }
          .browse-btn:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
