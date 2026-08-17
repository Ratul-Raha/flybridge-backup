"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, ExternalLink, Lock, Loader2, Share2, Star } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";

function downloadHref(r: ResourceCardData) {
  if (r.fileType === "link" || r.fileType === "image" || r.fileType === "video") {
    return r.fileUrl;
  }
  return `/api/resources/${r.id}/file?dl=1`;
}

export function ResourceDetail({
  resource: r,
  wantsDownload = false,
  wantsGet = false,
}: {
  resource: ResourceCardData;
  wantsDownload?: boolean;
  wantsGet?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [payNote, setPayNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  const paid = r.access === "paid";
  const isFree = (r.price ?? 0) <= 0 && !paid;
  const loginNext = `/login?next=${encodeURIComponent(`/resources/${r.id}?get=1`)}`;

  const triggerDownload = () => {
    const href = downloadHref(r);
    if (r.fileType === "link") {
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
      triggerDownload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get resource");
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
    if (paid) {
      setPayNote(true);
      return;
    }
    if (!user) {
      router.replace(loginNext);
      return;
    }
    triggerDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsDownload, loading, user, paid]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/resources/${r.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <Link
        href="/resources"
        className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 hover:opacity-70"
        style={{ color: "var(--brand)" }}
      >
        <ArrowLeft size={15} /> All resources
      </Link>

      <div className="mt-6 overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "var(--line)" }}>
        <div
          className="relative h-[220px] sm:h-[280px] flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${meta.bg}, transparent 75%)` }}
        >
          {r.thumbnail ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.thumbnail} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(18,32,67,0.30), rgba(18,32,67,0.05) 45%)" }}
              />
            </>
          ) : (
            <span
              className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px]"
              style={{ background: "rgba(255,255,255,0.9)", color: meta.color, boxShadow: "0 10px 30px -12px rgba(18,32,67,0.25)" }}
            >
              <Icon size={38} strokeWidth={1.8} />
            </span>
          )}

          <span
            className="absolute left-5 top-5 font-mono text-[10.5px] font-semibold tracking-[0.4px] px-[12px] py-[6px] rounded-full"
            style={{ background: "rgba(255,255,255,0.92)", color: meta.color }}
          >
            {meta.label.toUpperCase()}
          </span>
          {paid ? (
            <span
              className="absolute right-5 top-5 inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-[0.3px] px-[12px] py-[6px] rounded-full"
              style={{ background: "#6B4CE0", color: "#fff" }}
            >
              <Lock size={10} /> MEMBERS
            </span>
          ) : r.featured ? (
            <span
              className="absolute right-5 top-5 inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-[0.3px] px-[12px] py-[6px] rounded-full"
              style={{ background: "rgba(255,255,255,0.92)", color: "#E08A17" }}
            >
              <Star size={10} fill="#E08A17" /> FEATURED
            </span>
          ) : null}
        </div>

        <div className="p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2.5 text-[12.5px]" style={{ color: "var(--body)" }}>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3px]" style={{ color: "var(--brand-2)" }}>
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
            className="font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-[-0.02em] leading-[1.12] mt-3"
            style={{ color: "var(--ink)" }}
          >
            {r.title}
          </h1>

          {r.description && (
            <p className="text-[15px] leading-[1.75] mt-4 max-w-[680px]" style={{ color: "var(--body)" }}>
              {r.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
            {paid ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setPayNote((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B4CE0] px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#5A3CCB] hover:shadow-lg hover:shadow-[#6B4CE0]/25 active:scale-[0.98]"
                >
                  <Lock size={15} />
                  Buy now{r.price > 0 ? ` · $${r.price}` : ""}
                </button>
                {payNote && (
                  <span className="text-[12.5px] max-w-[280px]" style={{ color: "var(--body)" }}>
                    Payment for this resource is coming soon — you can download it for free once it launches.
                  </span>
                )}
              </div>
            ) : isFree ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGetForFree}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B4CE0] px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#5A3CCB] hover:shadow-lg hover:shadow-[#6B4CE0]/25 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? "Getting…" : "Get it for free"}
                </button>
                {error && (
                  <span className="text-[12.5px] max-w-[280px]" style={{ color: "#C0392B" }}>
                    {error}
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={triggerDownload}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B4CE0] px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#5A3CCB] hover:shadow-lg hover:shadow-[#6B4CE0]/25 active:scale-[0.98]"
              >
                {r.fileType === "link" ? <ExternalLink size={15} /> : <Download size={15} />}
                {r.fileType === "link" ? "Open link" : "Download"}
              </button>
            )}

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
        </div>
      </div>
    </div>
  );
}