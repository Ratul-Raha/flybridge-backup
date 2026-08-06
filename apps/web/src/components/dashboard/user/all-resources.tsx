"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, FileText, FileImage, Video, Music, File as FileIcon, Star, type LucideIcon } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import { ResourceCard, categoryGradient, formatFileSize, type ResourceCardData } from "./resource-card";
import { ScreenError, ScreenLoading } from "./ui";

type AccessFilter = "all" | "free" | "paid";

const TYPE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  image: FileImage,
  video: Video,
  audio: Music,
  other: FileIcon,
};

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fileHref(resource: ResourceCardData) {
  if (resource.fileType === "image" || resource.fileType === "video") return resource.fileUrl;
  return `/api/resources/${resource.id}/file`;
}

export function AllResources() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [access, setAccess] = useState<AccessFilter>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/resources", { cache: "no-store" });
      const data = await res.json();
      setResources(data.resources ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (access !== "all" && r.access !== access) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [resources, query, category, access]);

  if (loading) return <ScreenLoading label="Loading resources…" />;
  if (error) return <ScreenError message={error} />;

  const featured = visible.find((r) => r.featured);
  const rest = visible.filter((r) => !(r.featured && r.id === featured?.id));
  const Icon = featured ? (TYPE_ICONS[featured.fileType] ?? FileIcon) : FileIcon;

  return (
    <div className="flex flex-col gap-6">
      {resources.length === 0 ? (
        <div
          className="rounded-[16px] border bg-white px-6 py-14 flex flex-col items-center text-center gap-2.5"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
            No resources right now
          </p>
          <p className="text-[13.5px] max-w-[360px]" style={{ color: "var(--body)" }}>
            Guides, templates and toolkits are being prepared. Check back soon!
          </p>
        </div>
      ) : (
        <>
          {/* Featured hero */}
          {featured && (
            <section
              className="relative overflow-hidden rounded-[16px] px-6 py-7 md:px-8 md:py-8 text-white"
              style={{ background: categoryGradient(featured.category) }}
            >
              <Icon
                size={180}
                strokeWidth={1}
                className="absolute -right-6 -bottom-10 opacity-15"
                style={{ transform: "rotate(-8deg)" }}
              />
              <div className="relative flex flex-col items-start gap-3 max-w-[620px]">
                <span className="flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[11px] font-semibold" style={{ background: "rgba(255,255,255,0.18)" }}>
                  <Star size={12} fill="currentColor" /> Featured resource · {featured.category}
                </span>
                <h2 className="font-display text-[clamp(20px,3vw,26px)] font-semibold leading-tight">
                  {featured.title}
                </h2>
                {featured.description && (
                  <p className="text-[13.5px] leading-[1.7] opacity-90 line-clamp-2">{featured.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[12px] opacity-90">
                  <span>{TYPE_ICONS[featured.fileType] ? "File" : ""}</span>
                  <span className="rounded-md px-2 py-[3px]" style={{ background: "rgba(255,255,255,0.16)" }}>
                    {featured.access === "free" ? "Free" : `Members · $${featured.price || "—"}`}
                  </span>
                  {formatFileSize(featured.fileSize) && (
                    <span className="rounded-md px-2 py-[3px]" style={{ background: "rgba(255,255,255,0.16)" }}>
                      {formatFileSize(featured.fileSize)}
                    </span>
                  )}
                  <span className="rounded-md px-2 py-[3px]" style={{ background: "rgba(255,255,255,0.16)" }}>
                    {formatDate(featured.releaseDate)}
                  </span>
                </div>
                <a
                  href={fileHref(featured)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-[10px] text-[13px] font-semibold transition-transform duration-200 hover:scale-[1.02]"
                  style={{ color: "var(--ink)" }}
                >
                  <Download size={14} /> Open resource
                </a>
              </div>
            </section>
          )}

          {/* Toolbar */}
          <div
            className="rounded-[14px] border bg-white p-3 flex flex-col md:flex-row gap-3"
            style={{ borderColor: "var(--line)" }}
          >
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
                placeholder="Search resources…"
                className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex gap-2.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={selectClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <option value="All">All categories</option>
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={access}
                onChange={(e) => setAccess(e.target.value as AccessFilter)}
                className={selectClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <option value="all">All tiers</option>
                <option value="free">Free</option>
                <option value="paid">Members</option>
              </select>
            </div>
          </div>

          <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
            Showing {visible.length} of {resources.length} resources
          </p>

          {visible.length === 0 ? (
            <p className="text-[13.5px] py-10 text-center" style={{ color: "var(--body)" }}>
              No resources match your search or filters.
            </p>
          ) : (
            <>
              <section>
                <div className="mb-4">
                  <h3 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
                    All resources
                  </h3>
                  <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
                    Guides, checklists, templates and more.
                  </p>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {rest.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
              </section>
              {rest.length === 0 && (
                <p className="text-[13.5px] py-6 text-center" style={{ color: "var(--body)" }}>
                  Nothing else matches your filters.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
