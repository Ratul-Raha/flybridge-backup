"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  Check,
  Download,
  Film,
  FolderOpen,
  Lock,
  MessageSquare,
  Play,
  Search,
  Share2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { getCategoryColor } from "@/lib/resource-colors";
import { useAuth } from "@/lib/auth/auth-context";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";
import { VideoViews } from "@/components/resources/resource-video-player";
import { ResourceVideoDialog } from "@/components/resources/resource-video-dialog";
import { ResourceLoveButton } from "@/components/resources/resource-love-button";
import { SignInModal } from "@/components/resources/sign-in-modal";
import { outboundLink } from "@/lib/outbound-link";

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
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_60px_-34px_rgba(18,32,67,0.4)]";

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

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  count,
  accent = "var(--brand)",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
  count?: number;
  accent?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          <Icon size={12} /> {eyebrow}
        </span>
        <h2
          className="mt-1.5 font-display text-[clamp(21px,2.3vw,27px)] font-semibold leading-tight tracking-[-0.02em]"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span
          className="rounded-full px-3 py-[5px] font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ background: "var(--bg-soft)", color: "var(--body)" }}
        >
          {count} {count === 1 ? "item" : "items"}
        </span>
      )}
      {subtitle && (
        <p className="w-full max-w-[460px] text-[13px] leading-relaxed sm:w-auto" style={{ color: "var(--body)" }}>
          {subtitle}
        </p>
      )}
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
      style={{ borderColor: "var(--line)", boxShadow: "0 8px 26px -20px rgba(18,32,67,0.28)" }}
    >
      <div
        className="relative flex aspect-[16/9] items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${accent}20, ${accent}07)` }}
      >
        <span
          className="flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-white/85 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.06]"
          style={{ color: accent, boxShadow: "0 18px 34px -20px rgba(18,32,67,0.4)" }}
        >
          <Icon size={28} strokeWidth={1.7} />
        </span>
        <span
          className="absolute left-4 top-4 rounded-full px-2.5 py-[3px] font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: accent }}
        >
          {meta.label}
        </span>
        <span
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:translate-x-[2px]"
          style={{ background: accent }}
        >
          <Download size={14} strokeWidth={2.4} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
          <span
            className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            {r.category}
          </span>
        </div>

        <h3
          className="mt-3 line-clamp-2 font-display text-[17px] font-semibold leading-[1.35] tracking-[-0.01em]"
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
          <ShareButton id={r.id} />
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
      style={{ borderColor: "var(--line)", boxShadow: "0 8px 26px -20px rgba(18,32,67,0.28)" }}
    >
      {/* Poster only — never mount a player per card in the list. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-black">
        {r.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #1a1f35, #0a0e1a)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/25" />

        <button
          type="button"
          onClick={() => onOpen?.(r)}
          aria-label={`Watch ${r.title}`}
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
        >
          <span
            className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-transform duration-200 group-hover:scale-110"
            style={{ boxShadow: "0 18px 40px -14px rgba(0,0,0,0.5)" }}
          >
            <Play className="ml-1 h-6 w-6" fill="currentColor" strokeWidth={0} />
          </span>
        </button>

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

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
            <span
              className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: accent }}
            >
              {r.category}
            </span>
          </span>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em]"
            style={{ background: "rgba(15,169,104,0.10)", color: "#0FA968" }}
          >
            <MessageSquare size={9} strokeWidth={2.5} /> {(r.commentCount ?? 0).toLocaleString()}
          </span>
        </div>

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

function CompactVideoCard({
  r,
  onOpen,
}: {
  r: ResourceCardData;
  onOpen: (r: ResourceCardData) => void;
}) {
  const accent = getCategoryColor(r.category);

  return (
    <button
      type="button"
      onClick={() => onOpen(r)}
      className="group flex w-full items-center gap-3 rounded-xl border bg-white p-2.5 text-left transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_18px_34px_-24px_rgba(18,32,67,0.4)]"
      style={{ borderColor: "var(--line)" }}
    >
      <span className="relative h-[64px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-black">
        {r.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #1a1f35, #0a0e1a)" }}
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
            <Play className="ml-[1px] h-3 w-3" fill="currentColor" strokeWidth={0} />
          </span>
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="line-clamp-2 font-display text-[12.5px] font-semibold leading-[1.35]"
          style={{ color: "var(--ink)" }}
        >
          {r.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium" style={{ color: "var(--body)" }}>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            <span className="truncate font-mono uppercase tracking-[0.08em]" style={{ color: accent }}>
              {r.category}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <VideoViews count={r.viewCount ?? 0} />
          </span>
        </span>
      </span>
    </button>
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
    <div className="mt-6">
      <SectionHeading
        icon={TrendingUp}
        eyebrow="Most viewed"
        title="Trending videos right now"
        subtitle="The clips students keep coming back to — watch and join the discussion."
        accent="#E08A17"
      />
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
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<FileTypeFilter>("video");
  const [query, setQuery] = useState("");
  const [activeVideo, setActiveVideo] = useState<ResourceCardData | null>(null);
  const [lockedVideo, setLockedVideo] = useState<ResourceCardData | null>(null);
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

  const stats = useMemo(
    () => ({
      videos: resources.filter((r) => r.fileType === "video").length,
      files: resources.filter((r) => r.fileType !== "video").length,
      views: resources.reduce((sum, r) => sum + (r.viewCount ?? 0), 0),
    }),
    [resources]
  );

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

  const newestFirst = (a: ResourceCardData, b: ResourceCardData) =>
    new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();

  const publicVideos = useMemo(
    () => visible.filter((r) => r.fileType === "video" && r.access !== "members").sort(newestFirst),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible]
  );
  const memberVideos = useMemo(
    () => visible.filter((r) => r.fileType === "video" && r.access === "members").sort(newestFirst),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible]
  );
  const otherResources = useMemo(
    () => visible.filter((r) => r.fileType !== "video").sort(newestFirst),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible]
  );

  const mostViewed = useMemo(() => {
    const videos = resources.filter((r) => r.fileType === "video" && r.access !== "members");
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

  const openVideo = (r: ResourceCardData) => {
    if (r.access === "members" && !user) {
      setLockedVideo(r);
      return;
    }
    if (r.youtubeUrl) {
      fetch(`/api/resources/${r.id}/view`, { method: "POST", keepalive: true }).catch(() => {});
      window.open(
        outboundLink(r.youtubeUrl, { label: `resource-youtube:${r.id}` }) ?? r.youtubeUrl,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    setActiveVideo(r);
  };

  const activeFileTypeLabel = FILE_TYPES.find((t) => t.value === fileType)?.label;

  const libraryTitle = query.trim()
    ? `Results for “${query.trim()}”`
    : fileType !== "all"
      ? (activeFileTypeLabel ?? "Resources")
      : "Latest resources";
  const librarySub = query.trim()
    ? `${visible.length} ${visible.length === 1 ? "match" : "matches"} in the library.`
    : "Fresh videos, guides, checklists and templates — added as we publish.";

  const hasResults = publicVideos.length + memberVideos.length + otherResources.length > 0;

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden pt-[clamp(118px,15vh,150px)] pb-[clamp(28px,4vw,46px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 340px at 15% 0%, rgba(47,95,224,0.10), transparent 70%), radial-gradient(760px 320px at 88% 8%, rgba(107,76,224,0.12), transparent 72%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-[6px] font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
              >
                <FolderOpen size={12} /> Resource library
              </span>
              <h1
                className="mt-4 max-w-[640px] font-display text-[clamp(30px,4.4vw,48px)] font-semibold leading-[1.08] tracking-[-0.03em]"
                style={{ color: "var(--ink)" }}
              >
                Everything you need to{" "}
                <span
                  style={{
                    background: "linear-gradient(120deg, var(--brand), var(--brand-2))",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  move forward
                </span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[15px] leading-[1.75]" style={{ color: "var(--body)" }}>
                Watch expert videos, grab ready-to-use templates, and study the guides that get
                students from application to arrival.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { label: "Videos", value: stats.videos },
                  { label: "Files & guides", value: stats.files },
                  { label: "Total views", value: stats.views },
                ].map((s) => (
                  <div key={s.label} className="flex items-baseline gap-2">
                    <span className="font-display text-[20px] font-semibold" style={{ color: "var(--ink)" }}>
                      {s.value.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search + format filter */}
            <div
              className="rounded-2xl border bg-white/90 p-4 backdrop-blur-sm"
              style={{ borderColor: "var(--line)", boxShadow: "0 24px 60px -40px rgba(18,32,67,0.4)" }}
            >
              <div className="relative">
                <Search size={18} className="absolute left-[18px] top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search “cover letter”, “IELTS”, “visa checklist”…"
                  className="w-full rounded-xl border bg-white pl-12 pr-5 py-[14px] text-[14px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
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
                  All{loading ? "" : ` · ${resources.length}`}
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
        </div>
      </section>

      {/* ===== Library ===== */}
      <section className="pb-[110px]">
        <div ref={gridRef} className="mx-auto scroll-mt-[110px] w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
          {showMostViewed && <MostViewedSection videos={mostViewed} onOpen={openVideo} />}

          {!loading && resources.length > 0 && (
            <div className="mb-8 mt-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2
                    className="font-display text-[clamp(23px,2.6vw,31px)] font-medium leading-tight tracking-[-0.02em]"
                    style={{ color: "var(--ink)" }}
                  >
                    {libraryTitle}
                  </h2>
                  <p className="mt-[6px] text-[14px]" style={{ color: "var(--body)" }}>
                    {librarySub}
                  </p>
                </div>
                <span
                  className="rounded-full px-3.5 py-[7px] font-mono text-[10.5px] font-medium uppercase tracking-[0.25em]"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                >
                  {visible.length} {visible.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border bg-white"
                  style={{ borderColor: "var(--line)", height: 260 }}
                />
              ))}
            </div>
          ) : error ? (
            <div
              className="mt-8 rounded-2xl border bg-white px-6 py-16 text-center"
              style={{ borderColor: "var(--line)" }}
            >
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                Couldn&apos;t load resources
              </p>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>
                {error}
              </p>
            </div>
          ) : !hasResults ? (
            <div
              className="mt-8 rounded-2xl border bg-white px-6 py-16 text-center"
              style={{ borderColor: "var(--line)" }}
            >
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
            <div className="mt-8 flex flex-col gap-14">
              {/* Public videos */}
              {publicVideos.length > 0 && (
                <section>
                  <SectionHeading
                    icon={Film}
                    eyebrow="Watch now"
                    title={query.trim() ? "Videos" : "Latest videos"}
                    count={publicVideos.length}
                  />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {publicVideos.map((r) => (
                      <VideoResourceCard key={r.id} r={r} onOpen={openVideo} />
                    ))}
                  </div>
                </section>
              )}

              {/* Members-only videos — smaller, grouped */}
              {memberVideos.length > 0 && (
                <section
                  className="overflow-hidden rounded-2xl border p-[clamp(16px,2.5vw,26px)]"
                  style={{
                    borderColor: "rgba(107,76,224,0.18)",
                    background:
                      "linear-gradient(135deg, rgba(107,76,224,0.07), rgba(47,95,224,0.035) 60%, rgba(255,255,255,0.6))",
                  }}
                >
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span
                        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: "#6B4CE0" }}
                      >
                        <Lock size={12} /> Members only
                      </span>
                      <h2
                        className="mt-1.5 font-display text-[clamp(19px,2.1vw,24px)] font-semibold leading-tight tracking-[-0.02em]"
                        style={{ color: "var(--ink)" }}
                      >
                        Member video library
                      </h2>
                    </div>
                    <p className="max-w-[420px] text-[12.5px] leading-relaxed" style={{ color: "var(--body)" }}>
                      Included with your FlyBridge account — sign in to watch. Short previews below.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {memberVideos.map((r) => (
                      <CompactVideoCard key={r.id} r={r} onOpen={openVideo} />
                    ))}
                  </div>
                </section>
              )}

              {/* Documents & files */}
              {otherResources.length > 0 && (
                <section>
                  <SectionHeading
                    icon={FolderOpen}
                    eyebrow="Read & download"
                    title={query.trim() ? "Files & guides" : "Guides & templates"}
                    count={otherResources.length}
                  />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {otherResources.map((r) => (
                      <ResourceCard key={r.id} r={r} />
                    ))}
                  </div>
                </section>
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

          {lockedVideo && (
            <SignInModal
              title="Sign in to watch this video"
              message="This video is for FlyBridge members. Sign in with Google to watch it — your free account is created automatically if you're new."
              youtubeUrl={lockedVideo.youtubeUrl}
              onClose={() => setLockedVideo(null)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
