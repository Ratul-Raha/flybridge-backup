"use client";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Video,
  Route,
  Cpu,
  FileText,
  MessageCircle,
  Headphones,
  ArrowRight,
  X,
} from "lucide-react";
const FEATURES = [
  {
    icon: Video,
    title: "Step-by-step Video Guidance",
    desc: "ধাপে ধাপে সহজ ও কার্যকরী ভিডিওর মাধ্যমে প্রসেস সম্পন্ন করুন।",
  },
  {
    icon: Route,
    title: "Guided Roadmap",
    desc: "প্রিপারেশন থেকে ভিসা এপ্রুভাল, পুরো জার্নির স্পষ্ট নির্দেশনা।",
  },
  {
    icon: Cpu,
    title: "AI SOP Generator",
    desc: "মিনিটেই তৈরি করুন পারফেক্ট, পার্সোনাল SOP।",
  },
  {
    icon: FileText,
    title: "Document Templates & Practical Resources",
    desc: "সময় বাঁচান রেডি-মেইড টেমপ্লেট ও প্র্যাকটিক্যাল রিসোর্সের মাধ্যমে।",
  },
  {
    icon: MessageCircle,
    title: "Live Q&A Sessions",
    desc: "সরাসরি এক্সপার্টের সাথে লাইভ প্রশ্নোত্তর সেশন।",
  },
  {
    icon: Headphones,
    title: "Live Support",
    desc: "যেকোনো প্রশ্নে আমরা আছি আপনার পাশে।",
  },
];
export function PromoPopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
      aria-label="Student Visa Blueprint offer"
    >
      <div
        className="absolute inset-0 bg-[rgba(18,32,67,0.5)] backdrop-blur-[2px] fb-pop-fade"
        onClick={() => setOpen(false)}
      />

      <div
        className="relative w-full max-w-[880px] max-h-[92vh] overflow-y-auto fb-pop-up"
        style={{
          background: "var(--bg-soft)",
          boxShadow: "0 40px 80px -30px rgba(18,32,67,0.45)",
        }}
      >
        {/* Background image + readability overlay */}
        <img
          src="/watermark.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, var(--bg-soft) 0%, rgba(246,248,252,0.85) 45%, rgba(246,248,252,0.35) 100%)",
          }}
        />

        <button
          onClick={() => setOpen(false)}
          aria-label="Close popup"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#E7EBF0] transition-transform hover:scale-105"
          style={{ color: "var(--ink)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Intro offer — circular seal, bottom-right corner (desktop) */}
        <div
          className="hidden sm:flex absolute bottom-4 right-4 lg:bottom-5 lg:right-5 z-10"
        >
          <div
            className="relative w-[148px] h-[148px] rounded-full bg-[#0B1F3A] flex flex-col items-center justify-center text-center"
            style={{ boxShadow: "0 18px 40px -18px rgba(11,31,58,0.55)" }}
          >
            <div className="absolute inset-[6px] rounded-full border border-dashed border-white/25" />
            <div className="absolute inset-[14px] rounded-full border border-[#0F9D58]/40" />
            <div className="relative">
              <div className="mt-1.5 text-[11px] font-semibold text-white/70">
                মাত্র
              </div>
              <div className="mt-0.5 text-[27px] font-extrabold leading-none text-white">
                ৳২,৯৯৯
              </div>
              <div className="mt-1.5 rounded-full bg-[#0F9D58]/20 px-2 py-0.5 text-[9.5px] font-bold text-[#5EEAA6]">
                ৩ মাসের পূর্ণ এক্সেস
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
                Your Study Abroad Journey, Simplified
              </span>
            </div>

            {/* Heading */}
            <div className="mt-4">
              <h2 className="text-[2.1rem] font-extrabold leading-[0.98] tracking-tight text-[#0B1F3A] sm:text-[2.5rem]">
                Student Visa
                <br />
                <span className="text-[#0F9D58]">Blueprint</span>
                <sup className="ml-0.5 text-[0.9rem] font-bold text-[#0F9D58]">
                  ™
                </sup>
              </h2>
              <p className="mt-2.5 max-w-sm text-[13.5px] leading-relaxed text-[#4B5768]">
                The complete step-by-step system to prepare your study visa
                application{" "}
                <span className="font-semibold text-[#0B1F3A]">
                  with confidence.
                </span>
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
                {FEATURES.map(({ icon: Icon, title, desc }, i) => (
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
                প্রিপারেশন থেকে ভিসা পর্যন্ত সব প্রসেস{" "}
                <span className="text-[#0F9D58]">নিজের হাতে করুন</span>
              </p>
              <p className="mt-1 text-[11.5px] text-[#4B5768]">
                সব রিসোর্স, টুলস ও গাইডেন্সসহ
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              className="group mt-4 inline-flex items-center gap-2 rounded-full bg-[#0F9D58] px-6 py-2.5 text-white transition-colors hover:bg-[#0C8A4C]"
            >
              <span className="text-[13.5px] font-bold">Get access now</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Intro offer — circular seal (mobile) */}
            <div className="sm:hidden flex justify-center mt-5">
              <div
                className="relative w-[120px] h-[120px] rounded-full bg-[#0B1F3A] flex flex-col items-center justify-center text-center"
                style={{ boxShadow: "0 18px 40px -18px rgba(11,31,58,0.55)" }}
              >
                <div className="absolute inset-[5px] rounded-full border border-dashed border-white/25" />
                <div className="absolute inset-[12px] rounded-full border border-[#0F9D58]/40" />
                <div className="relative">
                  <div className="text-[10px] font-semibold text-white/70">
                    মাত্র
                  </div>
                  <div className="mt-0.5 text-[22px] font-extrabold leading-none text-white">
                    ৳২,৯৯৯
                  </div>
                  <div className="mt-1 rounded-full bg-[#0F9D58]/20 px-2 py-0.5 text-[9px] font-bold text-[#5EEAA6]">
                    ৩ মাসের পূর্ণ এক্সেস
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