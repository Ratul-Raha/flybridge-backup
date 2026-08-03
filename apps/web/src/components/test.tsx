"use client";

import { ShieldCheck, ArrowRight } from "lucide-react";

/**
 * CoursePromo
 * Combined promo section: watermark visual + Study Visa Prep offer copy.
 * Self-contained — drop it anywhere on the site.
 *
 * Follows the same token conventions as the partnerships page:
 * var(--brand), var(--brand-2), var(--brand-soft), var(--ink),
 * var(--body), var(--line), font-display, font-mono.
 */

export function CoursePromo({ image = true }: { image?: boolean }) {
  return (
    <div
      className="relative w-full max-w-[1320px] mx-auto rounded-[22px] overflow-hidden border border-line bg-white"
      style={{ boxShadow: "0 24px 50px -30px rgba(18,32,67,0.18)" }}
    >
      {/* Watermark visual (full-bleed background) */}
      {image && (
        <img
          src="/watermark.png"
          alt="FlyBridge watermark"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="relative p-8 sm:p-10 lg:p-14">
        {/* ── copy + offer + CTA ──────────────────────────── */}
        <div className="max-w-[480px]">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11.5px] font-medium tracking-[0.4px] mb-6"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            ✦ NEW COURSE
          </div>

          <h1
            className="font-display font-bold leading-[1.22] tracking-[-0.01em]"
            style={{ fontSize: "clamp(24px,2.6vw,30px)", color: "var(--ink)" }}
          >
            তোমার আমেরিকা যাওয়ার স্বপ্ন,{" "}
            <span style={{ color: "var(--brand-2)" }}>এবার হবে Preparation Perfect!</span>
          </h1>

          <div
            className="font-mono text-[11.5px] font-medium tracking-[0.4px] uppercase mt-7 mb-3"
            style={{ color: "var(--brand-2)" }}
          >
            STUDY ABROAD · COURSE
          </div>

          <h2
            className="font-display font-bold leading-[1.12] tracking-[-0.02em]"
            style={{ fontSize: "clamp(30px,3.4vw,40px)", color: "var(--ink)" }}
          >
            Study Visa Prep —{" "}
            <span style={{ color: "var(--brand-2)" }}>United States</span>
          </h2>

          <p
            className="text-[15.5px] leading-[1.65] mt-4"
            style={{ color: "var(--body)" }}
          >
            From application to visa interview, mapped out end to end.
          </p>

          {/* Offer card */}
          <div
            className="relative mt-7 rounded-2xl px-6 py-5 max-w-[340px]"
            style={{ background: "var(--brand-soft)" }}
          >
            <div className="font-mono text-[11px] font-medium tracking-[0.3px]" style={{ color: "var(--ink)", opacity: 0.75 }}>
              Introductory Offer
            </div>
            <div className="mt-2 text-[17px] font-medium line-through" style={{ color: "var(--body)", opacity: 0.6 }}>
              ৫,০০০ টাকা
            </div>
            <div
              className="font-display font-bold leading-none mt-1"
              style={{ fontSize: "clamp(30px,3.4vw,38px)", color: "var(--brand-2)" }}
            >
              ২৯৯৯ টাকা
            </div>

            {/* Limited time badge */}
            <div
              className={`absolute w-[86px] h-[86px] rounded-full flex items-center justify-center text-center text-white font-medium text-[12px] leading-[1.2] px-2 ${
                image ? "-top-5 -right-5" : "-top-5 right-3"
              }`}
              style={{ background: "var(--brand)", boxShadow: "0 14px 26px -12px rgba(15,169,104,0.55)" }}
            >
              Limited Time Offer!
            </div>
          </div>

          {/* CTA under the offer card */}
          <a
            href="#enroll"
            className="mt-7 w-full max-w-[340px] inline-flex items-center justify-center gap-2.5 font-medium text-[16px] text-white rounded-full px-8 py-[16px] transition-all duration-250 hover:translate-y-[-1px]"
            style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(15,169,104,0.5)" }}
          >
            এখনই Enroll করুন
            <ArrowRight className="w-4 h-4" />
          </a>

          <div
            className="flex items-center gap-2 mt-4 text-[13px]"
            style={{ color: "var(--body)" }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--brand-2)" }} />
            একবার কিনুন, জীবনভর Access পান
          </div>
        </div>
      </div>
    </div>
  );
}
