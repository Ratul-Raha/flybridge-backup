"use client";

import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Compass,
  GraduationCap,
  Languages,
  Plus,
  Target,
} from "lucide-react";

const tracks = [
  {
    label: "Study abroad",
    desc: "Visa prep, university applications and documentation for the US, Canada and beyond.",
    icon: GraduationCap,
    bg: "var(--blue-bg)",
    fg: "#2F5FE0",
  },
  {
    label: "Work abroad",
    desc: "Permits, eligibility and job-search groundwork for international careers.",
    icon: Briefcase,
    bg: "var(--mint-bg)",
    fg: "#188A5D",
  },
  {
    label: "English",
    desc: "Practical, confident communication for everyday life, interviews and exams.",
    icon: Languages,
    bg: "var(--peach-bg)",
    fg: "#DB8A2E",
  },
  {
    label: "Career prep",
    desc: "Interview frameworks, mock questions and professional delivery.",
    icon: Target,
    bg: "var(--lav-bg)",
    fg: "#6B4CE0",
  },
];

export function TrackAccordion() {
  const [openTrack, setOpenTrack] = useState<number | null>(0);

  return (
    <div
      className="relative w-full max-w-[400px] lg:w-[340px] shrink-0 rounded-[24px] border bg-white"
      style={{
        borderColor: "var(--line)",
        boxShadow: "0 30px 60px -30px rgba(18,32,67,0.28)",
      }}
    >
      <div
        className="flex items-center gap-3 px-6 pt-6 pb-5 border-b rounded-t-[24px]"
        style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(226,246,238,0.5), transparent)" }}
      >
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--brand-soft)" }}
        >
          <Compass size={18} style={{ color: "var(--brand-2)" }} />
        </span>
        <div>
          <div className="font-display font-semibold text-[15px] tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            Learning tracks
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mt-[2px]" style={{ color: "var(--body)" }}>
            {tracks.length} pathways
          </div>
        </div>
      </div>

      <div className="px-2.5 py-3 flex flex-col gap-1">
        {tracks.map((t, i) => {
          const open = openTrack === i;
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setOpenTrack(open ? null : i)}
              aria-expanded={open}
              className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors duration-200"
              style={open ? { background: "var(--brand-soft)" } : {}}
            >
              <span
                className="w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: t.bg }}
              >
                <Icon size={16} style={{ color: t.fg }} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {t.label}
                </span>
                <span
                  className={`block overflow-hidden text-[11.5px] leading-[1.55] transition-all duration-300 ${
                    open ? "max-h-[80px] mt-[4px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                  style={{ color: "var(--body)" }}
                >
                  {t.desc}
                </span>
              </span>
              <span
                className="w-[20px] h-[20px] rounded-full border flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  borderColor: open ? "var(--brand)" : "var(--line)",
                  background: open ? "var(--brand)" : "transparent",
                }}
              >
                <Plus
                  size={11}
                  style={{
                    color: open ? "#fff" : "var(--body)",
                    transform: open ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <a
        href="#programs"
        className="flex items-center justify-between group px-6 py-4 border-t rounded-b-[24px] transition-colors"
        style={{ borderColor: "var(--line)" }}
      >
        <span className="text-[12.5px] font-medium" style={{ color: "var(--brand-2)" }}>
          Explore all programs
        </span>
        <ArrowRight
          size={13}
          style={{ color: "var(--brand-2)", transition: "transform 0.2s ease" }}
          className="group-hover:translate-x-[3px]"
        />
      </a>
    </div>
  );
}