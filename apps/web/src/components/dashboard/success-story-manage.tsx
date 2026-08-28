"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  GraduationCap,
  Briefcase,
  UploadCloud,
  Trash2,
  Pencil,
  Search,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { COUNTRIES, countryByCode } from "@/lib/countries";

type StoryItem = {
  id: string;
  name: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  visaType: "student" | "work";
  universityName: string;
  cityName: string;
  story: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
};

type UploadedImage = {
  url: string;
  publicId: string;
};

type FormState = {
  name: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  visaType: "student" | "work";
  universityName: string;
  cityName: string;
  story: string;
  active: boolean;
  image: UploadedImage | null;
};

const emptyForm: FormState = {
  name: "",
  origin: "",
  originCode: "",
  destination: "",
  destinationCode: "",
  visaType: "student",
  universityName: "",
  cityName: "",
  story: "",
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
    xhr.open("POST", "/api/uploads?scope=stories");
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

function FlagCircle({ code }: { code: string }) {
  const flag = countryByCode(code)?.flag;
  return (
    <span className="text-[14px] leading-none" title={code}>
      {flag ?? "🌐"}
    </span>
  );
}

export function SuccessStoryManage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/success-stories?all=true", { cache: "no-store" });
      const data = await res.json();
      setStories(data.stories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (typeFilter !== "all" && s.visaType !== typeFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.universityName.toLowerCase().includes(q) ||
        s.cityName.toLowerCase().includes(q)
      );
    });
  }, [stories, query, typeFilter]);

  const visibleCount = useMemo(() => {
    return stories.reduce(
      (acc, s) => {
        if (s.visaType === "student") acc.student += 1;
        else if (s.visaType === "work") acc.work += 1;
        return acc;
      },
      { student: 0, work: 0 }
    );
  }, [stories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setUploadProgress(0);
    setFormOpen(true);
  };

  const openEdit = (s: StoryItem) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      origin: s.origin,
      originCode: s.originCode,
      destination: s.destination,
      destinationCode: s.destinationCode,
      visaType: s.visaType,
      universityName: s.universityName,
      cityName: s.cityName,
      story: s.story,
      active: s.active,
      image: s.imageUrl ? { url: s.imageUrl, publicId: "" } : null,
    });
    setUploadProgress(0);
    setFormOpen(true);
  };

  const setCountry = (field: "origin" | "destination", code: string) => {
    setForm((f) => {
      if (code === "") {
        return {
          ...f,
          [field]: "",
          [`${field}Code`]: "",
        };
      }
      const country = countryByCode(code);
      return {
        ...f,
        [field]: country?.name ?? "",
        [`${field}Code`]: code,
      };
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

  const save = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.image) {
      setError("An image must be uploaded");
      return;
    }

    const url = editingId ? `/api/success-stories/${editingId}` : "/api/success-stories";
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          origin: form.origin,
          originCode: form.originCode,
          destination: form.destination,
          destinationCode: form.destinationCode,
          visaType: form.visaType,
          universityName: form.universityName,
          cityName: form.cityName,
          story: form.story,
          active: form.active,
          imageUrl: form.image.url,
          imagePublicId: form.image.publicId,
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

  const remove = async (s: StoryItem) => {
    if (!confirm(`Delete story "${s.name}"?`)) return;
    setDeletingId(s.id);
    try {
      const res = await fetch(`/api/success-stories/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (s: StoryItem) => {
    setTogglingId(s.id);
    setError(null);
    try {
      const res = await fetch(`/api/success-stories/${s.id}`, {
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
        title="Success Stories"
        subtitle="Manage learner stories shown on the success stories page."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            + New story
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
            {editingId ? "Edit story" : "New story"}
          </h2>

          {/* Visa type toggle */}
          <div className="flex gap-1 rounded-full border p-1 w-fit mb-5" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
            {(
              [
                { value: "student", label: "Student visa", icon: GraduationCap },
                { value: "work", label: "Work permit", icon: Briefcase },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = form.visaType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, visaType: opt.value })}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-[7px] text-[13px] font-medium transition-colors duration-200"
                  style={
                    active
                      ? { background: "var(--brand)", color: "#fff" }
                      : { color: "var(--body)" }
                  }
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mijanur Rahman"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Origin country
              </label>
              <select
                value={form.originCode}
                onChange={(e) => setCountry("origin", e.target.value)}
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
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Destination country
              </label>
              <select
                value={form.destinationCode}
                onChange={(e) => setCountry("destination", e.target.value)}
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

            {form.visaType === "student" ? (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  University name
                </label>
                <input
                  type="text"
                  value={form.universityName}
                  onChange={(e) => setForm({ ...form, universityName: e.target.value })}
                  placeholder="e.g. University of Chester"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  City
                </label>
                <input
                  type="text"
                  value={form.cityName}
                  onChange={(e) => setForm({ ...form, cityName: e.target.value })}
                  placeholder="e.g. Lisbon, Portugal"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Story
              </label>
              <textarea
                value={form.story}
                onChange={(e) => setForm({ ...form, story: e.target.value })}
                placeholder="Share the learner's journey, shared publicly."
                rows={3}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Image *
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
                    alt="Story preview"
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
                Visible on the success stories page
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              disabled={uploading || saving}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create story"}
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
              placeholder="Search stories…"
              className="w-full text-[13.5px] rounded-xl border bg-white pl-10 pr-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <option value="all">All types ({stories.length})</option>
            <option value="student">Student ({visibleCount.student})</option>
            <option value="work">Work permit ({visibleCount.work})</option>
          </select>
        </div>

        {/* List */}
        <div className="rounded-[14px] border bg-white overflow-hidden" style={{ borderColor: "var(--line)" }}>
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_140px_180px_80px_auto] gap-3 px-4 py-2.5 border-b bg-[var(--bg-soft)]" style={{ borderColor: "var(--line)" }}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              Name
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              Destination
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              Type
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
              Status
            </span>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13.5px]" style={{ color: "var(--body)" }}>
              No stories match your search or filters.
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((s, idx) => {
                const isStudent = s.visaType === "student";
                return (
                  <div
                    key={s.id}
                    className={`group md:grid items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--bg-soft)] ${idx > 0 ? "border-t" : ""} grid-cols-[minmax(0,1fr)_140px_180px_80px_auto]`}
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}
                      >
                        {isStudent ? <GraduationCap size={18} /> : <Briefcase size={18} />}
                      </span>
                      <span className="min-w-0">
                        <span className="text-[14px] font-semibold truncate flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
                          {s.name}
                        </span>
                        <span className="text-[11.5px] truncate" style={{ color: "var(--body)" }}>
                          {s.origin || "—"}
                          {s.universityName && <> · {s.universityName}</>}
                          {s.cityName && <> · {s.cityName}</>}
                        </span>
                        <span className="md:hidden block mt-1 text-[11.5px] flex items-center gap-1" style={{ color: "var(--body)" }}>
                          {s.destinationCode && <FlagCircle code={s.destinationCode} />}
                          <span>{s.destination || "—"}</span>
                          {s.destinationCode && <span>({s.destinationCode})</span>}
                          <span>· {formatDate(s.createdAt)}</span>
                        </span>
                      </span>
                    </div>

                    <span className="hidden md:block text-[12.5px] flex items-center gap-1.5" style={{ color: "var(--body)" }}>
                      {s.destinationCode ? (
                        <>
                          <FlagCircle code={s.destinationCode} />
                          <span>
                            {s.destination} ({s.destinationCode})
                          </span>
                        </>
                      ) : (
                        s.destination || "—"
                      )}
                    </span>

                    <span className="hidden md:block">
                      <span
                        className="text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                        style={
                          isStudent
                            ? { background: "var(--brand-soft)", color: "var(--brand-2)" }
                            : { background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }
                        }
                      >
                        {isStudent ? "Student" : "Work permit"}
                      </span>
                    </span>

                    <span className="hidden md:block">
                      <span
                        className="text-[11px] font-semibold rounded-full px-2.5 py-[3px]"
                        style={
                          s.active
                            ? { background: "var(--brand-soft)", color: "var(--brand)" }
                            : { background: "var(--bg-soft)", color: "var(--body)" }
                        }
                      >
                        {s.active ? "Live" : "Hidden"}
                      </span>
                    </span>

                    <div className="flex items-center justify-end gap-1">
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
                );
              })}
            </div>
          )}
        </div>

        {stories.length === 0 && (
          <p className="text-[13.5px] text-center py-6" style={{ color: "var(--body)" }}>
            No stories yet — click "New story" to add your first one.
          </p>
        )}
      </div>
    </div>
  );
}
