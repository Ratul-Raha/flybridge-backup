"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Heart, Loader2, Plus, Trash2, Upload, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { uploadToStorage } from "@/lib/upload-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { COURSE_CATEGORIES } from "@/lib/course-categories";

type Lesson = { title: string; duration: string; videoUrl: string; pdfUrl: string; content: string };
type Module = { title: string; lessons: Lesson[] };
type Book = { title: string; description: string; pdfUrl: string };

type Course = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  category: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  pace: string;
  price: number;
  currency: string;
  prices?: { USD?: number; BDT?: number } | null;
  waitlistEnabled?: boolean;
  wishlistDiscountPercent?: number;
  image: string | null;
  published: boolean;
  featured: boolean;
  upcoming: boolean;
  enrollmentCount?: number;
  wishlistCount?: number;
  modules: Module[];
  books: Book[];
};

type FormState = {
  title: string;
  slug: string;
  badge: string;
  category: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  pace: string;
  price: string;
  bdtPrice: string;
  currency: string;
  waitlistEnabled: boolean;
  wishlistDiscountPercent: string;
  image: string;
  published: boolean;
  featured: boolean;
  upcoming: boolean;
  certificateEnabled: boolean;
  modules: Module[];
  books: Book[];
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60";

const emptyForm: FormState = {
  title: "",
  slug: "",
  badge: "",
  category: "",
  subtitle: "",
  description: "",
  level: "",
  language: "",
  pace: "",
  price: "",
  bdtPrice: "",
  currency: "USD",
  waitlistEnabled: false,
  wishlistDiscountPercent: "0",
  image: "",
  published: false,
  featured: false,
  upcoming: false,
  certificateEnabled: true,
  modules: [],
  books: [],
};

function emptyLesson(): Lesson {
  return { title: "", duration: "", videoUrl: "", pdfUrl: "", content: "" };
}

async function uploadFile(file: File): Promise<string> {
  const res = await uploadToStorage(file, "courses");
  return res.ref;
}

export function CourseManage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses?all=true", { cache: "no-store" });
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      slug: c.slug,
      badge: c.badge ?? "",
      category: c.category ?? "",
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      level: c.level ?? "",
      language: c.language ?? "",
      pace: c.pace ?? "",
      price: c.price ? String(c.price) : "",
      bdtPrice: c.prices?.BDT ? String(c.prices.BDT) : "",
      currency: c.currency ?? "USD",
      waitlistEnabled: c.waitlistEnabled ?? false,
      wishlistDiscountPercent:
        c.wishlistDiscountPercent != null ? String(c.wishlistDiscountPercent) : "0",
      image: c.image ?? "",
      published: c.published ?? false,
      featured: c.featured ?? false,
      upcoming: c.upcoming ?? false,
      certificateEnabled: c.certificateEnabled ?? true,
      modules: (c.modules ?? []).map((m) => ({
        title: m.title,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          duration: l.duration ?? "",
          videoUrl: l.videoUrl ?? "",
          pdfUrl: l.pdfUrl ?? "",
          content: l.content ?? "",
        })),
      })),
      books: (c.books ?? []).map((b) => ({
        title: b.title,
        description: b.description ?? "",
        pdfUrl: b.pdfUrl,
      })),
    });
    setFormOpen(true);
  };

  const save = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    const url = editingId ? `/api/courses/${editingId}` : "/api/courses";
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price) || 0,
          prices: {
            USD: Number(form.price) || 0,
            BDT: Number(form.bdtPrice) || 0,
          },
          wishlistDiscountPercent: Math.max(
            0,
            Math.min(100, Number(form.wishlistDiscountPercent) || 0)
          ),
          modules: form.modules.filter((m) => m.title.trim() || m.lessons.length > 0),
          books: form.books.filter((b) => b.title.trim() && b.pdfUrl),
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

  const remove = async (c: Course) => {
    if (!confirm(`Delete course "${c.title}"? This also removes its enrollments.`)) return;
    setDeletingId(c.id);
    try {
      const res = await fetch(`/api/courses/${c.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFile = async (file: File | undefined, apply: (url: string) => void) => {
    if (!file || uploading) return;
    const key = `${file.name}-${Date.now()}`;
    setUploading(key);
    try {
      const url = await uploadFile(file);
      if (!url) throw new Error("Upload returned no URL");
      apply(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const updateModule = (mi: number, patch: Partial<Module>) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)),
    }));
  };

  const updateLesson = (mi: number, li: number, patch: Partial<Lesson>) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.map((m, i) =>
        i === mi
          ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) }
          : m
      ),
    }));
  };

  if (!user) return <p style={{ color: "var(--body)" }}>Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses"
        subtitle="Create and manage courses, modules and lessons."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            + New course
          </button>
        }
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {formOpen && (
        <div className="rounded-[24px] border bg-white p-[clamp(20px,3vw,28px)]" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-[16px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
            {editingId ? "Edit course" : "New course"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Student Visa Blueprint™"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="Auto-generated from title if empty"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Badge</label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="e.g. STUDY ABROAD"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <option value="">None</option>
                {COURSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Short tagline"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What will students learn?"
                rows={3}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Level</label>
              <input
                type="text"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="e.g. Beginner"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Language</label>
              <input
                type="text"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="e.g. English"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Pace</label>
              <input
                type="text"
                value={form.pace}
                onChange={(e) => setForm({ ...form, pace: e.target.value })}
                placeholder="e.g. Self-paced"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0 = free"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Price (BDT)</label>
              <input
                type="number"
                min="0"
                value={form.bdtPrice}
                onChange={(e) => setForm({ ...form, bdtPrice: e.target.value })}
                placeholder="optional, e.g. 3480"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Primary currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="USD"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Waitlist
              </label>
              <label className="flex items-center gap-2.5 text-[13.5px]" style={{ color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  checked={form.waitlistEnabled}
                  onChange={(e) => setForm({ ...form, waitlistEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border"
                  style={{ accentColor: "var(--brand)" }}
                />
                Enable waitlist for this course
              </label>
              <div className="flex flex-col gap-2">
                <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  Waitlist discount (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!form.waitlistEnabled}
                  value={form.wishlistDiscountPercent}
                  onChange={(e) =>
                    setForm({ ...form, wishlistDiscountPercent: e.target.value })
                  }
                  placeholder="e.g. 10"
                  className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
                <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                  Discount for people who join this course&apos;s waitlist. Only applies when
                  the waitlist is enabled.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://… or upload"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading !== null}
                  className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium rounded-xl border px-4 py-[11px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200 disabled:opacity-60"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFile(e.target.files?.[0] ?? undefined, (url) =>
                      setForm((f) => ({ ...f, image: url }))
                    )
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-[13.5px] font-medium md:col-span-2 cursor-pointer" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={form.certificateEnabled}
                onChange={(e) => setForm({ ...form, certificateEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              Certificate enabled (show certificate button in player)
            </label>
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium md:col-span-2 cursor-pointer" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4"
              />
              Published (visible on public course pages)
            </label>
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium md:col-span-2 cursor-pointer" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4"
              />
              Featured
            </label>
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium md:col-span-2 cursor-pointer" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={form.upcoming}
                onChange={(e) => setForm({ ...form, upcoming: e.target.checked })}
                className="w-4 h-4"
              />
              Coming soon (upcoming — not yet available for enrollment)
            </label>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Curriculum
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, modules: [...f.modules, { title: "", lessons: [] }] }))
                  }
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white rounded-full px-4 py-[8px] hover:opacity-90 transition-opacity"
                  style={{ background: "var(--brand)" }}
                >
                  <Plus size={13} />
                  Add module
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {form.modules.map((m, mi) => (
                  <div key={mi} className="rounded-lg border p-4" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => updateModule(mi, { title: e.target.value })}
                        placeholder={`Module ${mi + 1} title`}
                        className={inputClass}
                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            modules: f.modules.filter((_, i) => i !== mi),
                          }))
                        }
                        className="shrink-0 p-[10px] rounded-lg border"
                        style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                        aria-label="Remove module"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {m.lessons.map((l, li) => (
                        <div key={li} className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={l.title}
                              onChange={(e) => updateLesson(mi, li, { title: e.target.value })}
                              placeholder="Lesson title"
                              className={inputClass}
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            />
                            <input
                              type="text"
                              value={l.duration}
                              onChange={(e) => updateLesson(mi, li, { duration: e.target.value })}
                              placeholder="Duration"
                              className={inputClass + " !w-[110px]"}
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  modules: f.modules.map((x, i) =>
                                    i === mi ? { ...x, lessons: x.lessons.filter((_, j) => j !== li) } : x
                                  ),
                                }))
                              }
                              className="shrink-0 p-[10px] rounded-lg border"
                              style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                              aria-label="Remove lesson"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={l.videoUrl}
                              onChange={(e) => updateLesson(mi, li, { videoUrl: e.target.value })}
                              placeholder="Video URL (Cloudinary)"
                              className={inputClass}
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            />
                            <label
                              className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-lg border px-3 py-[10px] cursor-pointer hover:border-brand-2 hover:text-brand-2 transition-all duration-200 disabled:opacity-60"
                              style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                            >
                              {uploading === `video-${mi}-${li}` ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Upload size={12} />
                              )}
                              Video
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleFile(e.target.files?.[0] ?? undefined, (url) =>
                                    updateLesson(mi, li, { videoUrl: url })
                                  )
                                }
                              />
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={l.pdfUrl}
                              onChange={(e) => updateLesson(mi, li, { pdfUrl: e.target.value })}
                              placeholder="PDF / notes URL"
                              className={inputClass}
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            />
                            <label
                              className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-lg border px-3 py-[10px] cursor-pointer hover:border-brand-2 hover:text-brand-2 transition-all duration-200 disabled:opacity-60"
                              style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                            >
                              {uploading === `pdf-${mi}-${li}` ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Upload size={12} />
                              )}
                              PDF
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) =>
                                  handleFile(e.target.files?.[0] ?? undefined, (url) =>
                                    updateLesson(mi, li, { pdfUrl: url })
                                  )
                                }
                              />
                            </label>
                          </div>
                          <textarea
                            value={l.content}
                            onChange={(e) => updateLesson(mi, li, { content: e.target.value })}
                            placeholder="Lesson text content (optional) — used by IELTS quizzes"
                            rows={4}
                            className={inputClass + " resize-y"}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateModule(mi, { lessons: [...m.lessons, emptyLesson()] })
                        }
                        className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                        style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                      >
                        <Plus size={12} />
                        Add lesson
                      </button>
                    </div>
                  </div>
                ))}
                {form.modules.length === 0 && (
                  <p className="text-[13px]" style={{ color: "var(--body)" }}>
                    No modules yet — add your first module to build the curriculum.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Course Books ── */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                  Course Books
                </h3>
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  Add PDF books or reading materials for this course
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    books: [...f.books, { title: "", description: "", pdfUrl: "" }],
                  }))
                }
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                style={{ color: "var(--ink)", borderColor: "var(--line)" }}
              >
                <Plus size={12} />
                Add book
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {form.books.map((b, bi) => (
                <div
                  key={bi}
                  className="flex flex-col gap-2 rounded-lg border p-4"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={b.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({
                          ...f,
                          books: f.books.map((x, i) => (i === bi ? { ...x, title: val } : x)),
                        }));
                      }}
                      placeholder="Book title"
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          books: f.books.filter((_, i) => i !== bi),
                        }))
                      }
                      className="shrink-0 p-2 rounded-lg hover:bg-red-50 transition"
                      style={{ color: "#DC2626" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={b.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({
                        ...f,
                        books: f.books.map((x, i) => (i === bi ? { ...x, description: val } : x)),
                      }));
                    }}
                    placeholder="Short description (optional)"
                    className={inputClass}
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={b.pdfUrl}
                      readOnly
                      placeholder="PDF URL"
                      className={inputClass}
                      style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--bg-soft)" }}
                    />
                    <label
                      className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-lg border px-3 py-[10px] cursor-pointer hover:border-brand-2 hover:text-brand-2 transition-all duration-200 disabled:opacity-60"
                      style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                    >
                      <Upload size={12} />
                      {b.pdfUrl ? "Replace PDF" : "Upload PDF"}
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleFile(e.target.files?.[0] ?? undefined, (url) =>
                            setForm((f) => ({
                              ...f,
                              books: f.books.map((x, i) => (i === bi ? { ...x, pdfUrl: url } : x)),
                            }))
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              {form.books.length === 0 && (
                <p className="text-[13px]" style={{ color: "var(--body)" }}>
                  No books added yet — click &quot;Add book&quot; to include PDF materials.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create course"}
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

      {/* ── Stat cards ── */}
      {(() => {
        const totalLessons = courses.reduce((n, c) => n + c.modules.reduce((m, mod) => m + mod.lessons.length, 0), 0);
        const totalEnrollments = courses.reduce((n, c) => n + (c.enrollmentCount ?? 0), 0);
        const publishedCount = courses.filter((c) => c.published).length;

        const items = [
          { label: "TOTAL COURSES", value: courses.length, icon: BookOpen, gradient: "linear-gradient(135deg,#6E4CFF,#8B5CF6)", caption: `${publishedCount} published` },
          { label: "ENROLLMENTS", value: totalEnrollments, icon: Users, gradient: "linear-gradient(135deg,#0EA5E9,#38BDF8)", caption: "Active enrollments" },
          { label: "TOTAL LESSONS", value: totalLessons, icon: BookOpen, gradient: "linear-gradient(135deg,#10B981,#34D399)", caption: "Across all modules" },
          { label: "DRAFTS", value: courses.length - publishedCount, icon: BookOpen, gradient: "linear-gradient(135deg,#F59E0B,#F97316)", caption: "Not yet published" },
        ];

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((s) => (
              <div
                key={s.label}
                className="relative rounded-lg border bg-white p-5 overflow-hidden transition-transform duration-250 hover:translate-y-[-2px]"
                style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: s.gradient }} />
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white mb-4"
                  style={{ background: s.gradient, boxShadow: `0 8px 18px -6px ${s.gradient}66` }}
                >
                  <s.icon size={19} strokeWidth={2.2} />
                </div>
                <p className="font-display text-[26px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
                  {s.value.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--body)" }}>
                  {s.label}
                </p>
                <p className="text-[11.5px] mt-2.5 font-medium" style={{ color: "var(--body)" }}>
                  {s.caption}
                </p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Course table ── */}
      {loading ? (
        <div className="rounded-lg border bg-white p-16 text-center" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
          <Loader2 size={28} className="animate-spin mx-auto" style={{ color: "var(--brand)" }} />
          <p className="text-[14px] font-medium mt-5" style={{ color: "var(--body)" }}>
            Loading courses…
          </p>
        </div>
      ) : courses.length === 0 && !formOpen ? (
        <div className="rounded-lg border bg-white p-16 text-center" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
          <div className="w-14 h-14 rounded-lg mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
            <BookOpen size={22} style={{ color: "var(--body)" }} />
          </div>
          <p className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>No courses yet</p>
          <p className="text-[13px] mt-1.5 max-w-[260px] mx-auto" style={{ color: "var(--body)" }}>
            Create your first course to start building your curriculum.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-full text-white text-[13px] font-medium px-5 py-[10px] transition-all hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={14} />
            New course
          </button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}>
          {/* Table header */}
          <div
            className="hidden md:grid items-center px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              color: "var(--body)",
              background: "var(--bg-soft)",
              gridTemplateColumns: "44px 1fr 100px 90px 90px auto",
              gap: "16px",
            }}
          >
            <span />
            <span>Course</span>
            <span>Status</span>
            <span className="text-right">Content</span>
            <span className="text-right">Students</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          {courses.map((c, idx) => {
            const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
            const isPaid = c.price > 0;
            return (
              <div
                key={c.id}
                className="grid items-center px-5 transition-colors hover:bg-[var(--bg-soft)]/60"
                style={{
                  gridTemplateColumns: "44px 1fr 100px 90px 90px auto",
                  gap: "16px",
                  borderBottom: idx < courses.length - 1 ? "1px solid var(--line)" : "none",
                  minHeight: "56px",
                }}
              >
                {/* Thumbnail (click to open player) */}
                <Link
                  href={`/dashboard/courses/${c.slug}/learn`}
                  className="block w-fit"
                  title={`Open ${c.title}`}
                >
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="w-[40px] h-[40px] rounded-lg object-cover" />
                  ) : (
                    <div
                      className="w-[40px] h-[40px] rounded-lg flex items-center justify-center"
                      style={{
                        background: isPaid
                          ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                          : "linear-gradient(135deg,#0FA968,#18A97A)",
                      }}
                    >
                      <BookOpen size={15} className="text-white/70" />
                    </div>
                  )}
                </Link>

                {/* Title + slug (click to open player) */}
                <Link
                  href={`/dashboard/courses/${c.slug}/learn`}
                  className="min-w-0 group"
                  title={`Open ${c.title}`}
                >
                  <p className="text-[13.5px] font-semibold truncate leading-tight group-hover:text-brand-2 transition-colors" style={{ color: "var(--ink)" }}>
                    {c.title}
                  </p>
                  <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: "var(--body)" }}>
                    /{c.slug}
                  </p>
                </Link>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium rounded-full px-2.5 py-[3px]"
                    style={
                      c.published
                        ? { background: "var(--mint-bg)", color: "var(--mint-ink)" }
                        : { background: "var(--bg-soft)", color: "var(--body)" }
                    }
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ background: c.published ? "var(--mint-ink)" : "#B0B8C9" }}
                    />
                    {c.published ? "Active" : "Draft"}
                  </span>
                  {c.upcoming && (
                    <span
                      className="text-[10px] font-semibold rounded-full px-2 py-[2px]"
                      style={{ background: "var(--lav-bg)", color: "var(--lav-ink)" }}
                    >
                      Soon
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-[12.5px] text-right tabular-nums" style={{ color: "var(--ink)" }}>
                  {c.modules.length} <span style={{ color: "var(--body)" }}>mod</span>{" "}
                  {lessonCount} <span style={{ color: "var(--body)" }}>les</span>
                </p>

                {/* Students */}
                <p className="text-[12.5px] text-right tabular-nums" style={{ color: "var(--ink)" }}>
                  {(c.enrollmentCount ?? 0).toLocaleString()}
                </p>

                {/* Actions — always visible */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full border px-3 py-[5px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                  </button>
                  <Link
                    href={`/dashboard/courses/${c.slug}/enrollments`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full border px-3 py-[5px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                    title="See registered members"
                  >
                    <Users size={12} />
                    {c.enrollmentCount ?? 0}
                  </Link>
                  <Link
                    href={`/dashboard/courses/${c.slug}/wishlist`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full border px-3 py-[5px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                    title="See waitlist / wishlist members"
                  >
                    <Heart size={12} />
                    {c.wishlistCount ?? 0}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    disabled={deletingId === c.id}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full border px-3 py-[5px] transition-all duration-200 disabled:opacity-50"
                    style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)" }}
                  >
                    {deletingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}