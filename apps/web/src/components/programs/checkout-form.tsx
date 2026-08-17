"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
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
  level: string;
  language: string;
  pace: string;
  upcoming: boolean;
};

export function CheckoutForm({ course }: { course: Props }) {
  const router = useRouter();
  const { user } = useAuth();
  const isFree = course.price <= 0;
  const isUpcoming = course.upcoming;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
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
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Enrollment failed");
      router.push(`/programs/${course.slug}/learn`);
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
          <div className="rounded-xl border border-line p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              {["VISA", "MC", "AMEX"].map((b) => (
                <span
                  key={b}
                  className="font-mono text-[9px] font-bold tracking-wider px-2 py-1 rounded border border-line bg-[var(--bg-soft)]"
                  style={{ color: "var(--body)" }}
                >
                  {b}
                </span>
              ))}
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>Card number</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                className={inputClass}
                style={{ color: "var(--ink)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: "var(--ink)" }}>Expiry</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM / YY"
                  className={inputClass}
                  style={{ color: "var(--ink)" }}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: "var(--ink)" }}>CVC</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  className={inputClass}
                  style={{ color: "var(--ink)" }}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }}>Name on card</label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                className={inputClass}
                style={{ color: "var(--ink)" }}
              />
            </div>
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
            ? "Processing…"
            : isFree
              ? "Get it for free"
              : `Pay ${course.currency} ${course.price.toLocaleString()}`}
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
