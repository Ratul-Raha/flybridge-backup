"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Eye,
  PenLine,
  Search,
} from "lucide-react";

export type BlogCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover: string | null;
  author: string;
  featured: boolean;
  publishedAt: string | null;
  viewCount: number;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function readingTime(content: string) {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const CATEGORY_COLORS: Record<string, string> = {
  "Study Visa": "#2F5FE0",
  "Work Abroad": "#0FA968",
  Career: "#E08A17",
  English: "#DB5BA8",
  Scholarships: "#6B4CE0",
  "Student Life": "#0EA5E9",
  Technology: "#475569",
  General: "#64748B",
};

function catColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#64748B";
}

function BlogCard({ b }: { b: BlogCardData }) {
  const accent = catColor(b.category);
  return (
    <Link
      href={`/blogs/${b.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_22px_44px_-24px_rgba(18,32,67,0.28)]"
      style={{ borderColor: "var(--line)", boxShadow: "0 4px 20px -14px rgba(18,32,67,0.14)" }}
    >
      {b.cover ? (
        <div className="relative h-[200px] w-full overflow-hidden">
          <Image
            src={b.cover}
            alt={b.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div
          className="flex h-[200px] w-full items-center justify-center"
          style={{
            background: `linear-gradient(150deg, ${accent}1A, ${accent}05 70%)`,
          }}
        >
          <BookOpen size={40} strokeWidth={1.4} style={{ color: accent }} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            {b.category}
          </span>
          {b.featured && (
            <span
              className="rounded-full px-2.5 py-[3px] font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ background: "rgba(224,138,23,0.12)", color: "#B7791F" }}
            >
              Featured
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-[17px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {b.title}
        </h3>

        {b.excerpt && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "var(--body)" }}>
            {b.excerpt}
          </p>
        )}

        <div className="min-h-[12px] flex-1" />

        <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-3 text-[11.5px]" style={{ color: "var(--body)" }}>
            <span className="flex items-center gap-1">
              <CalendarDays size={12} /> {formatDate(b.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {readingTime(b.excerpt)} min
            </span>
          </div>
          <span
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-white transition-all duration-200 group-hover:translate-x-[2px]"
            style={{ background: accent }}
          >
            <ArrowRight size={14} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PublicBlogList() {
  const [blogs, setBlogs] = useState<BlogCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/blogs", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load blogs");
        return res.json();
      })
      .then((data) => {
        if (alive) {
          setBlogs(data.blogs ?? []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load blogs");
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of blogs) map.set(b.category, (map.get(b.category) ?? 0) + 1);
    return map;
  }, [blogs]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(counts.keys())];
  }, [counts]);

  const featured = useMemo(
    () => blogs.find((b) => b.featured) ?? null,
    [blogs]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogs
      .filter((b) => (category === "All" ? true : b.category === category))
      .filter(
        (b) =>
          !q ||
          b.title.toLowerCase().includes(q) ||
          (b.excerpt ?? "").toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      )
      .sort(
        (a, b) =>
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime()
      );
  }, [blogs, category, query]);

  const latest = visible.filter((b) => !featured || b.id !== featured.id).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pt-[clamp(116px,15vh,150px)] pb-[clamp(48px,6vw,72px)]">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(rgba(18,32,67,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.04) 1px, transparent 1px), radial-gradient(680px 420px at 12% 6%, rgba(15,169,104,0.10), transparent 60%), radial-gradient(560px 380px at 92% 88%, rgba(107,76,224,0.08), transparent 60%)",
            backgroundSize: "40px 40px, 40px 40px, auto, auto",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--brand-2)", boxShadow: "0 8px 20px -14px rgba(18,32,67,0.25)" }}
          >
            <PenLine size={12} />
            FlyBridge Blog
          </span>

          <h1 className="mt-5 font-display font-semibold leading-[1.08] tracking-[-0.02em]" style={{ fontSize: "clamp(32px,4vw,46px)", color: "var(--ink)" }}>
            Ideas for the journey
            <br />
            to your <span style={{ color: "var(--brand-2)" }}>future abroad</span>
          </h1>

          <p className="mt-5 max-w-[540px] text-[15.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
            Practical guides and honest insights on visas, scholarships, English,
            careers and student life — written to help ambitious people prepare for
            international opportunities.
          </p>

          <div className="relative mt-8 max-w-[520px]">
            <Search size={17} className="absolute left-[18px] top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blog posts…"
              className="w-full rounded-full border bg-white pl-11 pr-5 py-[14px] text-[14.5px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
              style={{ borderColor: "var(--line)", color: "var(--ink)", boxShadow: "0 18px 44px -26px rgba(18,32,67,0.35)" }}
            />
          </div>
        </div>
      </section>

      {/* Featured banner */}
      {!loading && featured && (
        <section className="pb-4">
          <div className="mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
            <Link
              href={`/blogs/${featured.slug}`}
              className="group grid overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_30px_60px_-24px_rgba(18,32,67,0.3)] sm:grid-cols-[1fr_260px]"
              style={{ borderColor: `${catColor(featured.category)}22`, boxShadow: "0 10px 30px -18px rgba(18,32,67,0.18)" }}
            >
              <div className="flex flex-col items-start p-6 sm:p-8">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-white"
                  style={{ background: "#E08A17" }}
                >
                  Featured
                </span>
                <span
                  className="mt-4 inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: catColor(featured.category) }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: catColor(featured.category) }} />
                  {featured.category}
                </span>
                <h2 className="mt-3 font-display text-[clamp(21px,2.4vw,28px)] font-semibold leading-tight tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed" style={{ color: "var(--body)" }}>
                    {featured.excerpt}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold text-white transition-all duration-200 hover:opacity-90 group-hover:translate-y-[-1px]"
                    style={{ background: catColor(featured.category) }}
                  >
                    Read article
                    <ArrowRight size={15} />
                  </span>
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-3 text-[12.5px] font-medium"
                    style={{ borderColor: "var(--line)", color: "var(--body)" }}
                  >
                    <Clock size={13} /> {readingTime(featured.excerpt)} min read
                    <span className="flex items-center gap-1">
                      <Eye size={13} /> {featured.viewCount}
                    </span>
                  </span>
                </div>
              </div>
              {featured.cover ? (
                <div className="relative h-[200px] w-full min-h-[200px] sm:h-full">
                  <Image
                    src={featured.cover}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 260px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="flex min-h-[200px] items-center justify-center"
                  style={{
                    background: `linear-gradient(160deg, ${catColor(featured.category)}, ${catColor(featured.category)}CC)`,
                  }}
                >
                  <BookOpen size={44} strokeWidth={1.6} style={{ color: "#fff" }} />
                </div>
              )}
            </Link>
          </div>
        </section>
      )}

      {/* Category filter + grid */}
      <section className="pb-[110px]">
        <div className="mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="shrink-0 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition-colors duration-200 hover:border-brand-2/50 hover:text-[var(--brand-2)]"
                  style={{
                    background: active ? "var(--brand)" : "transparent",
                    borderColor: active ? "var(--brand)" : "var(--line)",
                    color: active ? "#fff" : "var(--ink)",
                  }}
                >
                  {c === "All" ? "All posts" : c}
                  {c !== "All" && <span style={{ opacity: 0.6 }}> {counts.get(c) ?? 0}</span>}
                </button>
              );
            })}
          </div>

          <div className="mb-8 mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[clamp(24px,2.6vw,32px)] font-medium leading-tight tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                {query.trim() ? `Results for “${query.trim()}”` : category === "All" ? "Latest articles" : `${category} articles`}
              </h2>
              <p className="mt-[6px] text-[14px]" style={{ color: "var(--body)" }}>
                {blogs.length === 0 ? "Fresh writing is on the way." : `${visible.length} ${visible.length === 1 ? "post" : "posts"}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border bg-white" style={{ borderColor: "var(--line)", height: 380 }} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>Couldn&apos;t load blogs</p>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>{error}</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border bg-white px-6 py-16 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                {blogs.length === 0 ? "No articles published yet" : "No matches"}
              </p>
              <p className="mt-1 text-[13.5px]" style={{ color: "var(--body)" }}>
                {blogs.length === 0 ? "Check back soon — articles are on the way." : "Try a different search or category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((b) => (
                <BlogCard key={b.id} b={b} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}