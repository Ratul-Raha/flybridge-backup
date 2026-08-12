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

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com"}/resources`;
  const shareText = `Check out "${r.title}" on FlyBridge Education Group`;

  const shares = [
    {
      label: "Share on Facebook",
      color: "#0866FF",
      bg: "rgba(8,102,255,0.08)",
      path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Share on WhatsApp",
      color: "#25D366",
      bg: "rgba(37,211,102,0.10)",
      path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} — ${shareUrl}`)}`,
    },
    {
      label: "Share on Messenger",
      color: "#006AFF",
      bg: "rgba(0,106,255,0.08)",
      path: "M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13",
      href: `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`,
    },
  ];

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
          <span className="flex items-center gap-1.5">
            {shares.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                title={s.label}
                aria-label={s.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(s.href, "_blank", "noopener");
                }}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
                style={{ background: s.bg }}
              >
                <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden="true">
                  <path fill={s.color} d={s.path} />
                </svg>
              </a>
            ))}
          </span>
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
