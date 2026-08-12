"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Download, ExternalLink, Lock, Share2, Star } from "lucide-react";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  fileHref,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";

export function ResourceDetail({ resource: r }: { resource: ResourceCardData }) {
  const [copied, setCopied] = useState(false);
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  const paid = r.access === "paid";

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
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B4CE0] px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#5A3CCB] hover:shadow-lg hover:shadow-[#6B4CE0]/25 active:scale-[0.98]"
              >
                <Lock size={15} /> Members only{r.price > 0 ? ` · $${r.price}` : ""}
              </Link>
            ) : (
              <a
                href={fileHref(r)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6B4CE0] px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#5A3CCB] hover:shadow-lg hover:shadow-[#6B4CE0]/25 active:scale-[0.98]"
              >
                {r.fileType === "link" ? <ExternalLink size={15} /> : <Download size={15} />}
                {r.fileType === "link" ? "Open link" : "Download"}
              </a>
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
