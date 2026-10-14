"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  MousePointerClick,
  ShoppingBag,
  Wallet,
  CircleDollarSign,
} from "lucide-react";
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
  commissionAmount: number;
  commissionPercent: number;
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
  code: string;
  status: string;
  commissionPercent: number;
  currency: string;
  payoutMethod: string;
  payoutDetails: PayoutDetails;
};

type MeResponse = {
  affiliate: Affiliate | null;
  link?: string;
  totals?: Record<string, Totals>;
  clicks?: number;
  conversions?: Conversion[];
  payouts?: Payout[];
};

type Product = {
  type: string;
  id: string;
  title: string;
  path: string;
  paid: boolean;
};

const PRODUCT_GROUPS: { type: string; label: string }[] = [
  { type: "course", label: "Courses" },
  { type: "seminar", label: "Seminars" },
  { type: "mock-bundle", label: "Mock-test bundles" },
  { type: "resource", label: "Resources" },
];

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

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[20px] border bg-white p-5 flex flex-col gap-2" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-center gap-2 text-[12.5px] font-medium" style={{ color: "var(--body)" }}>
        <Icon size={15} /> {label}
      </div>
      <div className="font-display text-[24px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>
        {value}
      </div>
      {hint && (
        <div className="text-[12px]" style={{ color: "var(--body)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function AffiliateDashboard() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/affiliate/me", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load affiliate data");
      setData(json);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load affiliate data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the link — select and copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading your affiliate dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>
        {error}
      </p>
    );
  }

  if (!data?.affiliate) {
    return (
      <div className="rounded-[20px] border bg-white p-10 text-center" style={{ borderColor: "var(--line)" }}>
        <Wallet size={22} className="mx-auto mb-3" style={{ color: "var(--body)" }} />
        <p className="font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          You are not an affiliate yet
        </p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
          The FlyBridge affiliate program is by invitation. Contact the team to join.
        </p>
      </div>
    );
  }

  const affiliate = data.affiliate;
  const totals = data.totals ?? {};
  const currencies = Object.keys(totals);
  const primaryCurrency = currencies[0] ?? affiliate.currency;
  const primary: Totals =
    totals[primaryCurrency] ?? {
      conversions: 0,
      pending: 0,
      approved: 0,
      paid: 0,
      reversed: 0,
      orderTotal: 0,
    };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--body)" }}>
              Your affiliate link
            </p>
            <p className="mt-1 break-all font-mono text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
              {data.link}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-[9px] text-[13px] font-medium text-white"
            style={{ background: "var(--brand)" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-[12.5px]" style={{ color: "var(--body)" }}>
          Share this link. You earn {affiliate.commissionPercent}% of every completed order it brings in.
        </p>
      </div>

      <LinkBuilder base={data.link ?? ""} code={affiliate.code} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MousePointerClick} label="Clicks" value={String(data.clicks ?? 0)} />
        <StatCard
          icon={ShoppingBag}
          label="Sales"
          value={String(primary.conversions)}
          hint={formatMoney(primary.orderTotal, primaryCurrency) + " in sales"}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Pending"
          value={formatMoney(primary.pending, primaryCurrency)}
          hint="Clears after the refund window"
        />
        <StatCard
          icon={Wallet}
          label="Paid out"
          value={formatMoney(primary.paid, primaryCurrency)}
          hint={`${formatMoney(primary.approved, primaryCurrency)} approved & unpaid`}
        />
      </div>

      {currencies.length > 1 && (
        <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
          <h2 className="mb-3 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
            Earnings by currency
          </h2>
          <div className="flex flex-col gap-2">
            {currencies.map((code) => {
              const t = totals[code];
              return (
                <div key={code} className="flex items-center justify-between text-[13px]" style={{ color: "var(--body)" }}>
                  <span>{code}</span>
                  <span className="tabular-nums">
                    {formatMoney(t.pending, code)} pending · {formatMoney(t.approved, code)} approved ·{" "}
                    {formatMoney(t.paid, code)} paid
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Recent sales
        </h2>
        {(data.conversions ?? []).length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--body)" }}>
            No sales yet. Share your link to get started.
          </p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {(data.conversions ?? []).map((c) => {
              const pill = STATUS_PILL[c.status] ?? STATUS_PILL.pending;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[180px] flex-1">
                    <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {c.itemTitle || c.itemType || "Order"}
                    </p>
                    <p className="text-[12px]" style={{ color: "var(--body)" }}>
                      {new Date(c.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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

      <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <h2 className="mb-4 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
          Payouts
        </h2>
        {(data.payouts ?? []).length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--body)" }}>
            No payouts yet. Approved earnings are paid out manually.
          </p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
            {(data.payouts ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[180px] flex-1">
                  <p className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                    {p.method}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--body)" }}>
                    {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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

      <PayoutMethodForm affiliate={affiliate} onSaved={load} />
    </div>
  );
}

function PayoutMethodForm({
  affiliate,
  onSaved,
}: {
  affiliate: Affiliate;
  onSaved: () => Promise<void> | void;
}) {
  const [form, setForm] = useState<PayoutDetails>(affiliate.payoutDetails);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof PayoutDetails>(key: K, value: PayoutDetails[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/affiliate/me/payout-method", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutDetails: form }),
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
    <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-1 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
        Payout method
      </h2>
      <p className="mb-4 text-[12.5px]" style={{ color: "var(--body)" }}>
        Where should we send your earnings?
      </p>

      {error && (
        <p className="mb-3 text-[13px] font-medium" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>
            Method
          </label>
          <select
            value={form.method}
            onChange={(e) => setField("method", e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <option value="bKash">bKash</option>
            <option value="bank">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>
            Account name
          </label>
          <input
            value={form.accountName}
            onChange={(e) => setField("accountName", e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>
            {form.method === "bKash" ? "bKash number" : "Account number"}
          </label>
          <input
            value={form.accountNumber}
            onChange={(e) => setField("accountNumber", e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
        {form.method === "bank" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>
                Bank name
              </label>
              <input
                value={form.bankName}
                onChange={(e) => setField("bankName", e.target.value)}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>
                Branch
              </label>
              <input
                value={form.branchName}
                onChange={(e) => setField("branchName", e.target.value)}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={{ color: "var(--ink)" }}>
                Routing number
              </label>
              <input
                value={form.routingNumber}
                onChange={(e) => setField("routingNumber", e.target.value)}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[13.5px] font-medium text-white disabled:opacity-60"
        style={{ background: "var(--brand)" }}
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saved ? "Saved" : "Save payout method"}
      </button>
    </div>
  );
}

const CUSTOM = "__custom__";

function LinkBuilder({ base, code }: { base: string; code: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [path, setPath] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/affiliate/products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (active) setProducts(data.products ?? []);
      })
      .catch(() => {
        // The picker is optional — a custom path still works without it.
      });
    return () => {
      active = false;
    };
  }, []);

  const groups = PRODUCT_GROUPS.map((group) => ({
    ...group,
    items: products.filter((product) => product.type === group.type),
  })).filter((group) => group.items.length > 0);

  const trimmed = path.trim();
  const normalized = trimmed ? (trimmed.startsWith("/") ? trimmed : `/${trimmed}`) : "";
  const link = normalized && normalized !== "/" ? `${base}?to=${encodeURIComponent(normalized)}` : base;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore — the URL is visible for manual copy.
    }
  };

  return (
    <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
      <h2 className="mb-1 font-display text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
        Link builder
      </h2>
      <p className="mb-4 text-[12.5px]" style={{ color: "var(--body)" }}>
        Point your link at a specific course, seminar or bundle — targeted links convert better than the
        homepage.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>
            Product
          </label>
          <select
            value={products.some((product) => product.path === normalized) ? normalized : CUSTOM}
            onChange={(e) => setPath(e.target.value === CUSTOM ? "" : e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <option value={CUSTOM}>Homepage / custom path</option>
            {groups.map((group) => (
              <optgroup key={group.type} label={group.label}>
                {group.items.map((product) => (
                  <option key={`${group.type}:${product.id}`} value={product.path}>
                    {product.title}
                    {product.paid ? "" : " (free)"}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={{ color: "var(--ink)" }}>
            Path
          </label>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/programs/student-visa-blueprint"
            className={`${inputClass} font-mono`}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 break-all font-mono text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
          {link}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-full px-5 py-[9px] text-[13px] font-medium text-white"
          style={{ background: "var(--brand)" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="mt-3 text-[12px]" style={{ color: "var(--body)" }}>
        {`Prefer a plain URL? Add ?ref=${code} to any FlyBridge link and it works the same.`}
      </p>
    </div>
  );
}
