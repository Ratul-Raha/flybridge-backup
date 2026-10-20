"use client";

import { useState } from "react";
import {
  FileText,
  FileImage,
  Video,
  Music,
  File as FileIcon,
  Link2,
  ExternalLink,
  Folder,
  Play,
  Star,
  type LucideIcon,
} from "lucide-react";
import { ResourceVideoModal } from "@/components/resources/resource-video-player";

export type ResourceCardData = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number;
  thumbnail: string | null;
  releaseDate: string;
  access: "public" | "members";
  price: number;
  prices?: { USD?: number; BDT?: number } | null;
  featured: boolean;
  published?: boolean;
  youtubeUrl?: string | null;
  downloadCount?: number;
  viewCount?: number;
  commentCount?: number;
  loveCount?: number;
  lovedByMe?: boolean;
};

const FILE_TYPE_META: Record<string, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  pdf: { icon: FileText, label: "PDF", color: "#C0392B", bg: "rgba(192,57,43,0.10)" },
  image: { icon: FileImage, label: "Image", color: "#2F5FE0", bg: "rgba(47,95,224,0.10)" },
  video: { icon: Video, label: "Video", color: "#6B4CE0", bg: "rgba(107,76,224,0.10)" },
  audio: { icon: Music, label: "Audio", color: "#E08A17", bg: "rgba(224,138,23,0.12)" },
  other: { icon: FileIcon, label: "File", color: "#0FA968", bg: "rgba(15,169,104,0.10)" },
  link: { icon: Link2, label: "Link", color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
};

export function fileTypeMeta(fileType: string) {
  return FILE_TYPE_META[fileType] ?? FILE_TYPE_META.other;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatResourceDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fileHref(resource: ResourceCardData) {
  return `/api/resources/${resource.id}/file`;
}

const GRID_COLS = "grid-cols-[minmax(0,1fr)_92px_80px_108px_auto]";

export function ResourceList({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] border bg-white overflow-hidden"
      style={{ borderColor: "var(--line)" }}
    >
      {children}
    </div>
  );
}

export function ResourceTableHeader() {
  const cells = ["Name", "Type", "Size", "Published"];
  return (
    <div
      className={`hidden md:grid gap-3 px-4 py-2.5 border-b bg-[var(--bg-soft)] ${GRID_COLS}`}
      style={{ borderColor: "var(--line)" }}
    >
      {cells.map((c) => (
        <span key={c} className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
          {c}
        </span>
      ))}
      <span />
    </div>
  );
}

export function ResourceRow({
  resource,
  divider = false,
}: {
  resource: ResourceCardData;
  divider?: boolean;
}) {
  const meta = fileTypeMeta(resource.fileType);
  const Icon = meta.icon;
  const isVideo = resource.fileType === "video";
  const [openVideo, setOpenVideo] = useState(false);

  const openNameCell = (
    <button
      type="button"
      onClick={() => setOpenVideo(true)}
      title="Watch video"
      className="flex items-center gap-3 min-w-0 text-left"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="text-[14px] font-semibold truncate flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
          {resource.title}
          {resource.featured && (
            <Star size={12} className="shrink-0" style={{ color: "#E08A17" }} fill="#E08A17" />
          )}
        </span>
        <span className="text-[11.5px] flex items-center gap-1 truncate" style={{ color: "var(--body)" }}>
          <Folder size={11} className="shrink-0" />
          {resource.category}
          {resource.fileName && <span className="truncate">· {resource.fileName}</span>}
        </span>
        <span className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            {meta.label}
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            {formatFileSize(resource.fileSize)}
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            {formatResourceDate(resource.releaseDate)}
          </span>
        </span>
      </span>
    </button>
  );

  const fileLink = (
    <a
      href={fileHref(resource)}
      target="_blank"
      rel="noreferrer"
      title="Open file"
      className="flex items-center gap-3 min-w-0"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: meta.bg, color: meta.color }}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="text-[14px] font-semibold truncate flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
          {resource.title}
          {resource.featured && (
            <Star size={12} className="shrink-0" style={{ color: "#E08A17" }} fill="#E08A17" />
          )}
        </span>
        <span className="text-[11.5px] flex items-center gap-1 truncate" style={{ color: "var(--body)" }}>
          <Folder size={11} className="shrink-0" />
          {resource.category}
          {resource.fileName && <span className="truncate">· {resource.fileName}</span>}
        </span>
        <span className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            {meta.label}
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            {formatFileSize(resource.fileSize)}
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
            {formatResourceDate(resource.releaseDate)}
          </span>
        </span>
      </span>
    </a>
  );

  return (
    <div
      className={`group md:grid items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${divider ? "border-t" : ""} ${GRID_COLS}`}
      style={{ borderColor: "var(--line)" }}
    >
      {/* Name cell */}
      <div className="flex items-center gap-3 min-w-0">
        {isVideo ? openNameCell : fileLink}
      </div>

      {/* Desktop cells */}
      <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
        {meta.label}
      </span>
      <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
        {formatFileSize(resource.fileSize)}
      </span>
      <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
        {formatResourceDate(resource.releaseDate)}
      </span>

      {/* Action */}
      <div className="flex items-center justify-end">
        {isVideo ? (
          <button
            type="button"
            onClick={() => setOpenVideo(true)}
            title="Watch video"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
            style={{ color: meta.color }}
          >
            <Play size={15} />
          </button>
        ) : (
          <a
            href={fileHref(resource)}
            target="_blank"
            rel="noreferrer"
            title="Open file"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
            style={{ color: "var(--body)" }}
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {openVideo && <ResourceVideoModal resource={resource} onClose={() => setOpenVideo(false)} />}
    </div>
  );
}