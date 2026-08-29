"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { programs } from "@/lib/programs";
import { BengaliText } from "../bengali-text";

type FetchedCourse = {
  slug: string;
  title: string;
  badge: string;
  subtitle: string;
  price: number;
  currency: string;
  image: string | null;
  upcoming: boolean;
};

type MenuItem = {
  slug: string;
  title: string;
  badge: string;
  price: number | string | null;
  currency?: string;
  upcoming: boolean;
  image: string | null;
  tileBg: string;
  tileFg: string;
};

const DbTile = { bg: "var(--brand-soft)", fg: "var(--brand)" };

export function ProgramsMegaMenu({ onClose }: { onClose: () => void }) {
  const [courses, setCourses] = useState<FetchedCourse[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/courses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (active) setCourses(Array.isArray(d.courses) ? d.courses : []);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo<MenuItem[]>(() => {
    const db = courses ?? [];
    const hasDb = db.length > 0;
    const staticItems = hasDb ? programs.filter((p) => !p.hasDb) : programs;

    const fromStatic: MenuItem[] = staticItems.map((p) => ({
      slug: p.slug,
      title: p.title,
      badge: p.badge,
      price: p.price ?? null,
      upcoming: !!p.upcoming,
      image: p.image ?? null,
      tileBg: p.bg,
      tileFg: p.badgeColor,
    }));

    const fromDb: MenuItem[] = db.map((c) => ({
      slug: c.slug,
      title: c.title,
      badge: c.badge || "COURSE",
      price: c.price,
      currency: c.currency || "USD",
      upcoming: !!c.upcoming,
      image: c.image,
      tileBg: DbTile.bg,
      tileFg: DbTile.fg,
    }));

    return [...fromStatic, ...fromDb];
  }, [courses]);

  const total = items.length;

  const renderPrice = (item: MenuItem) => {
    if (item.upcoming) {
      return (
        <span
          className="font-mono text-[9.5px] font-semibold tracking-[0.14em] uppercase rounded-full px-2.5 py-[4px]"
          style={{ background: "var(--brand)", color: "#fff" }}
        >
          Coming soon
        </span>
      );
    }
    if (item.price != null) {
      const label =
        typeof item.price === "number"
          ? `${item.currency} ${item.price.toLocaleString()}`
          : item.price;
      return (
        <span
          className="font-display font-semibold whitespace-nowrap"
          style={{ fontSize: 14, color: "var(--ink)" }}
        >
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full border border-line transition-colors duration-200 group-hover:border-brand group-hover:bg-brand-soft">
        <ArrowUpRight size={12} style={{ color: "var(--brand-2)" }} />
      </span>
    );
  };

  return (
    <div
      className="absolute left-1/2 top-full -translate-x-1/2 w-[min(94vw,820px)] rounded-[20px] border bg-white overflow-hidden"
      style={{
        borderColor: "var(--line)",
        boxShadow: "0 40px 80px -32px rgba(18,32,67,0.32)",
        animation: "programs-mega-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
<style>{`
        @keyframes programs-mega-in {
          from { opacity: 0; transform: translate(-50%, 12px) scale(0.98); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
      <div
        className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <div className="font-display font-semibold text-[15px]" style={{ color: "var(--ink)" }}>
            Programs &amp; courses
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase mt-[2px]" style={{ color: "var(--body)" }}>
            {courses === null ? "Loading…" : `${total} programs`}
          </div>
        </div>
        <a
          href="/programs"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium shrink-0"
          style={{ color: "var(--brand-2)" }}
        >
          View all
          <ArrowRight size={12} />
        </a>
      </div>

      <div className="p-3 grid sm:grid-cols-2 gap-1 max-h-[420px] overflow-y-auto">
        {failed ? (
          <div className="sm:col-span-2 px-4 py-8 text-center text-[12.5px]" style={{ color: "var(--body)" }}>
            Couldn&apos;t load programs.{" "}
            <a href="/programs" className="font-medium" style={{ color: "var(--brand-2)" }}>
              Browse them here
            </a>
          </div>
        ) : items.length === 0 ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span className="w-11 h-11 rounded-xl shrink-0" style={{ background: "var(--line)" }} />
              <span className="flex-1 flex flex-col gap-1.5">
                <span className="h-[10px] rounded-full w-[70%]" style={{ background: "var(--line)" }} />
                <span className="h-[8px] rounded-full w-[40%]" style={{ background: "var(--line)" }} />
              </span>
            </div>
          ))
        ) : (
          items.map((item) => (
            <a
              key={item.slug}
              href={`/programs/${item.slug}`}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-brand-soft/60"
            >
              <span
                className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: item.tileBg }}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase"
                    style={{ color: item.tileFg }}
                  >
                    {item.badge
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-[13.5px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                  <BengaliText>{item.title}</BengaliText>
                </span>
                <span
                  className="block truncate font-mono text-[10px] uppercase tracking-[0.12em] mt-[3px]"
                  style={{ color: "var(--body)" }}
                >
                  {item.badge}
                </span>
              </span>
              <span className="shrink-0">{renderPrice(item)}</span>
            </a>
          ))
        )}
      </div>

      <a
        href="/programs"
        onClick={onClose}
        className="flex items-center justify-center gap-2 border-t px-6 py-3.5 text-[13px] font-medium transition-colors duration-200 hover:bg-brand-soft/40"
        style={{ borderColor: "var(--line)", color: "var(--brand-2)" }}
      >
        Explore the full program catalog
        <ArrowRight size={13} />
      </a>
    </div>
  );
}