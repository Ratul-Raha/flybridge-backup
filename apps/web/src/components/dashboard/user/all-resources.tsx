"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import { ResourceCard, type ResourceCardData } from "./resource-card";
import { ScreenError, ScreenLoading } from "./ui";

type AccessFilter = "all" | "free" | "paid";

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

  const featured = visible.filter((r) => r.featured);
  const rest = visible.filter((r) => !r.featured);

  const renderSection = (title: string, subtitle: string, items: ResourceCardData[]) => (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
          {title}
        </h2>
        <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
          {subtitle}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-[13.5px] py-8" style={{ color: "var(--body)" }}>
          Nothing here yet.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {items.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex flex-col gap-6">
      {resources.length === 0 ? (
        <p className="text-[14px] py-12 text-center" style={{ color: "var(--body)" }}>
          No resources right now. Check back soon!
        </p>
      ) : (
        <>
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
              {featured.length > 0 &&
                renderSection("Featured", "Hand-picked guides and tools to get you started.", featured)}
              {renderSection("All resources", "Guides, checklists, templates and more.", rest)}
            </>
          )}
        </>
      )}
    </div>
  );
}
