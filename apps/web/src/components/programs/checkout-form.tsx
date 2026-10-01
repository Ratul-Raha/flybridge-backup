"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { PaymentMethodPicker, defaultCheckoutCurrency, type PickableCurrency } from "@/components/payment/payment-method-picker";
import { formatMoney } from "@/lib/pricing";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

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
  level: string;
  language: string;
  pace: string;
  upcoming: boolean;
};

type Pricing = {
  subtotal: number;
  discount: number;
  total: number;
  label: string | null;
  code: string | null;
  currency: string;
};

export function CheckoutForm({ course }: { course: Props }) {
  const router = useRouter();
  const { user } = useAuth();
  const isFree = course.price <= 0;
  const isUpcoming = course.upcoming;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState<PickableCurrency>(
    defaultCheckoutCurrency(course.prices)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  const baseAmount =
    currency === "BDT" ? course.prices?.BDT ?? course.price : course.price;

  const fetchPricing = useCallback(
    async (code?: string) => {
      if (!user) return null;
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "course",
          itemId: course.courseId,
          currency,
          code: code?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not apply promo code");
      return data as Pricing;
    },
    [user, currency, course.courseId]
  );

  useEffect(() => {
    if (isFree || isUpcoming || !user) return;
    let active = true;
    fetchPricing(appliedCode ?? undefined)
      .then((data) => {
        if (active && data) setPricing(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isFree, isUpcoming, user, fetchPricing, appliedCode]);

  const applyCode = async () => {
    const value = promoCode.trim();
    if (!value) return;
    setApplying(true);
    setPromoError(null);
    try {
      const data = await fetchPricing(value);
      if (data) {
        setPricing(data);
        setAppliedCode(value);
      }
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Could not apply promo code");
    } finally {
      setApplying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpcoming) return;

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/programs/${course.slug}/checkout`)}`);
      return;
    }

    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "course",
          itemId: course.courseId,
          currency,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          code: appliedCode ?? undefined,
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

  const displayCurrency = pricing?.currency ?? currency;
  const hasDiscount = !!pricing && pricing.discount > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div>
        <p className={sectionTitle} style={{ color: "var(--body)" }}>Contact information</p>
        <div className="space-y-3">
          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }}>Full name</label>
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
            <label className={labelClass} style={{ color: "var(--ink)" }}>Email address</label>
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
            <label className={labelClass} style={{ color: "var(--ink)" }}>Phone <span className="font-normal opacity-50">(optional)</span></label>
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

      {/* Payment */}
      {!isFree && !isUpcoming && (
        <div>
          <p className={sectionTitle} style={{ color: "var(--body)" }}>Payment method</p>
          <PaymentMethodPicker
            prices={course.prices}
            value={currency}
            onChange={setCurrency}
          />
        </div>
      )}

      {/* Order summary + promo */}
      {!isFree && !isUpcoming && (
        <div>
          <p className={sectionTitle} style={{ color: "var(--body)" }}>Order summary</p>
          <div className="space-y-3 rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between text-[14px]">
              <span style={{ color: "var(--body)" }}>Subtotal</span>
              <span style={{ color: "var(--ink)" }}>
                {formatMoney(pricing?.subtotal ?? baseAmount, displayCurrency)}
              </span>
            </div>
            {hasDiscount && (
              <div className="flex items-center justify-between text-[14px]" style={{ color: "#1E8E5A" }}>
                <span>{pricing!.label ?? "Discount"}</span>
                <span>-{formatMoney(pricing!.discount, displayCurrency)}</span>
              </div>
            )}
            <div
              className="flex items-center justify-between border-t pt-3 text-[16px] font-bold"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <span>Total</span>
              <span>{formatMoney(pricing?.total ?? baseAmount, displayCurrency)}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code"
                className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[13.5px] uppercase outline-none transition-colors placeholder:text-body/50 focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15"
                style={{ color: "var(--ink)" }}
              />
              <button
                type="button"
                onClick={applyCode}
                disabled={applying || !promoCode.trim()}
                className="shrink-0 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-colors disabled:opacity-50"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                {applying ? "Applying…" : "Apply"}
              </button>
            </div>
            {promoError && (
              <p className="text-[12.5px] font-medium" style={{ color: "#C0392B" }}>{promoError}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>
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
          style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(29,46,107,0.55)" }}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting
            ? "Redirecting to payment…"
            : isFree
              ? "Get it for free"
              : `Pay with ${currency === "BDT" ? "EPS" : "Stripe"}`}
        </button>
      )}

      <div className="flex items-center justify-center gap-4 text-[11.5px] font-medium" style={{ color: "var(--body)", opacity: 0.7 }}>
        <span className="inline-flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Secure checkout
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          30-day guarantee
        </span>
      </div>
    </form>
  );
}
