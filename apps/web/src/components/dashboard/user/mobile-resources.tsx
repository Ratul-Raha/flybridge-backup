"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, FolderOpen } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import { ResourceCard, type ResourceCardData } from "./resource-card";
import { ScreenError, ScreenLoading } from "./ui";

type AccessFilter = "all" | "free" | "paid";

const selectClass =
  "w-full text-[13px] rounded-xl border bg-white px-3 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

export function MobileResources() {
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

  if (resources.length === 0) {
    return (
      <div
        className="rounded-[16px] border bg-white px-6 py-12 flex flex-col items-center text-center gap-2.5"
        style={{ borderColor: "var(--line)" }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <FolderOpen size={20} strokeWidth={2} />
        </span>
        <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          No resources yet
        </p>
        <p className="text-[13px] max-w-[300px]" style={{ color: "var(--body)" }}>
          Guides, templates and toolkits will appear here soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
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
          className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
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

      <p className="text-[12px]" style={{ color: "var(--body)" }}>
        {visible.length} of {resources.length} resources
      </p>

      {visible.length === 0 ? (
        <p className="text-[13px] py-10 text-center" style={{ color: "var(--body)" }}>
          No resources match your search or filters.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  );
}
