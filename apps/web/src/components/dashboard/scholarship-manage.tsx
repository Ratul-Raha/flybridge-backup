"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Award,
  Sparkles,
  UploadCloud,
  Trash2,
  Pencil,
  Search,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  School,
} from "lucide-react";
import { COUNTRIES, countryByCode } from "@/lib/countries";

type ScholarshipItem = {
  id: string;
  institution: string;
  rawText: string;
  title: string;
  description: string;
  country: string;
  countryCode: string;
  level: string;
  amount: string;
  deadline: string;
  eligibility: string;
  applyUrl: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
};

type UploadedImage = {
  url: string;
  publicId: string;
};

const LEVELS = ["any", "undergraduate", "graduate", "postgraduate", "school"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_LABELS: Record<Level, string> = {
  any: "Any level",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
  postgraduate: "Postgraduate",
  school: "School",
};

type FormState = {
  institution: string;
  rawText: string;
  title: string;
  description: string;
  country: string;
  countryCode: string;
  level: Level;
  amount: string;
  deadline: string;
  eligibility: string;
  applyUrl: string;
  active: boolean;
  image: UploadedImage | null;
};

const emptyForm: FormState = {
  institution: "",
  rawText: "",
  title: "",
  description: "",
  country: "",
  countryCode: "",
  level: "any",
  amount: "",
  deadline: "",
  eligibility: "",
  applyUrl: "",
  active: true,
  image: null,
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60";

const selectClass =
  "text-[13px] rounded-xl border bg-white px-3 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 cursor-pointer";

function uploadImage(
  file: File,
  onProgress: (pct: number) => void
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads?scope=scholarships");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data: { asset?: { url?: string; publicId?: string }; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.asset?.url) {
        resolve({ url: data.asset.url, publicId: data.asset.publicId ?? "" });
      } else {
        reject(new Error(data.error ?? "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function levelIcon(level: string) {
  return level === "school" ? School : GraduationCap;
}

export function ScholarshipManage() {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/scholarships?all=true", { cache: "no-store" });
      const data = await res.json();
      setScholarships(data.scholarships ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scholarships.filter((s) => {
      if (statusFilter === "live" && !s.active) return false;
      if (statusFilter === "hidden" && s.active) return false;
      if (levelFilter !== "all" && s.level !== levelFilter) return false;
      if (!q) return true;
      return (
        s.institution.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.amount.toLowerCase().includes(q)
      );
    });
  }, [scholarships, query, levelFilter, statusFilter]);

  const liveCount = useMemo(
    () => scholarships.reduce((acc, s) => (s.active ? acc + 1 : acc), 0),
    [scholarships]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setUploadProgress(0);
    setFormOpen(true);
  };

  const openEdit = (s: ScholarshipItem) => {
    setEditingId(s.id);
    setForm({
      institution: s.institution,
      rawText: s.rawText,
      title: s.title,
      description: s.description,
      country: s.country,
      countryCode: s.countryCode,
      level: (LEVELS as readonly string[]).includes(s.level) ? (s.level as Level) : "any",
      amount: s.amount,
      deadline: s.deadline,
      eligibility: s.eligibility,
      applyUrl: s.applyUrl,
      active: s.active,
      image: s.imageUrl ? { url: s.imageUrl, publicId: "" } : null,
    });
    setUploadProgress(0);
    setFormOpen(true);
  };

  const setCountry = (code: string) => {
    setForm((f) => {
      if (code === "") {
        return { ...f, country: "", countryCode: "" };
      }
      const country = countryByCode(code);
      return { ...f, country: country?.name ?? "", countryCode: code };
    });
  };

  const runUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadImage(file, setUploadProgress);
      setForm((f) => ({ ...f, image: uploaded }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const parseWithAI = async () => {
    setError(null);
    if (!form.institution.trim()) {
      setError("Enter the institution name first");
      return;
    }
    if (!form.rawText.trim()) {
      setError("Paste the scholarship text first");
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/scholarships/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution: form.institution, rawText: form.rawText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "AI parse failed");
      const p = data.parsed ?? {};
      const parsedCode = typeof p.countryCode === "string" ? p.countryCode.toUpperCase() : "";
      setForm((f) => ({
        ...f,
        title: typeof p.title === "string" && p.title ? p.title : f.title,
        description: typeof p.description === "string" && p.description ? p.description : f.description,
        country: typeof p.country === "string" && p.country ? p.country : f.country,
        countryCode: parsedCode || f.countryCode,
        level: LEVELS.includes(p.level) ? p.level : f.level,
        amount: typeof p.amount === "string" && p.amount ? p.amount : f.amount,
        deadline: typeof p.deadline === "string" && p.deadline ? p.deadline : f.deadline,
        eligibility: typeof p.eligibility === "string" && p.eligibility ? p.eligibility : f.eligibility,
        applyUrl: typeof p.applyUrl === "string" && p.applyUrl ? p.applyUrl : f.applyUrl,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI parse failed");
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!form.institution.trim()) {
      setError("Institution name is required");
      return;
    }
    if (!form.rawText.trim()) {
      setError("The scholarship text is required");
      return;
    }

    const url = editingId ? `/api/scholarships/${editingId}` : "/api/scholarships";
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: form.institution,
          rawText: form.rawText,
          title: form.title,
          description: form.description,
          country: form.country,
          countryCode: form.countryCode,
          level: form.level,
          amount: form.amount,
          deadline: form.deadline,
          eligibility: form.eligibility,
          applyUrl: form.applyUrl,
          active: form.active,
          imageUrl: form.image?.url ?? "",
          imagePublicId: form.image?.publicId ?? "",
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

  const remove = async (s: ScholarshipItem) => {
    if (!confirm(`Delete scholarship "${s.title || s.institution}"?`)) return;
    setDeletingId(s.id);
    try {
      const res = await fetch(`/api/scholarships/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (s: ScholarshipItem) => {
    setTogglingId(s.id);
    setError(null);
    try {
      const res = await fetch(`/api/scholarships/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      if (!res.ok) throw new Error("Update failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTogglingId(null);
    }
  };

  if (!user) return <p style={{ color: "var(--body)" }}>Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scholarships"
        subtitle="Paste scholarship announcements, auto-design them with AI, and publish for members."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            + New scholarship
          </button>
        }
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {formOpen && (
        <div className="rounded-[14px] border bg-white p-[clamp(20px,3vw,28px)]" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-[16px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
            {editingId ? "Edit scholarship" : "New scholarship"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Institution (university / college / school) *
              </label>
              <input
                type="text"
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                placeholder="e.g. University of Toronto"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Scholarship text *
              </label>
              <textarea
                value={form.rawText}
                onChange={(e) => setForm({ ...form, rawText: e.target.value })}
                placeholder="Paste the full scholarship announcement here — title, amount, deadline, eligibility, apply link…"
                rows={6}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={parsing}
                  onClick={parseWithAI}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-[10px] text-[13.5px] font-medium text-white transition-all duration-200 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none"
                  style={{ background: "linear-gradient(135deg,#6B4CE0,#8A6BF2)" }}
                >
                  {parsing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {parsing ? "Designing…" : "Parse with AI"}
                </button>
                <span className="text-[12px]" style={{ color: "var(--body)" }}>
                  Auto-extracts title, country, level, amount, deadline & eligibility from the text.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[12px] border p-[clamp(16px,2.5vw,24px)]" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
            <div className="flex items-center gap-2 font-mono text-[10.5px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "var(--brand-2)" }}>
              <Award size={14} />
              Scholarship details
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. International Merit Scholarship"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Country</label>
                <select
                  value={form.countryCode}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Study level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as Level })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Amount / coverage</label>
                <input
                  type="text"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. $10,000 / Full tuition"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Application deadline</label>
                <input
                  type="text"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  placeholder="e.g. 15 December 2026"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Eligibility</label>
                <textarea
                  value={form.eligibility}
                  onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                  placeholder="Who can apply…"
                  rows={3}
                  className={inputClass + " resize-none"}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short summary shown to members…"
                  rows={3}
                  className={inputClass + " resize-none"}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>Application URL</label>
                <input
                  type="text"
                  value={form.applyUrl}
                  onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
                  placeholder="https://…"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Image (optional)
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) runUpload(f);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-[10px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2 hover:text-brand-2 disabled:opacity-50"
                    style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                  >
                    <UploadCloud size={15} />
                    {form.image ? "Replace image" : "Upload image"}
                  </button>
                  {form.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image.url}
                      alt="Scholarship preview"
                      className="h-14 w-14 rounded-lg object-cover border"
                      style={{ borderColor: "var(--line)" }}
                    />
                  )}
                </div>
                {uploading && (
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--bg-soft)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%`, background: "var(--brand)" }}
                      />
                    </div>
                    <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
                      {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 md:col-span-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-[var(--brand)]"
                />
                <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Visible to members
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              disabled={parsing || uploading || saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create scholarship"}
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

      <div className="flex flex-col gap-3">
        {/* Toolbar */}
        <div className="rounded-[14px] border bg-white p-3 flex flex-col md:flex-row gap-3" style={{ borderColor: "var(--line)" }}>
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
              placeholder="Search scholarships…"
              className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <option value="all">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <option value="all">All statuses ({scholarships.length})</option>
            <option value="live">Live ({liveCount})</option>
            <option value="hidden">Hidden ({scholarships.length - liveCount})</option>
          </select>
        </div>

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div className="rounded-[14px] border bg-white px-4 py-12 text-center text-[13.5px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
            No scholarships match your search or filters.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s) => {
              const Icon = levelIcon(s.level);
              const flag = countryByCode(s.countryCode)?.flag ?? "";
              return (
                <div
                  key={s.id}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-white"
                  style={{ borderColor: "var(--line)", boxShadow: "0 4px 20px -12px rgba(18,32,67,0.12)" }}
                >
                  {s.imageUrl ? (
                    <div className="relative aspect-[16/9]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.imageUrl} alt={s.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className="relative aspect-[16/9] flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(107,76,224,0.10), rgba(15,169,104,0.08))" }}
                    >
                      <Award size={34} style={{ color: "var(--brand-2)" }} />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col px-3.5 pb-3.5 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
                    <div className="font-display font-semibold text-[14px] leading-tight tracking-[-0.01em] truncate" style={{ color: "var(--ink)" }}>
                      {s.title || s.institution}
                    </div>
                    <div className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--body)" }}>
                      {s.institution}
                    </div>
                    {s.amount && (
                      <div className="text-[12px] font-semibold mt-1.5" style={{ color: "var(--brand-2)" }}>
                        {s.amount}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[12px] font-medium mt-1.5" style={{ color: "var(--brand-2)" }}>
                      {flag && <span className={`fi fi-${s.countryCode.toLowerCase()}`} />}
                      <span className="truncate">{s.country || "—"}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--body)" }}>
                      <Icon size={11} />
                      <span className="capitalize">{LEVEL_LABELS[s.level as Level] ?? s.level}</span>
                      {s.deadline && (
                        <>
                          <span className="opacity-50">·</span>
                          <span className="opacity-50">By {s.deadline}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--body)" }}>
                      <span className="opacity-50">{formatDate(s.createdAt)}</span>
                      <span
                        className="ml-auto text-[10px] font-semibold rounded-full px-2.5 py-1"
                        style={
                          s.active
                            ? { background: "rgba(15,169,104,0.12)", color: "#0FA968" }
                            : { background: "rgba(18,32,67,0.08)", color: "#6B7280" }
                        }
                      >
                        {s.active ? "Live" : "Hidden"}
                      </span>
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-end gap-1" style={{ borderTop: "1px solid var(--line)" }}>
                      <button
                        type="button"
                        title={s.active ? "Hide" : "Show"}
                        onClick={() => toggleActive(s)}
                        disabled={togglingId === s.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5 disabled:opacity-50"
                        style={{ color: "var(--body)" }}
                      >
                        {togglingId === s.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : s.active ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/5"
                        style={{ color: "var(--body)" }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title={deletingId === s.id ? "Deleting" : "Delete"}
                        onClick={() => remove(s)}
                        disabled={deletingId === s.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[#FDF1F0] disabled:opacity-50"
                        style={{ color: "#C0392B" }}
                      >
                        {deletingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {scholarships.length === 0 && (
          <p className="text-[13.5px] text-center py-6" style={{ color: "var(--body)" }}>
            No scholarships yet — click "New scholarship" to add your first one.
          </p>
        )}
      </div>
    </div>
  );
}