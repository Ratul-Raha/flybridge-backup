"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Calendar, Check, Search, Share2, Star } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";

const CATEGORY_COLORS: Record<string, string> = {
  "Study Visa": "#2F5FE0",
  "Study Abroad": "#188A5D",
  Scholarships: "#6B4CE0",
  "Career & Jobs": "#DB8A2E",
  Interviews: "#E05D44",
  "English Skills": "#2563EB",
  IELTS: "#0FA968",
  "Documents & Templates": "#8B5CF6",
  Other: "#64748B",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#64748B";
}

function ResourceCard({ r }: { r: ResourceCardData }) {
  const [copied, setCopied] = useState(false);
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  const accent = getCategoryColor(r.category);

  const copyLink = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/resources/${r.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const media = (
    <div
      className="relative h-[180px] flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${accent}08, ${accent}15 50%, ${accent}05)` }}
    >
      {r.thumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r.thumbnail}
            alt={r.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(18,32,67,0.3), rgba(18,32,67,0.04) 50%)" }}
          />
        </>
      ) : (
        <span
          className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl"
          style={{
            background: `${accent}12`,
            color: accent,
            boxShadow: `0 12px 32px -12px ${accent}25`,
          }}
        >
          <Icon size={32} strokeWidth={1.6} />
        </span>
      )}

      {/* Top badges */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between">
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.4px] px-[11px] py-[5px] rounded-full"
          style={{ background: "rgba(255,255,255,0.92)", color: accent }}
        >
          {meta.label.toUpperCase()}
        </span>
        {r.featured ? (
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.3px] px-[10px] py-[5px] rounded-full"
            style={{ background: "rgba(255,255,255,0.92)", color: "#E08A17" }}
          >
            <Star size={9} fill="#E08A17" /> FEATURED
          </span>
        ) : null}
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--line)" }}>
      <span
        className="inline-flex items-center gap-[5px] text-[12.5px] font-medium"
        style={{ color: accent }}
      >
        {r.fileType === "link" ? "Open link" : "Download"}
        <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
          <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <button
        type="button"
        title={copied ? "Copied!" : "Copy resource link"}
        aria-label={copied ? "Copied!" : "Copy resource link"}
        onClick={copyLink}
        className="flex h-[28px] w-[28px] items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
        style={{ background: copied ? "rgba(15,169,104,0.12)" : "rgba(18,32,67,0.06)" }}
      >
        {copied ? (
          <Check size={13} style={{ color: "#0FA968" }} strokeWidth={2.5} />
        ) : (
          <Share2 size={13} style={{ color: "var(--body)" }} />
        )}
      </button>
    </div>
  );

  const body = (
    <>
      {media}
      <div className="flex flex-col flex-1 gap-2.5 p-5">
        <div className="flex items-center gap-2">
          <span
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{ background: accent }}
          />
          <span
            className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase"
            style={{ color: accent }}
          >
            {r.category}
          </span>
        </div>
        <h3
          className="font-display text-[16px] font-semibold leading-[1.35] line-clamp-2"
          style={{ color: "var(--ink)" }}
        >
          {r.title}
        </h3>
        {r.description && (
          <p className="text-[13px] leading-[1.6] line-clamp-2" style={{ color: "var(--body)" }}>
            {r.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-[11.5px] mt-auto pt-2" style={{ color: "var(--body)" }}>
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {formatResourceDate(r.releaseDate)}
          </span>
          {r.fileSize > 0 && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-current opacity-40" />
              <span>{formatFileSize(r.fileSize)}</span>
            </>
          )}
        </div>
        {footer}
      </div>
    </>
  );

  return (
    <Link
      href={`/resources/${r.id}`}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
      style={{
        borderColor: r.featured ? `${accent}30` : "var(--line)",
        boxShadow: `0 6px 24px -14px rgba(18,32,67,0.12)`,
      }}
    >
      {body}
    </Link>
  );
}

export function PublicResourceList() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/resources", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load resources");
        return res.json();
      })
      .then((data) => {
        if (alive) {
          setResources(data.resources ?? []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load resources");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resources) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return map;
  }, [resources]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .filter((r) => (category === "All" ? true : r.category === category))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [resources, category, query]);

  return (
    <div className="flex flex-col gap-8">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("All")}
            className={`rounded-full px-4 py-[8px] text-[12.5px] font-medium transition-colors duration-200 ${
              category === "All" ? "text-white" : ""
            }`}
            style={
              category === "All"
                ? { background: "var(--brand)" }
                : { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" }
            }
          >
            All resources
            <span className="ml-1.5 opacity-70">{resources.length}</span>
          </button>
          {RESOURCE_CATEGORIES.map((c) => {
            const count = counts.get(c) ?? 0;
            if (!count) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-[8px] text-[12.5px] font-medium transition-colors duration-200 ${
                  category === c ? "text-white" : ""
                }`}
                style={
                  category === c
                    ? { background: "var(--brand)" }
                    : { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" }
                }
              >
                {c}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:ml-auto lg:w-[300px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--body)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full text-[13.5px] rounded-full border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white animate-pulse"
              style={{ borderColor: "var(--line)", height: 360 }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="rounded-xl border bg-white px-6 py-16 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Couldn&apos;t load resources
          </p>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
            {error}
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div
          className="rounded-xl border bg-white px-6 py-16 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            {resources.length === 0 ? "No resources published yet" : "No matches"}
          </p>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
            {resources.length === 0
              ? "Check back soon — guides and templates are on the way."
              : "Try a different search or category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((r) => (
            <ResourceCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
