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
          <p className={sectionTitle} style={{ color: "var(--body)" }}>Payment</p>
          <div
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ borderColor: "var(--line)" }}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: "var(--brand)" }} />
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--body)" }}>
              You'll be redirected to a secure Stripe checkout to complete your payment. Cards, Apple&nbsp;Pay and Google&nbsp;Pay are accepted.
            </p>
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
