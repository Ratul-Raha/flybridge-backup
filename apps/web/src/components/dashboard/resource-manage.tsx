"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { uploadToStorage } from "@/lib/upload-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { CardLoader, PageLoader } from "@/components/dashboard/page-loader";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import {
  FileText,
  FileImage,
  Video,
  Music,
  File as FileIcon,
  Link2,
  UploadCloud,
  Trash2,
  ExternalLink,
  Pencil,
  Download,
  Library,
  BarChart3,
  TrendingUp,
  CalendarRange,
  Search,
  Folder,
  Star,
  Eye,
  EyeOff,
  Loader2,
  type LucideIcon,
} from "lucide-react";

type ResourceItem = {
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
  published: boolean;
  youtubeUrl: string | null;
  downloadCount: number;
  viewCount: number;
};

type UploadedFile = {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};

type FormState = {
  title: string;
  description: string;
  category: string;
  releaseDate: string;
  access: "public" | "members";
  price: string;
  bdtPrice: string;
  featured: boolean;
  published: boolean;
  mode: "file" | "link" | "youtube";
  linkUrl: string;
  youtubeUrl: string;
  file: UploadedFile | null;
  thumbnail: UploadedFile | null;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  category: RESOURCE_CATEGORIES[0],
  releaseDate: new Date().toISOString().slice(0, 10),
  access: "public",
  price: "",
  bdtPrice: "",
  featured: false,
  published: true,
  mode: "file",
  linkUrl: "",
  youtubeUrl: "",
  file: null,
  thumbnail: null,
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60";

const FILE_TYPE_META: Record<string, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  pdf: { icon: FileText, label: "PDF", color: "#C0392B", bg: "rgba(192,57,43,0.10)" },
  image: { icon: FileImage, label: "Image", color: "#2F5FE0", bg: "rgba(47,95,224,0.10)" },
  video: { icon: Video, label: "Video", color: "#6B4CE0", bg: "rgba(107,76,224,0.10)" },
  audio: { icon: Music, label: "Audio", color: "#E08A17", bg: "rgba(224,138,23,0.12)" },
  other: { icon: FileIcon, label: "File", color: "#0FA968", bg: "rgba(15,169,104,0.10)" },
  link: { icon: Link2, label: "Link", color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
};

function fileTypeMeta(fileType: string) {
  return FILE_TYPE_META[fileType] ?? FILE_TYPE_META.other;
}

function fileTypeFromName(name: string): string {
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return "image";
  if (/\.(mp4|mov|webm)$/i.test(name)) return "video";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp3", "wav", "m4a", "aac"].includes(ext)) return "audio";
  return "other";
}

function uploadFile(file: File, use: "file" | "thumbnail", onProgress: (pct: number) => void): Promise<UploadedFile> {
  return uploadToStorage(file, "resources", use, onProgress).then((r) => ({
    url: r.ref,
    publicId: r.key,
    fileName: file.name,
    fileSize: file.size,
    fileType: fileTypeFromName(file.name),
  }));
}

function formatBytes(bytes: number) {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileHref(r: ResourceItem) {
  if (r.fileType === "link") return r.fileUrl;
  if ((r.fileType === "image" || r.fileType === "video") && !r.fileUrl.startsWith("s3://")) return r.fileUrl;
  return `/api/resources/${r.id}/file`;
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

const GRID_COLS = "grid-cols-[28px_minmax(0,1fr)_64px_64px_64px_92px_84px_auto]";

export function ResourceManage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [uploadingFile, setUploadingFile] = useState<"file" | "thumb" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [period, setPeriod] = useState<"all" | "7" | "30" | "90">("all");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<"publish" | "unpublish" | "delete" | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const headerCheckRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const daysParam = period === "all" ? "" : `&days=${period}`;
      const res = await fetch(`/api/resources?all=true${daysParam}`, { cache: "no-store" });
      const data = await res.json();
      setResources(data.resources ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalDownloads = resources.reduce((s, r) => s + r.downloadCount, 0);
    const top = resources.reduce<ResourceItem | null>((best, r) => (best === null || r.downloadCount > best.downloadCount ? r : best), null);
    const avg = resources.length > 0 ? Math.round(totalDownloads / resources.length) : 0;
    return { totalDownloads, top, avg };
  }, [resources]);

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of resources) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return [
      { name: "All", label: "All resources", count: resources.length },
      ...RESOURCE_CATEGORIES.filter((c) => counts.has(c)).map((c) => ({
        name: c,
        label: c,
        count: counts.get(c) ?? 0,
      })),
    ];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (folder !== "All" && r.category !== folder) return false;
      if (typeFilter !== "all" && r.fileType !== typeFilter) return false;
      if (accessFilter !== "all" && r.access !== accessFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.fileName ?? "").toLowerCase().includes(q)
      );
    });
  }, [resources, query, folder, typeFilter, accessFilter]);

  const visible = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => +new Date(a.releaseDate) - +new Date(b.releaseDate));
        break;
      case "name-asc":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        arr.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "largest":
        arr.sort((a, b) => b.fileSize - a.fileSize);
        break;
      case "downloads":
        arr.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case "views":
        arr.sort((a, b) => b.viewCount - a.viewCount);
        break;
      default:
        arr.sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
    }
    return arr;
  }, [filtered, sort]);

  const allOnPage = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const someOnPage = visible.some((r) => selected.has(r.id));

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = someOnPage && !allOnPage;
    }
  }, [someOnPage, allOnPage]);

  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const existing = new Set(resources.map((r) => r.id));
      const next = new Set([...prev].filter((id) => existing.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [resources]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPage) {
        for (const r of visible) next.delete(r.id);
      } else {
        for (const r of visible) next.add(r.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const runBulk = async (action: "publish" | "unpublish" | "delete") => {
    if (selected.size === 0 || bulkBusy) return;
    if (
      action === "delete" &&
      !confirm(`Delete ${selected.size} resource${selected.size === 1 ? "" : "s"}? This cannot be undone.`)
    ) {
      return;
    }
    setError(null);
    setBulkBusy(action);
    try {
      const res = await fetch("/api/resources/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds: [...selected], action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Bulk action failed");
      clearSelection();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBulkBusy(null);
    }
  };

  const togglePublished = async (r: ResourceItem) => {
    setError(null);
    setTogglingId(r.id);
    try {
      const res = await fetch(`/api/resources/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !r.published }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTogglingId(null);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setUploadProgress(0);
    setFormOpen(true);
  };

  const openEdit = (r: ResourceItem) => {
    setEditingId(r.id);
    const isLink = r.fileType === "link";
    const isYouTubeOnly = Boolean(r.youtubeUrl) && (!r.fileUrl || r.fileUrl === r.youtubeUrl);
    setForm({
      title: r.title,
      description: r.description ?? "",
      category: r.category,
      releaseDate: r.releaseDate.slice(0, 10),
      access: r.access,
      price: r.price ? String(r.price) : "",
      bdtPrice: r.prices?.BDT ? String(r.prices.BDT) : "",
      featured: r.featured,
      published: r.published !== false,
      mode: isYouTubeOnly ? "youtube" : isLink ? "link" : "file",
      linkUrl: isLink ? r.fileUrl : "",
      youtubeUrl: r.youtubeUrl ?? "",
      file: isLink || isYouTubeOnly
        ? null
        : {
            url: r.fileUrl,
            publicId: "",
            fileName: r.fileName ?? r.fileUrl.split("/").pop() ?? "",
            fileSize: r.fileSize,
            fileType: r.fileType,
          },
      thumbnail: r.thumbnail
        ? { url: r.thumbnail, publicId: "", fileName: "cover.jpg", fileSize: 0, fileType: "image" }
        : null,
    });
    setUploadProgress(0);
    setFormOpen(true);
  };

  const runUpload = async (file: File, target: "file" | "thumb") => {
    setError(null);
    setUploadingFile(target);
    setUploadProgress(0);
    try {
      const uploaded = await uploadFile(file, target === "thumb" ? "thumbnail" : "file", setUploadProgress);
      if (target === "file") {
        setForm((f) => ({ ...f, file: uploaded }));
      } else {
        setForm((f) => ({ ...f, thumbnail: uploaded }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingFile(null);
    }
  };

  const save = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (form.mode === "link") {
      if (!isValidUrl(form.linkUrl)) {
        setError("Enter a valid link URL (starting with http:// or https://)");
        return;
      }
    } else if (form.mode === "youtube") {
      if (!isValidUrl(form.youtubeUrl)) {
        setError("Enter a valid YouTube URL (starting with http:// or https://)");
        return;
      }
    } else if (!form.file) {
      setError("A file must be uploaded");
      return;
    }
    if (form.mode === "file" && form.youtubeUrl.trim() && !isValidUrl(form.youtubeUrl)) {
      setError("Enter a valid YouTube URL or leave it empty");
      return;
    }

    const url = editingId ? `/api/resources/${editingId}` : "/api/resources";
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          releaseDate: form.releaseDate,
          access: form.access,
          price: form.price,
          prices: {
            USD: form.access === "members" ? Math.max(0, Number(form.price) || 0) : 0,
            BDT: form.access === "members" ? Math.max(0, Number(form.bdtPrice) || 0) : 0,
          },
          featured: form.featured,
          published: form.published,
          youtubeUrl:
            form.mode === "youtube" || form.mode === "file" ? form.youtubeUrl.trim() : "",
          fileUrl:
            form.mode === "link"
              ? form.linkUrl.trim()
              : form.mode === "youtube"
                ? form.youtubeUrl.trim()
                : form.file?.url,
          publicId: form.mode === "file" ? form.file?.publicId : "",
          fileName:
            form.mode === "link"
              ? domainOf(form.linkUrl) || null
              : form.mode === "youtube"
                ? "YouTube"
                : form.file?.fileName,
          fileSize: form.mode === "file" ? form.file?.fileSize : 0,
          fileType:
            form.mode === "link" ? "link" : form.mode === "youtube" ? "video" : form.file?.fileType,
          thumbnail: form.thumbnail?.url,
          thumbnailPublicId: form.thumbnail?.publicId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFormOpen(false);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: ResourceItem) => {
    if (!confirm(`Delete resource "${r.title}"?`)) return;
    setDeletingId(r.id);
    try {
      const res = await fetch(`/api/resources/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return <PageLoader label="Loading…" />;

  const uploading = uploadingFile !== null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resources"
        subtitle="Upload and manage PDFs, images and videos shared with your users."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            + New resource
          </button>
        }
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {/* Stats */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-[15px] font-semibold flex items-center gap-2" style={{ color: "var(--ink)" }}>
            <BarChart3 size={17} style={{ color: "var(--brand)" }} />
            Downloads overview
          </p>
          <div className="flex gap-1 rounded-full border p-1" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
            {(
              [
                { value: "all", label: "All time" },
                { value: "90", label: "90d" },
                { value: "30", label: "30d" },
                { value: "7", label: "7d" },
              ] as const
            ).map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className="rounded-full px-3.5 py-[6px] text-[12px] font-medium transition-colors duration-200"
                style={
                  period === p.value
                    ? { background: "var(--brand)", color: "#fff" }
                    : { color: "var(--body)" }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#6E4CFF,#8B5CF6)" }}>
                <Download size={19} strokeWidth={2.2} />
              </div>
              <CalendarRange size={15} style={{ color: "#A6ADC0" }} />
            </div>
            <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
              {stats.totalDownloads.toLocaleString()}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
              Downloads
            </p>
            <p className="text-[11.5px] mt-2 font-medium" style={{ color: "var(--body)" }}>
              {period === "all" ? "Lifetime file downloads" : `Downloads in the last ${period} days`}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4" style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)" }}>
              <Library size={19} strokeWidth={2.2} />
            </div>
            <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
              {resources.length.toLocaleString()}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
              Total resources
            </p>
            <p className="text-[11.5px] mt-2 font-medium" style={{ color: "var(--body)" }}>
              Files shared on the platform
            </p>
          </div>

          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4" style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)" }}>
              <TrendingUp size={19} strokeWidth={2.2} />
            </div>
            {stats.top ? (
              <>
                <p className="font-display text-[22px] font-semibold leading-none truncate" title={stats.top.title} style={{ color: "var(--ink)" }}>
                  {stats.top.downloadCount.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2 truncate" style={{ color: "var(--body)" }}>
                  {stats.top.title}
                </p>
                <p className="text-[11.5px] mt-2 font-medium truncate" style={{ color: "var(--body)" }}>
                  Most downloaded
                </p>
              </>
            ) : (
              <p className="font-display text-[22px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                —
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4" style={{ background: "linear-gradient(135deg,#10B981,#34D399)" }}>
              <BarChart3 size={19} strokeWidth={2.2} />
            </div>
            <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
              {resources.length > 0 ? stats.avg.toLocaleString() : "—"}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
              Avg downloads
            </p>
            <p className="text-[11.5px] mt-2 font-medium" style={{ color: "var(--body)" }}>
              Per resource
            </p>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="rounded-lg border bg-white p-[clamp(20px,3vw,28px)]" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-[16px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
            {editingId ? "Edit resource" : "New resource"}
          </h2>

          {/* Resource type toggle */}
          <div className="flex gap-1 rounded-full border p-1 w-fit mb-5" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
            {(["file", "link", "youtube"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, mode: m })}
                className="rounded-full px-4 py-[7px] text-[13px] font-medium transition-colors duration-200"
                style={
                  form.mode === m
                    ? { background: "var(--brand)", color: "#fff" }
                    : { color: "var(--body)" }
                }
              >
                {m === "file" ? "Upload file" : m === "link" ? "Add link" : "YouTube video"}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Study Visa Document Checklist"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is in this resource?"
                rows={3}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Published date *
              </label>
              <input
                type="date"
                value={form.releaseDate}
                onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Access
              </label>
              <select
                value={form.access}
                onChange={(e) => setForm({ ...form, access: e.target.value as "public" | "members" })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <option value="public">Public — anyone can access</option>
                <option value="members">Members only</option>
              </select>
            </div>

            {form.access === "members" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="9.99"
                    className={inputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                    Price (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.bdtPrice}
                    onChange={(e) => setForm({ ...form, bdtPrice: e.target.value })}
                    placeholder="optional, e.g. 1200"
                    className={inputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
              </>
            )}

            {form.mode === "link" && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Link URL *
                </label>
                <input
                  type="url"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://example.com/article"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  The link opens in a new tab when users click the resource.
                </p>
              </div>
            )}

            {form.mode === "youtube" && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  YouTube URL *
                </label>
                <input
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  Visitors are sent to YouTube to watch, so video streaming never hits our servers.
                </p>
              </div>
            )}

            {form.mode === "file" && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  File (PDF / image / video) *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*,video/*,audio/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runUpload(f, "file");
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-[10px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    <UploadCloud size={15} />
                    {form.file ? "Replace file" : "Upload file"}
                  </button>
                  {form.file && (
                    <span className="flex items-center gap-2 text-[13px] min-w-0" style={{ color: "var(--body)" }}>
                      <FileText size={15} style={{ color: "var(--brand)" }} />
                      <span className="truncate max-w-[260px]">{form.file.fileName}</span>
                      {form.file.fileSize > 0 && (
                        <span className="font-mono text-[11px]">{formatBytes(form.file.fileSize)}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, file: null })}
                        className="p-1 rounded-md hover:bg-black/5"
                        aria-label="Remove file"
                      >
                        <Trash2 size={13} style={{ color: "#C0392B" }} />
                      </button>
                    </span>
                  )}
                </div>
                {uploadingFile === "file" && (
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--bg-soft)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%`, background: "var(--brand)" }}
                      />
                    </div>
                    <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
                      {uploadProgress}%
                    </span>
                  </div>
                )}
                {form.file?.fileType === "video" && (
                  <div className="mt-1 flex flex-col gap-2">
                    <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                      YouTube URL (optional)
                    </label>
                    <input
                      type="url"
                      value={form.youtubeUrl}
                      onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    />
                    <p className="text-[12px]" style={{ color: "var(--body)" }}>
                      If set, visitors watch on YouTube instead of streaming the uploaded file.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Cover / thumbnail (optional)
              </label>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) runUpload(f, "thumb");
                  e.target.value = "";
                }}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => thumbInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-[10px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  <UploadCloud size={15} />
                  {form.thumbnail ? "Replace cover" : "Upload cover"}
                </button>
                {form.thumbnail && (
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.thumbnail.url}
                      alt="Cover preview"
                      className="h-12 w-16 rounded-lg object-cover border"
                      style={{ borderColor: "var(--line)" }}
                    />
                    {uploadingFile === "thumb" && (
                      <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
                        {uploadProgress}%
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 md:col-span-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                Featured on the resources page
              </span>
            </label>

            <label className="flex items-center gap-2 md:col-span-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                Published — visible on the public resources page
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              disabled={uploading || saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create resource"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="text-[13.5px] font-medium px-4 py-[11px]"
              style={{ color: "var(--body)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <CardLoader label="Loading resources…" />}
      {!loading && resources.length === 0 && !formOpen ? (
        <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
          No resources yet — click "New resource" to upload your first one.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Mobile folder chips */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {folders.map((f) => {
              const active = folder === f.name;
              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setFolder(f.name)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-[7px] text-[12.5px] font-medium transition-colors duration-200"
                  style={
                    active
                      ? { background: "var(--brand)", color: "#fff" }
                      : { background: "var(--bg-soft)", color: "var(--body)" }
                  }
                >
                  <Folder size={13} />
                  {f.label}
                  <span className="font-mono text-[10.5px] opacity-70">{f.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-5">
            {/* Folder sidebar */}
            <aside className="hidden lg:flex w-[220px] shrink-0 flex-col rounded-lg border bg-white p-3" style={{ borderColor: "var(--line)" }}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] px-3 pb-2 pt-1" style={{ color: "#A6ADC0" }}>
                Folders
              </p>
              {folders.map((f) => {
                const active = folder === f.name;
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setFolder(f.name)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors duration-200"
                    style={
                      active
                        ? { background: "var(--brand-soft)", color: "var(--brand)" }
                        : { color: "var(--body)" }
                    }
                  >
                    <Folder size={15} strokeWidth={2} />
                    <span className="truncate">{f.label}</span>
                    <span className="ml-auto font-mono text-[11px]" style={{ color: active ? "var(--brand)" : "#A6ADC0" }}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* File browser */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* Toolbar */}
              <div className="rounded-lg border bg-white p-3 flex flex-col md:flex-row gap-3" style={{ borderColor: "var(--line)" }}>
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--body)" }}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search files…"
                    className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className={selectClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    <option value="all">All types</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="link">Link</option>
                    <option value="other">File</option>
                  </select>
                  <select
                    value={accessFilter}
                    onChange={(e) => setAccessFilter(e.target.value)}
                    className={selectClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    <option value="all">All access</option>
                    <option value="public">Public</option>
                    <option value="members">Members</option>
                  </select>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className={selectClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="name-desc">Name (Z–A)</option>
                    <option value="largest">Largest first</option>
                    <option value="downloads">Most downloaded</option>
                    <option value="views">Most viewed</option>
                  </select>
                </div>
              </div>

              {selected.size > 0 && (
                <div
                  className="rounded-lg border px-4 py-2.5 flex flex-wrap items-center gap-2.5"
                  style={{ borderColor: "rgba(47,95,224,0.25)", background: "rgba(47,95,224,0.06)" }}
                >
                  <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    {selected.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={bulkBusy !== null}
                    className="text-[12.5px] font-medium underline-offset-2 hover:underline disabled:opacity-50"
                    style={{ color: "var(--body)" }}
                  >
                    Clear
                  </button>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => runBulk("publish")}
                      disabled={bulkBusy !== null}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-[7px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      {bulkBusy === "publish" ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                      Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => runBulk("unpublish")}
                      disabled={bulkBusy !== null}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-[7px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    >
                      {bulkBusy === "unpublish" ? <Loader2 size={13} className="animate-spin" /> : <EyeOff size={13} />}
                      Unpublish
                    </button>
                    <button
                      type="button"
                      onClick={() => runBulk("delete")}
                      disabled={bulkBusy !== null}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-[7px] text-[12.5px] font-medium transition-colors hover:bg-[#FDF1F0] disabled:opacity-50"
                      style={{ borderColor: "rgba(192,57,43,0.3)", color: "#C0392B" }}
                    >
                      {bulkBusy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
                <div className={`hidden md:grid gap-3 px-4 py-2.5 border-b bg-[var(--bg-soft)] ${GRID_COLS}`} style={{ borderColor: "var(--line)" }}>
                  <span className="flex items-center">
                    <input
                      ref={headerCheckRef}
                      type="checkbox"
                      checked={allOnPage}
                      disabled={visible.length === 0}
                      onChange={toggleSelectAll}
                      aria-label="Select all resources matching the current filters"
                      className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ accentColor: "var(--brand)" }}
                    />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Name
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Type
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Views
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Downloads
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Status
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                    Access
                  </span>
                  <span />
                </div>

                {visible.length === 0 ? (
                  <div className="px-4 py-12 text-center text-[13.5px]" style={{ color: "var(--body)" }}>
                    No files match your search or filters.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {visible.map((r, idx) => {
                      const meta = fileTypeMeta(r.fileType);
                      const Icon = meta.icon;
                      return (
                        <div
                          key={r.id}
                          className={`group flex md:grid items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${idx > 0 ? "border-t" : ""} ${GRID_COLS}`}
                          style={{ borderColor: "var(--line)" }}
                        >
                          {/* Selection */}
                          <span className="flex shrink-0 items-center">
                            <input
                              type="checkbox"
                              checked={selected.has(r.id)}
                              onChange={() => toggleSelect(r.id)}
                              aria-label={`Select ${r.title}`}
                              className="w-4 h-4 cursor-pointer"
                              style={{ accentColor: "var(--brand)" }}
                            />
                          </span>

                          {/* Name cell */}
                          <div className="flex flex-1 md:flex-none items-center gap-3 min-w-0">
                            <a
                              href={fileHref(r)}
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
                                  {r.title}
                                  {r.youtubeUrl && (
                                    <Video size={13} className="shrink-0" style={{ color: "#FF0000" }} />
                                  )}
                                  {r.featured && (
                                    <Star size={12} className="shrink-0" style={{ color: "#E08A17" }} fill="#E08A17" />
                                  )}
                                </span>
                                <span className="text-[11.5px] flex items-center gap-1 truncate" style={{ color: "var(--body)" }}>
                                  <Folder size={11} className="shrink-0" />
                                  {r.category}
                                  {r.fileName && <span className="truncate">· {r.fileName}</span>}
                                  <span className="shrink-0">· {formatDate(r.releaseDate)}</span>
                                </span>
                                <span className="md:hidden flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                  <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                                    {meta.label}
                                  </span>
                                  <span className="text-[11.5px] flex items-center gap-1" style={{ color: "var(--body)" }}>
                                    <Eye size={11} />
                                    {r.viewCount}
                                  </span>
                                  <span className="text-[11.5px] flex items-center gap-1" style={{ color: "var(--body)" }}>
                                    <Download size={11} />
                                    {r.downloadCount}
                                  </span>
                                  <span
                                    className="text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                                    style={
                                      r.published
                                        ? { background: "rgba(15,169,104,0.12)", color: "#0FA968" }
                                        : { background: "rgba(160,174,192,0.18)", color: "#6B7280" }
                                    }
                                  >
                                    {r.published ? "Published" : "Draft"}
                                  </span>
                                  <span
                                    className="text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                                    style={
                                      r.access === "members"
                                        ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                                        : { background: "var(--brand-soft)", color: "var(--brand)" }
                                    }
                                  >
                                    {r.access === "members" ? "Members" : "Public"}
                                  </span>
                                </span>
                              </span>
                            </a>
                          </div>

                          <span className="hidden md:block text-[12.5px]" style={{ color: "var(--body)" }}>
                            {meta.label}
                          </span>
                          <span className="hidden md:flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--body)" }}>
                            <Eye size={13} />
                            {(r.viewCount ?? 0).toLocaleString()}
                          </span>
                          <span className="hidden md:flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--body)" }}>
                            <Download size={13} />
                            {r.downloadCount.toLocaleString()}
                          </span>
                          <span className="hidden md:inline-block">
                            <button
                              type="button"
                              onClick={() => togglePublished(r)}
                              disabled={togglingId === r.id}
                              title={r.published ? "Unpublish resource" : "Publish resource"}
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold transition-opacity hover:opacity-75 disabled:opacity-50"
                              style={
                                r.published
                                  ? { background: "rgba(15,169,104,0.12)", color: "#0FA968" }
                                  : { background: "rgba(160,174,192,0.18)", color: "#6B7280" }
                              }
                            >
                              {togglingId === r.id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : r.published ? (
                                <Eye size={10} />
                              ) : (
                                <EyeOff size={10} />
                              )}
                              {r.published ? "Published" : "Draft"}
                            </button>
                          </span>
                          <span className="hidden md:inline-block">
                            <span
                              className="text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                              style={
                                r.access === "members"
                                  ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                                  : { background: "var(--brand-soft)", color: "var(--brand)" }
                              }
                            >
                              {r.access === "members" ? "Members" : "Public"}
                            </span>
                          </span>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={fileHref(r)}
                              target="_blank"
                              rel="noreferrer"
                              title="Open file"
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
                              style={{ color: "var(--body)" }}
                            >
                              <ExternalLink size={15} />
                            </a>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => openEdit(r)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
                              style={{ color: "var(--body)" }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title={deletingId === r.id ? "Deleting" : "Delete"}
                              onClick={() => remove(r)}
                              disabled={deletingId === r.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#FDF1F0] disabled:opacity-50"
                              style={{ color: "#C0392B" }}
                            >
                              {deletingId === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
                Showing {visible.length} of {resources.length} files
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
