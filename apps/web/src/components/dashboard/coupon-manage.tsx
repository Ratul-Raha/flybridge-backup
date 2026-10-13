"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatMoney } from "@/lib/pricing";

type Coupon = {
  id: string;
  name: string;
  description: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  currency: string;
  appliesTo: string;
  minSubtotal: number;
  maxRedemptions: number | null;
  maxUsesPerUser: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  redemptions: number;
};

type FormState = {
  name: string;
  description: string;
  code: string;
  type: "percent" | "fixed";
  value: string;
  currency: "USD" | "BDT";
  appliesTo: string;
  minSubtotal: string;
  maxRedemptions: string;
  maxUsesPerUser: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  code: "",
  type: "percent",
  value: "10",
  currency: "BDT",
  appliesTo: "all",
  minSubtotal: "",
  maxRedemptions: "",
  maxUsesPerUser: "1",
  startsAt: "",
  endsAt: "",
  active: true,
};

const ITEM_LABELS: Record<string, string> = {
  all: "All products",
  course: "Courses",
  seminar: "Seminars",
  resource: "Resources",
  "mock-bundle": "Mock-test bundles",
};

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12.5px] font-medium";

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function valueLabel(coupon: Coupon): string {
  return coupon.type === "percent"
    ? `${coupon.value}% off`
    : `${formatMoney(coupon.value, coupon.currency)} off`;
}

export function CouponManage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/discounts", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load coupons");
      setCoupons(data.coupons ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      name: coupon.name,
      description: coupon.description,
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      currency: coupon.currency === "USD" ? "USD" : "BDT",
      appliesTo: coupon.appliesTo,
      minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal) : "",
      maxRedemptions: coupon.maxRedemptions == null ? "" : String(coupon.maxRedemptions),
      maxUsesPerUser: String(coupon.maxUsesPerUser ?? 1),
      startsAt: toLocalInput(coupon.startsAt),
      endsAt: toLocalInput(coupon.endsAt),
      active: coupon.active,
    });
    setError(null);
    setFormOpen(true);
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/admin/discounts/${editingId}` : "/api/admin/discounts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            value: Number(form.value),
            minSubtotal: Number(form.minSubtotal) || 0,
            maxRedemptions: form.maxRedemptions.trim() ? Number(form.maxRedemptions) : null,
            maxUsesPerUser: form.maxUsesPerUser === "" ? 1 : Number(form.maxUsesPerUser),
            startsAt: fromLocalInput(form.startsAt),
            endsAt: fromLocalInput(form.endsAt),
          }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (coupon: Coupon) => {
    if (!confirm(`Remove coupon ${coupon.code}? Coupons already used on orders will be disabled instead.`)) {
      return;
    }
    setDeletingId(coupon.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/discounts/${coupon.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not remove coupon");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove coupon");
    } finally {
      setDeletingId(null);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading coupons…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Create and track coupon codes customers can apply at checkout."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white transition-all hover:-translate-y-[1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={15} /> New coupon
          </button>
        }
      />

      {error && (
        <p className="mb-4 text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {formOpen && (
        <div className="mb-6 rounded-[20px] border bg-white p-5 sm:p-7" style={{ borderColor: "var(--line)" }}>
          <h2 className="mb-5 font-display text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
            {editingId ? "Edit coupon" : "Create coupon"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Name *</label>
              <input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Summer offer"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Coupon code *</label>
              <input
                value={form.code}
                onChange={(event) => setField("code", event.target.value.toUpperCase())}
                placeholder="SUMMER20"
                maxLength={40}
                className={`${inputClass} font-mono uppercase`}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Description</label>
              <input
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder="Internal note (optional)"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Discount type</label>
                <select
                  value={form.type}
                  onChange={(event) => setField("type", event.target.value as FormState["type"])}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Value</label>
                <input
                  type="number"
                  min="0.01"
                  max={form.type === "percent" ? 100 : undefined}
                  step="0.01"
                  value={form.value}
                  onChange={(event) => setField("value", event.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            </div>

            {(form.type === "fixed" || form.minSubtotal.trim() !== "") && (
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>
                  {form.type === "fixed" ? "Discount currency" : "Minimum subtotal currency"}
                </label>
                <select
                  value={form.currency}
                  onChange={(event) => setField("currency", event.target.value as FormState["currency"])}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Applies to</label>
              <select
                value={form.appliesTo}
                onChange={(event) => setField("appliesTo", event.target.value)}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {Object.entries(ITEM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Starts</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setField("startsAt", event.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Ends</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setField("endsAt", event.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Minimum subtotal</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minSubtotal}
                  onChange={(event) => setField("minSubtotal", event.target.value)}
                  placeholder="No minimum"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Redemption limit</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxRedemptions}
                  onChange={(event) => setField("maxRedemptions", event.target.value)}
                  placeholder="Unlimited"
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Uses per customer</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.maxUsesPerUser}
                  onChange={(event) => setField("maxUsesPerUser", event.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--body)" }}>0 means unlimited.</span>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-[13px] font-medium md:col-span-2" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setField("active", event.target.checked)}
                className="h-4 w-4"
              />
              Active and available at checkout
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Save changes" : "Create coupon"}
            </button>
            <button
              type="button"
              onClick={() => { setFormOpen(false); setEditingId(null); }}
              className="rounded-full border px-6 py-[10px] text-[13.5px] font-medium"
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {coupons.length === 0 ? (
          <div className="rounded-[20px] border bg-white p-10 text-center" style={{ borderColor: "var(--line)" }}>
            <Tag size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>No coupons yet</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>Create a coupon code for customers to use at checkout.</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex flex-wrap items-center gap-3 rounded-[20px] border bg-white p-4"
              style={{ borderColor: "var(--line)", opacity: coupon.active ? 1 : 0.62 }}
            >
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>{coupon.name}</span>
                  <span className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                    {valueLabel(coupon)}
                  </span>
                  <span className="rounded bg-[var(--bg-soft)] px-2 py-[3px] font-mono text-[11px] font-semibold uppercase" style={{ color: "var(--ink)" }}>
                    {coupon.code}
                  </span>
                  {!coupon.active && <span className="text-[11px] font-semibold" style={{ color: "#C0392B" }}>Inactive</span>}
                </div>
                <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
                  {ITEM_LABELS[coupon.appliesTo] ?? coupon.appliesTo}
                  {coupon.maxRedemptions != null ? ` · ${coupon.redemptions}/${coupon.maxRedemptions} uses` : ` · ${coupon.redemptions} uses`}
                  {coupon.maxUsesPerUser > 0 ? ` · ${coupon.maxUsesPerUser} per customer` : " · unlimited per customer"}
                  {coupon.endsAt ? ` · Ends ${new Date(coupon.endsAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(coupon)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  disabled={deletingId === coupon.id}
                  onClick={() => void remove(coupon)}
                  aria-label={`Remove ${coupon.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium disabled:opacity-50"
                  style={{ borderColor: "rgba(192,57,43,0.25)", color: "#C0392B" }}
                >
                  {deletingId === coupon.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
