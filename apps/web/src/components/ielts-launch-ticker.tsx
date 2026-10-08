"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const DEAL_END = "2026-10-30T23:59:59+06:00";
const DEAL_HREF = "/ielts-band-score-machine";

function toUnits(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function useCountdown(target: string) {
  const [remaining, setRemaining] = useState(() => toUnits(new Date(target).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(toUnits(new Date(target).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const done =
    remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0;

  return { remaining, done };
}

export function IeltsLaunchTicker() {
  const { remaining, done } = useCountdown(DEAL_END);

  const cells = [
    { value: remaining.days, label: "d" },
    { value: remaining.hours, label: "h" },
    { value: remaining.minutes, label: "m" },
    { value: remaining.seconds, label: "s" },
  ];

  return (
    <div
      className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-[14px] px-4 py-3 sm:px-6"
      style={{
        background: "linear-gradient(90deg, #0B1F3A, #0C1A33 50%, #122B4A)",
        border: "1px solid rgba(124,240,189,0.22)",
        boxShadow: "0 18px 40px -24px rgba(11,31,58,0.65)",
      }}
    >
      {/* Announcement + deal price */}
      <div className="flex items-center gap-2.5 whitespace-nowrap">
        <span className="flex items-center gap-1.5 rounded-full bg-[#0F9D58] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white">
          <Sparkles className="h-3 w-3" strokeWidth={2.6} />
          Launch Deal
        </span>
        <span className="text-[13.5px] font-semibold text-white/95">
          IELTS Band Score Machine
        </span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-[16px] font-extrabold leading-none tabular-nums text-[#7CF0BD]">৳2,999</span>
        <s className="text-[12.5px] font-medium text-white/45">৳5,999</s>
        <span className="rounded-md bg-[#7CF0BD]/15 px-2 py-0.5 text-[10.5px] font-bold text-[#7CF0BD]">
          Save BDT 3,000
        </span>
      </div>

      {/* Countdown */}
      {done ? (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#7CF0BD]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7CF0BD]" />
          Deal ends soon
        </span>
      ) : (
        <div className="flex items-center gap-1.5 whitespace-nowrap" role="timer" aria-label="Launch deal countdown">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55">
            Ends in
          </span>
          {cells.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1.5">
              <span
                className="inline-flex min-w-[30px] flex-col items-center rounded-[8px] bg-white/10 px-1.5 py-1"
              >
                <span className="text-[14px] font-bold leading-none tabular-nums text-white">
                  {String(c.value).padStart(2, "0")}
                </span>
                <span className="mt-0.5 text-[8.5px] font-semibold leading-none text-white/55">
                  {c.label}
                </span>
              </span>
              {i < cells.length - 1 && (
                <span className="text-[12px] font-bold text-white/40">:</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={DEAL_HREF}
        className="group inline-flex items-center gap-1.5 rounded-full bg-[#7CF0BD] px-4 py-1.5 text-[12.5px] font-bold text-[#052117] transition-transform hover:scale-[1.03]"
      >
        Enroll Now
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
