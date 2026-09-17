"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type Discount = {
  id: string;
  name: string;
  description: string;
  code: string | null;
  type: "percent" | "fixed";
  value: number;
  currency: string;
  appliesTo: string;
  scope: "all" | "selected";
  courseIds: string[];
  audience: string;
  emails: string[];
  startsAt: string | null;
  endsAt: string | null;
  minSubtotal: number;
  maxRedemptions: number | null;
  maxUsesPerUser: number;
  active: boolean;
  redemptions: number;
};

type CourseOption = { id: string; title: string; slug: string };

type FormState = {
  name: string;
  description: string;
  code: string;
  type: "percent" | "fixed";
  value: string;
  currency: string;
  appliesTo: string;
  scope: "all" | "selected";
  courseIds: string[];
  audience: string;
  emails: string;
  startsAt: string;
  endsAt: string;
  minSubtotal: string;
  maxRedemptions: string;
  maxUsesPerUser: string;
  active: boolean;
};

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30";

const labelClass = "text-[12.5px] font-medium";

const emptyForm: FormState = {
  name: "",
  description: "",
  code: "",
  type: "percent",
  value: "10",
  currency: "USD",
  appliesTo: "course",
  scope: "all",
  courseIds: [],
  audience: "everyone",
  emails: "",
  startsAt: "",
  endsAt: "",
  minSubtotal: "",
  maxRedemptions: "",
  maxUsesPerUser: "1",
  active: true,
};

const AUDIENCE_LABELS: Record<string, string> = {
  everyone: "Everyone",
  wishlist: "Waitlist members",
  "new-users": "New users",
  emails: "Specific emails",
};

const APPLIES_LABELS: Record<string, string> = {
  all: "All items",
  course: "Courses",
  seminar: "Seminars",
  resource: "Resources",
  "mock-bundle": "Mock bundles",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function valueLabel(d: Discount): string {
  if (d.type === "percent") return `${d.value}% off`;
  return `${d.value} ${d.currency} off`;
}

export function PromotionManage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        fetch("/api/admin/discounts", { cache: "no-store" }),
        fetch("/api/courses?all=true", { cache: "no-store" }),
      ]);
      const dData = await dRes.json();
      const cData = await cRes.json();
      if (!dRes.ok) throw new Error(dData.error ?? "Failed to load promotions");
      setDiscounts(dData.discounts ?? []);
      setCourses(
        (cData.courses ?? []).map((c: CourseOption) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load promotions");
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

  const openEdit = (d: Discount) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      description: d.description,
      code: d.code ?? "",
      type: d.type,
      value: String(d.value),
      currency: d.currency,
      appliesTo: d.appliesTo,
      scope: d.scope,
      courseIds: d.courseIds,
      audience: d.audience,
      emails: d.emails.join(", "),
      startsAt: toLocalInput(d.startsAt),
      endsAt: toLocalInput(d.endsAt),
      minSubtotal: d.minSubtotal ? String(d.minSubtotal) : "",
      maxRedemptions: d.maxRedemptions != null ? String(d.maxRedemptions) : "",
      maxUsesPerUser: String(d.maxUsesPerUser ?? 0),
      active: d.active,
    });
    setFormOpen(true);
  };

  const save = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/discounts/${editingId}` : "/api/admin/discounts";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          code: form.code,
          type: form.type,
          value: Number(form.value) || 0,
          currency: form.currency,
          appliesTo: form.appliesTo,
          scope: form.scope,
          courseIds: form.courseIds,
          audience: form.audience,
          emails: form.emails
            .split(/[,\n]/)
            .map((e) => e.trim())
            .filter(Boolean),
          startsAt: fromLocalInput(form.startsAt),
          endsAt: fromLocalInput(form.endsAt),
          minSubtotal: Number(form.minSubtotal) || 0,
          maxRedemptions:
            form.maxRedemptions.trim() === "" ? null : Number(form.maxRedemptions),
          maxUsesPerUser: Number(form.maxUsesPerUser) || 0,
          active: form.active,
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

  const remove = async (d: Discount) => {
    if (!confirm(`Delete promotion "${d.name}"?`)) return;
    setDeletingId(d.id);
    try {
      const res = await fetch(`/api/admin/discounts/${d.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const courseName = useMemo(() => {
    const map = new Map(courses.map((c) => [c.id, c.title]));
    return (id: string) => map.get(id) ?? "Course";
  }, [courses]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading promotions…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Promotions"
        subtitle="Coupon codes and automatic discounts for courses and other items."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={15} /> New promotion
          </button>
        }
      />

      {error && (
        <p className="text-[13px] mb-4" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {formOpen && (
        <div
          className="rounded-[24px] border bg-white p-[clamp(20px,3vw,28px)] mb-6"
          style={{ borderColor: "var(--line)" }}
        >
          <h2 className="font-display text-[16px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
            {editingId ? "Edit promotion" : "New promotion"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Waitlist launch offer"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Internal note (optional)"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Promo code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Leave empty for automatic"
                className={inputClass + " uppercase"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Value</label>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            </div>

            {form.type === "fixed" && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="USD">USD</option>
                  <option value="BDT">BDT</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Applies to</label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {Object.entries(APPLIES_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {form.audience === "emails" && (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className={labelClass} style={{ color: "var(--ink)" }}>
                  Emails (comma separated)
                </label>
                <textarea
                  value={form.emails}
                  onChange={(e) => setForm({ ...form, emails: e.target.value })}
                  rows={2}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Scope</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as "all" | "selected" })}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <option value="all">All eligible items</option>
                <option value="selected">Selected courses</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Starts</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Ends</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            </div>

            {form.scope === "selected" && (
              <div className="md:col-span-2">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Courses</label>
                <div
                  className="mt-1.5 max-h-52 overflow-y-auto rounded-xl border p-2 grid sm:grid-cols-2 gap-1"
                  style={{ borderColor: "var(--line)" }}
                >
                  {courses.length === 0 && (
                    <span className="text-[12.5px] p-2" style={{ color: "var(--body)" }}>
                      No courses found.
                    </span>
                  )}
                  {courses.map((c) => {
                    const checked = form.courseIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] cursor-pointer hover:bg-[var(--bg-soft)]"
                        style={{ color: "var(--ink)" }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              courseIds: e.target.checked
                                ? [...f.courseIds, c.id]
                                : f.courseIds.filter((id) => id !== c.id),
                            }))
                          }
                        />
                        {c.title}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Min. subtotal</label>
                <input
                  type="number"
                  min="0"
                  value={form.minSubtotal}
                  onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Max redemptions</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxRedemptions}
                  onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                  placeholder="Unlimited"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Uses / user</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxUsesPerUser}
                  onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            </div>

            <label
              className="flex items-center gap-2.5 text-[13.5px] font-medium cursor-pointer md:col-span-2"
              style={{ color: "var(--ink)" }}
            >
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4"
              />
              Active
            </label>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Save changes" : "Create promotion"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="rounded-full text-[13.5px] font-medium px-6 py-[10px] border"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {discounts.length === 0 && (
          <div
            className="rounded-[20px] border bg-white p-10 text-center"
            style={{ borderColor: "var(--line)" }}
          >
            <Tag size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
              No promotions yet
            </p>
            <p className="text-[13px] mt-1" style={{ color: "var(--body)" }}>
              Create a coupon code or an automatic discount.
            </p>
          </div>
        )}

        {discounts.map((d) => (
          <div
            key={d.id}
            className="rounded-[20px] border bg-white p-4 flex flex-wrap items-center gap-3"
            style={{ borderColor: "var(--line)", opacity: d.active ? 1 : 0.6 }}
          >
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {d.name}
                </span>
                <span
                  className="rounded-full px-2.5 py-[2px] text-[11px] font-semibold"
                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                >
                  {valueLabel(d)}
                </span>
                {d.code ? (
                  <span
                    className="font-mono text-[11px] font-semibold rounded px-2 py-[2px] uppercase"
                    style={{ background: "var(--bg-soft)", color: "var(--ink)" }}
                  >
                    {d.code}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: "var(--body)" }}>
                    Automatic
                  </span>
                )}
                {!d.active && (
                  <span className="text-[11px] font-semibold" style={{ color: "#C0392B" }}>
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-[12.5px] mt-1" style={{ color: "var(--body)" }}>
                {AUDIENCE_LABELS[d.audience] ?? d.audience}
                {" · "}
                {APPLIES_LABELS[d.appliesTo] ?? d.appliesTo}
                {d.scope === "selected" && d.courseIds.length > 0
                  ? `: ${d.courseIds.map(courseName).slice(0, 2).join(", ")}${
                      d.courseIds.length > 2 ? ` +${d.courseIds.length - 2}` : ""
                    }`
                  : ""}
                {d.redemptions > 0 ? ` · ${d.redemptions} used` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(d)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-full border px-3.5 py-[6px] transition-colors hover:border-brand-2 hover:text-brand-2"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                disabled={deletingId === d.id}
                onClick={() => remove(d)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium rounded-full border px-3.5 py-[6px] transition-colors disabled:opacity-50"
                style={{ borderColor: "rgba(192,57,43,0.25)", color: "#C0392B" }}
              >
                {deletingId === d.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
