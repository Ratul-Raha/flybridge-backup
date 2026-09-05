"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Eye,
  PenLine,
  Share2,
} from "lucide-react";
import { RichMarkdown, renderMarkdownHtml } from "./rich-markdown";
import type { BlogCardData } from "./public-blog-list";

export type BlogDetailData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover: string | null;
  author: string;
  publishedAt: string | null;
  viewCount: number;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(content: string) {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function extractHeadings(content: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  const cleaned = (content || "").replace(/```[\s\S]*?```/g, " ");
  const lines = cleaned.split("\n");
  lines.forEach((line) => {
    const m = line.trim().match(/^(#{2,4})\s+(.*)$/);
    if (m) {
      const text = m[2]
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
      headings.push({
        id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        text,
        level: m[1].length,
      });
    }
  });
  return headings;
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

function TocCard({ headings }: { headings: { id: string; text: string; level: number }[] }) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;
  return (
    <nav className="space-y-1">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className="block rounded-lg px-3 py-1.5 text-[12.5px] transition-colors duration-150"
          style={{
            paddingLeft: `${12 + (h.level - 2) * 14}px`,
            color: active === h.id ? "var(--brand-2)" : "var(--body)",
            background: active === h.id ? "var(--brand-soft)" : "transparent",
            fontWeight: active === h.id ? 600 : 400,
          }}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}

function RelatedCard({ r }: { r: BlogCardData }) {
  return (
    <Link
      href={`/blogs/${r.slug}`}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-[var(--bg-soft)]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${catColor(r.category)}12`, color: catColor(r.category) }}
      >
        <PenLine size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
          {r.title}
        </span>
        <span className="mt-[1px] flex items-center gap-2 text-[10.5px]" style={{ color: "var(--body)" }}>
          <CalendarDays size={10} /> {formatDate(r.publishedAt)}
        </span>
      </span>
      <ArrowUpRight size={14} className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ color: "var(--body)" }} />
    </Link>
  );
}

function ShareRow({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/blogs/${slug}` : "";

  const shareLinks = [
    {
      name: "Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: (
        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: (
        <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--body)" }}>
        Share
      </p>
      <div className="flex flex-col gap-2">
        {shareLinks.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition-colors duration-200 hover:bg-[var(--bg-soft)]"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <span style={{ color: "var(--brand-2)" }}>{s.icon}</span>
            {s.name}
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition-colors duration-200 hover:bg-[var(--bg-soft)]"
        style={{ borderColor: "var(--line)", color: copied ? "#0FA968" : "var(--ink)" }}
      >
        {copied ? <Check size={14} style={{ color: "#0FA968" }} /> : <Share2 size={14} style={{ color: "var(--brand-2)" }} />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

export function BlogDetail({
  blog,
  related,
}: {
  blog: BlogDetailData;
  related: BlogCardData[];
}) {
  const accent = catColor(blog.category);
  const headings = useMemo(() => extractHeadings(blog.content), [blog.content]);
  const minutes = readingTime(blog.content);

  return (
    <main>
      {/* Body */}
      <section className="px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,150px)] pb-20">
        <div className="mx-auto w-full max-w-[1320px]">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-[13.5px] font-medium transition-opacity duration-200 hover:opacity-70"
            style={{ color: "var(--brand)" }}
          >
            <ArrowLeft size={15} /> All articles
          </Link>

          {/* Hero */}
          <div className="mt-8 max-w-[840px]">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                {blog.category}
              </span>
              <span style={{ color: "var(--line)" }}>·</span>
              <span style={{ color: "var(--body)" }}>{formatDate(blog.publishedAt)}</span>
              <span style={{ color: "var(--line)" }}>·</span>
              <span style={{ color: "var(--body)" }}>{minutes} min read</span>
              <span style={{ color: "var(--line)" }}>·</span>
              <span className="inline-flex items-center gap-1" style={{ color: "var(--body)" }}>
                <Eye size={13} /> {blog.viewCount}
              </span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(28px,4.5vw,44px)] font-semibold leading-[1.12] tracking-[-0.02em] [overflow-wrap:anywhere]" style={{ color: "var(--ink)" }}>
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="mt-4 text-[17px] leading-relaxed" style={{ color: "var(--body)" }}>
                {blog.excerpt}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full font-display text-[13px] font-semibold text-white"
                style={{ background: accent }}
              >
                {blog.author.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {blog.author}
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  FlyBridge Education Group
                </div>
              </div>
            </div>
          </div>

          {blog.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blog.cover}
              alt={blog.title}
              className="mt-8 h-[260px] w-full rounded-2xl border object-cover sm:h-[380px]"
              style={{ borderColor: "var(--line)" }}
            />
          )}

          {/* Three-column article layout */}
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
            {/* Column 1: Table of contents */}
            <aside className={`order-2 lg:order-1 ${headings.length ? "lg:sticky lg:top-24 lg:self-start" : "hidden"}`}>
              {headings.length > 0 && (
                <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                  <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--body)" }}>
                    On this page
                  </p>
                  <TocCard headings={headings} />
                </div>
              )}
            </aside>

            {/* Column 2: Article */}
            <article className="order-1 lg:order-2 min-w-0">
              <div className="rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
                <div className="p-[clamp(22px,3.5vw,40px)]">
                  <RichMarkdown content={blog.content} />
                </div>
              </div>

              {/* Mobile share (shown under article on small screens) */}
              <div className="mt-6 lg:hidden">
                <ShareRow slug={blog.slug} title={blog.title} />
              </div>
            </article>

            {/* Column 3: Sidebar */}
            <aside className="order-3 lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border bg-white p-5 hidden lg:block" style={{ borderColor: "var(--line)" }}>
                  <ShareRow slug={blog.slug} title={blog.title} />
                </div>

                {related.length > 0 && (
                  <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                    <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--body)" }}>
                      Related articles
                    </p>
                    <div className="flex flex-col">
                      {related.slice(0, 4).map((r, idx) => (
                        <div key={r.id}>
                          <RelatedCard r={r} />
                          {idx < related.slice(0, 4).length - 1 && (
                            <div className="mx-2 h-px" style={{ background: "var(--line)" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href="/programs"
                  className="group rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-[2px]"
                  style={{ borderColor: "var(--line)", boxShadow: "0 10px 30px -20px rgba(18,32,67,0.25)" }}
                >
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--brand-2)" }}>
                    Build your path
                  </p>
                  <p className="mt-2 font-display text-[15px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                    Step-by-step programs to study and work abroad
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--body)" }}>
                    Practical, self-paced courses that turn plans into action.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-all duration-200 group-hover:translate-x-[2px]" style={{ color: "var(--brand-2)" }}>
                    Explore programs <ArrowUpRight size={14} />
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}