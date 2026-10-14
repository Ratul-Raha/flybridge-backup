"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, Wallet } from "lucide-react";
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

type Conversion = {
  id: string;
  itemTitle: string;
  itemType: string | null;
  orderTotal: number;
  currency: string;
  commissionPercent: number;
  commissionAmount: number;
  status: "pending" | "approved" | "paid" | "reversed";
  availableAt: string | null;
  createdAt: string;
};

type Payout = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  status: string;
  conversions: number;
  notes: string;
  paidAt: string | null;
  createdAt: string;
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
};

type Detail = {
  affiliate: Affiliate;
  totals: Record<string, Totals>;
  clicks: number;
  conversions: Conversion[];
  payouts: Payout[];
};

const STATUS_PILL: Record<string, { label: string; fg: string; bg: string }> = {
  pending: { label: "Pending", fg: "#92400E", bg: "rgba(217,119,6,0.12)" },
  approved: { label: "Approved", fg: "#1D4ED8", bg: "rgba(47,95,224,0.12)" },
  paid: { label: "Paid", fg: "#065F46", bg: "rgba(20,181,126,0.12)" },
  reversed: { label: "Reversed", fg: "#991B1B", bg: "rgba(239,68,68,0.12)" },
};

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";
const labelClass = "block text-[12.5px] font-medium";

function Pill({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{ color: fg, background: bg }}
    >
      {label}
    </span>
  );
}

export function AffiliateDetail({ id }: { id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load affiliate");
      setData(json);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load affiliate");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading affiliate…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <BackLink />
        <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error ?? "Affiliate not found"}
        </p>
      </div>
    );
  }

  const affiliate = data.affiliate;
  const pill = STATUS_PILL[affiliate.status] ?? { label: affiliate.status, fg: "#475569", bg: "rgba(100,116,139,0.12)" };
  const currency = affiliate.currency;
  const totals = data.totals[currency] ?? {
    conversions: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    reversed: 0,
    orderTotal: 0,
  };
  const link = `https://flybridge.com/r/${affiliate.code}`;

  return (
    <div>
      <BackLink />
      <PageHeader
        title={affiliate.name}
        subtitle={`${affiliate.email || "No email"} · ${affiliate.commissionPercent}% commission`}
        action={<Pill {...pill} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Clicks" value={String(data.clicks)} />
        <Stat label="Sales" value={String(totals.conversions)} hint={formatMoney(totals.orderTotal, currency)} />
        <Stat label="Pending" value={formatMoney(totals.pending, currency)} />
        <Stat label="Owed" value={formatMoney(totals.approved, currency)} hint={`${formatMoney(totals.paid, currency)} paid`} />
      </div>

      <div className="mb-6 rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>Affiliate link</p>
            <p className="mt-1 break-all font-mono text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{link}</p>
          </div>
          <CopyButton text={link} />
        </div>
      </div>

      <EditForm affiliate={affiliate} onSaved={load} />

      <PayoutPanel
        affiliate={affiliate}
        approved={totals.approved}
        payouts={data.payouts}
        onChanged={load}
      />

      <ConversionsTable conversions={data.conversions} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/admin/affiliates"
      className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      style={{ color: "var(--body)" }}
    >
      <ArrowLeft size={14} /> All affiliates
    </Link>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <p className="text-[12.5px] font-medium" style={{ color: "var(--body)" }}>{label}</p>
      <p className="mt-1 font-display text-[22px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>{value}</p>
      {hint && <p className="mt-1 text-[12px]" style={{ color: "var(--body)" }}>{hint}</p>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-full px-5 py-[9px] text-[13px] font-medium text-white"
      style={{ background: "var(--brand)" }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function EditForm({ affiliate, onSaved }: { affiliate: Affiliate; onSaved: () => Promise<void> | void }) {
  const [form, setForm] = useState({
    name: affiliate.name,
    email: affiliate.email,
    phone: affiliate.phone,
    commissionPercent: String(affiliate.commissionPercent),
    currency: affiliate.currency === "USD" ? "USD" : "BDT",
    status: affiliate.status,
    notes: affiliate.notes,
    payoutDetails: affiliate.payoutDetails,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setDetail = <K extends keyof PayoutDetails>(key: K, value: PayoutDetails[K]) =>
    setForm((current) => ({ ...current, payoutDetails: { ...current.payoutDetails, [key]: value } }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          commissionPercent: Number(form.commissionPercent),
          currency: form.currency,
          status: form.status,
          notes: form.notes,
          payoutMethod: form.payoutDetails.method,
          payoutDetails: form.payoutDetails,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSaved(true);
      await onSaved();
      setTimeout(() => setSaved(false), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>Settings</h2>
      {error && <p className="mb-3 text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Name</label>
          <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Email</label>
          <input value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Phone</label>
          <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={{ color: "var(--ink)" }}>Commission %</label>
            <input type="number" min="0" max="100" step="0.5" value={form.commissionPercent} onChange={(e) => setField("commissionPercent", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={{ color: "var(--ink)" }}>Currency</label>
            <select value={form.currency} onChange={(e) => setField("currency", e.target.value as "BDT" | "USD")} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              <option value="BDT">BDT</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={{ color: "var(--ink)" }}>Status</label>
            <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Payout method</label>
          <select value={form.payoutDetails.method} onChange={(e) => setDetail("method", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
            <option value="bKash">bKash</option>
            <option value="bank">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Account name</label>
          <input value={form.payoutDetails.accountName} onChange={(e) => setDetail("accountName", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Account number</label>
          <input value={form.payoutDetails.accountNumber} onChange={(e) => setDetail("accountNumber", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        {form.payoutDetails.method === "bank" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Bank name</label>
              <input value={form.payoutDetails.bankName} onChange={(e) => setDetail("bankName", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Branch</label>
              <input value={form.payoutDetails.branchName} onChange={(e) => setDetail("branchName", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>Routing number</label>
              <input value={form.payoutDetails.routingNumber} onChange={(e) => setDetail("routingNumber", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
            </div>
          </>
        )}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className={labelClass} style={{ color: "var(--ink)" }}>Internal notes</label>
          <input value={form.notes} onChange={(e) => setField("notes", e.target.value)} className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60"
        style={{ background: "var(--brand)" }}
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}

function PayoutPanel({
  affiliate,
  approved,
  payouts,
  onChanged,
}: {
  affiliate: Affiliate;
  approved: number;
  payouts: Payout[];
  onChanged: () => Promise<void> | void;
}) {
  const [method, setMethod] = useState(affiliate.payoutMethod || "bKash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, reference, notes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Payout failed");
      setReference("");
      setNotes("");
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payout failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-1 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>Payouts</h2>
      <p className="mb-4 text-[12.5px]" style={{ color: "var(--body)" }}>
        Send the transfer first, then log it here. This marks the included approved commissions as paid.
      </p>

      <div className="mb-5 rounded-xl p-4" style={{ background: "var(--bg-soft)" }}>
        <p className="text-[13px]" style={{ color: "var(--body)" }}>
          Approved and ready to pay:{" "}
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            {formatMoney(approved, affiliate.currency)}
          </span>
        </p>
        {error && <p className="mt-2 text-[13px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Method" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference / txn id" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
        </div>
        <button
          type="button"
          onClick={() => void create()}
          disabled={saving || approved <= 0}
          className="mt-3 inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
          Record payout of {formatMoney(approved, affiliate.currency)}
        </button>
      </div>

      {payouts.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--body)" }}>No payouts recorded yet.</p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {payouts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-[180px] flex-1">
                <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  {p.method}{p.reference ? ` · ${p.reference}` : ""}
                </p>
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {` · ${p.conversions} sale${p.conversions === 1 ? "" : "s"}`}
                </p>
              </div>
              <Pill
                label={p.status === "paid" ? "Paid" : "Failed"}
                fg={p.status === "paid" ? "#065F46" : "#991B1B"}
                bg={p.status === "paid" ? "rgba(20,181,126,0.12)" : "rgba(239,68,68,0.12)"}
              />
              <div className="font-mono text-[13.5px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                {formatMoney(p.amount, p.currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversionsTable({ conversions }: { conversions: Conversion[] }) {
  return (
    <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>Conversions</h2>
      {conversions.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--body)" }}>No sales yet.</p>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
          {conversions.map((c) => {
            const pill = STATUS_PILL[c.status] ?? STATUS_PILL.pending;
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[180px] flex-1">
                  <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                    {c.itemTitle || c.itemType || "Order"}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--body)" }}>
                    {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {` · ${formatMoney(c.orderTotal, c.currency)} order · ${c.commissionPercent}%`}
                  </p>
                </div>
                <Pill {...pill} />
                <div className="font-mono text-[13.5px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
                  {formatMoney(c.commissionAmount, c.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
