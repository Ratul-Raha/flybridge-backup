"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Plus, Trash2, Upload, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";

type Lesson = { title: string; duration: string; videoUrl: string; pdfUrl: string };
type Module = { title: string; lessons: Lesson[] };

type Course = {
  id: string;
  slug: string;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  pace: string;
  price: number;
  currency: string;
  image: string | null;
  published: boolean;
  featured: boolean;
  upcoming: boolean;
  enrollmentCount?: number;
  modules: Module[];
};

type FormState = {
  title: string;
  slug: string;
  badge: string;
  subtitle: string;
  description: string;
  level: string;
  language: string;
  pace: string;
  price: string;
  currency: string;
  image: string;
  published: boolean;
  featured: boolean;
  upcoming: boolean;
  modules: Module[];
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60";

const emptyForm: FormState = {
  title: "",
  slug: "",
  badge: "",
  subtitle: "",
  description: "",
  level: "",
  language: "",
  pace: "",
  price: "",
  currency: "USD",
  image: "",
  published: false,
  featured: false,
  upcoming: false,
  modules: [],
};

function emptyLesson(): Lesson {
  return { title: "", duration: "", videoUrl: "", pdfUrl: "" };
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads?scope=courses", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.asset?.url ?? "";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/courses?all=true", { cache: "no-store" });
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
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
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      level: c.level ?? "",
      language: c.language ?? "",
      pace: c.pace ?? "",
      price: c.price ? String(c.price) : "",
      currency: c.currency ?? "USD",
      image: c.image ?? "",
      published: c.published ?? false,
      featured: c.featured ?? false,
      upcoming: c.upcoming ?? false,
      modules: (c.modules ?? []).map((m) => ({
        title: m.title,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          duration: l.duration ?? "",
          videoUrl: l.videoUrl ?? "",
          pdfUrl: l.pdfUrl ?? "",
        })),
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
          modules: form.modules.filter((m) => m.title.trim() || m.lessons.length > 0),
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
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Price</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0 = free"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="USD"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
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
                  <div key={mi} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
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
                        <div key={li} className="rounded-xl border p-3 flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
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

      <div className="flex flex-col gap-5">
        {courses.map((c) => {
          const lessonCount = c.modules.reduce((n, m) => n + m.lessons.length, 0);
          return (
            <div key={c.id} className="rounded-[24px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
              <div className="flex flex-col sm:flex-row">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.title} className="w-full sm:w-[220px] sm:min-h-[140px] h-[150px] sm:h-auto object-cover" />
                ) : (
                  <div
                    className="w-full sm:w-[220px] h-[150px] sm:h-auto shrink-0 flex items-center justify-center"
                    style={{
                      background:
                        c.price > 0
                          ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
                          : "linear-gradient(135deg,#0FA968,#18A97A)",
                    }}
                  >
                    <BookOpen className="w-8 h-8 text-white/80" />
                  </div>
                )}

                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                      style={
                        c.price > 0
                          ? { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                          : { background: "var(--brand-soft)", color: "var(--brand)" }
                      }
                    >
                      {c.price > 0 ? `Paid · ${c.currency} ${c.price}` : "Free"}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                      {c.modules.length} modules
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                      {lessonCount} lessons
                    </span>
                    {c.enrollmentCount !== undefined && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                        {c.enrollmentCount} {c.enrollmentCount === 1 ? "member" : "members"}
                      </span>
                    )}
                    {!c.published && (
                      <span
                        className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                        style={{ background: "#FDF1F0", color: "#C0392B" }}
                      >
                        Draft
                      </span>
                    )}
                    {c.upcoming && (
                      <span
                        className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                        style={{ background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }}
                      >
                        Upcoming
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                    {c.title}
                  </h3>
                  <p className="text-[12.5px] font-mono mt-0.5" style={{ color: "var(--body)" }}>
                    /{c.slug}
                  </p>
                  {c.description && (
                    <p className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--body)" }}>
                      {c.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <Link
                      href={`/dashboard/courses/${c.slug}/enrollments`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                      style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                    >
                      <Users size={13} />
                      See registered members{c.enrollmentCount ? ` (${c.enrollmentCount})` : ""}
                    </Link>
                    {c.published && (
                      <Link
                        href={`/dashboard/courses/${c.slug}/learn`}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                        style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                      >
                        <BookOpen size={13} />
                        Open player
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                      style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      disabled={deletingId === c.id}
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-4 py-[8px] transition-all duration-200 disabled:opacity-50"
                      style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                    >
                      {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : null}
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {courses.length === 0 && !formOpen && (
          <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
            No courses yet — click "New course" to create your first one.
          </p>
        )}
      </div>
    </div>
  );
}
