import { FileText, FileImage, Video, Music, File as FileIcon, Download, Lock, Star, type LucideIcon } from "lucide-react";

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
  access: "free" | "paid";
  price: number;
  featured: boolean;
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  image: FileImage,
  video: Video,
  audio: Music,
  other: FileIcon,
};

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Image",
  video: "Video",
  audio: "Audio",
  other: "File",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Study Visa": "linear-gradient(135deg,#6B4CE0 0%,#2F5FE0 100%)",
  "Study Abroad": "linear-gradient(135deg,#2F5FE0 0%,#12A5D8 100%)",
  Scholarships: "linear-gradient(135deg,#E8792E 0%,#F2A53D 100%)",
  "Career & Jobs": "linear-gradient(135deg,#0FA968 0%,#14B57E 100%)",
  Interviews: "linear-gradient(135deg,#E8552E 0%,#EB5757 100%)",
  "English Skills": "linear-gradient(135deg,#12A5D8 0%,#2AA9A0 100%)",
  "Documents & Templates": "linear-gradient(135deg,#8A6FE8 0%,#5B5FE8 100%)",
  Other: "linear-gradient(135deg,#5B6478 0%,#3A4256 100%)",
};

export function categoryGradient(category: string): string {
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.Other;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fileHref(resource: ResourceCardData) {
  if (resource.fileType === "image" || resource.fileType === "video") {
    return resource.fileUrl;
  }
  return `/api/resources/${resource.id}/file`;
}

export function ResourceCard({
  resource,
  unlocked = false,
}: {
  resource: ResourceCardData;
  unlocked?: boolean;
}) {
  const Icon = TYPE_ICONS[resource.fileType] ?? FileIcon;
  const typeLabel = TYPE_LABELS[resource.fileType] ?? "File";
  const locked = resource.access === "paid" && !unlocked;
  const size = formatFileSize(resource.fileSize);
  const paid = resource.access === "paid";

  return (
    <article
      className="group rounded-[12px] border bg-white overflow-hidden flex flex-col transition-all duration-250 hover:shadow-[0_8px_24px_-12px_rgba(18,32,67,0.18)] hover:translate-y-[-1px]"
      style={{ borderColor: "var(--line)" }}
    >
      {/* Compact cover */}
      <div className="relative h-[76px] overflow-hidden shrink-0" style={{ background: categoryGradient(resource.category) }}>
        {resource.thumbnail && !locked && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[10px] backdrop-blur-[2px]"
            style={{ background: "rgba(255,255,255,0.22)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }}
          >
            <Icon size={17} className="text-white" strokeWidth={2} />
          </span>
        </div>
        {resource.featured && (
          <span
            className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: "rgba(30,20,60,0.55)", backdropFilter: "blur(3px)" }}
          >
            <Star size={11} className="text-[#F2C14E]" fill="currentColor" />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 p-3.5 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10.5px] font-semibold truncate" style={{ color: "var(--brand)" }}>
            {resource.category}
          </span>
          <span className="text-[10.5px] shrink-0" style={{ color: "var(--body)" }}>
            {formatDateShort(resource.releaseDate)}
          </span>
        </div>

        <h3
          className="font-display text-[13.5px] font-semibold leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-[var(--brand)]"
          style={{ color: "var(--ink)" }}
        >
          {resource.title}
        </h3>

        <p className="text-[11px] truncate" style={{ color: "var(--body)" }}>
          {typeLabel}
          {size ? ` · ${size}` : ""}
          {locked ? " · Members only" : ""}
        </p>

        <div className="mt-auto pt-2">
          {locked ? (
            <span
              className="w-full inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-[7px] text-[11px] font-semibold"
              style={{ borderColor: "rgba(111,76,224,0.3)", color: "#6B4CE0", background: "rgba(111,76,224,0.06)" }}
            >
              <Lock size={11} /> Members
            </span>
          ) : (
            <a
              href={fileHref(resource)}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-[7px] text-[11px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              style={{ background: categoryGradient(resource.category) }}
            >
              <Download size={11} /> Open
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
