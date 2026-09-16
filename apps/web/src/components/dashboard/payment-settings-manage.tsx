"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type GatewayState = {
  mode: string;
  testKey: boolean;
  liveKey: boolean;
  testWebhook: boolean;
  liveWebhook: boolean;
};

type EpsState = {
  mode: string;
  envCreds: boolean;
};

type SettingsData = {
  stripe: GatewayState;
  eps: EpsState;
};

function ModeSegmented({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-soft)" }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            disabled={disabled}
            className="text-[12.5px] font-semibold rounded-lg px-4 py-2 transition-all disabled:opacity-50"
            style={
              active
                ? { background: "var(--brand)", color: "#fff", boxShadow: "0 1px 4px rgba(15,169,104,0.35)" }
                : { color: "var(--body)" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusDot({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className={`inline-flex h-2 w-2 rounded-full ${ok ? "" : ""}`}
        style={{ background: ok ? "#10B981" : "#F59E0B" }}
      />
      <span style={{ color: "var(--ink)" }}>{label}</span>
      {hint && <span style={{ color: "var(--body)" }}>{hint}</span>}
    </div>
  );
}

export function PaymentSettingsManage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [stripeMode, setStripeMode] = useState<string>("test");
  const [epsMode, setEpsMode] = useState<string>("sandbox");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment-settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load payment settings");
      const d = (await res.json()) as SettingsData;
      setData(d);
      setStripeMode(d.stripe.mode);
      setEpsMode(d.eps.mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeMode, epsMode }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Failed to save");
      }
      setSaved(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const changed =
    !!data && (stripeMode !== data.stripe.mode || epsMode !== data.eps.mode);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Settings"
        subtitle="Choose which gateway environment (Test or Live) processes real checkouts."
      />

      {error && (
        <div className="rounded-lg px-4 py-3 text-[13px]" style={{ background: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg px-4 py-3 text-[13px]" style={{ background: "#ECFDF5", color: "#047857" }}>
          Settings saved and active immediately.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Stripe */}
        <div className="rounded-lg border bg-white p-6" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(99,91,255,0.12)", color: "#635BFF" }}>
                <CreditCard size={18} />
              </span>
              <div>
                <h3 className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>Stripe</h3>
                <p className="text-[11.5px]" style={{ color: "var(--body)" }}>Card payments (USD)</p>
              </div>
            </div>
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[4px]"
              style={{
                background: stripeMode === "live" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                color: stripeMode === "live" ? "#DC2626" : "#B45309",
              }}
            >
              {stripeMode === "live" ? "LIVE" : "TEST"}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-[11.5px] font-medium mb-2" style={{ color: "var(--body)" }}>
              Gateway mode
            </p>
            <ModeSegmented
              options={[
                { value: "test", label: "Test" },
                { value: "live", label: "Live" },
              ]}
              value={stripeMode}
              onChange={setStripeMode}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2.5 rounded-xl border px-4 py-3.5" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
            <StatusDot ok={data?.stripe.testKey ?? false} label="Test secret key" hint={data?.stripe.testKey ? "sk_test_… configured" : "missing"} />
            <StatusDot ok={data?.stripe.liveKey ?? false} label="Live secret key" hint={data?.stripe.liveKey ? "sk_live_… configured" : "missing"} />
            <StatusDot ok={data?.stripe.testWebhook ?? false} label="Test webhook secret" hint={data?.stripe.testWebhook ? "configured" : "missing"} />
            <StatusDot ok={data?.stripe.liveWebhook ?? false} label="Live webhook secret" hint={data?.stripe.liveWebhook ? "configured" : "missing"} />
          </div>

          {stripeMode === "live" && !data?.stripe.liveKey && (
            <p className="mt-3 flex items-start gap-1.5 text-[12px] font-medium" style={{ color: "#B45309" }}>
              <AlertTriangle size={13} className="mt-[1px] shrink-0" />
              Live is selected but no <code>STRIPE_SECRET_KEY</code> (sk_live_) is set — checkouts will fail until it is added.
            </p>
          )}
        </div>

        {/* EPS */}
        <div className="rounded-lg border bg-white p-6" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(28,122,94,0.12)", color: "#1C7A5E" }}>
                <Landmark size={18} />
              </span>
              <div>
                <h3 className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>EPS</h3>
                <p className="text-[11.5px]" style={{ color: "var(--body)" }}>bKash / Nagad / Rocket (BDT)</p>
              </div>
            </div>
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[4px]"
              style={{
                background: epsMode === "production" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                color: epsMode === "production" ? "#DC2626" : "#B45309",
              }}
            >
              {epsMode === "production" ? "LIVE" : "TEST"}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-[11.5px] font-medium mb-2" style={{ color: "var(--body)" }}>
              Gateway mode
            </p>
            <ModeSegmented
              options={[
                { value: "sandbox", label: "Test (Sandbox)" },
                { value: "production", label: "Live (Production)" },
              ]}
              value={epsMode}
              onChange={setEpsMode}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2.5 rounded-xl border px-4 py-3.5" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
            <StatusDot ok={epsMode !== "production"} label="Sandbox credentials" hint="public demo account" />
            <StatusDot ok={data?.eps.envCreds ?? false} label="Live credentials" hint={data?.eps.envCreds ? "configured" : "missing"} />
          </div>

          {epsMode === "production" && !data?.eps.envCreds && (
            <p className="mt-3 flex items-start gap-1.5 text-[12px] font-medium" style={{ color: "#B45309" }}>
              <AlertTriangle size={13} className="mt-[1px] shrink-0" />
              Live is selected but the EPS credentials (username, password, hash key, merchant &amp; store ID) are not set — checkouts will fail until they are added.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !changed}
          className="inline-flex items-center gap-2 rounded-full text-[13.5px] font-semibold text-white px-6 py-2.5 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--brand)" }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-full text-[13px] font-semibold px-4 py-2.5 border transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-50"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
        {!changed && !saving && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--body)" }}>
            <Check size={13} style={{ color: "#10B981" }} />
            Settings are up to date
          </span>
        )}
      </div>

      <p className="text-[12px] leading-relaxed max-w-[720px]" style={{ color: "var(--body)", opacity: 0.8 }}>
        Switching modes takes effect immediately for new checkouts. Orders already created keep their stored gateway
        reference, so a payment is always verified against the gateway it was started on. Test mode is safe to use with
        Stripe test keys and the public EPS sandbox account — never run real checkouts in live mode without verified
        credentials.
      </p>
    </div>
  );
}