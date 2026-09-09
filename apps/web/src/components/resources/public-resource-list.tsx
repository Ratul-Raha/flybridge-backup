"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Download,
  Flame,
  Plane,
  Search,
  Share2,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import { getCategoryColor } from "@/lib/resource-colors";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";

const QUICK_SEARCHES = ["Cover letter", "IELTS", "Visa checklist", "Interview"];

function TooltipCard({ r }: { r: ResourceCardData }) {
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-[var(--bg-soft)]">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
          {r.title}
        </div>
        <div className="mt-[1px] flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--body)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: getCategoryColor(r.category) }} />
          {r.category}
        </div>
      </div>
      <span
        className="rounded-full px-2 py-[2px] font-mono text-[8.5px] font-semibold uppercase tracking-[0.1em]"
        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
      >
        {meta.label}
      </span>
      <ArrowUpRight
        className="h-3.5 w-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ color: "var(--body)" }}
      />
    </div>
  );
}

function ToolkitPanel({ recent }: { recent: ResourceCardData[] }) {
  const rows: ResourceCardData[] =
    recent.length > 0
      ? recent.slice(0, 4)
      : ([
          { id: "ph-a", title: "Canada work-permit checklist", description: "", category: "Documents & Templates", fileType: "pdf", fileUrl: "", fileName: null, fileSize: 0, thumbnail: null, releaseDate: new Date().toISOString(), access: "public", price: 0, featured: false },
          { id: "ph-b", title: "Study Visa application walkthrough", description: "", category: "Study Visa", fileType: "pdf", fileUrl: "", fileName: null, fileSize: 0, thumbnail: null, releaseDate: new Date().toISOString(), access: "public", price: 0, featured: false },
          { id: "ph-c", title: "IELTS Band 7 study plan", description: "", category: "IELTS", fileType: "video", fileUrl: "", fileName: null, fileSize: 0, thumbnail: null, releaseDate: new Date().toISOString(), access: "public", price: 0, featured: false },
        ] as ResourceCardData[]);

  return (
    <div className="relative mx-auto w-full max-w-[400px] lg:ml-auto lg:mr-0">
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[48px] opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(15,169,104,0.22), transparent 75%)" }}
      />

      <div
        className="relative overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: "var(--line)", boxShadow: "0 40px 80px -40px rgba(18,32,67,0.45)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
          >
            <Wallet size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
              Free resource toolkit
            </div>
            <div className="font-mono text-[8.5px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
              Updated every week
            </div>
          </div>
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-white"
            style={{ background: "var(--brand)" }}
          >
            <Flame size={9} fill="#fff" /> Open
          </span>
        </div>

        {/* Rows */}
        <div className="px-2.5 py-2">
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={r.access === "public" ? `/resources/${r.id}` : "#"}
              target={r.access === "public" ? "_blank" : undefined}
              rel={r.access === "public" ? "noreferrer" : undefined}
              className="group block"
              aria-hidden={r.access !== "public"}
            >
              <TooltipCard r={r} />
              {i < rows.length - 1 && <div className="mx-2 h-px" style={{ background: "var(--line)" }} />}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2.5" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
          <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
            Instant download · Sign-up required
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--brand-2)" }}>
            <Plane size={10} />
            FlyBridge
          </span>
        </div>
      </div>

      {/* Floating chip */}
      <div
        className="fb-float absolute -left-5 -top-5 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em]"
        style={{ borderColor: "var(--line)", color: "var(--brand-2)", boxShadow: "0 16px 30px -14px rgba(18,32,67,0.4)" }}
      >
        <Zap size={11} fill="var(--brand-2)" style={{ color: "var(--brand-2)" }} />
        {recent.length > 0 ? `${recent.length} downloads` : "Instant access"}
      </div>
    </div>
  );
}

function ResourceCard({ r, topCount }: { r: ResourceCardData; topCount: number }) {
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

  return (
    <Link
      href={`/resources/${r.id}`}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full flex-col rounded-lg border bg-white p-5 transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_22px_44px_-24px_rgba(18,32,67,0.25)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 4px 18px -12px rgba(18,32,67,0.10)" }}
    >
      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${accent}12`, color: accent }}
          >
            <Icon size={14} strokeWidth={2} />
          </span>
          <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
            {r.category}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {(r.downloadCount ?? 0) > 0 && (r.downloadCount ?? 0) === topCount && <TrendingUp size={11} style={{ color: "#E08A17" }} />}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
            style={{ background: "rgba(15,169,104,0.10)", color: "#0FA968" }}
            title="Total downloads"
          >
            <Download size={9} strokeWidth={2.6} />
            {(r.downloadCount ?? 0).toLocaleString()}
          </span>
          <span
            className="rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[0.08em]"
            style={{ background: "var(--bg-soft)", color: "var(--body)" }}
          >
            {meta.label}
          </span>
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-4 line-clamp-2 font-display text-[16px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
        {r.title}
      </h3>

      {/* Description */}
      {r.description && (
        <p className="mt-1.5 line-clamp-1 text-[12.5px]" style={{ color: "var(--body)" }}>
          {r.description}
        </p>
      )}

      {/* Spacer pins footer */}
      <div className="min-h-[14px] flex-1" />

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <span className="truncate font-mono text-[9.5px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
          {formatResourceDate(r.releaseDate)}
          {r.fileSize > 0 && <span> · {formatFileSize(r.fileSize)}</span>}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            title={copied ? "Copied!" : "Share link"}
            aria-label={copied ? "Copied!" : "Share link"}
            onClick={copyLink}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
            style={{ background: copied ? "rgba(15,169,104,0.12)" : "rgba(18,32,67,0.06)" }}
          >
            {copied ? (
              <Check size={13} style={{ color: "#0FA968" }} strokeWidth={2.5} />
            ) : (
              <Share2 size={13} style={{ color: "var(--body)" }} />
            )}
          </button>
          <span
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-white transition-all duration-200 group-hover:translate-x-[2px]"
            style={{ background: accent }}
          >
            <Download size={13} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedBanner({ r }: { r: ResourceCardData }) {
  const accent = getCategoryColor(r.category);
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;

  return (
    <Link
      href={`/resources/${r.id}`}
      target="_blank"
      rel="noreferrer"
      className="group mb-12 grid overflow-hidden rounded-lg border bg-white transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_30px_60px_-24px_rgba(18,32,67,0.3)] sm:grid-cols-[1fr_240px]"
      style={{ borderColor: `${accent}22`, boxShadow: "0 10px 30px -18px rgba(18,32,67,0.18)" }}
    >
      <div className="flex flex-col items-start p-6 sm:p-8">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white"
          style={{ background: "#E08A17" }}
        >
          <TrendingUp size={10} /> Most downloaded
        </span>
        <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          {r.category}
        </span>
        <h2 className="mt-3 font-display text-[clamp(21px,2.4vw,28px)] font-semibold leading-tight tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
          {r.title}
        </h2>
        {r.description && (
          <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed" style={{ color: "var(--body)" }}>
            {r.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold text-white transition-all duration-200 hover:opacity-90 group-hover:translate-y-[-1px]"
            style={{ background: accent }}
          >
            Open resource
            <ArrowUpRight size={15} />
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-4 py-3 text-[12.5px] font-medium" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
            {meta.label}
            {r.fileSize > 0 && <span>· {formatFileSize(r.fileSize)}</span>}
            {formatResourceDate(r.releaseDate) && <span>· {formatResourceDate(r.releaseDate)}</span>}
          </span>
        </div>
      </div>

      <div
        className="relative flex min-h-[180px] items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${accent}, ${accent}CC)` }}
      >
        <span className="z-10 flex h-[84px] w-[84px] items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm" style={{ color: "#fff", boxShadow: "0 20px 40px -16px rgba(0,0,0,0.25)" }}>
          <Icon size={36} strokeWidth={1.7} />
        </span>
      </div>
    </Link>
  );
}

export function PublicResourceList() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

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

  const stats = useMemo(
    () => ({
      total: resources.length,
      free: resources.filter((r) => (r.price ?? 0) <= 0).length,
      categories: counts.size,
      formats: new Set(resources.map((r) => r.fileType)).size,
    }),
    [resources, counts]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .filter((r) => (category === "All" ? true : r.category === category))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const d = (b.downloadCount ?? 0) - (a.downloadCount ?? 0);
        if (d !== 0) return d;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
  }, [resources, category, query]);

  const topCount = useMemo(() => resources.reduce((m, r) => Math.max(m, r.downloadCount ?? 0), 0), [resources]);

  const topDownloaded =
    category === "All" && !query.trim() && topCount > 0
      ? visible.find((r) => (r.downloadCount ?? 0) === topCount) ?? null
      : null;

  const selectCategory = (c: string) => {
    setCategory(c);
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const gridTitle =
    category === "All" ? "Latest resources" : `${category} resources`;
  const gridSub =
    category === "All"
      ? "Fresh guides, checklists and templates — added as we publish."
      : `Guides, checklists and tools filed under ${category}.`;

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden pt-[clamp(116px,15vh,150px)] pb-[clamp(52px,7vw,84px)]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(rgba(18,32,67,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.04) 1px, transparent 1px), radial-gradient(680px 420px at 12% 6%, rgba(15,169,104,0.1), transparent 60%), radial-gradient(560px 380px at 92% 88%, rgba(107,76,224,0.08), transparent 60%)",
            backgroundSize: "40px 40px, 40px 40px, auto, auto",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-14 px-[clamp(20px,4.5vw,56px)] lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy + search */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--brand-2)", boxShadow: "0 8px 20px -14px rgba(18,32,67,0.25)" }}>
              <span className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--brand)" }} />
              Resource library · Updated weekly
            </span>

            <h1 className="mt-5 font-display font-semibold leading-[1.08] tracking-[-0.02em]" style={{ fontSize: "clamp(32px,4vw,46px)", color: "var(--ink)" }}>
              Tools for every
              <br />
              step before you{" "}
              <span style={{ color: "var(--brand-2)" }}>fly</span>
            </h1>

            <p className="mt-5 max-w-[500px] text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
              Download checklists, guides, templates and videos that turn study-abroad
              plans into action — from first application to arrival.
            </p>

            {/* Search */}
            <div className="relative mt-8 max-w-[520px]">
              <Search size={17} className="absolute left-[18px] top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “cover letter”, “IELTS”, “visa checklist”…"
                className="w-full rounded-full border bg-white pl-11 pr-5 py-[14px] text-[14.5px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                style={{ borderColor: "var(--line)", color: "var(--ink)", boxShadow: "0 18px 44px -26px rgba(18,32,67,0.35)" }}
              />
            </div>

            {/* Quick chips */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
                Popular:
              </span>
              {QUICK_SEARCHES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuery(query === q ? "" : q)}
                  className="rounded-full border px-3 py-[6px] text-[12px] font-medium transition-colors duration-200 hover:border-brand-2/50 hover:text-[var(--brand-2)]"
                  style={{
                    borderColor: query === q ? "var(--brand-2)" : "var(--line)",
                    color: query === q ? "var(--brand-2)" : "var(--body)",
                    background: query === q ? "var(--brand-soft)" : "transparent",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Stats */}
            {!loading && resources.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                {[
                  { value: `${stats.free}+`, label: "Instant downloads" },
                  { value: String(stats.total), label: "Resources live" },
                  { value: String(stats.categories), label: "Topics covered" },
                  { value: String(stats.formats), label: "File formats" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-x-8">
                    <div>
                      <div className="font-display text-[clamp(21px,2.1vw,26px)] font-semibold leading-none tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                        {s.value}
                      </div>
                      <div className="mt-2 text-[12px]" style={{ color: "var(--body)" }}>
                        {s.label}
                      </div>
                    </div>
                    {i < 3 && <span className="hidden h-9 w-px sm:block" style={{ background: "var(--line)" }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visual */}
          <ToolkitPanel recent={resources} />
        </div>
      </section>

      {/* ===== Library ===== */}
      <section className="pb-[110px]">
        <div ref={gridRef} className="mx-auto scroll-mt-[110px] w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => selectCategory("All")}
              className="shrink-0 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition-colors duration-200 hover:border-brand-2/50 hover:text-[var(--brand-2)]"
              style={{
                background: category === "All" ? "var(--brand)" : "transparent",
                borderColor: category === "All" ? "var(--brand)" : "var(--line)",
                color: category === "All" ? "#fff" : "var(--ink)",
              }}
            >
              Everything{loading ? "" : ` · ${resources.length}`}
            </button>

            {RESOURCE_CATEGORIES.map((c) => {
              const count = counts.get(c) ?? 0;
              if (!count) return null;
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectCategory(c)}
                  className="shrink-0 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition-colors duration-200 hover:border-brand-2/50 hover:text-[var(--brand-2)]"
                  style={{
                    background: active ? "var(--brand)" : "transparent",
                    borderColor: active ? "var(--brand)" : "var(--line)",
                    color: active ? "#fff" : "var(--ink)",
                  }}
                >
                  {c} <span style={{ opacity: 0.6 }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Most downloaded banner */}
          {!loading && topDownloaded && <div className="mt-8"><FeaturedBanner r={topDownloaded} /></div>}

          {/* Header + grid */}
          {!loading && resources.length > 0 && (
            <div className="mb-8 mt-2">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-[clamp(24px,2.6vw,32px)] font-medium leading-tight tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                    {query.trim() ? `Results for “${query.trim()}”` : gridTitle}
                  </h2>
                  <p className="mt-[6px] text-[14px]" style={{ color: "var(--body)" }}>
                    {query.trim()
                      ? `${visible.length} ${visible.length === 1 ? "match" : "matches"} ${category !== "All" ? `in ${category}` : "in the library"}.`
                      : gridSub}
                  </p>
                </div>
                <span className="rounded-full px-3.5 py-[7px] font-mono text-[10.5px] font-medium uppercase tracking-[0.25em]" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                  {visible.length} {visible.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>
          )}

          {/* Grid / states */}
          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border bg-white" style={{ borderColor: "var(--line)", height: 220 }} />
              ))}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-lg border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                Couldn&apos;t load resources
              </p>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>
                {error}
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-8 rounded-lg border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                {resources.length === 0 ? "No resources published yet" : "No matches"}
              </p>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>
                {resources.length === 0
                  ? "Check back soon — guides and templates are on the way."
                  : "Try a different search or category."}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((r) => (
                <ResourceCard key={r.id} r={r} topCount={topCount} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}