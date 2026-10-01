"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  Check,
  Monitor,
  FileText,
  Gift,
  GraduationCap,
  Users,
  ArrowRight,
  X,
} from "lucide-react";

const IELTS_FEATURES = [
  {
    icon: BookOpen,
    title: "২৫টি ভিডিও মাস্টারক্লাস",
    desc: "Speaking, Writing, Listening, Reading — ৪ স্কিলের সম্পূর্ণ সিস্টেম এক প্যাকেজে।",
  },
  {
    icon: Monitor,
    title: "১৫টি কম্পিউটার-বেসড মক টেস্ট",
    desc: "রিডিং, রাইটিং আর লিসেনিং — পরীক্ষার হলে যেভাবে, ওয়েবসাইটেই ঠিক সেভাবে। ফোন, ট্যাব বা কম্পিউটার, যেকোনো ডিভাইসে।",
  },
  {
    icon: FileText,
    title: "Companion PDF বই",
    desc: "প্রতিটি লেসনের গুরুত্বপূর্ণ বিষয়, Model Answer, Band 6 ও Band 7-এর পার্থক্য আর Practice Test — ভিডিও দেখুন, PDF দিয়ে রিভিশন করুন, প্রস্তুতি যাচাই করুন।",
  },
  {
    icon: Users,
    title: "লাইভ সেমিনার ও ৫টা বোনাস ক্লাস",
    desc: "নিয়মিত লাইভ সেমিনার আর এক্সপার্টদের সরাসরি সাপোর্ট।",
  },
];

let dismissedInSession = false;

export function IeltsPromoPopup() {
  const [open, setOpen] = useState(false);

  const close = () => {
    dismissedInSession = true;
    setOpen(false);
  };

  useEffect(() => {
    if (dismissedInSession) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="IELTS Band Score Machine waitlist offer"
    >
      <div
        className="absolute inset-0 bg-[rgba(18,32,67,0.5)] backdrop-blur-[2px] fb-pop-fade"
        onClick={close}
      />

      <div
        className="relative w-full max-w-[880px] max-h-[92vh] overflow-y-auto fb-pop-up"
        style={{
          background: "var(--bg-soft)",
          boxShadow: "0 40px 80px -30px rgba(18,32,67,0.45)",
        }}
      >
        {/* Background image + readability overlay (desktop only) */}
        <Image
          src="/ielts-band-score-machine-popup.webp"
          alt=""
          fill
          sizes="880px"
          className="hidden sm:block absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="hidden sm:block absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, var(--bg-soft) 0%, rgba(246,248,252,0.85) 45%, rgba(246,248,252,0.35) 100%)",
          }}
        />

        <button
          onClick={close}
          aria-label="Close popup"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#E7EBF0] transition-transform hover:scale-105"
          style={{ color: "var(--ink)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Intro offer — circular seal, bottom-right corner (desktop) */}
        <div className="hidden sm:flex absolute bottom-4 right-4 lg:bottom-5 lg:right-5 z-10">
          <div
            className="relative w-[148px] h-[148px] rounded-full bg-[#0B1F3A] flex flex-col items-center justify-center text-center"
            style={{ boxShadow: "0 18px 40px -18px rgba(11,31,58,0.55)" }}
          >
            <div className="absolute inset-[6px] rounded-full border border-dashed border-white/25" />
            <div className="absolute inset-[14px] rounded-full border border-[#0F9D58]/40" />
            <div className="relative">
              <div className="mt-1.5 text-[11px] font-semibold text-white/70">TARGET</div>
              <div className="mt-0.5 text-[25px] font-extrabold leading-none text-white">Band 7</div>
              <div className="mt-1.5 rounded-full bg-[#0F9D58]/20 px-2 py-0.5 text-[9.5px] font-bold text-[#5EEAA6]">
                IELTS
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="max-w-[600px]">
            {/* Eyebrow */}
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#0B1F3A] px-3 py-1">
              <GraduationCap className="h-3 w-3 text-[#5EEAA6]" strokeWidth={2.5} />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-white">
                Your Path to Band 7, Simplified
              </span>
            </div>

            {/* Heading */}
            <div className="mt-4">
              <h2 className="text-[2.1rem] font-extrabold leading-[0.98] tracking-tight text-[#0B1F3A] sm:text-[2.5rem]">
                IELTS
                <br />
                <span className="text-[#0F9D58]">Band Score Machine</span>
              </h2>
              <p className="mt-2.5 max-w-sm text-[13.5px] leading-relaxed text-[#4B5768]">
                ২৫টি ভিডিও মাস্টারক্লাস + ৫টি বোনাস ক্লাস, সাথে ১৫টি ফ্রি কম্পিউটার-বেসড মক টেস্ট, কুইজ,
                প্র্যাকটিস, সম্পূর্ণ Companion PDF বই আর লাইভ ক্লাস —{" "}
                <span className="font-semibold text-[#0B1F3A]">শুরু থেকে শেষ, একই জায়গায়।</span>
              </p>
            </div>

            {/* Feature roadmap */}
            <div className="relative mt-5 pl-1">
              <div
                className="absolute left-[15px] top-2 bottom-2 w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, #0F9D58 0%, #CFE9DB 100%)",
                }}
              />
              <div className="flex flex-col gap-3.5">
                {IELTS_FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="relative flex items-start gap-3">
                    <span className="relative z-[1] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-[#0F9D58] bg-white">
                      <Icon
                        className="h-3.5 w-3.5 text-[#0F9D58]"
                        strokeWidth={2.2}
                      />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[13px] font-semibold leading-snug text-[#0B1F3A]">
                        {title}
                      </p>
                      <p className="text-[11.5px] leading-snug text-[#7A8697]">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offer highlight */}
            <div className="mt-5 w-fit max-w-full rounded-xl bg-[#EAF9F1] px-4 py-3">
              <p className="text-[14.5px] font-extrabold leading-snug text-[#0B1F3A]">
                Band 7-এর জন্য ২৫টা মাস্টারক্লাস{" "}
                <span className="text-[#0F9D58]">+ ৫টা বোনাস ক্লাস একটাই সিস্টেমে</span>
              </p>
              <p className="mt-1 text-[11.5px] text-[#4B5768]">
                লাইফটাইম অ্যাক্সেস · একবার ভর্তি হলে সব লেসন আপনার
              </p>
            </div>

            {/* CTA */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <a
                href="/programs/ielts-band-score-machine/checkout"
                onClick={close}
                className="group inline-flex items-center gap-2 rounded-full bg-[#0F9D58] px-6 py-2.5 text-white transition-colors hover:bg-[#0C8A4C]"
              >
                <span className="text-[13.5px] font-bold">Enroll Now</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#curriculum"
                onClick={close}
                className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0F9D58] transition-colors hover:text-[#0C8A4C]"
              >
                <Gift className="h-3.5 w-3.5" />
                কোর্সে কী আছে দেখো
              </a>
            </div>

            {/* Trust row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              {["৩ দিনের ১০০% রিফান্ড গ্যারান্টি", "লাইফটাইম অ্যাক্সেস", "যেকোনো ডিভাইসে মক টেস্ট"].map(
                (t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#4B5768]"
                  >
                    <Check className="h-3 w-3 text-[#0F9D58]" strokeWidth={3} />
                    {t}
                  </span>
                )
              )}
            </div>

            {/* Intro offer — circular seal (mobile) */}
            <div className="sm:hidden flex justify-center mt-5">
              <div
                className="relative w-[120px] h-[120px] rounded-full bg-[#0B1F3A] flex flex-col items-center justify-center text-center"
                style={{ boxShadow: "0 18px 40px -18px rgba(11,31,58,0.55)" }}
              >
                <div className="absolute inset-[5px] rounded-full border border-dashed border-white/25" />
                <div className="absolute inset-[12px] rounded-full border border-[#0F9D58]/40" />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-white/70">TARGET</div>
                  <div className="mt-0.5 text-[21px] font-extrabold leading-none text-white">Band 7</div>
                  <div className="mt-1 rounded-full bg-[#0F9D58]/20 px-2 py-0.5 text-[9px] font-bold text-[#5EEAA6]">
                    IELTS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}