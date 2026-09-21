import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getProgram } from "@/lib/programs";
import { BLUEPRINT_FEATURES } from "@/lib/blueprint-features";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseReview } from "@/lib/models/course-review";
import { readSession } from "@/lib/auth/session";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Flag,
  Gift,
  Monitor,
  Pencil,
  Play,
  Star,
} from "lucide-react";
import {
  courseDetails,
  type CourseBook,
  type CourseDetails,
  type CurriculumSection,
} from "../programs/[slug]/course-data";
import { BengaliText } from "@/components/bengali-text";
import { ReviewsSection } from "@/components/programs/reviews-section";
import { WaitlistForm } from "@/components/programs/waitlist-form";
import { IeltsPromoPopup } from "@/components/ielts-promo-popup";
import { ExamWindow, Reveal, SkillTabs, StickyOffer } from "@/components/ielts/interactive";
import { DbCoursePage } from "./db-course-page";

const SLUG = "ielts-band-score-machine";
const MOCK_TEST_COUNT = 15;

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
  showWaitlistForm: boolean;
  slug: string;
  title: string;
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
  heroSub: `কম্পিউটারে IELTS দেবেন? তাহলে প্র্যাকটিসও কম্পিউটারেই করুন। বুঝিয়ে শেখানো সেলফ-পেসড এক্সপ্লেইনার লেসন, সাথে ${N}টি ফ্রি কম্পিউটার-বেসড মক টেস্ট। সব এক কোর্সে, লাইফটাইম অ্যাক্সেসসহ।`,
  windowCaption: "আমাদের মক টেস্টের ডেমো সিমুলেশন",

  systemTitle: "শিখুন, প্র্যাকটিস করুন, নিজেকে যাচাই করুন",
  systemDesc: "তিনটা কাজ এক জায়গায়। আলাদা কোর্স, আলাদা ফাইল আর আলাদা মক টেস্ট সাইট খুঁজে বেড়াতে হবে না।",

  mockTitle: `${N}টি ফুল মক টেস্ট, ঠিক পরীক্ষার স্ক্রিনের মতো`,
  mockDesc:
    "আমরা বানিয়েছি বিশ্বের সেরা কম্পিউটার-বেসড মক টেস্ট অভিজ্ঞতা, যাতে পরীক্ষার দিন স্ক্রিন দেখে চমকে না যান। টাইমার, নেভিগেশন, প্রশ্নের লেআউট, সব হাতের মুঠোয় আগেই চেনা হয়ে যাবে।",
  mockNote: "মক টেস্ট দিতে ডেস্কটপ বা ল্যাপটপ লাগবে।",

  bookTitle: "সম্পূর্ণ কোর্সের একটি ডিজিটাল বই",
  bookTicks: [
    "মডেল আনসার আর প্র্যাকটিস টেস্টসহ",
    "মোবাইল বা কম্পিউটার, যেখানে ইচ্ছা পড়ুন",
    "লাইফটাইম আপনার অ্যাকাউন্টে থাকবে",
  ],

  closeTitle: "পরীক্ষার হলে স্ক্রিনটাও যেন চেনা লাগে।",
  closeWaitlist: "শুধু যারা এখন ওয়েটলিস্টে জয়েন করবে, তারাই স্কলারশিপ প্রাইসে পাবে।",
  closeBuy: "একবার ভর্তি হলে লেসন আর মক টেস্ট সব আপনার, লাইফটাইম।",
  closeIncluded: "প্যাকেজে যা যা পাচ্ছ",
};

/* ───────────────────────── atoms ───────────────────────── */

const wrap = "max-w-[1240px] mx-auto px-[clamp(20px,4.5vw,56px)]";
const sectionY = "py-[clamp(64px,8vw,104px)]";

/** Partial fills are exact: 4.6 shows 4.6 stars, not 5. */
function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const row = (color: string, fill: string) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="shrink-0" style={{ width: size, height: size, color, fill }} strokeWidth={1.5} />
    ));
  return (
    <span className="relative inline-flex" role="img" aria-label={`${value} / 5`}>
      <span className="inline-flex gap-[2px]">{row("#B9C5D6", "transparent")}</span>
      <span className="absolute inset-y-0 left-0 inline-flex gap-[2px] overflow-hidden" style={{ width: `${pct}%` }}>
        {row("#F2A900", "#F2A900")}
      </span>
    </span>
  );
}

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

function Cta({ offer, tone = "light", full = false }: { offer: Offer; tone?: "light" | "dark"; full?: boolean }) {
  const dark = tone === "dark";
  return (
    <Link
      href={offer.href}
      className={`ib-cta inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-[15px] text-[16px] font-bold text-center leading-[1.4] ${
        full ? "w-full" : ""
      }`}
      style={{
        background: dark ? "var(--ib-mint)" : "var(--ib-brand)",
        color: dark ? "#052117" : "#fff",
        boxShadow: dark ? "0 14px 30px -14px rgba(124,240,189,0.6)" : "0 14px 30px -14px rgba(20,133,90,0.7)",
      }}
    >
      {offer.mode === "enrolled" && <Play className="w-[14px] h-[14px]" fill="currentColor" />}
      <BengaliText>{offer.label}</BengaliText>
      {offer.mode !== "enrolled" && <ArrowRight className="w-[16px] h-[16px] shrink-0" strokeWidth={2.4} />}
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
}: {
  offer: Offer;
  note?: string;
  dark?: boolean;
  className?: string;
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
          <div className="font-display text-[20px] font-semibold leading-[1.5]" style={{ color: ink }}>
            <BengaliText>আপনি এই কোর্সে ভর্তি আছেন</BengaliText>
          </div>
          <p className="mt-2 mb-6 text-[14.5px] leading-[1.8]" style={{ color: body }}>
            <BengaliText>যেখানে থেমেছিলেন, সেখান থেকেই আবার শুরু করুন।</BengaliText>
          </p>
          <Cta offer={offer} tone={dark ? "dark" : "light"} full />
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
                  {offer.savings} off
                </span>
              )}
            </div>
          )}

          {hasScholarship ? (
            <p className="mt-4 flex items-start gap-2.5 text-[14px] leading-[1.75]" style={{ color: body }}>
              <Gift className="mt-[2px] h-[16px] w-[16px] shrink-0" strokeWidth={2.2} style={{ color: "var(--ib-brand-2)" }} />
              <span>
                <span className="font-bold" style={{ color: dark ? "#A9F5D5" : "var(--ib-brand-2)" }}>
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
              <WaitlistForm slug={offer.slug} title={offer.title} discountPercent={offer.scholarshipPercent} />
            ) : (
              <Cta offer={offer} tone={dark ? "dark" : "light"} full />
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 pt-5" style={{ borderTop: `1px solid ${line}` }}>
            {[
              "লাইফটাইম অ্যাক্সেস",
              `${toBn(MOCK_TEST_COUNT)}টি কম্পিউটার-বেসড মক টেস্ট, ফ্রি`,
            ].map((t) => (
              <div key={t} className="flex items-start gap-2.5 text-[14px] leading-[1.7]" style={{ color: body }}>
                <Check
                  className="mt-[4px] h-[15px] w-[15px] shrink-0"
                  strokeWidth={3}
                  style={{ color: dark ? "#7CF0BD" : "var(--ib-brand)" }}
                />
                <BengaliText>{t}</BengaliText>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function TrustStrip({
  details,
  lessonCount,
}: {
  details?: CourseDetails;
  lessonCount: number;
}) {
  const rating = details?.rating;
  const stats = details?.heroStats?.length
    ? details.heroStats
    : [
        { value: toBn(MOCK_TEST_COUNT), label: "ফ্রি মক টেস্ট" },
        { value: toBn(lessonCount), label: "সেলফ-পেসড লেসন" },
        { value: "লাইফটাইম", label: "অ্যাক্সেস" },
      ];

  return (
    <Reveal>
    <div className="mt-14 lg:mt-16 pt-10" style={{ borderTop: "1px solid var(--ib-line)" }}>
      {rating && (
        <a href="#reviews" className="flex items-center gap-3 mb-9">
          <span className="font-display text-[30px] font-semibold leading-none tabular-nums" style={{ color: "var(--ib-ink)" }}>
            {toBn(rating.average)}
          </span>
          <span className="flex flex-col gap-1">
            <Stars value={rating.average} />
            <span className="text-[13px] underline underline-offset-2" style={{ color: "var(--ib-muted)" }}>
              <BengaliText>{`${toBn(rating.count)} জন লিখেছে`}</BengaliText>
            </span>
          </span>
        </a>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        {stats.map((s) => (
          <div key={s.label} className="relative pl-5" style={{ borderLeft: "3px solid var(--ib-brand)" }}>
            <div className="text-[13px] leading-[1.55]" style={{ color: "var(--ib-muted)" }}>
              <BengaliText>{s.label}</BengaliText>
            </div>
            <div
              className="mt-2.5 font-display text-[32px] font-semibold leading-none tabular-nums"
              style={{ color: "var(--ib-ink)" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
    </Reveal>
  );
}

function Hero({
  offer,
  title,
  details,
  lessonCount,
  pricingNote,
}: {
  offer: Offer;
  title: string;
  details?: CourseDetails;
  lessonCount: number;
  pricingNote?: string;
}) {
  const status =
    offer.mode === "enrolled" ? "ভর্তি আছো" : offer.mode === "buy" ? "ভর্তি চলছে" : "ওয়েটলিস্ট খোলা";

  return (
    <section id="ielts-hero" style={{ background: "var(--ib-fog)" }}>
      <div className={`${wrap} pt-[104px] sm:pt-[124px] pb-14 lg:pb-20`}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-12 lg:gap-16 items-start">
          <Reveal>
            <a href="/" className="inline-block mb-6" aria-label="FlyBridge Education Group">
              <Image
                src="/transparent-logo-dark.png"
                alt="FlyBridge Education Group"
                width={113}
                height={38}
                className="w-auto h-[32px] object-contain"
              />
            </a>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[14.5px] font-semibold" style={{ color: "var(--ib-ink)" }}>
                <BengaliText>{title}</BengaliText>
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold bg-white"
                style={{ border: "1px solid var(--ib-line)", color: "var(--ib-brand-2)" }}
              >
                <span
                className="ib-dot w-[7px] h-[7px] rounded-full"
                style={{ background: "var(--ib-brand)" }}
              />
                <BengaliText>{status}</BengaliText>
              </span>
            </div>

            <h1
              className="font-display font-bold leading-[1.18] mt-5 max-w-[640px]"
              style={{ fontSize: "clamp(34px,4.6vw,60px)", color: "var(--ib-ink)", letterSpacing: "-0.015em" }}
            >
              <BengaliText>{title}</BengaliText>
            </h1>
            {details?.titleAccent && (
              <p
                className="mt-5 pl-4 text-[16.5px] font-bold tracking-wide"
                style={{ color: "var(--ib-brand-2)", borderLeft: "3px solid var(--ib-brand)" }}
              >
                <BengaliText>{details.titleAccent}</BengaliText>
              </p>
            )}
            <p className="mt-5 text-[17px] leading-[1.9] max-w-[560px]" style={{ color: "var(--ib-body)" }}>
              <BengaliText>{COPY.heroSub}</BengaliText>
            </p>

            <OfferCard offer={offer} note={pricingNote} className="mt-8 max-w-[520px]" />
          </Reveal>

          <Reveal delay={0.15}>
            <ExamWindow />
            <p className="mt-5 text-[13.5px] leading-[1.75] max-w-[500px]" style={{ color: "var(--ib-muted)" }}>
              <BengaliText>{COPY.windowCaption}</BengaliText>
            </p>
          </Reveal>
        </div>

        <TrustStrip details={details} lessonCount={lessonCount} />
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
        ? "প্রতিটি লেসনের সাথেই রয়েছে প্র্যাকটিস টেস্ট, বারবার টেস্ট দিন, প্রতিবার নতুন প্রশ্নে"
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

        <ol className="mt-14 grid md:grid-cols-3 gap-x-10 gap-y-12">
          {steps.map((s, i) => (
            <li key={s.verb}>
              <Reveal delay={0.15 + i * 0.12}>
                <div className="flex items-center gap-4">
                <span
                  className="w-[46px] h-[46px] rounded-full flex items-center justify-center font-bold text-[18px] shrink-0 tabular-nums text-white"
                  style={{ background: "var(--ib-navy-2)" }}
                >
                  {toBn(i + 1)}
                </span>
                {i < steps.length - 1 && (
                  <span className="hidden md:block h-px flex-1" style={{ background: "var(--ib-line)" }} aria-hidden />
                )}
              </div>
              <h3 className="font-display text-[24px] font-semibold leading-[1.4] mt-6" style={{ color: "var(--ib-ink)" }}>
                <BengaliText>{s.verb}</BengaliText>
              </h3>
              <div className="mt-1 text-[15px] font-semibold" style={{ color: "var(--ib-brand-2)" }}>
                <BengaliText>{s.title}</BengaliText>
              </div>
              <p className="mt-3 text-[15.5px] leading-[1.85] max-w-[340px]" style={{ color: "var(--ib-body)" }}>
                <BengaliText>{s.text}</BengaliText>
              </p>
              <span
                className="inline-flex items-center gap-2 mt-4 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
                style={{ background: "var(--ib-fog)", color: "var(--ib-ink)" }}
              >
                <s.icon className="w-[14px] h-[14px]" strokeWidth={2} style={{ color: "var(--ib-brand-2)" }} />
                <BengaliText>{s.chip}</BengaliText>
              </span>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── mock tests ───────────────────────── */

function MockSection({ offer }: { offer: Offer }) {
  return (
    <section id="mock-tests" className={`ib-dark ${sectionY}`} style={{ background: "var(--ib-navy)" }}>
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
          <span className="inline-flex items-center gap-2 text-[14px]" style={{ color: "#9FB0C7" }}>
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
    { k: "ফরম্যাট", v: "সেলফ-পেসড এক্সপ্লেইনার" },
    { k: "লেভেল", v: details.level },
    { k: "মাধ্যম", v: details.language },
    { k: "গতি", v: details.pace },
    { k: "অ্যাক্সেস", v: "লাইফটাইম" },
    { k: "মোট কনটেন্ট", v: `${toBn(moduleCount)} মডিউল, ${toBn(lessonCount)}টি লেসন` },
  ].filter((r) => r.v && r.v !== "—");

  return (
    <section id="curriculum" className={sectionY} style={{ background: "#fff" }}>
      <div className={`${wrap} grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-12 lg:gap-20`}>
        <div className="lg:sticky lg:top-28 self-start">
          <Reveal>
            {curriculum.label && (
            <div className="text-[14px] font-semibold mb-3" style={{ color: "var(--ib-brand-2)" }}>
              <BengaliText>{curriculum.label}</BengaliText>
            </div>
          )}
          <h2
            className="font-display font-semibold leading-[1.4]"
            style={{ fontSize: "clamp(26px,3vw,38px)", color: "var(--ib-ink)" }}
          >
            <BengaliText>{curriculum.title}</BengaliText>
          </h2>
          <p className="mt-4 text-[16px] leading-[1.9]" style={{ color: "var(--ib-body)" }}>
            <BengaliText>{curriculum.subtitle}</BengaliText>
          </p>

          {details.targetBand && (
            <div
              className="mt-7 rounded-[14px] px-5 py-4 flex items-center justify-between gap-4"
              style={{ background: "var(--ib-fog)", border: "1px solid var(--ib-line)" }}
            >
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold" style={{ color: "var(--ib-ink)" }}>
                  <BengaliText>{details.targetBand.label}</BengaliText>
                </div>
                <div className="text-[13px] mt-0.5" style={{ color: "var(--ib-muted)" }}>
                  <BengaliText>{details.targetBand.sub}</BengaliText>
                </div>
              </div>
              <div className="font-display text-[36px] font-semibold leading-none tabular-nums" style={{ color: "var(--ib-ink)" }}>
                {details.targetBand.value}
              </div>
            </div>
          )}

          <dl className="mt-6">
            {facts.map((r) => (
              <div
                key={r.k}
                className="flex items-start justify-between gap-6 py-3 text-[14.5px]"
                style={{ borderTop: "1px solid var(--ib-line)" }}
              >
                <dt style={{ color: "var(--ib-muted)" }}>
                  <BengaliText>{r.k}</BengaliText>
                </dt>
                <dd className="font-medium text-right" style={{ color: "var(--ib-ink)" }}>
                  <BengaliText>{r.v as string}</BengaliText>
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
          <Reveal>
            <div className="ib-acc">
            {curriculum.modules.map((m, i) => (
              <details key={m.title} open={i === 0}>
                <summary className="flex items-center gap-4 py-5">
                  <span
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[15px] shrink-0 tabular-nums"
                    style={{ background: "var(--ib-fog)", color: "var(--ib-ink)", border: "1px solid var(--ib-line)" }}
                  >
                    {toBn(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold text-[17.5px] leading-[1.5]" style={{ color: "var(--ib-ink)" }}>
                      <BengaliText>{m.title}</BengaliText>
                    </span>
                    <span className="block text-[13.5px] mt-0.5" style={{ color: "var(--ib-muted)" }}>
                      <BengaliText>{m.lessonCount}</BengaliText>
                    </span>
                  </span>
                  <ChevronDown className="ib-chev w-[20px] h-[20px] shrink-0" style={{ color: "var(--ib-muted)" }} />
                </summary>
                <div className="pl-[54px] pr-2 pb-7">
                  <ul className="flex flex-col gap-2.5">
                    {m.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.75]" style={{ color: "var(--ib-body)" }}>
                        <span className="mt-[11px] w-[5px] h-[5px] rounded-full shrink-0" style={{ background: "var(--ib-brand)" }} />
                        <BengaliText>{item}</BengaliText>
                      </li>
                    ))}
                  </ul>
                  <div
                    className="mt-5 flex items-start gap-3 rounded-[12px] px-4 py-3.5 text-[14.5px] leading-[1.75] font-medium"
                    style={{ background: "var(--ib-fog)", color: "var(--ib-ink)" }}
                  >
                    <Flag className="w-[16px] h-[16px] mt-[5px] shrink-0" style={{ color: "var(--ib-brand-2)" }} strokeWidth={2.2} />
                    <BengaliText>{`মডিউল শেষে চ্যালেঞ্জ: ${m.capstone}`}</BengaliText>
                  </div>
                </div>
              </details>
            ))}
          </div>

          {curriculum.note && (
            <p className="mt-6 text-[14.5px] leading-[1.85]" style={{ color: "var(--ib-muted)" }}>
              <BengaliText>{curriculum.note}</BengaliText>
            </p>
          )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HighlightsSection({ details, lessonCount }: { details: CourseDetails; lessonCount: number }) {
  // Fallback only states things that are always true for this course.
  const highlights = details.highlights ?? [
    { title: `${toBn(lessonCount)}টি সেলফ-পেসড এক্সপ্লেইনার লেসন`, sub: "নিজের সময়মতো, নিজের গতিতে দেখো" },
    { title: `${N}টি ফ্রি কম্পিউটার-বেসড মক টেস্ট`, sub: "রিডিং, রাইটিং আর লিসেনিং" },
    { title: "লাইফটাইম অ্যাক্সেস", sub: "যতবার ইচ্ছা, যখন ইচ্ছা ফিরে আসো" },
  ];
  return (
    <section className={sectionY} style={{ background: "#fff" }}>
      <div className={wrap}>
        <Reveal>
          <Heading title="কোর্সে যা শিখবে" desc={details.highlightsDesc} />
        </Reveal>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
          {highlights.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.1} className="flex">
              <div className="flex items-start gap-4">
              <span
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--ib-fog)" }}
              >
                <Check className="w-[16px] h-[16px]" strokeWidth={3} style={{ color: "var(--ib-brand-2)" }} />
              </span>
              <div>
                <h3 className="font-display text-[17px] font-semibold leading-[1.5]" style={{ color: "var(--ib-ink)" }}>
                  <BengaliText>{item.title}</BengaliText>
                </h3>
                <p className="mt-1.5 text-[15px] leading-[1.8]" style={{ color: "var(--ib-body)" }}>
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
    <section className="py-[clamp(48px,6vw,80px)]" style={{ background: "var(--ib-fog)" }}>
      <Reveal>
        <div className={`${wrap} grid grid-cols-1 md:grid-cols-[200px_1fr] gap-9 md:gap-14 items-center max-w-[1040px]`}>
        {/* Flat digital cover — this is a PDF, so no hardcover art */}
        <div
          className="ib-float w-[168px] md:w-[200px] aspect-[3/4] mx-auto rounded-[10px] flex flex-col overflow-hidden"
          style={{
            background: "var(--ib-navy-2)",
            boxShadow: "0 28px 50px -26px rgba(10,20,40,0.7)",
          }}
        >
          <div className="flex-1 flex flex-col p-5">
            <span className="w-[26px] h-[5px] rounded-full" style={{ background: "var(--ib-mint)" }} />
            <div className="font-display font-semibold text-white leading-[1.45] mt-4 text-[18px]">
              <BengaliText>{book.title}</BengaliText>
            </div>
            <div className="mt-auto text-[12.5px] font-semibold" style={{ color: "var(--ib-mint)" }}>
              <BengaliText>ডিজিটাল প্র্যাকটিস বই</BengaliText>
            </div>
          </div>
        </div>

        <div>
          <h2
            className="font-display font-semibold leading-[1.45]"
            style={{ fontSize: "clamp(23px,2.6vw,32px)", color: "var(--ib-ink)" }}
          >
            <BengaliText>{COPY.bookTitle}</BengaliText>
          </h2>
          <p className="mt-3 text-[16px] leading-[1.9] max-w-[560px]" style={{ color: "var(--ib-body)" }}>
            <BengaliText>{book.desc}</BengaliText>
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {COPY.bookTicks.map((t) => (
              <li key={t} className="flex items-center gap-3 text-[15px] font-medium" style={{ color: "var(--ib-ink)" }}>
                <Check className="w-[17px] h-[17px] shrink-0" strokeWidth={3} style={{ color: "var(--ib-brand)" }} />
                <BengaliText>{t}</BengaliText>
              </li>
            ))}
          </ul>
          {book.includedNote && (
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mt-6 text-[13.5px] font-semibold bg-white"
              style={{ color: "var(--ib-brand-2)", border: "1px solid var(--ib-line)" }}
            >
              <Check className="w-[13px] h-[13px]" strokeWidth={3} />
              <BengaliText>{book.includedNote}</BengaliText>
            </span>
          )}
        </div>
      </div>
      </Reveal>
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
            className="rounded-[18px] p-[clamp(28px,4vw,44px)] relative overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid var(--ib-line)",
              boxShadow: "0 30px 60px -40px rgba(12,26,51,0.25)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-10 md:gap-14 items-start">
              <div>
                <div className="text-[14px] font-semibold mb-3" style={{ color: "var(--ib-brand-2)" }}>
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
                    কেনার ৩ দিনের মধ্যে যেকোনো কারণে কোর্সটা যদি আপনার পছন্দ না হয়, রিফান্ড দাবি করলেই
                    পুরো টাকা ফেরত পাবেন। কোনো ঝামেলা নেই, কোনো প্রশ্ন নেই।
                  </BengaliText>
                </p>
                <div className="mt-7 grid grid-cols-3 gap-4">
                  {facts.map((f) => (
                    <div
                      key={f.label}
                      className="rounded-[12px] px-3.5 py-4 text-center"
                      style={{ background: "var(--ib-fog)", border: "1px solid var(--ib-line)" }}
                    >
                      <div
                        className="font-display text-[clamp(20px,2.6vw,28px)] font-bold leading-none tabular-nums"
                        style={{ color: "var(--ib-brand-2)" }}
                      >
                        <BengaliText>{f.value}</BengaliText>
                      </div>
                      <div className="mt-2 text-[12.5px] leading-[1.5]" style={{ color: "var(--ib-muted)" }}>
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
                className="rounded-[14px] px-6 py-7 flex flex-col gap-5"
                style={{ border: "1px dashed var(--ib-line)", background: "var(--ib-fog)" }}
              >
                <div className="flex items-start gap-3">
                  <Check className="w-[18px] h-[18px] mt-[2px] shrink-0" strokeWidth={3} style={{ color: "var(--ib-brand)" }} />
                  <p className="text-[15px] leading-[1.8]" style={{ color: "var(--ib-ink)" }}>
                    <BengaliText>কেনার <span className="font-bold">৩ দিনের মধ্যে</span> রিফান্ড দাবি করুন।</BengaliText>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-[18px] h-[18px] mt-[2px] shrink-0" strokeWidth={3} style={{ color: "var(--ib-brand)" }} />
                  <p className="text-[15px] leading-[1.8]" style={{ color: "var(--ib-ink)" }}>
                    <BengaliText>অনুমোদনের পর <span className="font-bold">১০০% টাকা</span> ফেরত পাবেন।</BengaliText>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-[18px] h-[18px] mt-[2px] shrink-0" strokeWidth={3} style={{ color: "var(--ib-brand)" }} />
                  <p className="text-[15px] leading-[1.8]" style={{ color: "var(--ib-ink)" }}>
                    <BengaliText>টাকা ফেরত আসতে <span className="font-bold">৭–১৫ কার্যদিবস</span> লাগে।</BengaliText>
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
    <section id="waitlist" className={`ib-dark ${sectionY}`} style={{ background: "var(--ib-navy)" }}>
      <div className={`${wrap} grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] gap-12 lg:gap-20 items-start`}>
        <div>
          <Reveal>
            <Heading
              title={heading}
              desc={sub}
              dark
            />
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
                <Icon className="w-[20px] h-[20px] mt-[5px] shrink-0" strokeWidth={1.9} style={{ color: "var(--ib-mint)" }} />
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
            <p className="mt-5 text-[13.5px] leading-[1.75] text-center" style={{ color: "#9FB0C7" }}>
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
                {pricing.paymentMethods.map((name) => (
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

  const [enrolledDoc, liveReviews, userReviewDoc] = await Promise.all([
    liveCourse && userId ? CourseEnrollment.exists({ user: userId, course: liveCourse._id, status: "active" }) : null,
    liveCourse
      ? CourseReview.find({ course: liveCourse._id }).populate("user", "name avatar").sort({ createdAt: -1 }).limit(20).lean()
      : [],
    liveCourse && userId ? CourseReview.findOne({ course: liveCourse._id, user: userId }).lean() : null,
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
  const showWaitlistForm = true;

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
        ? "ক্লাসে ফিরে যান"
        : mode === "buy"
          ? "এখনই ভর্তি হন"
          : scholarshipPercent > 0
            ? `ওয়েটলিস্টে জয়েন করে ${toBn(scholarshipPercent)}% স্কলারশিপ নিন`
            : "Join the waitlist",
    price,
    originalPrice: details?.originalPrice,
    savings: details?.savings,
    scholarshipPercent,
    showWaitlistForm,
    slug: SLUG,
    title: details?.title ?? program.title,
  };

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
  const isEnrolled = mode === "enrolled";
  const stickyPrice = mode !== "enrolled" && offer.price ? { label: "কোর্স ফি", value: offer.price } : null;

  return (
    <div className="ib-page ielts-landing pb-[88px]">
      <JsonLd data={courseLd} />
      <Nav />

      <Hero
        offer={offer}
        title={details?.title ?? program.title}
        details={details}
        lessonCount={lessonCount}
        pricingNote={details?.pricing?.note}
      />

      <IeltsPromoPopup />

      {details ? (
        <>
          <SystemSection lessonCount={lessonCount} moduleCount={moduleCount} hasBook={Boolean(details.book)} />

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

          <div style={{ background: "#fff" }}>
            {liveCourse ? (
              <Reveal>
                <ReviewsSection
                  courseId={liveCourse._id.toString()}
                  reviews={liveReviewItems}
                  totalReviews={liveReviewItems.length}
                  averageRating={liveCourse.averageRating ?? 0}
                  userReview={userReviewDoc ? { id: userReviewDoc._id.toString(), rating: userReviewDoc.rating, text: userReviewDoc.text } : null}
                />
              </Reveal>
            ) : details.reviews?.length ? (
              <Reveal>
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
              </Reveal>
            ) : null}
          </div>

          {!isEnrolled && <RefundSection />}

          {!isEnrolled && <ClosingSection details={details} offer={offer} />}
        </>
      ) : (
        <section className={`${wrap} py-[96px] text-center`}>
          <Heading
            className="mx-auto [&_h2]:mx-auto [&_p]:mx-auto"
            title="এই কোর্সটা এখনো প্রস্তুত হচ্ছে"
            desc="ভিডিও লেসন, রিসোর্স আর ফুল কারিকুলাম রেডি হলেই এখানে দেখতে পাবে। একটু পরে আবার দেখো।"
          />
          <Link
            href="/programs"
            className="ib-cta mt-8 inline-flex items-center gap-2.5 font-bold text-[15px] text-white rounded-full px-7 py-[14px]"
            style={{ background: "var(--ib-brand)" }}
          >
            <BengaliText>প্রোগ্রামে ফিরে যাও</BengaliText>
            <ArrowRight className="w-[16px] h-[16px]" strokeWidth={2.4} />
          </Link>
        </section>
      )}

      <StickyOffer
        href={offer.href}
        label={offer.label}
        price={stickyPrice?.value}
        priceLabel={stickyPrice?.label}
        arrow={mode !== "enrolled"}
      />

      <style>{`
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
          --ib-mark: #FFE066;
          --ib-focus: #1F5C8A;
          /* keep shared components (reviews, related cards) on their expected tokens */
          --body: #39445A;
          --line: #DDE2EC;
          color: var(--ib-body);
          background: #fff;
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

        .ib-live-dot, .ib-dot { animation: ibPulse 1.6s ease-in-out infinite; }
        .ib-anim-in { animation: ibSlide .4s cubic-bezier(.22,1,.36,1) both; }
        .ib-float { animation: ibFloat 7s ease-in-out infinite; }
        .ib-float:hover { animation-play-state: paused; }
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
          .ib-cta, .ib-chev { transition: none; }
          .ib-cta:hover { transform: none; }
          .ib-live-dot, .ib-dot, .ib-anim-in, .ib-opt, .ib-float { animation: none !important; transition: none !important; }
          .ib-opt:hover, .ib-opt:active { transform: none; }
          .ib-acc summary, .closing-feature { transition: none; }
          .ib-acc summary:hover { background: transparent; }
          .closing-feature:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
