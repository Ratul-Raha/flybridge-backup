"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Link2,
  PenLine,
  Share2,
  Sparkles,
} from "lucide-react";
import { RichMarkdown } from "./rich-markdown";
import type { BlogCardData } from "./public-blog-list";
import { outboundLink } from "@/lib/outbound-link";

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

function shortDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

/* ------------------------------------------------------------------ */
/*  Table of contents                                                  */
/* ------------------------------------------------------------------ */

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
    <nav className="space-y-0.5">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className="block rounded-lg px-3 py-[7px] text-[12.5px] leading-snug transition-colors duration-150"
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

/* ------------------------------------------------------------------ */
/*  Share card (with banner thumbnail)                                 */
/* ------------------------------------------------------------------ */

function SocialIcon({ name, className }: { name: "x" | "facebook" | "linkedin" | "whatsapp"; className?: string }) {
  if (name === "x")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (name === "facebook")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    );
  if (name === "linkedin")
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ShareCard({ blog }: { blog: BlogDetailData }) {
  const [copied, setCopied] = useState(false);
  const accent = catColor(blog.category);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/blogs/${blog.slug}`
      : `https://flybridgeedu.com/blogs/${blog.slug}`;
  const shareText = encodeURIComponent(`${blog.title} — FlyBridge Blog`);

  const socials = [
    {
      name: "X",
      color: "#111111",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${shareText}`,
      icon: "x",
    },
    {
      name: "Facebook",
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: "facebook",
    },
    {
      name: "LinkedIn",
      color: "#0A66C2",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: "linkedin",
    },
    {
      name: "WhatsApp",
      color: "#25D366",
      href: `https://wa.me/?text=${shareText}%20${encodeURIComponent(url)}`,
      icon: "whatsapp",
    },
  ] as const;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "var(--line)", boxShadow: "0 12px 32px -22px rgba(18,32,67,0.3)" }}>
      {/* Banner thumbnail with gradient overlay */}
      <div className="relative h-[132px] w-full overflow-hidden">
        {blog.cover ? (
          <Image src={blog.cover} alt="" fill sizes="(max-width: 640px) 100vw, 880px" className="object-cover" />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{ background: `linear-gradient(150deg, ${accent}1F, ${accent}0A 70%)` }}
          >
            <BookOpen size={30} strokeWidth={1.5} style={{ color: accent }} />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(18,32,67,0.85), rgba(18,32,67,0.15) 60%)`,
          }}
        />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/85">
            <span style={{ color: "#ffffff" }}>
            <Sparkles size={11} />
            </span>
            Share this article
          </p>
        </div>
      </div>

      <div className="p-4">
        {/* Social buttons */}
        <div className="grid grid-cols-4 gap-2">
          {socials.map((s) => (
            <a
              key={s.name}
              href={outboundLink(s.href, { label: `blog-share:${s.name}` }) ?? s.href}
              target="_blank"
              rel="noreferrer"
              title={`Share on ${s.name}`}
              aria-label={`Share on ${s.name}`}
              className="flex h-10 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_18px_-10px_rgba(18,32,67,0.35)]"
              style={{ borderColor: "var(--line)", color: s.color, background: `${s.color}0D` }}
            >
              <SocialIcon name={s.icon} className="h-[15px] w-[15px]" />
            </a>
          ))}
        </div>

        <div className="my-3.5 flex items-center gap-3">
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#A6ADC0" }}>
            or
          </span>
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        </div>

        {/* Copy link with thumbnail hint */}
        <button
          type="button"
          onClick={copy}
          className="group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 hover:bg-[var(--bg-soft)]"
          style={{
            borderColor: copied ? "rgba(15,169,104,0.4)" : "var(--line)",
            background: copied ? "rgba(15,169,104,0.06)" : "#fff",
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: copied ? "rgba(15,169,104,0.12)" : "var(--brand-soft)",
              color: copied ? "#0FA968" : "var(--brand-2)",
            }}
          >
            {copied ? <Check size={16} /> : <Link2 size={16} />}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-[12.5px] font-semibold" style={{ color: copied ? "#0FA968" : "var(--ink)" }}>
              {copied ? "Link copied!" : "Copy link"}
            </span>
            <span className="block truncate text-[10.5px]" style={{ color: "var(--body)" }}>
              {copied ? "Paste it anywhere with the thumbnail preview" : "flybridgeedu.com/blogs/…"}
            </span>
          </span>
          {copied ? <Check size={14} style={{ color: "#0FA968" }} /> : <Copy size={14} style={{ color: "var(--body)" }} />}
        </button>

        <p className="mt-3 flex items-center gap-1.5 text-center text-[10.5px]" style={{ color: "var(--body)" }}>
          <Share2 size={11} />
          Linked posts show the banner image as a preview on social media.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent post cards                                                  */
/* ------------------------------------------------------------------ */

function RecentCard({ r }: { r: BlogCardData }) {
  const accent = catColor(r.category);
  return (
    <Link
      href={`/blogs/${r.slug}`}
      className="group flex gap-4 rounded-2xl border bg-white p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-24px_rgba(18,32,67,0.3)]"
      style={{ borderColor: "var(--line)" }}
    >
      <span className="relative h-[84px] w-[116px] shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: "var(--line)" }}>
        {r.cover ? (
          <Image src={r.cover} alt="" fill sizes="116px" className="object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center" style={{ background: `${accent}12`, color: accent }}>
            <BookOpen size={22} strokeWidth={1.6} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
          {r.category}
        </span>
        <span className="mt-1.5 line-clamp-2 block font-display text-[14px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
          {r.title}
        </span>
        <span className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: "var(--body)" }}>
          <CalendarDays size={11} /> {shortDate(r.publishedAt)}
          <span className="flex items-center gap-1">
            <Clock size={11} /> {readingTime(r.excerpt)} min
          </span>
        </span>
      </span>
      <ArrowUpRight size={14} className="shrink-0 text-[var(--body)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar related list                                               */
/* ------------------------------------------------------------------ */

function RelatedList({ posts }: { posts: BlogCardData[] }) {
  return (
    <div className="flex flex-col">
      {posts.map((r, idx) => (
        <div key={r.id}>
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
              <span className="mt-[2px] block text-[10.5px]" style={{ color: "var(--body)" }}>
                {shortDate(r.publishedAt)} · {readingTime(r.excerpt)} min
              </span>
            </span>
            <ChevronRight size={14} className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ color: "var(--body)" }} />
          </Link>
          {idx < posts.length - 1 && <div className="mx-3 h-px" style={{ background: "var(--line)" }} />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

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
  const recent = related;

  return (
    <main>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `radial-gradient(720px 320px at 14% 2%, ${accent}14, transparent 62%), radial-gradient(520px 300px at 94% 0%, rgba(107,76,224,0.07), transparent 60%)`,
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)] pt-[clamp(110px,14vh,148px)] pb-10">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-[13.5px] font-medium transition-opacity duration-200 hover:opacity-70"
            style={{ color: "var(--brand)" }}
          >
            <ArrowLeft size={15} /> Back to blog
          </Link>

          <div className="mt-7 max-w-[860px]">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-[6px]"
                style={{ borderColor: `${accent}33`, background: `${accent}0D`, color: accent }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                {blog.category}
              </span>
              <span style={{ color: "#A6ADC0" }}>·</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--body)" }}>
                <CalendarDays size={12} /> {formatDate(blog.publishedAt)}
              </span>
              <span style={{ color: "#A6ADC0" }}>·</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--body)" }}>
                <Clock size={12} /> {minutes} min read
              </span>
              <span style={{ color: "#A6ADC0" }}>·</span>
              <span className="inline-flex items-center gap-1.5" style={{ color: "var(--body)" }}>
                <Eye size={12} /> {blog.viewCount} views
              </span>
            </div>

            <h1 className="mt-5 font-display text-[clamp(30px,5vw,50px)] font-semibold leading-[1.08] tracking-[-0.022em] [overflow-wrap:anywhere]" style={{ color: "var(--ink)" }}>
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="mt-5 max-w-[680px] text-[17px] leading-[1.7]" style={{ color: "var(--body)" }}>
                {blog.excerpt}
              </p>
            )}

            <div className="mt-7 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full font-display text-[14px] font-semibold text-white"
                style={{ background: accent, boxShadow: `0 10px 22px -12px ${accent}AA` }}
              >
                {blog.author.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                    {blog.author}
                  </span>
                  <span className="rounded-full px-2 py-[3px] font-mono text-[9px] font-bold uppercase tracking-[0.1em]" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                    FlyBridge
                  </span>
                </div>
                <div className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  FlyBridge Education Group
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Banner image ===== */}
      {blog.cover && (
        <section className="relative z-10 mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
          <div className="relative h-[240px] w-full overflow-hidden rounded-[22px] border sm:h-[400px]" style={{ borderColor: "var(--line)", boxShadow: "0 30px 60px -30px rgba(18,32,67,0.4)" }}>
            <Image
              src={blog.cover}
              alt={blog.title}
              fill
              sizes="(max-width: 640px) 100vw, 1320px"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(18,32,67,0.35), transparent 55%)" }}
            />
          </div>
        </section>
      )}

      {/* ===== Three-column body ===== */}
      <section className="mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)] pb-20 pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[210px_minmax(0,1fr)_280px]">
          {/* Column 1: TOC */}
          <aside className={`order-2 lg:order-1 ${headings.length ? "lg:sticky lg:top-24 lg:self-start" : "hidden"}`}>
            {headings.length > 0 && (
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--body)" }}>
                  On this page
                </p>
                <TocCard headings={headings} />
              </div>
            )}
          </aside>

          {/* Column 2: Article */}
          <article className="order-1 min-w-0 lg:order-2">
            <div className="rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
              <div className="p-[clamp(22px,3.5vw,42px)]">
                <RichMarkdown content={blog.content} />

                {/* Tags / footer strip */}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6" style={{ borderColor: "var(--line)" }}>
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-[7px] font-mono text-[10.5px] font-bold uppercase tracking-[0.16em]"
                    style={{ borderColor: `${accent}33`, background: `${accent}0D`, color: accent }}
                  >
                    <PenLine size={12} /> {blog.category}
                  </span>
                  <Link
                    href="/blogs"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold transition-all duration-200 hover:translate-x-[2px]"
                    style={{ color: "var(--brand-2)" }}
                  >
                    Browse all articles <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile share */}
            <div className="mt-7 lg:hidden">
              <ShareCard blog={blog} />
            </div>
          </article>

          {/* Column 3: Sidebar */}
          <aside className="order-3 lg:sticky lg:top-24 lg:self-start">
            <div className="hidden flex-col gap-6 lg:flex">
              <ShareCard blog={blog} />

              {recent.length > 0 && (
                <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                  <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--body)" }}>
                    Recent posts
                  </p>
                  <RelatedList posts={recent.slice(0, 4)} />
                </div>
              )}

              <Link
                href="/programs"
                className="group rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_36px_-24px_rgba(18,32,67,0.3)]"
                style={{ borderColor: "var(--line)" }}
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
      </section>

      {/* ===== Recent posts section ===== */}
      {recent.length > 0 && (
        <section className="relative pb-[110px]">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(rgba(18,32,67,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(18,32,67,0.035) 1px, transparent 1px)",
              backgroundSize: "40px 40px, 40px 40px",
            }}
          />
          <div className="relative mx-auto w-full max-w-[1320px] px-[clamp(20px,4.5vw,56px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                  Keep reading
                </span>
                <h2 className="mt-2 font-display text-[clamp(24px,2.8vw,34px)] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                  Recent posts
                </h2>
              </div>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 rounded-full border px-5 py-[10px] text-[13px] font-semibold transition-all duration-200 hover:border-brand-2 hover:text-[var(--brand-2)]"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                View all posts
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.slice(0, 3).map((r) => (
                <RecentCard key={r.id} r={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}