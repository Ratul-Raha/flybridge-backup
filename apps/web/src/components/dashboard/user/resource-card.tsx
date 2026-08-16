import {
  FileText,
  FileImage,
  Video,
  Music,
  File as FileIcon,
  Link2,
  ExternalLink,
  Folder,
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
  if (
    resource.fileType === "link" ||
    resource.fileType === "image" ||
    resource.fileType === "video"
  ) {
    return resource.fileUrl;
  }
  return `/api/resources/${resource.id}/file`;
}

const GRID_COLS = "grid-cols-[minmax(0,1fr)_92px_80px_108px_84px_auto]";

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
  const cells = ["Name", "Type", "Size", "Published", "Access"];
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
  unlocked = false,
  divider = false,
}: {
  resource: ResourceCardData;
  unlocked?: boolean;
  divider?: boolean;
}) {
  const meta = fileTypeMeta(resource.fileType);
  const Icon = meta.icon;
  const locked = resource.access === "paid" && !unlocked;
  const paid = resource.access === "paid";

  const accessBadge = (
    <span
      className="text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
      style={
        paid
          ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
          : { background: "var(--brand-soft)", color: "var(--brand)" }
      }
    >
      {paid ? "Members" : "Free"}
    </span>
  );

  return (
    <div
      className={`group md:grid items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${divider ? "border-t" : ""} ${GRID_COLS}`}
      style={{ borderColor: "var(--line)" }}
    >
      {/* Name cell */}
      <div className="flex items-center gap-3 min-w-0">
        <a
          href={locked ? undefined : fileHref(resource)}
          target={locked ? undefined : "_blank"}
          rel={locked ? undefined : "noreferrer"}
          title={locked ? resource.title : "Open file"}
          className="flex items-center gap-3 min-w-0"
          aria-disabled={locked}
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
              {accessBadge}
            </span>
          </span>
        </a>
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
      <span className="hidden md:inline-block">{accessBadge}</span>

      {/* Action */}
      <div className="flex items-center justify-end">
        {locked ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-[4px] text-[10.5px] font-semibold"
            style={{ borderColor: "rgba(111,76,224,0.3)", color: "#6B4CE0", background: "rgba(111,76,224,0.06)" }}
          >
            <Lock size={10} /> Members
          </span>
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
    </div>
  );
}