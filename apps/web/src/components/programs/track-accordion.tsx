"use client";

import { useState } from "react";

const tracks = [
  { label: "Study abroad", desc: "Visa prep, university applications and documentation for the US, Canada and beyond." },
  { label: "Work abroad", desc: "Permits, eligibility and job-search groundwork for international careers." },
  { label: "English", desc: "Practical, confident communication for everyday life, interviews and exams." },
  { label: "Career prep", desc: "Interview frameworks, mock questions and professional delivery." },
];

export function TrackAccordion() {
  const [openTrack, setOpenTrack] = useState<number | null>(null);

  return (
    <div className="lg:w-[300px] shrink-0">
      <div className="flex flex-col">
        {tracks.map((t, i) => {
          const open = openTrack === i;
          return (
            <div
              key={t.label}
              className="border-t last:border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <button
                type="button"
                onClick={() => setOpenTrack(open ? null : i)}
                aria-expanded={open}
                className="group flex w-full items-center justify-between gap-6 py-4 text-left transition-colors"
              >
                <span
                  className="text-[14.5px] font-medium transition-colors"
                  style={{ color: "var(--ink)" }}
                >
                  {t.label}
                </span>
                <span
                  className={`w-[7px] h-[7px] rounded-full shrink-0 opacity-30 group-hover:opacity-100 transition-opacity ${
                    open ? "opacity-100" : ""
                  }`}
                  style={{ background: "var(--brand-2)" }}
                />
              </button>
              {open && (
                <p
                  className="pb-4 pr-6 text-[13px] leading-[1.65]"
                  style={{ color: "var(--body)" }}
                >
                  {t.desc}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
