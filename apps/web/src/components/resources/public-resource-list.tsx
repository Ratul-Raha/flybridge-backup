"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Download,
  MessageSquare,
  PlayCircle,
  Search,
  Share2,
  TrendingUp,
} from "lucide-react";
import { getCategoryColor } from "@/lib/resource-colors";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";
import { ResourceVideoPlayer, VideoViews } from "@/components/resources/resource-video-player";

const FILE_TYPES = [
  { value: "video", label: "Videos" },
  { value: "pdf", label: "PDFs" },
  { value: "image", label: "Images" },
  { value: "audio", label: "Audio" },
  { value: "link", label: "Links" },
  { value: "other", label: "Files" },
] as const;

type FileTypeFilter = (typeof FILE_TYPES)[number]["value"] | "all";

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

function VideoResourceCard({ r }: { r: ResourceCardData }) {
  const [copied, setCopied] = useState(false);
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
    <div
      className="group flex h-full flex-col rounded-lg border bg-white p-5 transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_22px_44px_-24px_rgba(18,32,67,0.25)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 4px 18px -12px rgba(18,32,67,0.10)" }}
    >
      {/* Portrait player */}
      <div className="-mx-5 -mt-5 overflow-hidden rounded-t-lg">
        <ResourceVideoPlayer resource={r} />
      </div>

      {/* Meta row */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${accent}12`, color: accent }}
          >
            <PlayCircle size={14} strokeWidth={2} />
          </span>
          <span className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
            {r.category}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2">
          {(r.commentCount ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
              style={{ background: "rgba(15,169,104,0.10)", color: "#0FA968" }}
            >
              <MessageSquare size={9} strokeWidth={2.5} /> {r.commentCount}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
            style={{ background: "rgba(107,76,224,0.10)", color: "#6B4CE0" }}
          >
            <VideoViews count={r.viewCount ?? 0} /> views
          </span>
        </span>
      </div>

      {/* Title */}
      <Link href={`/resources/${r.id}`} target="_blank" rel="noreferrer">
        <h3 className="mt-4 line-clamp-2 font-display text-[16px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {r.title}
        </h3>
      </Link>

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
        </span>
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
      </div>
    </div>
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
  const [fileType, setFileType] = useState<FileTypeFilter>("video");
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

  const formatCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resources) map.set(r.fileType, (map.get(r.fileType) ?? 0) + 1);
    return map;
  }, [resources]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .filter((r) => (fileType === "all" ? true : r.fileType === fileType))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const d = (b.downloadCount ?? 0) - (a.downloadCount ?? 0);
        if (d !== 0) return d;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
  }, [resources, fileType, query]);

  const topCount = useMemo(() => resources.reduce((m, r) => Math.max(m, r.downloadCount ?? 0), 0), [resources]);

  const topDownloaded =
    !query.trim() && topCount > 0
      ? visible.find((r) => (r.downloadCount ?? 0) === topCount) ?? null
      : null;

  const selectFileType = (f: FileTypeFilter) => {
    setFileType(f);
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const activeFileTypeLabel = FILE_TYPES.find((t) => t.value === fileType)?.label;

  const gridTitle =
    fileType !== "all" ? activeFileTypeLabel ?? "Resources" : "Latest resources";
  const gridSub =
    fileType !== "all"
      ? `Browse the latest ${(activeFileTypeLabel ?? "resources").toLowerCase()} — added as we publish.`
      : "Fresh guides, checklists and templates — added as we publish.";

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="pt-[clamp(120px,15vh,150px)] pb-[clamp(32px,4vw,48px)]">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-10 px-[clamp(20px,4.5vw,56px)] lg:grid-cols-2">
          {/* Description */}
          <p className="max-w-[560px] font-display text-[clamp(22px,2.6vw,32px)] font-semibold leading-[1.3] tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            All premium resources you need
          </p>

          {/* Search + format filter */}
          <div>
            <div className="relative">
              <Search size={18} className="absolute left-[20px] top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search “cover letter”, “IELTS”, “visa checklist”…"
                className="w-full rounded-full border bg-white pl-12 pr-5 py-[16px] text-[15px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                style={{ borderColor: "var(--line)", color: "var(--ink)", boxShadow: "0 18px 44px -26px rgba(18,32,67,0.35)" }}
              />
            </div>

            {/* Format filter */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--body)" }}>
                Format
              </span>
              <button
                type="button"
                onClick={() => selectFileType("all")}
                className="shrink-0 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition-colors duration-200 hover:border-brand-2/50 hover:text-[var(--brand-2)]"
                style={{
                  background: fileType === "all" ? "var(--brand)" : "transparent",
                  borderColor: fileType === "all" ? "var(--brand)" : "var(--line)",
                  color: fileType === "all" ? "#fff" : "var(--ink)",
                }}
              >
                All formats{loading ? "" : ` · ${resources.length}`}
              </button>

              {FILE_TYPES.map((t) => {
                const count = formatCounts.get(t.value) ?? 0;
                if (count === 0 && fileType !== t.value) return null;
                const active = fileType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectFileType(t.value)}
                    className="shrink-0 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition-colors duration-200 hover:border-brand-2/50 hover:text-[var(--brand-2)]"
                    style={{
                      background: active ? "var(--brand)" : "transparent",
                      borderColor: active ? "var(--brand)" : "var(--line)",
                      color: active ? "#fff" : "var(--ink)",
                    }}
                  >
                    {t.label} <span style={{ opacity: 0.6 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Library ===== */}
      <section className="pb-[110px]">
        <div ref={gridRef} className="mx-auto scroll-mt-[110px] w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
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
                      ? `${visible.length} ${visible.length === 1 ? "match" : "matches"} in the library.`
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
                  : "Try a different search, format or topic."}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((r) =>
                r.fileType === "video" ? (
                  <VideoResourceCard key={r.id} r={r} />
                ) : (
                  <ResourceCard key={r.id} r={r} topCount={topCount} />
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}