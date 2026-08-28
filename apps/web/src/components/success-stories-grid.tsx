"use client";

import { useCallback, useEffect, useState } from "react";
import { countryByCode } from "@/lib/countries";

type StoryDto = {
  id: string;
  name: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  visaType: "student" | "work";
  universityName: string;
  cityName: string;
  story: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
};

type Story = {
  src: string;
  alt: string;
  name: string;
  program: string;
  country: string;
  flagCode: string;
  quote: string;
  badge: string;
};

function mapStory(s: StoryDto): Story {
  const country = countryByCode(s.destinationCode);
  const program = s.visaType === "student" ? s.universityName : s.cityName;
  return {
    src: s.imageUrl,
    alt: `${s.name} in ${s.destination || "their destination"}`,
    name: s.name,
    program,
    country: s.destination,
    flagCode: country?.code ?? "",
    quote: s.story,
    badge: s.visaType === "student" ? "Visa Approved" : "Work Permit Approved",
  };
}

export function SuccessStoriesGrid() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStories = useCallback(async () => {
    try {
      const res = await fetch("/api/success-stories", { cache: "no-store" });
      const data = await res.json();
      const list: StoryDto[] = Array.isArray(data.stories) ? data.stories : [];
      setStories(list.map(mapStory));
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  if (loading) {
    return (
      <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
        Loading stories…
      </p>
    );
  }

  if (stories.length === 0) {
    return (
      <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
        No success stories yet.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((s) => (
        <div
          key={s.src}
          className="aspect-[4/5] rounded-lg overflow-hidden bg-white flex flex-col"
          style={{ border: "1px solid var(--line)" }}
        >
          <div className="relative flex-1 overflow-hidden">
            <img src={s.src} alt={s.alt} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-24 w-28 rounded-tr-3xl select-none pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stamp.png"
              alt=""
              aria-hidden="true"
              className="absolute left-3 top-2.5 w-[15%] -rotate-12 select-none pointer-events-none"
            />
          </div>
          <div className="px-4 pb-4 pt-3 flex flex-col" style={{ borderTop: "1px solid var(--line)" }}>
            <div className="font-display font-semibold text-[15px] leading-tight tracking-[-0.01em] truncate" style={{ color: "var(--ink)" }}>
              {s.name}
            </div>
            {s.program && (
              <div className="text-[12px] mt-0.5 truncate" style={{ color: "var(--body)" }}>{s.program}</div>
            )}
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium mt-1.5" style={{ color: "var(--brand-2)" }}>
              <span className={`fi fi-${s.flagCode.toLowerCase()}`} />
              <span>{s.country}</span>
            </div>
            {s.quote && (
              <p className="text-[12.5px] leading-relaxed mt-2 line-clamp-2" style={{ color: "var(--ink)" }}>
                &ldquo;{s.quote}&rdquo;
              </p>
            )}
            <div
              className="inline-flex items-center gap-1.5 mt-auto pt-3 px-2.5 py-1 rounded-full font-mono text-[9px] font-medium tracking-[0.3px] uppercase"
              style={{ background: "var(--brand-soft)", color: "var(--brand-2)", alignSelf: "flex-start" }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {s.badge}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
