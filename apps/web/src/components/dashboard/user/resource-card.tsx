import {
  FileText,
  FileImage,
  Video,
  Music,
  File as FileIcon,
  ExternalLink,
  Lock,
  Star,
  type LucideIcon,
} from "lucide-react";

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

export function formatResourceDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fileHref(resource: ResourceCardData) {
  if (resource.fileType === "image" || resource.fileType === "video") {
    return resource.fileUrl;
  }
  return `/api/resources/${resource.id}/file`;
}

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

export function ResourceRow({
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
    <div
      className="group flex items-center gap-3.5 md:gap-4 px-4 md:px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--bg-soft)] border-t first:border-t-0"
      style={{ borderColor: "var(--line)" }}
    >
      {/* Cover tile */}
      <div
        className="relative h-11 w-11 md:h-12 md:w-12 shrink-0 rounded-[12px] overflow-hidden flex items-center justify-center"
        style={{ background: categoryGradient(resource.category) }}
      >
        {resource.thumbnail && !locked ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.thumbnail}
            alt={resource.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Icon size={18} className="text-white" strokeWidth={2} />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className="font-display text-[14px] md:text-[14.5px] font-semibold truncate transition-colors duration-200 group-hover:text-[var(--brand)]"
            style={{ color: "var(--ink)" }}
          >
            {resource.title}
          </p>
          {resource.featured && (
            <Star size={12} className="shrink-0" style={{ color: "#E08A17" }} fill="#E08A17" />
          )}
        </div>
        <p className="text-[11.5px] md:text-[12px] truncate mt-0.5" style={{ color: "var(--body)" }}>
          {resource.category} · {typeLabel}
          {size ? ` · ${size}` : ""} · {formatResourceDate(resource.releaseDate)}
        </p>
      </div>

      {/* Access badge (desktop) */}
      <span
        className="hidden md:inline-flex shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-[5px]"
        style={
          paid
            ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
            : { background: "var(--brand-soft)", color: "var(--brand)" }
        }
      >
        {paid ? "Members" : "Free"}
      </span>

      {/* Action */}
      {locked ? (
        <span
          className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-[7px] text-[12px] font-semibold"
          style={{ borderColor: "rgba(111,76,224,0.3)", color: "#6B4CE0", background: "rgba(111,76,224,0.06)" }}
        >
          <Lock size={12} /> Members
        </span>
      ) : (
        <a
          href={fileHref(resource)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-[8px] text-[12px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          style={{ background: categoryGradient(resource.category) }}
        >
          Open <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
