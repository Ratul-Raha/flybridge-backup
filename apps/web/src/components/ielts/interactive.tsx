"use client";

/**
 * Interactive pieces for the IELTS landing page.
 * Everything here is a demo of the real product experience — no scoring, no fake results.
 */

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Headphones, Pencil } from "lucide-react";

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
      className="rounded-[12px] overflow-hidden bg-white"
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
      <div className="flex items-center gap-4 rounded-[10px] px-4 py-3.5" style={{ background: "#F3F6FA", border: "1px solid var(--ib-line)" }}>
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
      <div className="mt-3 rounded-[10px] overflow-hidden" style={{ border: "1px solid var(--ib-line)" }}>
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
        className="mt-4 rounded-[10px] p-4 text-[13.5px] leading-[1.75] min-h-[150px]"
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

  const move = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
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
        className="rounded-[12px] overflow-hidden bg-white min-h-[340px]"
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
  arrow = true,
}: {
  href: string;
  label: string;
  priceLabel?: string;
  price?: string;
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
            <div className="text-[18px] font-bold text-white tabular-nums">{price}</div>
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
      className="inline-flex flex-wrap items-center gap-2 rounded-[12px] px-3 py-2.5"
      style={{ background: "#fff", border: "1px solid var(--ib-line)", boxShadow: "0 10px 24px -14px rgba(12,26,51,0.25)" }}
    >
      <span className="flex items-center gap-2 text-[12.5px] font-bold mr-1" style={{ color: "var(--ib-brand-2)" }}>
        <span className="ib-dot w-[7px] h-[7px] rounded-full" style={{ background: "var(--ib-brand)" }} />
        লঞ্চ হতে বাকি
      </span>
      {cells.map((c, i) => (
        <span key={c.label} className="flex items-center gap-2">
          <span className="flex flex-col items-center rounded-[9px] px-2.5 py-1.5 min-w-[46px]" style={{ background: "var(--ib-fog)" }}>
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
