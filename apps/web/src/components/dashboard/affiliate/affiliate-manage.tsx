"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Megaphone, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatMoney } from "@/lib/pricing";

type Totals = {
  conversions: number;
  pending: number;
  approved: number;
  paid: number;
  reversed: number;
  orderTotal: number;
};

type Affiliate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  status: string;
  commissionPercent: number;
  currency: string;
  payoutMethod: string;
  payoutDetails: PayoutDetails;
  notes: string;
  clicks: number;
  totals: Record<string, Totals>;
};

type PayoutDetails = {
  method: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  routingNumber: string;
  note: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  code: string;
  commissionPercent: string;
  currency: "BDT" | "USD";
  status: string;
  notes: string;
  payoutDetails: PayoutDetails;
};

const EMPTY_PAYOUT: PayoutDetails = {
  method: "bKash",
  accountName: "",
  accountNumber: "",
  bankName: "",
  branchName: "",
  routingNumber: "",
  note: "",
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  code: "",
  commissionPercent: "10",
  currency: "BDT",
  status: "active",
  notes: "",
  payoutDetails: { ...EMPTY_PAYOUT },
};

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12.5px] font-medium";

function statusPill(status: string) {
  return status === "active"
    ? { label: "Active", fg: "#065F46", bg: "rgba(20,181,126,0.12)" }
    : { label: "Suspended", fg: "#92400E", bg: "rgba(217,119,6,0.12)" };
}

export function AffiliateManage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/affiliates", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load affiliates");
      setAffiliates(data.affiliates ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load affiliates");
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

  const openEdit = (affiliate: Affiliate) => {
    setEditingId(affiliate.id);
    setForm({
      name: affiliate.name,
      email: affiliate.email,
      phone: affiliate.phone,
      code: affiliate.code,
      commissionPercent: String(affiliate.commissionPercent),
      currency: affiliate.currency === "USD" ? "USD" : "BDT",
      status: affiliate.status,
      notes: affiliate.notes,
      payoutDetails: { ...EMPTY_PAYOUT, ...affiliate.payoutDetails, method: affiliate.payoutDetails?.method || affiliate.payoutMethod || "bKash" },
    });
    setError(null);
    setFormOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        commissionPercent: Number(form.commissionPercent),
        currency: form.currency,
        status: form.status,
        notes: form.notes,
        payoutMethod: form.payoutDetails.method,
        payoutDetails: form.payoutDetails,
        ...(editingId ? {} : { code: form.code }),
      };
      const res = await fetch(
        editingId ? `/api/admin/affiliates/${editingId}` : "/api/admin/affiliates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (affiliate: Affiliate) => {
    setBusyId(affiliate.id);
    setError(null);
    try {
      const next = affiliate.status === "active" ? "suspended" : "active";
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (affiliate: Affiliate) => {
    if (!confirm(`Remove affiliate ${affiliate.code}? Affiliates with earnings are suspended instead.`)) {
      return;
    }
    setBusyId(affiliate.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not remove affiliate");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove affiliate");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading affiliates…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Affiliates"
        subtitle="Hand-picked partners who earn a share of the sales their links bring in."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white transition-all hover:-translate-y-[1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={15} /> New affiliate
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
            {editingId ? "Edit affiliate" : "Create affiliate"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Name *</label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Rahim Uddin"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Code</label>
              <input
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                disabled={!!editingId}
                placeholder="Auto-generated if left blank"
                maxLength={30}
                className={`${inputClass} font-mono uppercase disabled:opacity-60`}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Email</label>
              <input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="partner@example.com"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+880…"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Commission %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commissionPercent}
                  onChange={(e) => setField("commissionPercent", e.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Payout currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value as FormState["currency"])}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={{ color: "var(--ink)" }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <p className="text-[12.5px] md:col-span-2" style={{ color: "var(--body)" }}>
              Payout details can be set by the affiliate from their dashboard; leave blank if not known yet.
            </p>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Internal notes</label>
              <input
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="How we found them, deal terms…"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
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
              {editingId ? "Save changes" : "Create affiliate"}
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
        {affiliates.length === 0 ? (
          <div className="rounded-[20px] border bg-white p-10 text-center" style={{ borderColor: "var(--line)" }}>
            <Megaphone size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
            <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>No affiliates yet</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>Add a partner to start tracking the sales their links bring in.</p>
          </div>
        ) : (
          affiliates.map((affiliate) => (
            <AffiliateRow
              key={affiliate.id}
              affiliate={affiliate}
              busy={busyId === affiliate.id}
              onEdit={() => openEdit(affiliate)}
              onToggle={() => void toggleStatus(affiliate)}
              onRemove={() => void remove(affiliate)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AffiliateRow({
  affiliate,
  busy,
  onEdit,
  onToggle,
  onRemove,
}: {
  affiliate: Affiliate;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const pill = statusPill(affiliate.status);
  const currency = affiliate.currency;
  const totals = affiliate.totals[currency] ?? {
    conversions: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    reversed: 0,
    orderTotal: 0,
  };
  const active = affiliate.status === "active";

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-[20px] border bg-white p-4"
      style={{ borderColor: "var(--line)", opacity: active ? 1 : 0.65 }}
    >
      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>{affiliate.name}</span>
          <span className="rounded-full px-2.5 py-[3px] text-[11px] font-semibold" style={{ color: pill.fg, background: pill.bg }}>
            {pill.label}
          </span>
          <span className="rounded bg-[var(--bg-soft)] px-2 py-[3px] font-mono text-[11px] font-semibold uppercase" style={{ color: "var(--ink)" }}>
            {affiliate.code}
          </span>
          <span className="text-[11.5px] font-medium" style={{ color: "var(--brand)" }}>
            {affiliate.commissionPercent}%
          </span>
        </div>
        <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
          {`${affiliate.clicks} clicks · ${totals.conversions} sales · ${formatMoney(totals.orderTotal, currency)} sold · `}
          {formatMoney(totals.paid, currency)} paid
          {totals.approved > 0 ? ` · ${formatMoney(totals.approved, currency)} owed` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/admin/affiliates/${affiliate.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          <Settings2 size={12} /> Manage
        </Link>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className="rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium disabled:opacity-50"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          {active ? "Suspend" : "Activate"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          aria-label={`Remove ${affiliate.code}`}
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[6px] text-[12.5px] font-medium disabled:opacity-50"
          style={{ borderColor: "rgba(192,57,43,0.25)", color: "#C0392B" }}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Remove
        </button>
      </div>
    </div>
  );
}
