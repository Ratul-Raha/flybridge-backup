"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, ExternalLink, Loader2, Lock, Share2, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PaymentMethodPicker, type PickableCurrency } from "@/components/payment/payment-method-picker";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";
import { getCategoryColor } from "@/lib/resource-colors";
import { formatMoney } from "@/lib/pricing";

function downloadHref(r: ResourceCardData) {
  if (r.fileType === "link") {
    return `/api/resources/${r.id}/file`;
  }
  return `/api/resources/${r.id}/file?dl=1`;
}

export function ResourceDetail({
  resource: r,
  wantsDownload = false,
  wantsGet = false,
  mostDownloaded = false,
}: {
  resource: ResourceCardData;
  wantsDownload?: boolean;
  wantsGet?: boolean;
  mostDownloaded?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [payNote, setPayNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<PickableCurrency>(
    r.prices?.USD ? "USD" : "BDT"
  );
  const { user, loading } = useAuth();
  const router = useRouter();
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  const accent = getCategoryColor(r.category);
  const isFree = (r.price ?? 0) <= 0;
  const isMembersOnly = r.access === "members";
  const needsLogin = isMembersOnly && isFree && !user;
  const needsPayment = isMembersOnly && !isFree;
  const isPublic = r.access === "public";
  const isLink = r.fileType === "link";
  const loginNext = `/login?next=${encodeURIComponent(`/resources/${r.id}`)}`;

  const triggerDownload = () => {
    const href = downloadHref(r);
    if (isLink) {
      window.open(href, "_blank", "noopener");
    } else {
      const a = document.createElement("a");
      a.href = href;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleGetForFree = async () => {
    if (!user) {
      router.push(loginNext);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "resource", itemId: r.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to get resource");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      triggerDownload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get resource");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      router.push(loginNext);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "resource", itemId: r.id, currency }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to buy resource");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      triggerDownload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to buy resource");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!wantsGet || loading) return;
    if (!user) {
      router.replace(loginNext);
      return;
    }
    handleGetForFree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsGet, loading, user]);

  useEffect(() => {
    if (!wantsDownload || loading) return;
    if (needsPayment) {
      setPayNote(true);
      return;
    }
    if (isMembersOnly && !user) {
      router.replace(loginNext);
      return;
    }
    triggerDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsDownload, loading, user]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/resources/${r.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const usdPrice = typeof r.prices?.USD === "number" && r.prices.USD > 0 ? r.prices.USD : null;
  const bdtPrice = typeof r.prices?.BDT === "number" && r.prices.BDT > 0 ? r.prices.BDT : null;
  const pairPrice = [usdPrice !== null ? formatMoney(usdPrice, "USD") : null, bdtPrice !== null ? formatMoney(bdtPrice, "BDT") : null]
    .filter(Boolean)
    .join(" / ");

  const primaryLabel = needsPayment
    ? "Buy Now"
    : needsLogin
      ? "Sign in to download"
      : isFree
        ? submitting
          ? "Processing…"
          : isPublic
            ? isLink
              ? "Open link"
              : "Download"
            : "Get it for free"
        : isLink
          ? "Open link"
          : "Download";

  const primaryAction = needsPayment
    ? () => setPayNote((v) => !v)
    : needsLogin
      ? () => router.push(loginNext)
      : isFree
        ? () => (isPublic ? triggerDownload() : handleGetForFree())
        : triggerDownload;

  const reassurance = needsPayment
    ? `One-time purchase · ${r.fileName ?? r.fileType} file`
    : needsLogin
      ? "Free for FlyBridge members — sign in to download it."
      : isPublic
        ? "Free download · sign up required"
        : "Members-only · yours to keep once you\u2019re in";

  const detailRows: { label: string; value: string }[] = [
    { label: "Category", value: r.category },
    { label: "File type", value: meta.label },
    ...(r.fileName ? [{ label: "File", value: r.fileName }] : []),
    ...(r.fileSize > 0 ? [{ label: "Size", value: formatFileSize(r.fileSize) }] : []),
    { label: "Published", value: formatResourceDate(r.releaseDate) },
    { label: "Access", value: isPublic ? "Public" : "Members only" },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] font-medium">
        <Link href="/resources" className="inline-flex shrink-0 items-center gap-2 transition-opacity duration-200 hover:opacity-70" style={{ color: "var(--brand)" }}>
          <ArrowLeft size={15} /> All resources
        </Link>
        <span className="shrink-0" style={{ color: "var(--line)" }}>/</span>
        <span className="min-w-0 truncate font-mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>
          {r.category}
        </span>
      </nav>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ===== Main document sheet ===== */}
        <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--line)" }}>
          {/* Accent header */}
          <div
            className="relative border-b px-6 pb-10 pt-5 sm:px-10"
            style={{ borderColor: "var(--line)", background: `linear-gradient(165deg, ${accent}14, ${accent}03 72%)` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className="rounded-md border bg-white/80 px-2.5 py-[4px] font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ borderColor: "var(--line)", color: meta.color }}
              >
                {meta.label}
              </span>
              {isMembersOnly ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/80 px-2.5 py-[4px] font-mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#6B4CE0" }}>
                  <Users size={10} /> Members
                </span>
              ) : mostDownloaded ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white/80 px-2.5 py-[4px] font-mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#E08A17" }}>
                  <TrendingUp size={10} /> Most downloaded
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex justify-center">
              <span
                className="flex h-[84px] w-[84px] items-center justify-center rounded-xl border"
                style={{ background: "rgba(255,255,255,0.92)", borderColor: "var(--line)", color: accent, boxShadow: "0 18px 40px -20px rgba(18,32,67,0.3)" }}
              >
                <Icon size={38} strokeWidth={1.7} />
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-8 sm:px-10">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]" style={{ color: "var(--body)" }}>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
                {r.category}
              </span>
              <span>·</span>
              <span>{formatResourceDate(r.releaseDate)}</span>
              {r.fileSize > 0 && (
                <>
                  <span>·</span>
                  <span>{formatFileSize(r.fileSize)}</span>
                </>
              )}
            </div>

            <h1
              className="mt-3 font-display text-[clamp(26px,4vw,38px)] font-semibold leading-[1.12] tracking-[-0.02em] [overflow-wrap:anywhere]"
              style={{ color: "var(--ink)" }}
            >
              {r.title}
            </h1>

            {r.description && (
              <p className="mt-5 break-words whitespace-pre-line text-[15.5px] leading-[1.8]" style={{ color: "var(--body)" }}>
                {r.description}
              </p>
            )}
          </div>
        </div>

        {/* ===== Sidebar ===== */}
        <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-28">
          {/* Actions */}
          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: `${accent}12`, color: accent }}>
                <Icon size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
                  {r.title}
                </div>
                <div className="mt-[2px] text-[11px]" style={{ color: "var(--body)" }}>
                  {meta.label} · {r.category}
                </div>
              </div>
            </div>

            {needsPayment && (
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border px-4 py-3"
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

            <button
              type="button"
              onClick={primaryAction}
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {needsPayment ? <Lock size={15} /> : isLink ? <ExternalLink size={15} /> : <Download size={15} />}
              {primaryLabel}
            </button>

            <button
              type="button"
              onClick={copyLink}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-6 py-3 text-[13.5px] font-semibold transition-colors duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
              style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--ink)" }}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              {copied ? "Link copied!" : "Copy link"}
            </button>

            <p className="mt-3.5 text-center text-[11.5px]" style={{ color: "var(--body)" }}>
              {reassurance}
            </p>

            {error && (
              <p className="mt-2 text-center text-[12px]" style={{ color: "#C0392B" }}>
                {error}
              </p>
            )}
            {payNote && (
              <div className="mt-3 flex flex-col gap-3">
                <PaymentMethodPicker
                  prices={r.prices}
                  value={currency}
                  onChange={setCurrency}
                />
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
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

          {/* Details */}
          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
              File details
            </h2>
            <dl className="mt-3 divide-y" style={{ borderColor: "var(--line)" }}>
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-[12px]" style={{ color: "var(--body)" }}>
                    {row.label}
                  </dt>
                  <dd className="truncate text-right text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}