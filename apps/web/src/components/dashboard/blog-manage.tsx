"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { uploadToStorage } from "@/lib/upload-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { CardLoader, PageLoader } from "@/components/dashboard/page-loader";
import { MarkdownEditor } from "@/components/blogs/markdown-editor";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import {
  Check,
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

type BlogItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover: string | null;
  coverPublicId?: string | null;
  author: string;
  featured: boolean;
  published: boolean;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  cover: string;
  coverPublicId: string | null;
  featured: boolean;
  published: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: BLOG_CATEGORIES[0],
  author: "",
  cover: "",
  coverPublicId: null,
  featured: false,
  published: false,
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30";

const toolRowClass =
  "flex flex-col gap-2 md:flex-row md:items-center border rounded-lg px-4 py-3 bg-white";
const toolInputClass =
  "flex-1 text-[13.5px] rounded-lg border bg-white px-3.5 py-[9px] focus:outline-none focus:ring-2 focus:ring-brand-2/30";

function extractGeneratedFields(content: string): { excerpt: string } {
  // Grab first paragraph after title heading (if any) as a rough excerpt
  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const first = paragraphs.find((p) => !p.startsWith("#")) ?? "";
  return { excerpt: first.slice(0, 200) };
}

export function BlogManage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // AI generation
  const [genOpen, setGenOpen] = useState(false);
  const [genSubject, setGenSubject] = useState("");
  const [genTitle, setGenTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogs?all=true", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load blogs");
      setBlogs(data.blogs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filterBlogs(blogs, query, statusFilter);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setGenOpen(false);
    setFormOpen(true);
  };

  const openEdit = (b: BlogItem) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt ?? "",
      content: b.content ?? "",
      category: b.category ?? BLOG_CATEGORIES[0],
      author: b.author ?? "",
      cover: b.cover ?? "",
      coverPublicId: b.coverPublicId ?? null,
      featured: b.featured ?? false,
      published: b.published ?? false,
    });
    setFormOpen(true);
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const uploadCover = async (file: File) => {
    setError(null);
    setUploadingCover(true);
    try {
      const res = await uploadToStorage(file, "blogs");
      setForm((f) => ({ ...f, cover: res.ref, coverPublicId: res.key }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const generate = async () => {
    setError(null);
    if (!genSubject.trim() && !genTitle.trim()) {
      setError("Enter a subject or title for the blog to generate.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: genSubject, title: genTitle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      const { excerpt } = extractGeneratedFields(data.content);
      setForm({
        title: data.title ?? "",
        slug: slugify(data.title ?? genTitle ?? ""),
        excerpt: data.excerpt ?? excerpt,
        content: data.content ?? "",
        category: data.category ?? BLOG_CATEGORIES[0],
        author: data.author ?? user?.name ?? "",
        cover: "",
        coverPublicId: null,
        featured: false,
        published: false,
      });
      setGenOpen(false);
      setGenSubject("");
      setGenTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required — add one or generate a draft first.");
      return;
    }
    if (!form.content.trim()) {
      setError("Content is required — write the article body.");
      return;
    }
    const url = editingId ? `/api/blogs/${editingId}` : "/api/blogs";
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          author: form.author,
cover: form.cover,
      coverPublicId: form.coverPublicId,
      featured: form.featured,
          published: form.published,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFormOpen(false);
      setEditingId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: BlogItem) => {
    if (!confirm(`Delete blog "${b.title}"?`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`/api/blogs/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return <PageLoader label="Loading…" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blogs"
        subtitle="Write, generate and publish articles on the FlyBridge blog."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={15} /> New blog post
          </button>
        }
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {formOpen && (
        <div className="rounded-lg border bg-white p-[clamp(20px,3vw,28px)]" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
              {editingId ? "Edit blog post" : "New blog post"}
            </h2>

            {!editingId && (
              <button
                type="button"
                onClick={() => setGenOpen((v) => !v)}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-[8px] text-[12.5px] font-semibold transition-colors duration-200 hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                style={{ borderColor: genOpen ? "var(--brand)" : "var(--line)", color: genOpen ? "var(--brand-2)" : "var(--ink)", background: genOpen ? "var(--brand-soft)" : "#fff" }}
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} style={{ color: "var(--brand-2)", fill: genOpen ? "var(--brand-2)" : "none" }} />}
                Generate with AI
              </button>
            )}
          </div>

          {/* AI generation card */}
          {genOpen && !editingId && (
            <div className="mb-6 rounded-lg border p-5" style={{ borderColor: "var(--line)", background: "linear-gradient(135deg, rgba(107,76,224,0.05), rgba(15,169,104,0.05))" }}>
              <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-2)" }}>
                <Sparkles size={13} /> Draft with AI
              </p>
              <p className="mt-1.5 text-[12.5px]" style={{ color: "var(--body)" }}>
                Give a subject and/or title — we&apos;ll write a full markdown draft you can edit before publishing.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <div className={toolRowClass} style={{ borderColor: "var(--line)" }}>
                  <input
                    type="text"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    placeholder="Title / headline (optional)"
                    className={toolInputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
                <div className={toolRowClass} style={{ borderColor: "var(--line)" }}>
                  <input
                    type="text"
                    value={genSubject}
                    onChange={(e) => setGenSubject(e.target.value)}
                    placeholder="Subject, e.g. “How to choose a US student visa interview date”"
                    className={toolInputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="mt-4 inline-flex items-center gap-2 rounded-full text-white text-[13px] font-semibold px-6 py-[10px] transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--brand)" }}
              >
                {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {generating ? "Writing draft…" : "Generate draft"}
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: editingId ? form.slug : slugify(e.target.value),
                  })
                }
                placeholder="e.g. How to prepare for your US visa interview"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Author
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="e.g. FlyBridge Education Group"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Excerpt (shown on cards &amp; search)
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="A 1–2 sentence summary of the article."
                rows={2}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Cover image (optional)
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCover(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-[10px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  {uploadingCover ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                  {form.cover ? "Replace cover" : "Upload cover"}
                </button>
                {form.cover ? (
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.cover} alt="Cover preview" className="h-12 w-20 rounded-lg border object-cover" style={{ borderColor: "var(--line)" }} />
                    <button type="button" onClick={() => setForm({ ...form, cover: "" })} className="text-[12px] font-medium" style={{ color: "#C0392B" }}>
                      Remove
                    </button>
                  </span>
                ) : (
                  <span className="hidden sm:flex items-center gap-1.5 text-[12px]" style={{ color: "var(--body)" }}>
                    <Check size={13} style={{ color: "#0FA968" }} /> Optional — shows at the top of the article
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Content * (Markdown)
              </label>
              <MarkdownEditor
                value={form.content}
                onChange={(v) => setForm({ ...form, content: v })}
                placeholder={"## Write your article here…\n\nUse the toolbar to format, or type Markdown directly.\n\n- Bullet lists\n- **Bold** and *italic*\n- [links](https://)\n"}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none md:col-span-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                Publish to the blog
              </span>
              <span className="text-[12px]" style={{ color: "var(--body)" }}>
                (uncheck to keep as a draft)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none md:col-span-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                Feature at the top of the blog page
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create blog post"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="text-[13.5px] font-medium px-4 py-[11px]"
              style={{ color: "var(--body)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading && <CardLoader label="Loading blogs…" />}
      {!loading && blogs.length === 0 && !formOpen ? (
        <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
          No blog posts yet — click &quot;New blog post&quot; to write one, or generate a draft with AI.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-white p-3 flex flex-col md:flex-row gap-3" style={{ borderColor: "var(--line)" }}>
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts…"
                className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-[13.5px]" style={{ color: "var(--body)" }}>
                No posts match your search or filters.
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map((b, idx) => (
                  <div
                    key={b.id}
                    className={`group flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${idx > 0 ? "border-t" : ""}`}
                    style={{ borderColor: "var(--line)" }}
                  >
                    {b.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover} alt="" className="hidden sm:block h-12 w-20 shrink-0 rounded-lg border object-cover" style={{ borderColor: "var(--line)" }} />
                    ) : (
                      <span className="hidden sm:flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: "var(--line)", background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                        <FileText size={18} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                          {b.title}
                        </span>
                        {b.featured && (
                          <span className="shrink-0 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ background: "rgba(224,138,23,0.12)", color: "#B7791F" }}>
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]" style={{ color: "var(--body)" }}>
                        <span>{b.category}</span>
                        <span>·</span>
                        <span>{b.viewCount} views</span>
                        <span>·</span>
                        <span>{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                        <span
                          className="rounded-full px-2 py-[2px] font-mono text-[9px] font-bold uppercase tracking-[0.08em]"
                          style={
                            b.published
                              ? { background: "rgba(15,169,104,0.12)", color: "#0FA968" }
                              : { background: "rgba(100,116,139,0.12)", color: "#64748B" }
                          }
                        >
                          {b.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/blogs/${b.slug}`}
                        target={b.published ? "_blank" : undefined}
                        rel={b.published ? "noreferrer" : undefined}
                        title={b.published ? "View post" : "Not published yet"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
                        style={{ color: "var(--body)" }}
                        aria-disabled={!b.published}
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(b)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
                        style={{ color: "var(--body)" }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title={deletingId === b.id ? "Deleting" : "Delete"}
                        onClick={() => remove(b)}
                        disabled={deletingId === b.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#FDF1F0] disabled:opacity-50"
                        style={{ color: "#C0392B" }}
                      >
                        {deletingId === b.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[12.5px]" style={{ color: "var(--body)" }}>
            Showing {filtered.length} of {blogs.length} posts
          </p>
        </div>
      )}
    </div>
  );
}

function filterBlogs(blogs: BlogItem[], query: string, status: string) {
  const q = query.trim().toLowerCase();
  return blogs.filter((b) => {
    if (status === "published" && !b.published) return false;
    if (status === "draft" && b.published) return false;
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.excerpt ?? "").toLowerCase().includes(q) ||
      (b.category ?? "").toLowerCase().includes(q)
    );
  });
}