"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Folder, Search } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import {
  ResourceList,
  ResourceTableHeader,
  ResourceRow,
  type ResourceCardData,
} from "./resource-card";
import { ScreenError, ScreenLoading } from "./ui";

type Section = "all" | "mine";
type AccessFilter = "all" | "free" | "paid";

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

export function ResourceBrowser({
  mobile = false,
  initialSection = "all",
}: {
  mobile?: boolean;
  initialSection?: Section;
}) {
  const [section, setSection] = useState<Section>(initialSection);
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = useCallback(async (s: Section) => {
    try {
      setLoading(true);
      const res = await fetch(s === "mine" ? "/api/resources?mine=true" : "/api/resources", {
        cache: "no-store",
      });
      const data = await res.json();
      setResources(data.resources ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(section);
  }, [load, section]);

  const switchSection = (s: Section) => {
    if (s === section) return;
    setSection(s);
    setFolder("All");
  };

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

  const mineCount = useMemo(
    () => resources.filter((r) => r.access === "paid").length,
    [resources]
  );

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
      default:
        arr.sort((a, b) => +new Date(b.releaseDate) - +new Date(a.releaseDate));
    }
    return arr;
  }, [filtered, sort]);

  if (loading) return <ScreenLoading label="Loading resources…" />;
  if (error) return <ScreenError message={error} />;

  const unlocked = section === "mine";

  const searchInput = (
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
  );

  const typeSelect = (
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
  );

  const accessSelect = (
    <select
      value={accessFilter}
      onChange={(e) => setAccessFilter(e.target.value)}
      className={selectClass}
      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
    >
      <option value="all">All access</option>
      <option value="free">Free</option>
      <option value="paid">Members</option>
    </select>
  );

  const sortSelect = (
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
    </select>
  );

  const list = (
    <ResourceList>
      <ResourceTableHeader />
      {visible.length === 0 ? (
        <div className="px-4 py-12 text-center text-[13.5px]" style={{ color: "var(--body)" }}>
          {resources.length === 0
            ? section === "mine"
              ? "You don't have any member resources yet."
              : "No resources yet — check back soon."
            : "No files match your search or filters."}
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((r, idx) => (
            <ResourceRow key={r.id} resource={r} unlocked={unlocked} divider={idx > 0} />
          ))}
        </div>
      )}
    </ResourceList>
  );

  const sectionPill = (s: Section, label: string, count: number) => (
    <button
      key={s}
      type="button"
      onClick={() => switchSection(s)}
      className="rounded-full px-4 py-[7px] text-[13px] font-medium transition-colors duration-200 whitespace-nowrap"
      style={
        section === s
          ? { background: "var(--brand)", color: "#fff" }
          : { color: "var(--body)" }
      }
    >
      {label}
      {count > 0 && <span className="ml-1.5 font-mono text-[10.5px] opacity-70">{count}</span>}
    </button>
  );

  if (mobile) {
    return (
      <div className="flex flex-col gap-4">
        {/* Section switch */}
        <div
          className="inline-flex rounded-full border p-1 gap-1 self-start"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
        >
          {sectionPill("all", "All resources", resources.length)}
          {sectionPill("mine", "My resources", mineCount)}
        </div>

        {/* Folder chips */}
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-0.5">
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

        {/* Toolbar */}
        <div className="flex flex-col gap-2">
          {searchInput}
          <div className="grid grid-cols-2 gap-2">
            {typeSelect}
            {accessSelect}
          </div>
          {sortSelect}
        </div>

        {list}

        <p className="text-[12px]" style={{ color: "var(--body)" }}>
          Showing {visible.length} of {resources.length} files
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Section switch */}
      <div
        className="inline-flex rounded-full border p-1 gap-1 self-start"
        style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
      >
        {sectionPill("all", "All resources", resources.length)}
        {sectionPill("mine", "My resources", mineCount)}
      </div>

      <div className="flex items-start gap-5">
        {/* Folder sidebar */}
        <aside
          className="hidden lg:flex w-[220px] shrink-0 flex-col rounded-[14px] border bg-white p-3"
          style={{ borderColor: "var(--line)" }}
        >
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
          <div
            className="rounded-[14px] border bg-white p-3 flex flex-col md:flex-row gap-3"
            style={{ borderColor: "var(--line)" }}
          >
            {searchInput}
            <div className="flex flex-wrap gap-2.5">
              {typeSelect}
              {accessSelect}
              {sortSelect}
            </div>
          </div>

          {list}

          <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
            Showing {visible.length} of {resources.length} files
          </p>
        </div>
      </div>
    </div>
  );
}