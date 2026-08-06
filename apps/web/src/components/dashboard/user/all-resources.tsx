"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Star, FileText, FileImage, Video, Music, File as FileIcon, type LucideIcon } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import { ResourceList, ResourceRow, categoryGradient, fileHref, type ResourceCardData } from "./resource-card";
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
  const FeaturedIcon = featured ? (TYPE_ICONS[featured.fileType] ?? FileIcon) : FileIcon;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
            Resource library
          </p>
          <h1
            className="font-display text-[clamp(20px,2.6vw,26px)] font-semibold tracking-[-0.02em] mt-1.5"
            style={{ color: "var(--ink)" }}
          >
            Guides & toolkits
          </h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
            Checklists, templates and practical files for your journey.
          </p>
        </div>
        <p className="text-[12.5px] shrink-0 hidden sm:block" style={{ color: "var(--body)" }}>
          {visible.length} of {resources.length} resources
        </p>
      </div>

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

      {/* Empty states */}
      {resources.length === 0 ? (
        <div
          className="rounded-[14px] border bg-white px-6 py-14 flex flex-col items-center text-center gap-2.5"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            No resources right now
          </p>
          <p className="text-[13px] max-w-[360px]" style={{ color: "var(--body)" }}>
            Guides, templates and toolkits are being prepared. Check back soon!
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div
          className="rounded-[14px] border bg-white px-6 py-14 flex flex-col items-center text-center gap-2.5"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Nothing matches your filters
          </p>
          <p className="text-[13px]" style={{ color: "var(--body)" }}>
            Try a different search or category.
          </p>
        </div>
      ) : (
        <>
          {/* Featured strip */}
          {featured && (
            <a
              href={fileHref(featured)}
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden rounded-[14px] px-5 py-4 text-white flex items-center gap-4 transition-shadow duration-200 hover:shadow-[0_14px_34px_-18px_rgba(18,32,67,0.4)]"
              style={{ background: categoryGradient(featured.category) }}
            >
              <FeaturedIcon
                size={110}
                strokeWidth={1}
                className="absolute -right-4 -bottom-8 opacity-15"
              />
              <span
                className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[10.5px] font-semibold"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <Star size={11} fill="currentColor" /> Featured
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold truncate">{featured.title}</p>
                <p className="text-[12px] opacity-90 truncate">{featured.category}</p>
              </div>
              <span
                className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] bg-white px-3.5 py-[8px] text-[12px] font-semibold transition-transform duration-200 group-hover:scale-[1.03]"
                style={{ color: "var(--ink)" }}
              >
                Open <ExternalLink size={12} />
              </span>
            </a>
          )}

          {/* List */}
          <ResourceList>
            {rest.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </ResourceList>
        </>
      )}
    </div>
  );
}
