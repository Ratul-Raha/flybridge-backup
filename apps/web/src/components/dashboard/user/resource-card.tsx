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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
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
      className="group rounded-[14px] border bg-white overflow-hidden flex flex-col transition-all duration-250 hover:shadow-[0_12px_32px_-16px_rgba(18,32,67,0.22)] hover:translate-y-[-2px]"
      style={{ borderColor: "var(--line)" }}
    >
      {/* Cover */}
      <div
        className="relative h-[150px] shrink-0 overflow-hidden"
        style={{ background: categoryGradient(resource.category) }}
      >
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
            className="flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-[2px] transition-transform duration-200 group-hover:scale-110"
            style={{ background: "rgba(255,255,255,0.22)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }}
          >
            <Icon size={26} className="text-white" strokeWidth={2} />
          </span>
        </div>

        <span
          className="absolute top-3.5 left-3.5 rounded-full px-3 py-[5px] text-[11px] font-semibold text-white"
          style={{ background: paid ? "rgba(30,20,60,0.55)" : "rgba(10,80,50,0.55)", backdropFilter: "blur(3px)" }}
        >
          {paid ? `Members · $${resource.price || "—"}` : "Free"}
        </span>
        {resource.featured && (
          <span
            className="absolute top-3.5 right-3.5 flex items-center gap-1 rounded-full px-3 py-[5px] text-[10.5px] font-semibold text-[#F2C14E]"
            style={{ background: "rgba(30,20,60,0.55)", backdropFilter: "blur(3px)" }}
          >
            <Star size={11} fill="currentColor" /> Featured
          </span>
        )}
        <span
          className="absolute bottom-3.5 right-3.5 rounded-md px-2.5 py-[4px] text-[10.5px] font-semibold text-white"
          style={{ background: "rgba(12,20,40,0.45)", backdropFilter: "blur(3px)" }}
        >
          {typeLabel}
          {size ? ` · ${size}` : ""}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>
            {resource.category}
          </span>
          <span className="text-[12px]" style={{ color: "var(--body)" }}>
            {formatDate(resource.releaseDate)}
          </span>
        </div>

        <h3
          className="font-display text-[17px] font-semibold leading-snug transition-colors duration-200 group-hover:text-[var(--brand)]"
          style={{ color: "var(--ink)" }}
        >
          {resource.title}
        </h3>

        {resource.description && (
          <p className="text-[13px] leading-[1.6] line-clamp-2" style={{ color: "var(--body)" }}>
            {resource.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          {locked ? (
            <span
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-[9px] text-[12.5px] font-semibold"
              style={{ borderColor: "rgba(111,76,224,0.3)", color: "#6B4CE0", background: "rgba(111,76,224,0.06)" }}
            >
              <Lock size={13} /> Members only
            </span>
          ) : (
            <a
              href={fileHref(resource)}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-[9px] text-[12.5px] font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              style={{ background: categoryGradient(resource.category) }}
            >
              <Download size={13} /> Open resource
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
