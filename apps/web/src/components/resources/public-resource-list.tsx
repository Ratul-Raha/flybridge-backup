"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  Check,
  Download,
  MessageSquare,
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
import { ResourceVideoDialog } from "@/components/resources/resource-video-dialog";
import { ResourceLoveButton } from "@/components/resources/resource-love-button";

const FILE_TYPES = [
  { value: "video", label: "Videos" },
  { value: "pdf", label: "PDFs" },
  { value: "image", label: "Images" },
  { value: "audio", label: "Audio" },
  { value: "link", label: "Links" },
  { value: "other", label: "Files" },
] as const;

type FileTypeFilter = (typeof FILE_TYPES)[number]["value"] | "all";

const CARD_SHELL =
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_55px_-32px_rgba(18,32,67,0.38)]";

function useCopyLink() {
  const [copied, setCopied] = useState(false);
  const copyLink = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/resources/${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return { copied, copyLink };
}

function ShareButton({ id }: { id: string }) {
  const { copied, copyLink } = useCopyLink();
  return (
    <button
      type="button"
      title={copied ? "Copied!" : "Share link"}
      aria-label={copied ? "Copied!" : "Share link"}
      onClick={(e) => copyLink(e, id)}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
      style={{ background: copied ? "rgba(15,169,104,0.12)" : "rgba(18,32,67,0.06)" }}
    >
      {copied ? (
        <Check size={14} style={{ color: "#0FA968" }} strokeWidth={2.5} />
      ) : (
        <Share2 size={14} style={{ color: "var(--body)" }} />
      )}
    </button>
  );
}

function MetaRow({
  r,
  accent,
  metaLabel,
  trailing,
}: {
  r: ResourceCardData;
  accent: string;
  metaLabel: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex min-w-0 items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
        <span
          className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {r.category}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[0.08em]"
          style={{ background: "var(--bg-soft)", color: "var(--body)" }}
        >
          {metaLabel}
        </span>
      </span>
      {trailing}
    </div>
  );
}

function ResourceCard({ r }: { r: ResourceCardData }) {
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  const accent = getCategoryColor(r.category);

  return (
    <Link
      href={`/resources/${r.id}`}
      target="_blank"
      rel="noreferrer"
      className={CARD_SHELL}
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 22px -16px rgba(18,32,67,0.22)" }}
    >
      {/* Header */}
      <div
        className="relative flex aspect-[16/10] items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${accent}1F, ${accent}08)` }}
      >
        <span
          className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.06]"
          style={{ color: accent, boxShadow: "0 18px 34px -20px rgba(18,32,67,0.4)" }}
        >
          <Icon size={30} strokeWidth={1.7} />
        </span>
        <span
          className="absolute left-4 top-4 rounded-full px-2.5 py-[3px] font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: accent }}
        >
          {meta.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <MetaRow
          r={r}
          accent={accent}
          metaLabel={
            (r.downloadCount ?? 0) > 0
              ? `${(r.downloadCount ?? 0).toLocaleString()} downloads`
              : meta.label
          }
        />

        <h3
          className="mt-3.5 line-clamp-2 font-display text-[17px] font-semibold leading-[1.35] tracking-[-0.01em]"
          style={{ color: "var(--ink)" }}
        >
          {r.title}
        </h3>

        {r.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-[1.55]" style={{ color: "var(--body)" }}>
            {r.description}
          </p>
        )}

        <div className="min-h-[16px] flex-1" />

        <div
          className="flex items-center justify-between gap-3 border-t pt-3.5"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.08em]"
            style={{ color: "var(--body)" }}
          >
            {formatResourceDate(r.releaseDate)}
            {r.fileSize > 0 && <span> · {formatFileSize(r.fileSize)}</span>}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <ShareButton id={r.id} />
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:translate-x-[2px]"
              style={{ background: accent }}
            >
              <Download size={14} strokeWidth={2.4} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function VideoResourceCard({
  r,
  onOpen,
  rank,
}: {
  r: ResourceCardData;
  onOpen?: (r: ResourceCardData) => void;
  rank?: number;
}) {
  const accent = getCategoryColor(r.category);

  return (
    <div
      className={CARD_SHELL}
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 22px -16px rgba(18,32,67,0.22)" }}
    >
      {/* Portrait player (click opens the watch + comments dialog) */}
      <div className="relative overflow-hidden">
        <ResourceVideoPlayer resource={r} />
        <button
          type="button"
          onClick={() => onOpen?.(r)}
          aria-label={`Watch ${r.title}`}
          className="absolute inset-0 cursor-pointer"
        />
        {rank !== undefined && (
          <span
            className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full font-display text-[13px] font-bold text-white"
            style={{ background: "rgba(10,14,26,0.55)", backdropFilter: "blur(6px)" }}
          >
            {rank}
          </span>
        )}
        <span
          className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold text-white"
          style={{ background: "rgba(10,14,26,0.55)", backdropFilter: "blur(6px)" }}
        >
          <VideoViews count={r.viewCount ?? 0} /> views
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <MetaRow
          r={r}
          accent={accent}
          metaLabel="Video"
          trailing={
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
              style={{ background: "rgba(15,169,104,0.10)", color: "#0FA968" }}
            >
              <MessageSquare size={9} strokeWidth={2.5} /> {(r.commentCount ?? 0).toLocaleString()}
            </span>
          }
        />

        <button type="button" onClick={() => onOpen?.(r)} className="mt-3.5 text-left">
          <h3
            className="line-clamp-2 font-display text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] transition-opacity hover:opacity-70"
            style={{ color: "var(--ink)" }}
          >
            {r.title}
          </h3>
        </button>

        {r.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-[1.55]" style={{ color: "var(--body)" }}>
            {r.description}
          </p>
        )}

        <div className="min-h-[16px] flex-1" />

        <div
          className="flex items-center justify-between gap-3 border-t pt-3.5"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <ResourceLoveButton
              resourceId={r.id}
              initialCount={r.loveCount ?? 0}
              initialLoved={r.lovedByMe ?? false}
            />
            <button
              type="button"
              onClick={() => onOpen?.(r)}
              className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors hover:text-[var(--brand-2)]"
              style={{ color: "var(--body)" }}
            >
              {formatResourceDate(r.releaseDate)}
            </button>
          </div>
          <ShareButton id={r.id} />
        </div>
      </div>
    </div>
  );
}

function MostViewedSection({
  videos,
  onOpen,
}: {
  videos: ResourceCardData[];
  onOpen: (r: ResourceCardData) => void;
}) {
  if (videos.length === 0) return null;
  return (
    <div className="mt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "#E08A17" }}
          >
            <TrendingUp size={12} /> Most viewed
          </span>
          <h2
            className="mt-1.5 font-display text-[clamp(21px,2.3vw,27px)] font-semibold leading-tight tracking-[-0.02em]"
            style={{ color: "var(--ink)" }}
          >
            Trending videos right now
          </h2>
        </div>
        <p className="max-w-[420px] text-[13px]" style={{ color: "var(--body)" }}>
          The clips students keep coming back to — watch and join the discussion.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((r, i) => (
          <VideoResourceCard key={r.id} r={r} onOpen={onOpen} rank={i + 1} />
        ))}
      </div>
      <div className="mt-12 h-px w-full" style={{ background: "var(--line)" }} />
    </div>
  );
}

export function PublicResourceList() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<FileTypeFilter>("video");
  const [query, setQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState<ResourceCardData | null>(null);
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

  const mostViewed = useMemo(() => {
    const videos = resources.filter((r) => r.fileType === "video");
    const ranked = videos.some((r) => (r.viewCount ?? 0) > 0)
      ? videos.filter((r) => (r.viewCount ?? 0) > 0)
      : videos;
    return ranked
      .slice()
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 4);
  }, [resources]);

  const showMostViewed =
    !loading && !query.trim() && (fileType === "all" || fileType === "video") && mostViewed.length > 0;

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
          {/* Most viewed videos */}
          {showMostViewed && <MostViewedSection videos={mostViewed} onOpen={setActiveVideo} />}

          {/* Header + grid */}
          {!loading && resources.length > 0 && (
            <div className="mb-8 mt-10">
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
                <div key={i} className="animate-pulse rounded-2xl border bg-white" style={{ borderColor: "var(--line)", height: 240 }} />
              ))}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                Couldn&apos;t load resources
              </p>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>
                {error}
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-8 rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
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
                  <VideoResourceCard key={r.id} r={r} onOpen={setActiveVideo} />
                ) : (
                  <ResourceCard key={r.id} r={r} />
                )
              )}
            </div>
          )}

          {activeVideo && (
            <ResourceVideoDialog
              resource={activeVideo}
              onClose={() => setActiveVideo(null)}
              onCommentCountChange={(id, t) =>
                setResources((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, commentCount: t } : x))
                )
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
