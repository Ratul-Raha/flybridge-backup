"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMoney } from "@/lib/pricing";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  Clock3,
  CreditCard,
  GraduationCap,
  Loader2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { CouponCodeEntry, type CouponQuote } from "@/components/checkout/coupon-code-entry";
import { trackMetaEvent } from "@/lib/meta-events";
import { outboundLink } from "@/lib/outbound-link";

type Course = {
  courseId: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string | null;
  badge: string;
  price: number;
  currency: string;
  certificateEnabled?: boolean;
  prices?: { USD?: number; BDT?: number } | null;
  /** The pre-discount BDT amount, as a number so the summary can subtract from it. */
  originalPrice?: number;
  discountLabel?: string | null;
  /** Wishlist discount for waitlist members, already resolved by the server. */
  wishlistDiscountPercent?: number;
  wishlistDiscountAmount?: number;
  upcoming: boolean;
  /** Whether at least one lesson is marked free preview. */
  hasFreePreview?: boolean;
  level?: string;
  language?: string;
  pace?: string;
  access?: string;
};

type CheckoutInclusion = {
  title: string;
  description?: string;
};

type CheckoutStat = {
  value: string;
  label: string;
};

/**
 * The full checkout grid. The price summary and the "Pay Now" button live in
 * the same client tree so the discount shown in the summary matches the
 * amount the gateway will charge. Pricing is always in BDT.
 */
export function CheckoutPanel({
  course,
  moduleCount,
  lessonCount,
  intro,
  stats,
  includedItems,
}: {
  course: Course;
  moduleCount: number;
  lessonCount: number;
  intro?: string;
  stats?: CheckoutStat[];
  includedItems?: CheckoutInclusion[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const baseAmount = course.prices?.BDT ?? course.price ?? 0;
  const isFree = baseAmount <= 0;
  const isUpcoming = course.upcoming;
  const canPay = !isFree && !isUpcoming;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpcoming) return;

    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }

    // Checked before anything else so a signed-out buyer who already owns this
    // is told to sign in rather than being bounced to login and back with no
    // idea why. The price never depends on the answer — this is only about
    // buying it twice.
    setSubmitting(true);
    setError(null);
    try {
      const check = await fetch("/api/orders/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "course",
          itemId: course.courseId,
          email: email.trim(),
        }),
      });
      const checked = await check.json().catch(() => null);

      if (check.ok && checked?.available === false) {
        if (!user) {
          setError(checked.message ?? "Sign in to continue.");
          return;
        }
        if (checked.reason === "enrolled") {
          router.push(`/dashboard/courses/${course.slug}/learn`);
          return;
        }
        // Signed in and the server already refuses this order; let the order
        // endpoint be the one to say why.
      }

      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/programs/${course.slug}/checkout`)}`);
        return;
      }

      trackMetaEvent("InitiateCheckout", {
        content_ids: [course.courseId],
        content_name: course.title,
        content_type: "product",
        value: couponQuote?.total ?? baseAmount,
        currency: displayCurrency,
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "course",
          itemId: course.courseId,
          currency: "BDT",
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          code: couponQuote?.code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Enrollment failed");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      router.push(`/dashboard/courses/${course.slug}/learn`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-[14px] border border-[#DDE4E2] bg-white px-4 py-[14px] text-[14px] outline-none transition-all placeholder:text-[#98A2B3] focus:border-[#15875F] focus:ring-4 focus:ring-[#15875F]/10";
  const labelClass = "mb-2 block text-[13px] font-semibold";
  const displayCurrency = "BDT";
  const currentCouponQuote = couponQuote?.currency === displayCurrency ? couponQuote : null;
  // The server already applied the course's discount, so the summary and the
  // order it creates are always the same numbers.
  const total = currentCouponQuote?.total ?? baseAmount;

  // The summary reads as an invoice: the full price, what the running discount
  // takes off it, then what is left to pay. The discount is derived from the two
  // amounts rather than sent separately, so the rows can never disagree. With no
  // discount there is nothing to subtract, so the total stands alone rather than
  // repeating itself under a second heading.
  const originalAmount = course.originalPrice ?? baseAmount;
  const wishlistDiscountAmount = course.wishlistDiscountAmount ?? 0;
  // The general (course) discount is whatever the original price drops by before
  // the wishlist cut, so the two rows stay additive and sum to the total.
  const discountAmount = Math.max(0, originalAmount - baseAmount - wishlistDiscountAmount);
  const couponDiscountAmount = currentCouponQuote?.couponDiscount ?? 0;
  const hasDiscount = discountAmount > 0 || wishlistDiscountAmount > 0 || couponDiscountAmount > 0;

  const money = (amount: number) => (amount <= 0 ? "Free" : formatMoney(amount, displayCurrency));
  const itemsToInclude = includedItems ?? [
    ...(moduleCount || lessonCount
      ? [{ title: `${moduleCount} modules · ${lessonCount} lessons`, description: "Self-paced course content." }]
      : []),
    ...(course.language ? [{ title: `Course language: ${course.language}` }] : []),
    ...(course.pace ? [{ title: course.pace }] : []),
    ...(course.certificateEnabled ? [{ title: "Completion certificate" }] : []),
  ];
  const statsToShow = stats ?? [
    ...(moduleCount ? [{ value: String(moduleCount), label: "Modules" }] : []),
    ...(lessonCount ? [{ value: String(lessonCount), label: "Lessons" }] : []),
    ...(course.level ? [{ value: course.level, label: "Level" }] : []),
    ...(course.access ? [{ value: course.access, label: "Access" }] : []),
  ].slice(0, 4);
  const checkoutIntro = intro ?? course.description;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section
        className="relative isolate overflow-hidden rounded-[30px] bg-[#101B35] text-white shadow-[0_30px_75px_-38px_rgba(16,27,53,0.58)]"
        aria-labelledby="checkout-title"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
          style={{
            background:
              "radial-gradient(600px 400px at 100% 0%, rgba(124,240,189,.19), transparent 65%), radial-gradient(560px 360px at 0% 100%, rgba(42,104,150,.2), transparent 68%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at 70% 20%, #000 4%, transparent 72%)",
          }}
        />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,.82fr)]">
          <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9 lg:py-11">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.17em] text-[#B8F6DD]">
              <Lock className="h-[13px] w-[13px]" strokeWidth={2.4} />
              FlyBridge · Secure checkout
            </div>
            <h1
              id="checkout-title"
              className="mt-5 max-w-[620px] font-display text-[clamp(27px,4vw,43px)] font-semibold leading-[1.25] tracking-[-0.025em]"
            >
              আপনার পরের লক্ষ্যপূরণের যাত্রা শুরু হোক এখান থেকেই
            </h1>
            <p className="mt-4 max-w-[590px] text-[14.5px] leading-[1.85] text-[#C0CAD8] sm:text-[15.5px]">
              {checkoutIntro || "কোর্সে ভর্তি হয়ে নিজের শেখার যাত্রা শুরু করুন।"}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5 text-[12px] font-medium text-[#D9E2EC]">
              <span className="inline-flex items-center gap-2">
                <Check className="h-[14px] w-[14px] text-[#8AF0C5]" strokeWidth={2.8} />
                তাৎক্ষণিক কোর্স অ্যাক্সেস
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-[14px] w-[14px] text-[#8AF0C5]" strokeWidth={2.3} />
                ৩ দিনের refund window
              </span>
            </div>
          </div>

          <div className="px-4 pb-5 sm:px-6 sm:pb-6 lg:py-6 lg:pr-6">
            <div className="h-full rounded-[23px] border border-white/10 bg-white/[0.075] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex h-full items-center gap-4 sm:gap-5">
                <div className="relative h-[112px] w-[92px] shrink-0 overflow-hidden rounded-[15px] bg-white/10 sm:h-[145px] sm:w-[120px]">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 92px, 120px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#B8F6DD]">
                      <BookOpen className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9F36A] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#142139]">
                    <Sparkles className="h-3 w-3" />
                    {course.badge}
                  </span>
                  <h2 className="mt-3 font-display text-[16px] font-semibold leading-[1.45] text-white sm:text-[18px]">
                    {course.title}
                  </h2>
                  {course.subtitle && (
                    <p className="mt-1 text-[11px] leading-[1.5] text-[#D0D9E4]">{course.subtitle}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-[1.5] text-[#BCC8D7]">
                    {[course.level, course.language].filter(Boolean).map((detail) => (
                      <span key={detail} className="inline-flex items-center gap-2">
                        {detail}
                        {detail === course.level && course.language && <i className="h-1 w-1 rounded-full bg-white/40" />}
                      </span>
                    ))}
                  </div>
                  {course.pace && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#B8F6DD]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {course.pace}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {statsToShow.length > 0 && (
          <dl className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
            {statsToShow.map((stat, index) => (
              <div
                key={`${stat.value}-${stat.label}`}
                className="min-w-0 px-5 py-4 sm:px-7 sm:py-5"
                style={{ borderLeft: index > 0 ? "1px solid rgba(255,255,255,.1)" : undefined }}
              >
                <dt className="text-[10.5px] leading-[1.5] text-[#AAB8CA] sm:text-[11px]">{stat.label}</dt>
                <dd className="mt-1 font-display text-[20px] font-semibold leading-tight text-[#C9F36A] sm:text-[23px]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-8">
        <div className="space-y-6">
          <section className="rounded-[25px] border border-[#E5EAE8] bg-white p-5 shadow-[0_18px_50px_-42px_rgba(16,27,53,.36)] sm:p-8">
            <div className="mb-6 flex items-start gap-3.5 sm:mb-7">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#E6F7F0] font-mono text-[13px] font-bold text-[#14845B]">
                01
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#14845B]">
                  Your details
                </p>
                <h2 className="mt-1 font-display text-[20px] font-semibold leading-[1.35] text-[#142139] sm:text-[22px]">
                  কোথায় পাঠাবো আপনার কোর্স অ্যাক্সেস?
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-[#697586]">
                  সঠিক তথ্য দিন—অর্ডার ও অ্যাক্সেসের আপডেট এখানেই পাবেন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-name" className={labelClass} style={{ color: "var(--ink)" }}>
                  Full name
                </label>
                <input
                  id="checkout-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার পুরো নাম"
                  className={inputClass}
                  style={{ color: "var(--ink)" }}
                />
              </div>
              <div>
                <label htmlFor="checkout-email" className={labelClass} style={{ color: "var(--ink)" }}>
                  Email address
                </label>
                <input
                  id="checkout-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  style={{ color: "var(--ink)" }}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="checkout-phone" className={labelClass} style={{ color: "var(--ink)" }}>
                  Phone number <span className="font-normal text-[#8792A2]">(optional)</span>
                </label>
                <input
                  id="checkout-phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className={inputClass}
                  style={{ color: "var(--ink)" }}
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-[#F2C7C2] bg-[#FFF4F2] px-4 py-3 text-[13px] font-medium leading-[1.6] text-[#A4362B]">
                {error}
              </p>
            )}
          </section>

          <div className="flex items-start gap-3 rounded-[18px] border border-[#DDEEE6] bg-[#F5FBF8] px-4 py-4 sm:px-5">
            <BadgeCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#16845C]" />
            <p className="text-[12.5px] leading-[1.7] text-[#526273]">
              পেমেন্ট সফল হলে আপনার অ্যাকাউন্টে কোর্সটি যোগ হবে। নতুন হলে পরের ধাপে সাইন ইন বা অ্যাকাউন্ট তৈরি করতে পারবেন।
            </p>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-[25px] border border-[#E4E9E7] bg-white shadow-[0_24px_65px_-42px_rgba(16,27,53,.38)]">
            <div className="border-b border-[#E9EEEC] px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#687587]">
                  Order summary
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF8F1] px-2.5 py-1 text-[10px] font-semibold text-[#137C55]">
                  <Lock className="h-3 w-3" /> Secure
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3.5">
                <div className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] bg-[#E7F6F0]">
                  {course.image ? (
                    <Image src={course.image} alt="" fill sizes="58px" className="object-cover" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-[#14845B]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-[14px] font-semibold leading-[1.45] text-[#142139]">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-[11px] font-medium text-[#778394]">{course.badge}</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <div className="space-y-3">
                {hasDiscount && (
                  <>
                    <div className="flex items-center justify-between gap-4 text-[13px]">
                      <span className="text-[#687587]">Course price</span>
                      <span className="font-medium tabular-nums text-[#142139]">{money(originalAmount)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-[13px]">
                        <span className="flex flex-wrap items-center gap-2 text-[#687587]">
                          Discount
                          {course.discountLabel && (
                            <span className="rounded bg-[#EAF8F1] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.06em] text-[#147D56]">
                              {course.discountLabel}
                            </span>
                          )}
                        </span>
                        <span className="whitespace-nowrap font-semibold tabular-nums text-[#14845B]">
                          −{formatMoney(discountAmount, displayCurrency)}
                        </span>
                      </div>
                    )}
                    {wishlistDiscountAmount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-[13px]">
                        <span className="text-[#687587]">
                          Wishlist discount{course.wishlistDiscountPercent ? ` · ${course.wishlistDiscountPercent}%` : ""}
                        </span>
                        <span className="whitespace-nowrap font-semibold tabular-nums text-[#14845B]">
                          −{formatMoney(wishlistDiscountAmount, displayCurrency)}
                        </span>
                      </div>
                    )}
                    {couponDiscountAmount > 0 && currentCouponQuote && (
                      <div className="flex items-center justify-between gap-4 text-[13px]">
                        <span className="text-[#687587]">Coupon · {currentCouponQuote.code}</span>
                        <span className="whitespace-nowrap font-semibold tabular-nums text-[#14845B]">
                          −{formatMoney(couponDiscountAmount, displayCurrency)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {canPay && (
                <div className={`${hasDiscount ? "mt-4 border-t pt-4" : "mt-1"}`} style={{ borderColor: "var(--line)" }}>
                  <CouponCodeEntry
                    itemType="course"
                    itemId={course.courseId}
                    currency={displayCurrency}
                    onQuoteChange={setCouponQuote}
                  />
                </div>
              )}

              <div className={`mt-4 flex items-end justify-between gap-4 border-t border-[#E9EEEC] pt-4 ${hasDiscount ? "" : "!mt-2"}`}>
                <div>
                  <p className="text-[13px] font-semibold text-[#39465A]">Total due</p>
                  <p className="mt-1 text-[10.5px] text-[#8893A1]">One-time payment · BDT</p>
                </div>
                <span className="font-display text-[25px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[#142139]">
                  {money(total)}
                </span>
              </div>

              {isUpcoming ? (
                <div className="mt-5 rounded-[14px] bg-[#F2EEFF] px-4 py-3 text-center text-[12.5px] font-semibold leading-[1.6] text-[#6948C9]">
                  This course is coming soon. Join the waitlist to be notified.
                </div>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-[15px] bg-[#14845B] px-5 py-[15px] text-[14px] font-bold text-white shadow-[0_14px_28px_-15px_rgba(20,132,91,.8)] transition-all hover:-translate-y-0.5 hover:bg-[#0F714D] disabled:cursor-wait disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {submitting
                      ? "Taking you to secure payment…"
                      : isFree || total === 0
                        ? "Get started for free"
                        : "Continue to secure payment"}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </button>

                  {course.hasFreePreview && (
                    <a
                      href={`/dashboard/courses/${course.slug}/learn`}
                      className="mt-3 flex w-full items-center justify-center rounded-[14px] border border-[#E0E6E3] px-4 py-3 text-[12.5px] font-semibold text-[#465366] transition-colors hover:bg-[#F7FAF8]"
                    >
                      Explore the free preview
                    </a>
                  )}

                  {canPay && (
                    <>
                      <div className="my-4 flex items-center gap-3">
                        <span className="h-px flex-1 bg-[#E9EEEC]" />
                        <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-[#8A95A3]">Need help?</span>
                        <span className="h-px flex-1 bg-[#E9EEEC]" />
                      </div>
                      <a
                        href={
                          outboundLink(
                            `https://wa.me/8801804400070?text=${encodeURIComponent(
                              `Hi FlyBridge! I'd like to pay for "${course.title}" (BDT ${formatMoney(total, displayCurrency)}${currentCouponQuote ? ` with coupon ${currentCouponQuote.code}` : ""}).`
                            )}`,
                            { label: `checkout-whatsapp:${course.slug}` }
                          ) ?? "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[#DDEEE5] bg-[#F5FBF7] px-4 py-3 text-[12px] font-bold text-[#167C53] transition-colors hover:bg-[#EAF7EF]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Ask us on WhatsApp
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </>
                  )}
                </>
              )}

              <div className="mt-4 flex items-start gap-2.5 border-t border-[#E9EEEC] pt-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#14845B]" />
                <p className="text-[10.5px] leading-[1.65] text-[#758091]">
                  ৩ দিনের refund window প্রযোজ্য। ব্যবহারের শর্ত ও রিফান্ডের সম্পূর্ণ নিয়ম{" "}
                  <a href="/refund#terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#147D56] underline underline-offset-2">
                    দেখে নিন
                  </a>
                  ।
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[25px] border border-[#E4E9E7] bg-white p-5 shadow-[0_18px_50px_-42px_rgba(16,27,53,.32)] sm:p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F0F5F3] text-[#14845B]">
                <GraduationCap className="h-[17px] w-[17px]" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#778394]">Your course includes</p>
                <h2 className="mt-0.5 font-display text-[16px] font-semibold text-[#142139]">শেখার জন্য যা যা পাচ্ছেন</h2>
              </div>
            </div>
            <ul className="mt-5 space-y-4">
              {itemsToInclude.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex items-start gap-3">
                  <span className="mt-[1px] flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-[#E8F7F0] text-[#14845B]">
                    <Check className="h-[11px] w-[11px]" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[12.5px] leading-[1.55] text-[#253247] ${item.description ? "font-semibold" : "font-medium"}`}>
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="mt-1 block text-[11px] leading-[1.65] text-[#758091]">
                        {item.description}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-[#E9EEEC] pt-4">
              <div className="flex items-center gap-2 text-[11px] font-medium text-[#758091]">
                <Zap className="h-3.5 w-3.5 text-[#14845B]" />
                {isFree ? "Course access is added after enrollment." : "Course access is added as soon as payment clears."}
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-[#758091]">
                <Lock className="h-3.5 w-3.5 text-[#14845B]" />
                Your account and checkout details stay protected.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
