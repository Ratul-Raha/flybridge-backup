"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMoney } from "@/lib/pricing";
import { ArrowUpRight, BookOpen, Check, Loader2, Lock, ShieldCheck, Zap } from "lucide-react";

type Course = {
  courseId: string;
  slug: string;
  title: string;
  image: string | null;
  badge: string;
  price: number;
  currency: string;
  prices?: { USD?: number; BDT?: number } | null;
  /** The pre-discount BDT amount, as a number so the summary can subtract from it. */
  originalPrice?: number;
  discountLabel?: string | null;
  /** Wishlist discount for waitlist members, already resolved by the server. */
  wishlistDiscountPercent?: number;
  wishlistDiscountAmount?: number;
  upcoming: boolean;
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
  product,
}: {
  course: Course;
  moduleCount: number;
  lessonCount: number;
  product: ReactNode;
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
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-body/50 focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
  const labelClass = "block text-[13px] font-medium mb-1.5";
  const sectionTitle = "text-[12px] font-semibold uppercase tracking-[0.08em] mb-4";

  const displayCurrency = "BDT";
  // The server already applied the course's discount, so the summary and the
  // order it creates are always the same numbers.
  const total = baseAmount;

  // The summary reads as an invoice: the full price, what the running discount
  // takes off it, then what is left to pay. The discount is derived from the two
  // amounts rather than sent separately, so the rows can never disagree. With no
  // discount there is nothing to subtract, so the total stands alone rather than
  // repeating itself under a second heading.
  const originalAmount = course.originalPrice ?? total;
  const wishlistDiscountAmount = course.wishlistDiscountAmount ?? 0;
  // The general (course) discount is whatever the original price drops by before
  // the wishlist cut, so the two rows stay additive and sum to the total.
  const discountAmount = Math.max(0, originalAmount - total - wishlistDiscountAmount);
  const hasDiscount = discountAmount > 0 || wishlistDiscountAmount > 0;

  const money = (amount: number) => (isFree ? "Free" : formatMoney(amount, displayCurrency));

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start"
    >
      {/* Left — product + contact */}
      <div className="space-y-8">
        {product}

        <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
          <p className={sectionTitle} style={{ color: "var(--body)" }}>
            Contact information
          </p>
          <div className="space-y-3">
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
                style={{ color: "var(--ink)" }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                style={{ color: "var(--ink)" }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>
                Phone <span className="font-normal opacity-50">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className={inputClass}
                style={{ color: "var(--ink)" }}
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}

          {isUpcoming ? (
            <div
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold"
              style={{ background: "var(--bg-soft)", color: "var(--body)" }}
            >
              Coming soon
            </div>
          ) : null}
        </div>
      </div>

      {/* Right — subtotal card, then payment options, then inclusions */}
      <aside className="space-y-6">
        <div
          className="rounded-lg border border-line bg-white overflow-hidden"
          style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.18)" }}
        >
          <div className="p-6">
            <p className={sectionTitle} style={{ color: "var(--body)" }}>
              Order summary
            </p>

            <div className="flex gap-4 pb-5 border-b" style={{ borderColor: "var(--line)" }}>
              <div
                className="w-[64px] h-[64px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: "var(--brand-soft)" }}
              >
                {course.image ? (
                  <Image
                    src={course.image}
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
                  {course.title}
                </p>
                <p className="text-[12px] mt-1" style={{ color: "var(--body)" }}>
                  {course.badge}
                </p>
              </div>
            </div>

            {hasDiscount && (
              <div className="py-4 space-y-2.5">
                <div className="flex items-center justify-between gap-4 text-[13.5px]">
                  <span style={{ color: "var(--body)" }}>Course price</span>
                  <span className="font-medium tabular-nums" style={{ color: "var(--ink)" }}>
                    {money(originalAmount)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between gap-4 text-[13.5px]">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span style={{ color: "var(--body)" }}>Discount</span>
                      {course.discountLabel && (
                        <span
                          className="font-mono text-[10px] font-medium tracking-[0.08em]"
                          style={{ color: "var(--brand-2)" }}
                        >
                          {course.discountLabel}
                        </span>
                      )}
                    </span>
                    <span
                      className="font-medium tabular-nums whitespace-nowrap"
                      style={{ color: "var(--brand-2)" }}
                    >
                      &minus;{formatMoney(discountAmount, displayCurrency)}
                    </span>
                  </div>
                )}

                {wishlistDiscountAmount > 0 && (
                  <div className="flex items-center justify-between gap-4 text-[13.5px]">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span style={{ color: "var(--body)" }}>Wishlist discount</span>
                      {course.wishlistDiscountPercent ? (
                        <span
                          className="font-mono text-[10px] font-medium tracking-[0.08em]"
                          style={{ color: "var(--brand-2)" }}
                        >
                          {course.wishlistDiscountPercent}%
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="font-medium tabular-nums whitespace-nowrap"
                      style={{ color: "var(--brand-2)" }}
                    >
                      &minus;{formatMoney(wishlistDiscountAmount, displayCurrency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div
              className={`flex items-center justify-between gap-4 ${
                hasDiscount ? "border-t pt-4" : "pt-5"
              }`}
              style={{ borderColor: "var(--line)" }}
            >
              <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                Total
              </span>
              <span
                className="text-[22px] font-bold leading-none tabular-nums"
                style={{ color: "var(--ink)" }}
              >
                {money(total)}
              </span>
            </div>

            {isUpcoming && (
              <div
                className="mt-4 text-center text-[13px] font-medium py-2.5 rounded-xl"
                style={{ background: "rgba(111,76,224,0.08)", color: "#6B4CE0" }}
              >
                This course is coming soon — join the waitlist to be notified.
              </div>
            )}
          </div>
        </div>

        {canPay && (
          <div
            className="rounded-lg border border-line bg-white p-6"
            style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.18)" }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[15px] font-bold text-white transition-all duration-250 hover:-translate-y-[1px] hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{
                background: "var(--brand)",
                boxShadow: "0 16px 28px -14px rgba(29,46,107,0.55)",
              }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? "Redirecting to payment…" : isFree ? "Get it for free" : "Pay Now"}
            </button>
          </div>
        )}

        <div
          className="rounded-lg border border-line bg-white p-6"
          style={{ boxShadow: "0 32px 60px -32px rgba(18,32,67,0.18)" }}
        >
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
              ...(course.slug === "ielts-band-score-machine" ? [] : ["Certificate of completion"]),
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

          <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--line)" }}>
            <p
              className="text-[11.5px] font-semibold uppercase tracking-[0.08em] mb-3.5"
              style={{ color: "var(--body)" }}
            >
              Buying safely
            </p>
            <ul className="space-y-2.5">
              {/* The refund row is the only outbound one, and it opens the exact
                  section of the policy that says what is covered. */}
              {[
                {
                  icon: Lock,
                  label: "SSL encrypted, secure checkout",
                  href: null,
                },
                {
                  icon: ShieldCheck,
                  label: "3-day refund, 100% of your money back",
                  href: "/refund#terms",
                },
                {
                  icon: Zap,
                  label: "Instant access once payment clears",
                  href: null,
                },
              ].map((item) => {
                const Icon = item.icon;
                const body = (
                  <>
                    <Icon
                      className="w-[14px] h-[14px] shrink-0"
                      strokeWidth={2.2}
                      style={{ color: "var(--brand-2)" }}
                    />
                    <span className="flex-1 text-[12.5px] leading-[1.5]" style={{ color: "var(--body)" }}>
                      {item.label}
                    </span>
                    {item.href && (
                      <ArrowUpRight
                        className="w-[13px] h-[13px] shrink-0 opacity-60"
                        strokeWidth={2.4}
                        style={{ color: "var(--brand-2)" }}
                      />
                    )}
                  </>
                );

                return (
                  <li key={item.label} className="flex items-start gap-2.5">
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2.5 group -m-1 p-1 rounded transition-colors hover:bg-brand-soft/50"
                      >
                        {body}
                      </a>
                    ) : (
                      <span className="flex items-start gap-2.5">{body}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>
    </form>
  );
}
