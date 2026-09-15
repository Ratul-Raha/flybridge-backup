"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Award, ChevronRight } from "lucide-react";
import { useMarqueeSpeed } from "@/hooks/use-marquee-speed";

type TickerScholarship = {
  id: string;
  institution: string;
  title: string;
  country: string;
  countryCode: string;
  amount: string;
  deadline: string;
};

export function ScholarshipTicker({ href = "/dashboard/scholarships" }: { href?: string }) {
  const [items, setItems] = useState<TickerScholarship[]>([]);
  const [ready, setReady] = useState(false);
  const { trackRef, duration } = useMarqueeSpeed(22);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/public/scholarships?limit=6", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data.scholarships) ? data.scholarships : []);
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready) return null;
  if (items.length === 0) return null;

  const entries = items.map((s) => {
    const label = s.title || s.institution;
    const detail = [s.institution, s.amount, s.country, s.deadline]
      .filter((v) => Boolean(v) && v !== label)
      .join(" · ");
    return { id: s.id, label, detail };
  });

  return (
    <div
      className="fb-marquee flex items-center w-full overflow-hidden min-w-0 rounded-[14px]"
      style={{
        background: "linear-gradient(90deg, #0B5E46, #0E7A55 50%, #14B57E)",
        maskImage: "linear-gradient(90deg, transparent, black 3%, black 97%, transparent)",
      }}
    >
      <div ref={trackRef} className="fb-marquee-track flex items-center gap-8 pr-8 shrink-0" style={duration ? { animationDuration: `${duration}s` } : undefined}>
        {[...entries, ...entries].map((e, i) => (
          <Link
            key={`${e.id}-${i}`}
            href={href}
            className="flex items-center gap-2.5 py-2.5 whitespace-nowrap text-white/95 transition-opacity duration-200 hover:opacity-80"
          >
            <Award size={14} className="shrink-0 opacity-90" />
            <span className="text-[12.5px] font-semibold">{e.label}</span>
            {e.detail && (
              <span className="text-[12px] opacity-75 hidden sm:inline">{e.detail}</span>
            )}
            <ChevronRight size={13} className="shrink-0 opacity-80" />
          </Link>
        ))}
      </div>
    </div>
  );
}