"use client";

/**
 * Interactive pieces for the IELTS landing page.
 * Everything here is a demo of the real product experience — no scoring, no fake results.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Headphones,
  Mic,
  Monitor,
  Pencil,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { trackMetaEvent } from "@/lib/meta-events";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBn = (v: number | string) => String(v).replace(/\d/g, (d) => BN_DIGITS.charAt(Number(d)));

/* ───────────────────────── hero: minimal enrollment controls ───────────────────────── */

export type HeroVersionOption = {
  slug: string;
  title: string;
  language: string;
  languageLabelBn: string;
  languageNote: string;
  price?: string;
  numericPrice?: number;
  originalPrice?: string;
  savings?: string;
  discountLabel?: string | null;
  endsAt?: string | null;
  href: string;
  previewHref?: string;
  enrolled: boolean;
  upcoming: boolean;
};

export function HeroDealTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (remaining === null || remaining <= 0) return null;

  const totalSecs = Math.floor(remaining / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const readout =
    d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums tracking-[0.04em]"
      style={{
        background: "#E3F4EC",
        border: "1px solid #B9E4D1",
        color: "#0D7A55",
      }}
    >
      <Clock3 className="h-3 w-3 shrink-0 text-[#0D7A55]" />
      <span>{readout}</span>
    </span>
  );
}

export function HeroDirectCtaButton({
  href,
  label,
  enrolled = false,
  contentId,
  contentName,
  numericPrice,
}: {
  href: string;
  label: string;
  subPrice?: string;
  enrolled?: boolean;
  contentId: string;
  contentName: string;
  numericPrice?: number;
}) {
  const handleClick = () => {
    if (!enrolled && !href.startsWith("#")) {
      trackMetaEvent("InitiateCheckout", {
        content_ids: [contentId],
        content_name: contentName,
        content_type: "product",
        ...(numericPrice != null && numericPrice > 0 ? { value: numericPrice, currency: "BDT" } : {}),
      });
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="ib-hero-cta group inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-[10px] px-6 text-[16px] font-bold leading-[1.3] text-white transition-all"
      style={{
        background: "#0D7A55",
        boxShadow: "0 10px 28px rgba(13,122,85,0.16)",
      }}
    >
      {enrolled && <Play className="h-4 w-4 shrink-0" fill="currentColor" />}
      <span>{label}</span>
      {!enrolled && (
        <ArrowRight
          className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-1"
          strokeWidth={2.4}
        />
      )}
    </Link>
  );
}

function trackVersionCheckout(version: HeroVersionOption) {
  if (version.enrolled || version.upcoming) return;
  trackMetaEvent("InitiateCheckout", {
    content_ids: [version.slug],
    content_name: `IELTS Band Score Machine (${version.language})`,
    content_type: "product",
    ...(version.numericPrice != null && version.numericPrice > 0
      ? { value: version.numericPrice, currency: "BDT" }
      : {}),
  });
}

function VersionSelectorDialog({
  versions,
  onClose,
}: {
  versions: HeroVersionOption[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="ডায়ালগ বন্ধ করুন"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F16]/55 backdrop-blur-[3px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ielts-version-dialog-title"
        className="ib-anim-in relative z-[1] w-full max-w-[460px] rounded-[6px] border border-[#E3E9E5] bg-[#FCFDFC] p-4 shadow-[0_28px_80px_rgba(3,20,12,0.28)] sm:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="ielts-version-dialog-title"
            className="pt-1 font-display text-[20px] font-bold tracking-[-0.03em] text-[#0F1F1A]"
          >
            ভার্সন বেছে নিন
          </h2>
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={onClose}
            autoFocus
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-[#E1E7E3] bg-white text-[#536159] transition-colors hover:bg-[#F3F7F4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5">
          {versions.map((version) => {
            const available = version.enrolled || !version.upcoming;
            const primary = version.language === "English" && available;
            const choice = (
              <span className="flex min-h-[62px] items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-display text-[14px] font-bold">
                    {version.languageLabelBn}
                  </span>
                  {!available && (
                    <span className="mt-0.5 block text-[10px] font-medium opacity-70">
                      শীঘ্রই আসছে
                    </span>
                  )}
                  {version.enrolled && (
                    <span className="mt-0.5 block text-[10px] font-medium opacity-70">
                      কোর্সে ফিরে যান
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-display text-[17px] font-bold tabular-nums">
                    {version.price ?? "See price"}
                  </span>
                  {available && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </span>
            );

            if (!available) {
              return (
                <div
                  key={version.slug}
                  aria-disabled="true"
                  className="rounded-[6px] border border-[#DDE3DF] bg-[#F4F6F4] px-4 py-1 text-[#66736C] opacity-75"
                >
                  {choice}
                </div>
              );
            }

            return (
              <Link
                key={version.slug}
                href={version.href}
                onClick={() => trackVersionCheckout(version)}
                aria-label={`${version.languageLabelBn} — ${version.price ?? "View price"}`}
                className={`group rounded-[6px] border-2 px-4 py-1 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0D7A55] ${
                  primary
                    ? "border-[#0D7A55] bg-[#0D7A55] text-white shadow-[0_10px_24px_rgba(13,122,85,0.18)] hover:bg-[#095F42]"
                    : "border-[#B9DCCB] bg-white text-[#0F1F1A] shadow-[0_8px_20px_rgba(15,31,26,0.06)] hover:border-[#0D7A55]"
                }`}
              >
                {choice}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function HeroVersionSelectorButton({
  versions,
  label,
  className,
  style,
  leadingDot = false,
}: {
  versions: HeroVersionOption[];
  label: string;
  className: string;
  style?: CSSProperties;
  leadingDot?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={className}
        style={style}
      >
        {leadingDot && <span className="ib-live-dot h-2 w-2 rounded-full bg-[#041E14]" aria-hidden="true" />}
        <span>{label}</span>
        <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </button>
      {open && <VersionSelectorDialog versions={versions} onClose={close} />}
    </>
  );
}

export function HeroVersionSelectorDock({ versions }: { versions: HeroVersionOption[] }) {
  return (
    <div id="enroll-options" className="mt-5 max-w-[560px] scroll-mt-24">
      <div className="mb-2 font-sans text-[13px] font-semibold text-[#5B6B65]">
        আপনার পছন্দের ভার্সন বেছে নিন
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {versions.map((version) => {
          const available = version.enrolled || !version.upcoming;
          const primary = version.language === "English" && available;
          const titleTone = primary ? "text-white" : available ? "text-[#0F1F1A]" : "text-[#66736C]";
          const priceTone = primary ? "text-white" : available ? "text-[#0D7A55]" : "text-[#66736C]";
          const content = (
            <span className="flex min-h-[62px] items-center justify-between gap-4">
              <span className="min-w-0">
                <span className={`block truncate font-display text-[14px] font-bold ${titleTone}`}>
                  {version.languageLabelBn}
                </span>
                {!available && (
                  <span className="mt-0.5 block text-[10px] font-medium text-[#78857E]">
                    শীঘ্রই আসছে
                  </span>
                )}
                {version.enrolled && (
                  <span className={`mt-0.5 block text-[10px] font-medium ${primary ? "text-white/70" : "text-[#78857E]"}`}>
                    কোর্সে ফিরে যান
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2.5">
                <span className={`font-display text-[17px] font-bold leading-none tabular-nums ${priceTone}`}>
                  {version.price ?? "See price"}
                </span>
                {available && (
                  <ArrowRight
                    className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 ${priceTone}`}
                  />
                )}
              </span>
            </span>
          );

          if (!available) {
            return (
              <div
                key={version.slug}
                aria-disabled="true"
                className="flex min-h-[70px] flex-col justify-center rounded-[6px] border border-[#DDE3DF] bg-white/70 px-4 py-1 opacity-75"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={version.slug}
              href={version.href}
              onClick={() => trackVersionCheckout(version)}
              aria-label={`${version.languageLabelBn} — ${version.price ?? "View price"}`}
              className={`group block min-h-[70px] rounded-[6px] border-2 px-4 py-1 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0D7A55] ${
                primary
                  ? "border-[#0D7A55] bg-[#0D7A55] shadow-[0_12px_28px_rgba(13,122,85,0.18)] hover:border-[#095F42] hover:bg-[#095F42] hover:shadow-[0_16px_34px_rgba(13,122,85,0.22)]"
                  : "border-[#B9DCCB] bg-white shadow-[0_8px_24px_rgba(15,31,26,0.07)] hover:border-[#0D7A55] hover:bg-[#FBFEFC] hover:shadow-[0_14px_30px_rgba(15,31,26,0.12)]"
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── hero: band score machine™ live console ───────────────────────── */

type ConsoleMode = "upgrade" | "simulator" | "evaluator";
type UpgradeSkill = "writing" | "speaking";

const UPGRADE_SAMPLES: Record<
  UpgradeSkill,
  {
    label: string;
    taskTag: string;
    prompt: string;
    band6: {
      overall: string;
      rubrics: { code: string; name: string; score: number }[];
      beforeText: string;
      weakSpot1: string;
      midText: string;
      weakSpot2: string;
      afterText: string;
      flaws: string[];
    };
    band7: {
      overall: string;
      rubrics: { code: string; name: string; score: number }[];
      beforeText: string;
      strongSpot1: string;
      midText: string;
      strongSpot2: string;
      afterText: string;
      wins: string[];
    };
  }
> = {
  writing: {
    label: "Writing Task 2",
    taskTag: "ESSAY X-RAY · BAND 6 vs 7+",
    prompt: "Prompt: Does modern technology make people less socially connected?",
    band6: {
      overall: "6.0",
      rubrics: [
        { code: "TR", name: "Task", score: 6.0 },
        { code: "CC", name: "Coherence", score: 6.0 },
        { code: "LR", name: "Lexical", score: 5.5 },
        { code: "GRA", name: "Grammar", score: 6.0 },
      ],
      beforeText: "Nowadays technology is ",
      weakSpot1: "very important in our daily life",
      midText: ". Many people think it ",
      weakSpot2: "makes people less social",
      afterText: " because they use phones all day instead of talking.",
      flaws: ["মুখস্থ ক্লিশে শুরু", "সাধারণ শব্দভাণ্ডার", "অস্পষ্ট পজিশন"],
    },
    band7: {
      overall: "7.0",
      rubrics: [
        { code: "TR", name: "Task", score: 7.0 },
        { code: "CC", name: "Coherence", score: 7.0 },
        { code: "LR", name: "Lexical", score: 7.0 },
        { code: "GRA", name: "Grammar", score: 7.0 },
      ],
      beforeText: "While digital devices are often blamed for ",
      strongSpot1: "eroding face-to-face interaction",
      midText: ", they actively ",
      strongSpot2: "strengthen long-distance bonds",
      afterText: " when used intentionally rather than passively.",
      wins: ["Complex Contrast Clause", "Precise Collocations", "Clear Examiner Thesis"],
    },
  },
  speaking: {
    label: "Speaking Part 2",
    taskTag: "CUE CARD X-RAY · BAND 6 vs 7+",
    prompt: "Cue Card: Describe a skill you learned recently that helped your career.",
    band6: {
      overall: "6.0",
      rubrics: [
        { code: "FC", name: "Fluency", score: 6.0 },
        { code: "LR", name: "Lexical", score: 5.5 },
        { code: "GRA", name: "Grammar", score: 6.0 },
        { code: "PR", name: "Pronun.", score: 6.0 },
      ],
      beforeText: "Last year I learned public speaking. At first it was ",
      weakSpot1: "very hard and scary for me",
      midText: ", but later it gave me ",
      weakSpot2: "very good benefit in my job",
      afterText: " when presenting to clients.",
      flaws: ["বারবার 'very' ব্যবহার", "সরল বাক্য গঠন", "সীমিত এক্সপ্রেশন"],
    },
    band7: {
      overall: "7.0",
      rubrics: [
        { code: "FC", name: "Fluency", score: 7.0 },
        { code: "LR", name: "Lexical", score: 7.0 },
        { code: "GRA", name: "Grammar", score: 7.0 },
        { code: "PR", name: "Pronun.", score: 7.0 },
      ],
      beforeText: "Picking up persuasive speaking was ",
      strongSpot1: "initially daunting",
      midText: ", yet mastering the PREP framework ",
      strongSpot2: "transformed my client pitches",
      afterText: " within weeks.",
      wins: ["Idiomatic Precision", "PREP Method Flow", "Natural Rhythm"],
    },
  },
};

const SIM_OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];

const SIM_QUESTIONS = [
  {
    statement: "Urban bees may have a more varied diet than bees kept beside single-crop farms.",
    correct: "TRUE",
    why: "প্যাসেজে স্পষ্ট বলা আছে: 'more varied diet than those kept beside single-crop farms.'",
  },
  {
    statement: "Rooftop hives produce double the honey of rural farm hives.",
    correct: "NOT GIVEN",
    why: "মধুর পরিমাণের কোনো তুলনা প্যাসেজে দেওয়া হয়নি — এটি ক্লাসিক IELTS ট্র্যাপ!",
  },
  {
    statement: "Every ecologist supports placing more hives in small city areas.",
    correct: "FALSE",
    why: "'Some ecologists, however, warn...' — অর্থাৎ সবাই সমর্থন করেন না।",
  },
];

export function BandScoreMachineConsole() {
  const [mode, setMode] = useState<ConsoleMode>("upgrade");
  const [skill, setSkill] = useState<UpgradeSkill>("writing");
  const [upgraded, setUpgraded] = useState(false);

  // Simulator state
  const [secs, setSecs] = useState(59 * 60 + 12);
  const [qIdx, setQIdx] = useState(0);
  const [simAnswers, setSimAnswers] = useState<(string | null)[]>(["TRUE", null, null]);

  const userTouched = useRef(false);

  const markTouched = () => {
    userTouched.current = true;
  };

  // Cycle through the demo screens and Band 6→7 until the visitor interacts.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setUpgraded(true);
      return;
    }
    const firstFlip = window.setTimeout(() => {
      if (!userTouched.current) setUpgraded(true);
    }, 1800);

    const cycle = window.setInterval(() => {
      if (userTouched.current) return;
      setMode((current) =>
        current === "upgrade" ? "simulator" : current === "simulator" ? "evaluator" : "upgrade",
      );
      setUpgraded((prev) => !prev);
    }, 4800);

    return () => {
      window.clearTimeout(firstFlip);
      window.clearInterval(cycle);
    };
  }, []);

  // Exam timer tick when simulator tab is open
  useEffect(() => {
    if (mode !== "simulator") return;
    const id = window.setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const sample = UPGRADE_SAMPLES[skill];
  const activeData = upgraded ? sample.band7 : sample.band6;
  const bandProgress = Math.min(100, (Number(activeData.overall) / 9) * 100);
  const bandGap = Math.max(0, 7 - Number(activeData.overall));
  const bandNote = upgraded
    ? "লক্ষ্যে পৌঁছে গেছেন"
    : `Band 7+ এর জন্য আরও ${toBn(bandGap.toFixed(1))} দরকার`;
  const currentQ = SIM_QUESTIONS[qIdx];
  const chosenAnswer = simAnswers[qIdx];

  const tabs: { id: ConsoleMode; label: string }[] = [
    { id: "upgrade", label: "Band upgrade" },
    { id: "simulator", label: "Mock test" },
    { id: "evaluator", label: "AI feedback" },
  ];

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[500px]">
      <div
        className="ib-card-motion flex h-full flex-col overflow-hidden rounded-[6px] border border-[#E4E8E4] bg-white"
        style={{
          boxShadow: "0 18px 48px -30px rgba(15,31,26,0.28)",
          color: "#0F1F1A",
        }}
      >
        <div className="flex min-h-[54px] shrink-0 items-center justify-between gap-3 px-5">
          <span className="font-display text-[14px] font-semibold tracking-[-0.02em] text-[#0F1F1A]">
            IELTS Band Score Machine
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6B7972]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0D7A55]" />
            Live preview
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Band Score Machine ফিচার প্রিভিউ"
          className="flex shrink-0 border-y border-[#E8ECE9] px-3"
        >
          {tabs.map(({ id, label }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => {
                  markTouched();
                  setMode(id);
                }}
                className="min-h-[42px] flex-1 border-b-2 px-2 py-1 font-sans text-[11px] font-semibold tracking-[-0.01em] transition-colors sm:text-[12px]"
                style={
                  active
                    ? {
                        borderColor: "#0D7A55",
                        color: "#0D7A55",
                      }
                    : {
                        borderColor: "transparent",
                        color: "#7B8982",
                      }
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── MODE 1: BAND 6.0 -> BAND 7 COMPARISON ── */}
        {mode === "upgrade" && (
          <div className="ib-anim-in min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-3">
                {(["writing", "speaking"] as UpgradeSkill[]).map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => {
                      markTouched();
                      setSkill(sk);
                    }}
                    className="border-b pb-1 text-[12px] font-semibold transition-colors"
                    style={{
                      borderColor: skill === sk ? "#0D7A55" : "transparent",
                      color: skill === sk ? "#0D7A55" : "#7B8982",
                    }}
                  >
                    {sk === "writing" ? "Writing" : "Speaking"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-md bg-[#F4F6F4] p-1">
                {[
                  { value: false, label: "6.0" },
                  { value: true, label: "7+" },
                ].map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={upgraded === value}
                    onClick={() => {
                      markTouched();
                      setUpgraded(value);
                    }}
                    className="rounded px-2 py-1 text-[10.5px] font-semibold transition-colors"
                    style={{
                      background: upgraded === value ? "#FFFFFF" : "transparent",
                      color: upgraded === value ? "#0F1F1A" : "#78857E",
                      boxShadow: upgraded === value ? "0 1px 3px rgba(15,31,26,0.1)" : "none",
                    }}
                  >
                    Band {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-[#839088]">
                  {sample.label} · Overall band
                </span>
                <div className="mt-1 flex items-baseline gap-2.5">
                  <span
                    key={activeData.overall}
                    className="ib-anim-in font-display text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums"
                    style={{ color: upgraded ? "#0D7A55" : "#0F1F1A" }}
                  >
                    {activeData.overall}
                  </span>
                  <span className="text-[11px] text-[#78857E]">{bandNote}</span>
                </div>
              </div>
              <span className="mb-1 rounded-full bg-[#E9F5EE] px-2.5 py-1 text-[10px] font-semibold text-[#0D7A55]">
                Target 7+
              </span>
            </div>

            <div className="mt-4">
              <div
                role="meter"
                aria-label={`${sample.label} band score progress`}
                aria-valuemin={0}
                aria-valuemax={9}
                aria-valuenow={Number(activeData.overall)}
                className="relative h-1.5 overflow-visible rounded-full bg-[#E8ECE9]"
              >
                <span
                  className="block h-full rounded-full bg-[#0D7A55] transition-[width] duration-500"
                  style={{ width: `${bandProgress}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-[3px] h-3 w-px bg-[#68766F]"
                  style={{ left: "77.78%" }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-[#929C96]">
                <span>0</span>
                <span>7+ target</span>
                <span>9</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 divide-x divide-[#E8ECE9] border-y border-[#E8ECE9] py-3">
              {activeData.rubrics.map((r) => (
                <div key={r.code} className="min-w-0 px-2 first:pl-0">
                  <span className="block text-[9px] font-medium text-[#87938C]">{r.code}</span>
                  <span
                    className="mt-0.5 block font-display text-[16px] font-semibold leading-none tabular-nums"
                    style={{ color: upgraded ? "#0D7A55" : "#0F1F1A" }}
                  >
                    {r.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#87938C]">
                Sample response
              </span>
              <p className="mt-1.5 font-sans text-[13px] leading-[1.7] text-[#34413A]">
                {upgraded ? (
                  <>
                    {sample.band7.beforeText}
                    <mark className="rounded bg-[#E9F5EE] px-1 text-[#0D7A55]">
                      {sample.band7.strongSpot1}
                    </mark>
                    {sample.band7.midText}
                    <mark className="rounded bg-[#E9F5EE] px-1 text-[#0D7A55]">
                      {sample.band7.strongSpot2}
                    </mark>
                    {sample.band7.afterText}
                  </>
                ) : (
                  <>
                    {sample.band6.beforeText}
                    <mark className="rounded bg-[#FCEDEC] px-1 text-[#A33B3F]">
                      {sample.band6.weakSpot1}
                    </mark>
                    {sample.band6.midText}
                    <mark className="rounded bg-[#FCEDEC] px-1 text-[#A33B3F]">
                      {sample.band6.weakSpot2}
                    </mark>
                    {sample.band6.afterText}
                  </>
                )}
              </p>
              <p className="mt-2 text-[11px] text-[#78857E]">
                {upgraded ? "Strength" : "Focus next"}: {upgraded ? sample.band7.wins[0] : sample.band6.flaws[0]}
              </p>
            </div>
          </div>
        )}

        {/* ── MODE 2: MINIMAL CD-IELTS MOCK SIMULATOR ── */}
        {mode === "simulator" && (
          <div className="ib-anim-in min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="font-medium text-[#66736C]">Reading mock · 01 / 15</span>
              <span role="timer" className="font-mono font-semibold tabular-nums text-[#0D7A55]">
                {mm}:{ss}
              </span>
            </div>

            <p className="mt-3 border-l-2 border-[#B9E4D1] pl-3 text-[12px] leading-[1.65] text-[#5B6861]">
              Supporters point to city parks giving urban bees a{" "}
              <mark className="bg-[#E9F5EE] px-0.5 text-[#0D7A55]">more varied diet</mark>{" "}
              than those beside single-crop farms.
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-[#E8ECE9] pt-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#839088]">
                Question {qIdx + 1} of {SIM_QUESTIONS.length}
              </span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Question ${i + 1}`}
                    aria-current={i === qIdx ? "step" : undefined}
                    onClick={() => {
                      markTouched();
                      setQIdx(i);
                    }}
                    className="h-1.5 w-5 rounded-full"
                    style={{ background: i === qIdx ? "#0D7A55" : "#DDE4DF" }}
                  />
                ))}
              </div>
            </div>

            <p className="mt-2 font-sans text-[13px] font-medium leading-[1.5] text-[#19251F]">
              {currentQ.statement}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {SIM_OPTIONS.map((opt) => {
                const isPicked = chosenAnswer === opt;
                const isRight = opt === currentQ.correct;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={isPicked}
                    onClick={() => {
                      markTouched();
                      setSimAnswers((prev) => prev.map((a, i) => (i === qIdx ? opt : a)));
                    }}
                    className="rounded-md border px-2 py-2 text-center text-[10px] font-semibold transition-colors"
                    style={{
                      background: isPicked ? (isRight ? "#E9F5EE" : "#FCEDEC") : "#FFFFFF",
                      borderColor: isPicked ? (isRight ? "#9AD4B5" : "#E9B5B4") : "#E1E7E3",
                      color: isPicked ? (isRight ? "#0D7A55" : "#A33B3F") : "#536159",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {chosenAnswer && (
              <p
                aria-live="polite"
                className="mt-3 border-t border-[#E8ECE9] pt-2 text-[11px] leading-[1.5]"
                style={{ color: chosenAnswer === currentQ.correct ? "#0D7A55" : "#9A5514" }}
              >
                {chosenAnswer === currentQ.correct
                  ? "Correct — "
                  : `Correct answer: ${currentQ.correct} · `}
                {currentQ.why}
              </p>
            )}
          </div>
        )}

        {/* ── MODE 3: MINIMAL INSTANT EVALUATION ── */}
        {mode === "evaluator" && (
          <div className="ib-anim-in min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#839088]">
                  AI feedback
                </span>
                <p className="mt-0.5 font-display text-[15px] font-semibold text-[#0F1F1A]">
                  Writing &amp; Speaking
                </p>
              </div>
              <div className="text-right">
                <span className="block text-[9px] uppercase tracking-[0.08em] text-[#839088]">
                  Sample band
                </span>
                <span className="font-display text-[24px] font-semibold leading-none text-[#0D7A55]">
                  7.0
                </span>
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#E8ECE9] border-y border-[#E8ECE9]">
              {[
                {
                  tag: "LEXICAL RESOURCE",
                  before: "good career chance",
                  after: "lucrative career prospects",
                },
                {
                  tag: "GRAMMAR",
                  before: "People is depending more on...",
                  after: "Individuals increasingly rely on...",
                },
                {
                  tag: "SPEAKING PACE",
                  before: "136 WPM · Clear delivery",
                  after: "Band 7.0 Fluency",
                },
              ].map((item) => (
                <div
                  key={item.tag}
                  className="py-3 first:pt-0 last:pb-0"
                >
                  <span className="block text-[9px] font-medium uppercase tracking-[0.08em] text-[#87938C]">
                    {item.tag}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                    <s className="text-[#8A948E]">{item.before}</s>
                    <ArrowRight className="h-3 w-3 shrink-0 text-[#0D7A55]" />
                    <span className="font-medium text-[#24332B]">{item.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ───────────────────────── curriculum: interactive 4-skill explorer ───────────────────────── */

export type CurriculumModuleItem = {
  number: string;
  skillKey: "speaking" | "writing" | "listening" | "reading" | "general";
  skillTag: string;
  title: string;
  lessonCount: string;
  capstone: string;
  lessons: { title: string; duration?: string }[];
};

const SKILL_META: Record<
  CurriculumModuleItem["skillKey"],
  { Icon: typeof Mic; bg: string; ink: string }
> = {
  speaking: { Icon: Mic, bg: "var(--mint-bg)", ink: "var(--mint-ink)" },
  writing: { Icon: FileText, bg: "var(--blue-bg)", ink: "var(--blue-ink)" },
  listening: { Icon: Headphones, bg: "var(--lav-bg)", ink: "var(--lav-ink)" },
  reading: { Icon: BookOpen, bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
  general: { Icon: Sparkles, bg: "var(--mint-bg)", ink: "var(--mint-ink)" },
};

export function CurriculumExplorer({ modules }: { modules: CurriculumModuleItem[] }) {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="flex flex-col gap-3.5">
      {modules.map((mod, idx) => {
        const isOpen = openIdx === idx;
        const { Icon, bg, ink } = SKILL_META[mod.skillKey] ?? SKILL_META.general;

        return (
          <article
            key={mod.title}
            className="ib-card-motion overflow-hidden rounded-[6px] bg-white transition-all duration-200"
            style={{
              border: isOpen ? "1px solid #BCE5D3" : "1px solid #E4E9F1",
              boxShadow: isOpen
                ? "0 20px 44px -26px rgba(18,32,67,0.14)"
                : "0 6px 18px -12px rgba(18,32,67,0.06)",
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
              className="flex w-full items-center gap-4 px-5 py-4.5 text-left transition-colors hover:bg-[#FAFBFD] sm:px-6 sm:py-5"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px]"
                style={{ background: bg, color: ink }}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#64728A]">
                    {mod.skillTag}
                  </span>
                </span>
                <span className="mt-1 block font-display text-[17.5px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#122043] sm:text-[19px]">
                  {mod.title}
                </span>
              </span>

              <span className="hidden rounded-full bg-[#F3F6FA] px-3 py-1 text-[12px] font-medium text-[#4B5768] sm:inline-block">
                {mod.lessonCount}
              </span>

              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors"
                style={{
                  background: isOpen ? "#E8F7F1" : "#F3F6FA",
                  color: isOpen ? "#0F6B48" : "#64728A",
                }}
              >
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                />
              </span>
            </button>

            {isOpen && (
              <div
                className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6"
                style={{ borderTop: "1px solid #EEF2F7" }}
              >
                <ul className="divide-y divide-[#F1F4F9]">
                  {mod.lessons.map((lesson, lIdx) => (
                    <li
                      key={lesson.title}
                      className="flex items-start justify-between gap-4 py-3 text-[14.5px] leading-[1.65]"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-[3px] w-5 shrink-0 font-mono text-[11.5px] font-semibold tabular-nums text-[#8A94A6]">
                          {String(lIdx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[#2C3A52]">{lesson.title}</span>
                      </div>
                      {lesson.duration && (
                        <span className="mt-[2px] shrink-0 rounded-md bg-[#F6F8FC] px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-[#64728A]">
                          {lesson.duration}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {mod.capstone && (
                  <div
                    className="ib-card-motion mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[6px] px-4 py-3"
                    style={{ background: "#F2FAF6", border: "1px solid #D5EFE3" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]"
                        style={{ background: "#E2F6EE", color: "#0F6B48" }}
                      >
                        <Award className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0">
                        <span className="block font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#188A5D]">
                          MODULE CAPSTONE
                        </span>
                        <span className="block text-[13.5px] font-semibold text-[#122043]">
                          {mod.capstone}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ───────────────────────── shared chrome ───────────────────────── */

function ScreenBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ background: "var(--ib-navy-2)" }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex gap-1.5 shrink-0" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[9px] h-[9px] rounded-full" style={{ background: "#3B4A63" }} />
          ))}
        </span>
        <span className="text-[12.5px] font-semibold truncate" style={{ color: "#C9D5E5" }}>
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

/* ───────────────────────── hero: exam window ───────────────────────── */

const PASSAGE = [
  "Rooftop beekeeping has grown steadily in large cities over the past two decades.",
  "Supporters point to the wide variety of flowering plants in parks and gardens, which can give urban bees a more varied diet than those kept beside single-crop farms.",
  "Some ecologists, however, warn that placing more hives in a small area may leave wild pollinators with less to eat.",
];

const STATEMENTS = [
  "Urban bees may have a more varied diet than bees kept beside single-crop farms.",
  "Rooftop hives produce more honey than hives on farms.",
  "Every ecologist supports the expansion of urban beekeeping.",
];

const OPTIONS = ["TRUE", "FALSE", "NOT GIVEN"];
const START_SECONDS = 59 * 60 + 12;

export function ExamWindow() {
  const [secs, setSecs] = useState(START_SECONDS);
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null]);

  // Refs keep the demo autopilot below free of stale closures.
  const activeRef = useRef(active);
  const lastInteract = useRef(Date.now());
  const simTick = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  /* Demo autopilot: while the visitor isn't clicking, the test "takes itself" —
     answering the current question and moving on like a live attempt. */
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastInteract.current < 6000) return;
      const q = activeRef.current;
      simTick.current += 1;
      const pick = OPTIONS[(q + simTick.current) % OPTIONS.length];
      setAnswers((prev) => (prev[q] === null ? prev.map((a, i) => (i === q ? pick : a)) : prev));
      setActive((q + 1) % STATEMENTS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const touch = () => {
    lastInteract.current = Date.now();
  };

  const choose = (opt: string) => {
    touch();
    setAnswers((prev) => prev.map((a, i) => (i === active ? opt : a)));
  };

  return (
    <div
      className="ib-card-motion rounded-[6px] overflow-hidden bg-white"
      style={{
        border: "1px solid var(--ib-line)",
        boxShadow: "0 44px 80px -44px rgba(12,26,51,0.5), 0 0 0 6px rgba(255,255,255,0.6)",
      }}
    >
      <ScreenBar
        title="Mock Test 01 · Reading"
        right={
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-white/10"
              style={{ color: "#A9F5D5" }}
            >
              <span className="ib-live-dot w-[7px] h-[7px] rounded-full" style={{ background: "var(--ib-mint)" }} />
              LIVE
            </span>
            <span role="timer" className="text-[14px] font-bold tabular-nums" style={{ color: "var(--ib-mint)" }}>
              {mm}:{ss}
            </span>
          </div>
        }
      />

      <div className="grid md:grid-cols-2" style={{ color: "var(--ib-ink)" }}>
        <div className="p-5 md:border-r" style={{ borderColor: "var(--ib-line)" }}>
          <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--ib-muted)" }}>
            Reading Passage 1
          </div>
          <h3 className="text-[16px] font-semibold mb-3" style={{ color: "var(--ib-ink)" }}>
            The city bee
          </h3>
          <div className="space-y-3 text-[13.5px] leading-[1.7]" style={{ color: "var(--ib-body)" }}>
            {PASSAGE.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <div className="p-5 border-t md:border-t-0" style={{ borderColor: "var(--ib-line)", background: "#FAFBFD" }}>
          <div className="text-[12px] font-semibold mb-1" style={{ color: "var(--ib-muted)" }}>
            Questions 1–3
          </div>
          <p className="text-[12.5px] leading-[1.6] mb-4" style={{ color: "var(--ib-muted)" }}>
            Do the following statements agree with the information given in the passage?
          </p>

          <div className="flex items-start gap-3 mb-4">
            <span
              key={active}
              className="ib-anim-in w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[12px] font-bold shrink-0 text-white"
              style={{ background: "var(--ib-navy-2)" }}
            >
              {active + 1}
            </span>
            <p
              key={`st-${active}`}
              className="ib-anim-in text-[14px] leading-[1.6] font-medium"
              style={{ color: "var(--ib-ink)" }}
            >
              {STATEMENTS[active]}
            </p>
          </div>

          <div role="radiogroup" aria-label={`Question ${active + 1}`} className="flex flex-col gap-2">
            {OPTIONS.map((opt) => {
              const on = answers[active] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-on={on}
                  onClick={() => choose(opt)}
                  className="ib-opt flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left text-[13px] font-semibold"
                  style={{
                    background: on ? "rgba(20,133,90,0.09)" : "#fff",
                    border: `1.5px solid ${on ? "var(--ib-brand)" : "var(--ib-line)"}`,
                    color: "var(--ib-ink)",
                  }}
                >
                  <span
                    className="w-[15px] h-[15px] rounded-full shrink-0"
                    style={{
                      border: `1.5px solid ${on ? "var(--ib-brand)" : "#9AA8BC"}`,
                      background: on ? "var(--ib-brand)" : "transparent",
                      boxShadow: on ? "inset 0 0 0 2.5px #fff" : "none",
                    }}
                  />
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
        style={{ background: "#F3F6FA", borderTop: "1px solid var(--ib-line)" }}
      >
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Question navigation">
          {Array.from({ length: 13 }).map((_, i) => {
            const enabled = i < 3;
            const isActive = i === active;
            const answered = enabled && answers[i] !== null;
            return (
              <button
                key={i}
                type="button"
                disabled={!enabled}
                aria-current={isActive ? "true" : undefined}
                aria-label={`Question ${i + 1}${answered ? ", answered" : ""}`}
                onClick={() => {
                  touch();
                  setActive(i);
                }}
                className="w-[24px] h-[24px] rounded-[6px] text-[11px] font-bold tabular-nums flex items-center justify-center transition-colors disabled:cursor-default"
                style={{
                  background: answered ? "var(--ib-navy-2)" : "#fff",
                  color: answered ? "#fff" : enabled ? "var(--ib-ink)" : "#9AA8BC",
                  border: `1.5px solid ${isActive ? "var(--ib-brand)" : answered ? "var(--ib-navy-2)" : "var(--ib-line)"}`,
                  boxShadow: isActive ? "0 0 0 2px rgba(20,133,90,0.25)" : "none",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous question"
            disabled={active === 0}
            onClick={() => {
              touch();
              setActive((a) => Math.max(0, a - 1));
            }}
            className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center bg-white disabled:opacity-40"
            style={{ border: "1px solid var(--ib-line)", color: "var(--ib-ink)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next question"
            disabled={active === 2}
            onClick={() => {
              touch();
              setActive((a) => Math.min(2, a + 1));
            }}
            className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-white disabled:opacity-40"
            style={{ background: "var(--ib-navy-2)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── mock-test section: skill tabs ───────────────────────── */

type SkillKey = "listening" | "reading" | "writing";

const SKILLS: {
  key: SkillKey;
  label: string;
  Icon: typeof Headphones;
  line: string;
  benefit: string;
}[] = [
  {
    key: "listening",
    label: "লিসেনিং",
    Icon: Headphones,
    line: "হেডফোন লাগিয়ে শোনো, স্ক্রিনেই উত্তর লেখো।",
    benefit: "অডিও চলতে চলতেই টাইপ করে উত্তর দেওয়ার অভ্যাস তৈরি হয়।",
  },
  {
    key: "reading",
    label: "রিডিং",
    Icon: BookOpen,
    line: "স্ক্রিনে প্যাসেজ পড়ো, পাশেই উত্তর দাও।",
    benefit: "টাইমার দেখে প্যাসেজ আর প্রশ্নের মধ্যে যাওয়া-আসার গতি বাড়ে।",
  },
  {
    key: "writing",
    label: "রাইটিং",
    Icon: Pencil,
    line: "কিবোর্ডে টাইপ করে লেখো, ঠিক কম্পিউটার-বেসড পরীক্ষার মতো।",
    benefit: "হাতে না লিখে কিবোর্ডে লেখার রিদম পরীক্ষার আগেই রপ্ত হয়ে যায়।",
  },
];

const WAVE = [8, 14, 22, 12, 28, 18, 10, 24, 30, 16, 9, 20, 26, 14, 8, 18, 28, 22, 12, 30, 16, 10, 24, 18, 12, 26, 20, 9];

function ListeningPane() {
  return (
    <div className="p-5 sm:p-6">
      <div className="ib-card-motion flex items-center gap-4 rounded-[6px] px-4 py-3.5" style={{ background: "#F3F6FA", border: "1px solid var(--ib-line)" }}>
        <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--ib-navy-2)" }}>
          <Headphones className="w-[18px] h-[18px] text-white" />
        </span>
        <div className="flex items-center gap-[3px] h-[34px] flex-1 min-w-0 overflow-hidden">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full shrink-0"
              style={{ height: h, background: i < 11 ? "var(--ib-brand)" : "#C3CEDD" }}
            />
          ))}
        </div>
        <span className="text-[12.5px] font-bold tabular-nums shrink-0" style={{ color: "var(--ib-ink)" }}>
          04:12
        </span>
      </div>

      <div className="mt-5 text-[12px] font-semibold" style={{ color: "var(--ib-muted)" }}>
        Questions 1–4 · Complete the form
      </div>
      <div className="ib-card-motion mt-3 rounded-[6px] overflow-hidden" style={{ border: "1px solid var(--ib-line)" }}>
        {[
          { label: "Name", value: "Sarah Collins" },
          { label: "Phone", value: "07700 9" },
          { label: "Course", value: "" },
          { label: "Start date", value: "" },
        ].map((row, i) => (
          <div
            key={row.label}
            className="grid grid-cols-[110px_1fr] items-center text-[13.5px]"
            style={{ borderTop: i ? "1px solid var(--ib-line)" : "none" }}
          >
            <div className="px-4 py-3 font-medium" style={{ background: "#FAFBFD", color: "var(--ib-body)" }}>
              {row.label}
            </div>
            <div className="px-4 py-3 font-semibold" style={{ color: "var(--ib-ink)", minHeight: 44 }}>
              {row.value}
              {i === 1 && <span className="inline-block w-px h-[15px] align-middle ml-0.5" style={{ background: "var(--ib-ink)" }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingPane() {
  const bars = [92, 100, 84, 96, 70, 100, 88, 60];
  return (
    <div className="grid sm:grid-cols-2">
      <div className="p-5 sm:p-6 sm:border-r" style={{ borderColor: "var(--ib-line)" }}>
        <div className="text-[12px] font-semibold mb-3.5" style={{ color: "var(--ib-muted)" }}>
          Reading Passage 2
        </div>
        <div className="flex flex-col gap-[10px]">
          {bars.map((w, i) => (
            <span key={i} className="h-[8px] rounded-full" style={{ width: `${w}%`, background: "#E3E9F1" }} />
          ))}
        </div>
      </div>
      <div className="p-5 sm:p-6 border-t sm:border-t-0" style={{ borderColor: "var(--ib-line)", background: "#FAFBFD" }}>
        <div className="text-[12px] font-semibold mb-3.5" style={{ color: "var(--ib-muted)" }}>
          Questions 14–18
        </div>
        <div className="flex flex-col gap-3.5">
          {[78, 64, 86, 54].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="w-[15px] h-[15px] rounded-full shrink-0"
                style={{
                  border: `1.5px solid ${i === 1 ? "var(--ib-brand)" : "#9AA8BC"}`,
                  background: i === 1 ? "var(--ib-brand)" : "transparent",
                  boxShadow: i === 1 ? "inset 0 0 0 2.5px #fff" : "none",
                }}
              />
              <span className="h-[8px] rounded-full" style={{ width: `${w}%`, background: "#E3E9F1" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WritingPane() {
  return (
    <div className="p-5 sm:p-6">
      <div className="text-[12px] font-semibold mb-2" style={{ color: "var(--ib-muted)" }}>
        Writing Task 2
      </div>
      <p className="text-[13.5px] leading-[1.65] font-medium" style={{ color: "var(--ib-ink)" }}>
        Some people think all students should learn to type before they learn to write by hand. Discuss both views and give your opinion.
      </p>
      <div
        className="ib-card-motion mt-4 rounded-[6px] p-4 text-[13.5px] leading-[1.75] min-h-[150px]"
        style={{ border: "1.5px solid var(--ib-brand)", background: "#fff", color: "var(--ib-body)" }}
      >
        People who support this idea argue that typing is a skill every graduate needs. On the other hand, handwriting still helps young children remember what they learn
        <span className="inline-block w-px h-[16px] align-middle ml-0.5" style={{ background: "var(--ib-ink)" }} />
      </div>
    </div>
  );
}

const PANES: Record<SkillKey, { bar: string; node: ReactNode }> = {
  listening: { bar: "Mock Test 07 · Listening", node: <ListeningPane /> },
  reading: { bar: "Mock Test 07 · Reading", node: <ReadingPane /> },
  writing: { bar: "Mock Test 07 · Writing", node: <WritingPane /> },
};

export function SkillTabs() {
  const [current, setCurrent] = useState<SkillKey>("listening");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = idx;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % SKILLS.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + SKILLS.length) % SKILLS.length;
    else return;
    e.preventDefault();
    const key = SKILLS[next].key;
    setCurrent(key);
    refs.current[key]?.focus();
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-8 lg:gap-14 mt-12 items-start">
      <div role="tablist" aria-label="মক টেস্টের তিনটা স্কিল" aria-orientation="vertical" className="flex flex-col">
        {SKILLS.map(({ key, label, Icon, line, benefit }, idx) => {
          const on = key === current;
          return (
            <button
              key={key}
              ref={(el) => {
                refs.current[key] = el;
              }}
              id={`skill-tab-${key}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`skill-panel-${key}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setCurrent(key)}
              onKeyDown={(e) => move(e, idx)}
              className="text-left py-5 pl-5 pr-2 transition-colors"
              style={{
                borderLeft: `3px solid ${on ? "var(--ib-mint)" : "rgba(255,255,255,0.14)"}`,
              }}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-[20px] h-[20px] shrink-0" style={{ color: on ? "var(--ib-mint)" : "#7F91AB" }} strokeWidth={1.9} />
                <span className="font-display text-[19px] font-semibold" style={{ color: on ? "#fff" : "#9FB0C7" }}>
                  {label}
                </span>
              </span>
              <span className="block mt-2 text-[14.5px] leading-[1.75]" style={{ color: on ? "#C9D5E5" : "#7F91AB" }}>
                {line}
              </span>
              {on && (
                <span className="block mt-1.5 text-[13.5px] leading-[1.75]" style={{ color: "var(--ib-mint)" }}>
                  {benefit}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`skill-panel-${current}`}
        aria-labelledby={`skill-tab-${current}`}
        className="ib-card-motion rounded-[6px] overflow-hidden bg-white min-h-[340px]"
        style={{ boxShadow: "0 44px 90px -44px rgba(0,0,0,0.7)" }}
      >
        <ScreenBar title={PANES[current].bar} />
        <div aria-hidden>{PANES[current].node}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── sticky offer bar ───────────────────────── */

/**
 * Appears once the hero has scrolled away and hides again when the closing offer is on screen,
 * so it is never stacked on top of another CTA.
 */
export function StickyOffer({
  href,
  label,
  priceLabel,
  price,
  originalPrice,
  arrow = true,
}: {
  href: string;
  label: string;
  priceLabel?: string;
  price?: string;
  originalPrice?: string;
  arrow?: boolean;
}) {
  const [heroIn, setHeroIn] = useState(true);
  const [joinIn, setJoinIn] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("ielts-hero");
    const join = document.getElementById("waitlist");
    if (!hero) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) setHeroIn(e.isIntersecting);
          if (e.target === join) setJoinIn(e.isIntersecting);
        }
      },
      { threshold: 0.12 },
    );
    io.observe(hero);
    if (join) io.observe(join);
    return () => io.disconnect();
  }, []);

  const visible = !heroIn && !joinIn;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 sm:px-4 pb-3 pointer-events-none"
      style={{
        transform: visible ? "translateY(0)" : "translateY(24px)",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transition: "transform .3s ease, opacity .3s ease, visibility .3s",
      }}
    >
      <div
        className="pointer-events-auto mx-auto max-w-[620px] rounded-full pl-5 pr-2 py-2 flex items-center gap-4"
        style={{
          background: "rgba(10,20,40,0.96)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 18px 40px -12px rgba(10,20,40,0.55)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {price && (
          <div className="shrink-0 leading-tight">
            {priceLabel && (
              <div className="text-[11.5px]" style={{ color: "#9FB0C7" }}>
                {priceLabel}
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[18px] font-bold text-white tabular-nums">{price}</span>
              {originalPrice && (
                <span
                  className="text-[12px] font-medium line-through tabular-nums"
                  style={{ color: "#9FB0C7", opacity: 0.7 }}
                >
                  {originalPrice}
                </span>
              )}
            </div>
          </div>
        )}
        <Link
          href={href}
          className="ib-cta flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-full px-5 py-[11px] text-[14.5px] font-bold text-center leading-[1.35]"
          style={{ background: "var(--ib-mint)", color: "#052117" }}
        >
          <span>{label}</span>
          {arrow && <ArrowRight className="w-[15px] h-[15px] shrink-0" strokeWidth={2.4} />}
        </Link>
      </div>
    </div>
  );
}

/* ───────────────────────── waitlist launch countdown ───────────────────────── */

/** Counts down to a fixed launch date on the client. */
export function Countdown({
  target,
  labels = ["দিন", "ঘণ্টা", "মিনিট", "সেকেন্ড"],
}: {
  target: string;
  labels?: [string, string, string, string];
}) {
  const toUnits = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };
  };

  const [remaining, setRemaining] = useState<ReturnType<typeof toUnits>>(() => toUnits(new Date(target).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(toUnits(new Date(target).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const done = remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0;

  const cells = [
    { value: remaining.days, label: labels[0] },
    { value: remaining.hours, label: labels[1] },
    { value: remaining.minutes, label: labels[2] },
    { value: remaining.seconds, label: labels[3] },
  ];

  if (done) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold"
        style={{ background: "var(--ib-mint)", color: "#052117" }}
      >
        <span className="ib-dot w-[7px] h-[7px] rounded-full" style={{ background: "#052117" }} />
        কোর্স লাইভ — এখনই ভর্তি হন
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-label="কোর্স লঞ্চ পর্যন্ত বাকি সময়"
      className="ib-card-motion inline-flex flex-wrap items-center gap-2 rounded-[6px] px-3 py-2.5"
      style={{ background: "#fff", border: "1px solid var(--ib-line)", boxShadow: "0 10px 24px -14px rgba(12,26,51,0.25)" }}
    >
      <span className="flex items-center gap-2 text-[12.5px] font-bold mr-1" style={{ color: "var(--ib-brand-2)" }}>
        <span className="ib-dot w-[7px] h-[7px] rounded-full" style={{ background: "var(--ib-brand)" }} />
        লঞ্চ হতে বাকি
      </span>
      {cells.map((c, i) => (
        <span key={c.label} className="flex items-center gap-2">
          <span className="flex flex-col items-center rounded-[6px] px-2.5 py-1.5 min-w-[46px]" style={{ background: "var(--ib-fog)" }}>
            <span
              className="font-display text-[17px] font-bold leading-none tabular-nums"
              style={{ color: "var(--ib-ink)" }}
            >
              {String(c.value).padStart(2, "0")}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold leading-none" style={{ color: "var(--ib-muted)" }}>
              {c.label}
            </span>
          </span>
          {i < cells.length - 1 && (
            <span className="font-display text-[14px] font-bold tabular-nums" style={{ color: "var(--ib-muted)" }}>
              :
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────── scroll reveal ─────────────────────────
 * Fade + rise sections into view once, on first scroll into the viewport.
 * If the user prefers reduced motion, content is shown instantly.
 */

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(26px)",
        transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s, transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
