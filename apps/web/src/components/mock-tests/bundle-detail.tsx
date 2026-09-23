"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Check,
  Clock,
  Loader2,
  Lock,
  Share2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PaymentMethodPicker, type PickableCurrency } from "@/components/payment/payment-method-picker";
import {
  SKILL_META,
  skillLabel,
  type TestListItem,
} from "@/lib/mock-test-ui";
import { formatMoney } from "@/lib/pricing";
import { PromoSummary } from "@/components/checkout/promo-summary";

export type PublicBundle = {
  id: string;
  title: string;
  description: string;
  badge: string;
  image: string | null;
  price: number;
  currency: string;
  prices?: { USD?: number; BDT?: number } | null;
  featured: boolean;
  testCount: number;
};

export function MockTestBundleDetail({ bundle }: { bundle: PublicBundle }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payNote, setPayNote] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [currency, setCurrency] = useState<PickableCurrency>(
    bundle.prices?.USD ? "USD" : "BDT"
  );

  const anyOwned = tests.some((t) => t.owned);
  const isFree = bundle.price <= 0;
  const usdPrice = typeof bundle.prices?.USD === "number" && bundle.prices.USD > 0 ? bundle.prices.USD : null;
  const bdtPrice = typeof bundle.prices?.BDT === "number" && bundle.prices.BDT > 0 ? bundle.prices.BDT : null;
  const pairPrice = [usdPrice !== null ? formatMoney(usdPrice, "USD") : null, bdtPrice !== null ? formatMoney(bdtPrice, "BDT") : null]
    .filter(Boolean)
    .join(" / ");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/mock-tests/bundles/${bundle.id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load bundle (${res.status})`);
      const data = await res.json();
      setTests(Array.isArray(data.tests) ? data.tests : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tests");
    } finally {
      setLoaded(true);
    }
  }, [bundle.id]);

  useEffect(() => {
    load();
  }, [load]);

  const purchase = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/mock-tests/${bundle.id}`)}`);
      return;
    }
    if (anyOwned) {
      router.push("/dashboard/mock-tests");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "mock-bundle",
          itemId: bundle.id,
          currency,
          code: appliedCode ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to get this pack");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      router.push("/dashboard/mock-tests");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get this pack");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/mock-tests/${bundle.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const primaryLabel = anyOwned
    ? "Go to my tests"
    : isFree
      ? submitting
        ? "Adding…"
        : user
          ? "Get the pack"
          : "Sign in to get it"
      : submitting
        ? "Redirecting to payment…"
        : "Buy Now";

  const primaryAction = anyOwned
    ? () => router.push("/dashboard/mock-tests")
    : isFree
      ? purchase
      : () => setPayNote((v) => !v);

  return (
    <div>
      <Link
        href="/mock-tests"
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 hover:opacity-70"
        style={{ color: "var(--brand)" }}
      >
        <ArrowLeft size={15} /> All mock tests
      </Link>

      <div
        className="mt-6 overflow-hidden rounded-lg border bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="relative h-[200px] sm:h-[260px] overflow-hidden">
          {bundle.image ? (
            <>
              <Image
                src={bundle.image}
                alt={bundle.title}
                fill
                sizes="(max-width: 640px) 100vw, 1320px"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(18,32,67,0.32), rgba(18,32,67,0.05) 50%)" }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6B4CE0,#2F5FE0)" }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20" style={{ backdropFilter: "blur(2px)" }}>
                <BookOpen className="h-6 w-6 text-white" />
              </span>
            </div>
          )}
          <span
            className="absolute left-5 top-5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] rounded-full px-[12px] py-[6px]"
            style={{ background: "rgba(255,255,255,0.92)", color: "#6B4CE0" }}
          >
            {bundle.badge || "IELTS Mock Tests"}
          </span>
        </div>

        <div className="p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2.5 text-[12.5px]" style={{ color: "var(--body)" }}>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} style={{ color: "var(--brand-2)" }} />
              AI-graded with band feedback
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} style={{ color: "var(--brand-2)" }} />
              {bundle.testCount} {bundle.testCount === 1 ? "test" : "tests"}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={13} style={{ color: "var(--brand-2)" }} />
              Unlimited attempts
            </span>
          </div>

          <h1
            className="font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-[-0.02em] leading-[1.12] mt-3"
            style={{ color: "var(--ink)" }}
          >
            {bundle.title}
          </h1>

          {bundle.description && (
            <p
              className="text-[15px] leading-[1.75] mt-4 max-w-[680px] whitespace-pre-line"
              style={{ color: "var(--body)" }}
            >
              {bundle.description}
            </p>
          )}

          {!anyOwned && (
            <div
              className="mt-8 flex flex-col gap-3 rounded-2xl border bg-white p-5"
              style={{ borderColor: "var(--line)" }}
            >
              {!isFree && (
                <div
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border bg-white px-4 py-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Price
                  </span>
                  <span className="text-[15px] font-bold" style={{ color: "var(--brand-2)" }}>
                    {pairPrice || "Free"}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={primaryAction}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{ background: "var(--brand)" }}
                >
                  {submitting || loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : anyOwned ? (
                    <Check size={15} />
                  ) : isFree ? null : (
                    <Lock size={15} />
                  )}
                  {primaryLabel}
                </button>

                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-7 py-3.5 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
                  style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--ink)" }}
                >
                  {copied ? <Check size={15} /> : <Share2 size={15} />}
                  {copied ? "Link copied!" : "Share"}
                </button>
              </div>

              {payNote && !isFree && (
                <div className="mt-1 flex flex-col gap-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Payment method
                  </p>
                  <PaymentMethodPicker
                    prices={bundle.prices}
                    value={currency}
                    onChange={setCurrency}
                  />
                  <PromoSummary
                    itemType="mock-bundle"
                    itemId={bundle.id}
                    currency={currency}
                    baseAmount={
                      currency === "BDT"
                        ? bundle.prices?.BDT ?? bundle.price
                        : bundle.price
                    }
                    onCodeChange={setAppliedCode}
                  />
                  <button
                    type="button"
                    onClick={purchase}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "var(--brand)" }}
                  >
                    {submitting && <Loader2 size={15} className="animate-spin" />}
                    {submitting
                      ? "Redirecting to payment…"
                      : `Pay with ${currency === "BDT" ? "EPS" : "Stripe"}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 text-[12.5px]" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Tests in the bundle */}
      <div className="mt-10">
        <h2
          className="font-display font-semibold tracking-[-0.02em]"
          style={{ fontSize: "clamp(20px,2.4vw,26px)", color: "var(--ink)" }}
        >
          What&apos;s inside
        </h2>

        {!loaded ? (
          <div className="flex justify-center py-14">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
          </div>
        ) : tests.length === 0 ? (
          <div className="rounded-xl border mt-5 px-5 py-12 text-center" style={{ borderColor: "var(--line)" }}>
            <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
              Tests in this pack are being prepared. Check back soon!
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {tests.map((t) => {
              const meta = SKILL_META[t.skill] ?? SKILL_META.reading;
              return (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-xl border bg-white p-4 sm:p-5"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span
                    className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px] w-fit"
                    style={{ background: meta.soft, color: meta.accent }}
                  >
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={t.owned ? `/dashboard/mock-tests/${t.id}/take` : `/mock-tests/${bundle.id}`}
                      className="font-display text-[15px] font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: "var(--ink)" }}
                    >
                      {t.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] mt-1" style={{ color: "var(--body)" }}>
                      {t.durationMinutes > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {t.durationMinutes} min
                        </span>
                      )}
                      {t.questionCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span style={{ color: "var(--line)" }}>·</span> {t.questionCount} questions
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <span style={{ color: "var(--line)" }}>·</span> {skillLabel(t.skill)}
                      </span>
                    </div>
                  </div>
                  {t.owned ? (
                    <Link
                      href={`/dashboard/mock-tests/${t.id}/take`}
                      className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90"
                      style={{ background: "var(--brand)" }}
                    >
                      Start test
                    </Link>
                  ) : (
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-4 py-2"
                      style={{ background: "var(--bg-soft)", color: "var(--body)" }}
                    >
                      <Lock size={11} /> Part of this pack
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}