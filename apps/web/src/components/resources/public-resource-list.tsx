"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Lock, Search, Star } from "lucide-react";
import { RESOURCE_CATEGORIES } from "@/lib/resource-categories";
import {
  fileTypeMeta,
  formatFileSize,
  formatResourceDate,
  fileHref,
  type ResourceCardData,
} from "@/components/dashboard/user/resource-card";

function ResourceCard({ r }: { r: ResourceCardData }) {
  const meta = fileTypeMeta(r.fileType);
  const Icon = meta.icon;
  const paid = r.access === "paid";
  const href = paid ? "/login" : fileHref(r);
  const external = !paid;

  const media = (
    <div
      className="relative h-[150px] flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${meta.bg}, transparent 75%)` }}
    >
      {r.thumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r.thumbnail}
            alt={r.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(18,32,67,0.28), rgba(18,32,67,0.04) 45%)" }}
          />
        </>
      ) : (
        <span
          className="flex h-[64px] w-[64px] items-center justify-center rounded-[20px]"
          style={{ background: "rgba(255,255,255,0.85)", color: meta.color, boxShadow: "0 10px 30px -12px rgba(18,32,67,0.25)" }}
        >
          <Icon size={30} strokeWidth={1.8} />
        </span>
      )}

      <span
        className="absolute left-3.5 top-3.5 font-mono text-[10px] font-semibold tracking-[0.4px] px-[11px] py-[5px] rounded-full"
        style={{ background: "rgba(255,255,255,0.92)", color: meta.color }}
      >
        {meta.label.toUpperCase()}
      </span>

      {paid ? (
        <span
          className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.3px] px-[10px] py-[5px] rounded-full"
          style={{ background: "#6B4CE0", color: "#fff" }}
        >
          <Lock size={9} /> MEMBERS
        </span>
      ) : r.featured ? (
        <span
          className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.3px] px-[10px] py-[5px] rounded-full"
          style={{ background: "rgba(255,255,255,0.92)", color: "#E08A17" }}
        >
          <Star size={9} fill="#E08A17" /> FEATURED
        </span>
      ) : null}
    </div>
  );

  const footer = paid ? (
    <span
      className="inline-flex items-center gap-2 text-[12.5px] font-medium"
      style={{ color: "#6B4CE0" }}
    >
      <Lock size={12} />
      Members only{r.price > 0 ? ` · $${r.price}` : ""}
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-[5px] text-[12.5px] font-medium"
      style={{ color: meta.color }}
    >
      {r.fileType === "link" ? "Open link" : "Download"}
      <svg className="w-[12px] h-[12px]" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );

  const body = (
    <>
      {media}
      <div className="flex flex-col flex-1 gap-2 p-5">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] font-medium tracking-[0.3px] uppercase"
            style={{ color: "var(--brand-2)" }}
          >
            {r.category}
          </span>
        </div>
        <h3
          className="font-display text-[16.5px] font-semibold leading-[1.3] line-clamp-2"
          style={{ color: "var(--ink)" }}
        >
          {r.title}
        </h3>
        {r.description && (
          <p className="text-[12.5px] leading-[1.55] line-clamp-2" style={{ color: "var(--body)" }}>
            {r.description}
          </p>
        )}
        <div className="flex items-center gap-2.5 text-[11.5px] mt-auto pt-4 border-t" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {formatResourceDate(r.releaseDate)}
          </span>
          {r.fileSize > 0 && <span>· {formatFileSize(r.fileSize)}</span>}
        </div>
        <div className="flex items-center justify-between gap-3 pt-3">
          {footer}
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex flex-col overflow-hidden rounded-[20px] border bg-white transition-all duration-300 hover:-translate-y-[6px] hover:shadow-[0_24px_48px_-20px_rgba(18,32,67,0.22)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 6px 24px -14px rgba(18,32,67,0.12)" }}
    >
      {body}
    </Link>
  );
}

export function PublicResourceList() {
  const [resources, setResources] = useState<ResourceCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/resources", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load resources");
        return res.json();
      })
      .then((data) => {
        if (alive) {
          setResources(data.resources ?? []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load resources");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resources) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return map;
  }, [resources]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources
      .filter((r) => (category === "All" ? true : r.category === category))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [resources, category, query]);

  return (
    <div className="flex flex-col gap-8">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("All")}
            className={`rounded-full px-4 py-[8px] text-[12.5px] font-medium transition-colors duration-200 ${
              category === "All" ? "text-white" : ""
            }`}
            style={
              category === "All"
                ? { background: "var(--brand)" }
                : { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" }
            }
          >
            All resources
            <span className="ml-1.5 opacity-70">{resources.length}</span>
          </button>
          {RESOURCE_CATEGORIES.map((c) => {
            const count = counts.get(c) ?? 0;
            if (!count) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-[8px] text-[12.5px] font-medium transition-colors duration-200 ${
                  category === c ? "text-white" : ""
                }`}
                style={
                  category === c
                    ? { background: "var(--brand)" }
                    : { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" }
                }
              >
                {c}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:ml-auto lg:w-[300px]">
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
            className="w-full text-[13.5px] rounded-full border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[20px] border bg-white"
              style={{ borderColor: "var(--line)", height: 320 }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="rounded-[20px] border bg-white px-6 py-16 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            Couldn&apos;t load resources
          </p>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
            {error}
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div
          className="rounded-[20px] border bg-white px-6 py-16 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            {resources.length === 0 ? "No resources published yet" : "No matches"}
          </p>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--body)" }}>
            {resources.length === 0
              ? "Check back soon — guides and templates are on the way."
              : "Try a different search or category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((r) => (
            <ResourceCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
