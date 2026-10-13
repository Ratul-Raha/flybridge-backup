"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMoney } from "@/lib/pricing";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { CouponCodeEntry, type CouponQuote } from "@/components/checkout/coupon-code-entry";
import { trackMetaEvent } from "@/lib/meta-events";

type Props = {
  courseId: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string | null;
  badge: string;
  price: number;
  currency: string;
  prices?: { USD?: number; BDT?: number } | null;
  originalPrice?: string;
  discountLabel?: string | null;
  level: string;
  language: string;
  pace: string;
  upcoming: boolean;
};

export function CheckoutForm({ course }: { course: Props }) {
  const router = useRouter();
  const { user } = useAuth();
  const baseAmount = course.prices?.BDT ?? 0;
  const isFree = baseAmount <= 0;
  const isUpcoming = course.upcoming;

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
        if (!user && checked.reason === "enrolled") {
          setError("You are already enrolled with this email. Sign in to continue.");
          return;
        }
        if (checked.reason === "enrolled") {
          router.push(`/dashboard/courses/${course.slug}/learn`);
          return;
        }
        if (!user) {
          setError(checked.message ?? "Sign in to continue.");
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
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-body/50 focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
  const labelClass = "block text-[13px] font-medium mb-1.5";
  const sectionTitle = "text-[12px] font-semibold uppercase tracking-[0.08em] mb-4";

  const displayCurrency = "BDT";
  const currentCouponQuote = couponQuote?.currency === displayCurrency ? couponQuote : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div>
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
      </div>

      {/* Payments are collected in BDT through the local gateway. */}

      {/* The server already applied the course's discount, so this is the
          exact amount the gateway will charge. */}
      {!isFree && !isUpcoming && (
        <div>
          <p className={sectionTitle} style={{ color: "var(--body)" }}>
            Order summary
          </p>
          <div className="space-y-3 rounded-xl border border-line bg-white p-4">
            <div
              className="flex items-center justify-between text-[16px] font-bold"
              style={{ color: "var(--ink)" }}
            >
              <span>{course.discountLabel ?? (currentCouponQuote ? "Subtotal" : "Total")}</span>
              <span className="flex items-baseline gap-2">
                {formatMoney(baseAmount, displayCurrency)}
                {course.originalPrice && (
                  <span
                    className="text-[12px] font-medium line-through"
                    style={{ color: "var(--body)", opacity: 0.6 }}
                  >
                    {course.originalPrice}
                  </span>
                )}
              </span>
            </div>
            {currentCouponQuote && (
              <>
                <div className="flex items-center justify-between text-[13.5px]" style={{ color: "#16834B" }}>
                  <span>Coupon · {currentCouponQuote.code}</span>
                  <span>&minus;{formatMoney(currentCouponQuote.couponDiscount, displayCurrency)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-[16px] font-bold" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                  <span>Total</span>
                  <span>{formatMoney(currentCouponQuote.total, displayCurrency)}</span>
                </div>
              </>
            )}
            <CouponCodeEntry
              itemType="course"
              itemId={course.courseId}
              currency={displayCurrency}
              onQuoteChange={setCouponQuote}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {isUpcoming ? (
        <div
          className="w-full flex items-center justify-center gap-2 rounded-full py-4 text-[15px] font-semibold"
          style={{ background: "var(--bg-soft)", color: "var(--body)" }}
        >
          Coming soon
        </div>
      ) : (
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
          {submitting
            ? "Redirecting to payment…"
            : isFree || currentCouponQuote?.total === 0
              ? "Get it for free"
              : "Pay with EPS"}
        </button>
      )}

      <div
        className="flex items-center justify-center gap-4 text-[11.5px] font-medium"
        style={{ color: "var(--body)", opacity: 0.7 }}
      >
        <span className="inline-flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Secure checkout
        </span>
        <a href="/refund" className="inline-flex items-center gap-1 underline underline-offset-2">
          <ShieldCheck className="w-3 h-3" />
          3-day refund policy
        </a>
      </div>
    </form>
  );
}
