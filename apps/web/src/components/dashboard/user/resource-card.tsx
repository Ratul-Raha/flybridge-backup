import { FileText, FileImage, Video, Music, File as FileIcon, Download, Lock, type LucideIcon } from "lucide-react";

export type ResourceCardData = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
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

  return (
    <article
      className="rounded-[14px] border bg-white overflow-hidden flex flex-col"
      style={{ borderColor: "var(--line)" }}
    >
      {resource.thumbnail && !locked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resource.thumbnail}
          alt={resource.title}
          className="w-full h-[150px] object-cover"
        />
      ) : (
        <div
          className="w-full h-[150px] flex items-center justify-center font-display text-[14px] text-white px-4 text-center"
          style={{
            background:
              resource.access === "paid"
                ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                : "linear-gradient(135deg,#0FA968,#18A97A)",
          }}
        >
          {resource.category}
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-5 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
            style={
              resource.access === "paid"
                ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                : { background: "var(--brand-soft)", color: "var(--brand)" }
            }
          >
            {resource.access === "paid" ? `Paid${resource.price ? ` · $${resource.price}` : ""}` : "Free"}
          </span>
          <span className="text-[12px]" style={{ color: "var(--body)" }}>
            {formatDate(resource.releaseDate)}
          </span>
        </div>

        <h3 className="font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {resource.title}
        </h3>

        <p className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: "var(--body)" }}>
          <Icon size={13} style={{ color: "var(--brand)" }} />
          {typeLabel} · {resource.category}
        </p>

        {resource.description && (
          <p className="text-[13px] leading-[1.6] line-clamp-2" style={{ color: "var(--body)" }}>
            {resource.description}
          </p>
        )}

        {locked ? (
          <p className="mt-auto pt-2 text-[12px] font-semibold flex items-center gap-1.5" style={{ color: "#0FA968" }}>
            <Lock size={13} /> Unlocked for members
          </p>
        ) : (
          <a
            href={fileHref(resource)}
            target="_blank"
            rel="noreferrer"
            className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold"
            style={{ color: "var(--brand)" }}
          >
            <Download size={13} /> Open resource
          </a>
        )}
      </div>
    </article>
  );
}
