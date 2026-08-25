"use client";

import {
  ArrowRight,
  Bot,
  FileText,
  LifeBuoy,
  MessageCircle,
  Route,
  Video,
} from "lucide-react";

const features = [
  { icon: Video, label: "Step-by-step video guidance" },
  { icon: Route, label: "Guided roadmap — preparation to visa approval" },
  { icon: Bot, label: "AI SOP Generator" },
  { icon: FileText, label: "Document templates & practical resources" },
  { icon: MessageCircle, label: "Live Q&A Sessions" },
  { icon: LifeBuoy, label: "Live Support" },
];

/**
 * CoursePromo
 * Combined promo section: right-side visual + Student Visa Blueprint™ offer copy.
 * Self-contained — drop it anywhere on the site.
 *
 * Follows the same token conventions as the partnerships page:
 * var(--brand), var(--brand-2), var(--brand-soft), var(--ink),
 * var(--body), var(--line), font-display, font-mono.
 */

export function CoursePromo({ image = true }: { image?: boolean }) {
  return (
    <div
      className="relative w-full max-w-[1100px] mx-auto overflow-hidden border border-line bg-white"
      style={{ boxShadow: "0 24px 50px -30px rgba(18,32,67,0.18)" }}
    >
      {/* Right-side visual panel (smaller than full-bleed) */}
      {image && (
        <div className="absolute right-0 inset-y-0 w-full sm:w-[40%]">
          <img
            src="/watermark.png"
            alt="FlyBridge watermark"
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/75 to-white/5" />
        </div>
      )}

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="max-w-[440px]">
          {/* ── copy ──────────────────────────────────────── */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[11px] font-medium tracking-[0.4px] mb-5"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            ✦ NEW COURSE
          </div>

          <h1
            className="font-display font-bold leading-[1.22] tracking-[-0.01em]"
            style={{ fontSize: "clamp(22px,2.4vw,28px)", color: "var(--ink)" }}
          >
            Student Visa <span style={{ color: "var(--brand-2)" }}>Blueprint™</span>
          </h1>

          <p
            className="text-[14.5px] leading-[1.6] mt-3"
            style={{ color: "var(--body)" }}
          >
            The complete step-by-step system to prepare your study visa
            application with confidence.
          </p>

          {/* Feature checklist */}
          <div className="mt-6">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 text-[13.5px] leading-snug py-[5px]"
                style={{ color: "var(--ink)" }}
              >
                <span
                  className="w-8 h-8 shrink-0 flex items-center justify-center"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <f.icon className="w-[15px] h-[15px]" style={{ color: "var(--brand-2)" }} />
                </span>
                {f.label}
              </div>
            ))}
          </div>

          {/* Bengali value lines */}
          <div className="mt-6 pt-4 border-t border-line">
            <div
              className="font-mono text-[11px] font-medium tracking-[0.4px] uppercase"
              style={{ color: "var(--brand-2)" }}
            >
              ৩ মাসের সম্পূর্ণ অ্যাক্সেস — সব রিসোর্স, টুলস ও গাইডেন্সসহ
            </div>
            <p className="text-[13.5px] leading-[1.6] mt-1.5" style={{ color: "var(--body)" }}>
              নিজেই নিজের স্টুডেন্ট ভিসা প্রসেস করুন — কনসালটেন্সি ফিতে সাশ্রয়
              লাখ টাকা পর্যন্ত।
            </p>
          </div>

          {/* ── offer + CTA ───────────────────────────────── */}
          <div className="w-full mt-6">
            <div className="relative mt-10 px-5 py-4" style={{ background: "var(--brand-soft)" }}>
              {/* Torn-receipt price tag — old price ripped off */}
              <div
                className="absolute -top-9 right-5 w-[160px] rotate-3"
                style={{ filter: "drop-shadow(0 12px 16px rgba(18,32,67,0.2))" }}
              >
                {/* punched hole */}
                <div
                  className="mx-auto w-4 h-4 rounded-full bg-white border-2"
                  style={{ borderColor: "var(--line)" }}
                />
                {/* tag body with zigzag torn bottom */}
                <div
                  className="-mt-[5px] bg-white border border-line"
                  style={{
                    clipPath:
                      "polygon(0 0, 100% 0, 100% calc(100% - 14px), 90% 100%, 80% calc(100% - 14px), 70% 100%, 60% calc(100% - 14px), 50% 100%, 40% calc(100% - 14px), 30% 100%, 20% calc(100% - 14px), 10% 100%, 0 calc(100% - 14px))",
                  }}
                >
                  <div className="px-3 pt-2.5 pb-5 text-center">
                    <div
                      className="font-mono text-[8px] font-bold tracking-[0.3em]"
                      style={{ color: "var(--brand-2)" }}
                    >
                      INTRODUCTORY
                    </div>
                    <div
                      className="font-display font-bold leading-none mt-1.5 tracking-[-0.01em]"
                      style={{ fontSize: "26px", color: "var(--ink)" }}
                    >
                      $29.99
                    </div>
                    <div className="font-mono text-[8.5px] mt-1.5" style={{ color: "var(--brand-2)" }}>
                      SAVE $20 · 40% OFF
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="inline-flex border px-2.5 py-1 font-mono text-[10px] font-medium tracking-[0.3px]"
                style={{ borderColor: "var(--line)", color: "var(--brand-2)" }}
              >
                Only for the First 100 Students
              </div>
            </div>

            {/* CTA under the offer card */}
            <a
              href="#enroll"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 font-medium text-[15px] text-white px-8 py-[13px] transition-all duration-250 hover:translate-y-[-1px]"
              style={{ background: "var(--brand)", boxShadow: "0 16px 28px -14px rgba(15,169,104,0.5)" }}
            >
              Start Your Journey Today
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
