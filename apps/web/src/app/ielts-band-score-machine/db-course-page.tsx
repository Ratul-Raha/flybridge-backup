/**
 * DB-only course page (no static program entry).
 *
 * This is the previous `DbCoursePage` from the landing page, moved here unchanged
 * so the redesigned landing page file stays focused. It only renders when
 * `getProgram(SLUG)` returns nothing but the course exists in the database.
 */
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { BookOpen, Check, Lock, ShieldCheck, Zap } from "lucide-react";
import { formatPriceText, cleanPrices } from "@/lib/pricing";
import type { CourseDoc } from "@/lib/models/course";
import { CheckoutForm } from "@/components/programs/checkout-form";
import { BengaliText } from "@/components/bengali-text";
import { ReviewsSection, type ReviewItem } from "@/components/programs/reviews-section";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBn = (v: number | string) => String(v).replace(/\d/g, (d) => BN_DIGITS.charAt(Number(d)));

const playIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4L20 12L6 20V4Z" />
  </svg>
);

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

export function DbCoursePage({
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
                আপনি এই কোর্সে ভর্তি আছেন
              </h2>
              <p className="text-[14.5px] mt-2 mb-8 leading-[1.8]" style={{ color: "var(--body)" }}>
                {toBn(moduleCount)} মডিউলে {toBn(lessonCount)} লেসন আপনার জন্য রেডি।
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
                        <Image src={checkoutCourse.image} alt={checkoutCourse.title} fill sizes="200px" className="absolute inset-0 w-full h-full object-cover" />
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
                        <Image src={checkoutCourse.image} alt="" width={128} height={128} sizes="64px" className="w-full h-full object-cover" />
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
                      "লাইফটাইম অ্যাক্সেস — নিজের গতিতে শিখুন",
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
                      { icon: ShieldCheck, label: "৩ দিনের রিফান্ড গ্যারান্টি" },
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
          <SectionIntro kicker="কোর্সের বই" title="বই ও রিডিং ম্যাটেরিয়াল" desc="কোর্সের সাথে ফ্রি — নিজের সময়মতো ডাউনলোড করে পড়ুন" />
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
