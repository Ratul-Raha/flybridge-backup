"use client";

import { Landmark, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/pricing";

export type PickableCurrency = "USD" | "BDT";

export type PickerPrices = { USD?: number; BDT?: number } | null | undefined;

const METHOD_META: Record<
  PickableCurrency,
  { label: string; note: string }
> = {
  USD: { label: "US Dollar", note: "Stripe · cards, Apple Pay" },
  BDT: { label: "Bangladeshi Taka", note: "EPS · bKash, Nagad, cards" },
};

export function PaymentMethodPicker({
  prices,
  value,
  onChange,
}: {
  prices: PickerPrices;
  value: PickableCurrency;
  onChange: (currency: PickableCurrency) => void;
}) {
  const usd = typeof prices?.USD === "number" && prices.USD > 0 ? prices.USD : null;
  const bdt = typeof prices?.BDT === "number" && prices.BDT > 0 ? prices.BDT : null;
  const available: PickableCurrency[] = [];
  if (usd) available.push("USD");
  if (bdt) available.push("BDT");

  if (available.length < 2) {
    const only = available[0];
    const meta = METHOD_META[only ?? "USD"];
    const amount = only === "BDT" ? bdt : usd;
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: "var(--line)" }}>
        <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--body)" }}>
          Pay {only && amount ? formatMoney(amount, only) : "Free"} via{" "}
          <span className="font-semibold" style={{ color: "var(--ink)" }}>{meta.label}</span>{" "}
          ({meta.note}).
        </p>
      </div>
    );
  }

  const amounts: Record<PickableCurrency, number> = { USD: usd!, BDT: bdt! };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {available.map((code) => {
          const meta = METHOD_META[code];
          const selected = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all duration-200"
              style={{
                borderColor: selected ? "var(--brand-2)" : "var(--line)",
                boxShadow: selected ? "0 8px 22px -12px rgba(47,95,224,0.45)" : "none",
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: selected ? "var(--brand-soft)" : "var(--bg-soft)",
                  color: selected ? "var(--brand-2)" : "var(--body)",
                }}
              >
                <Landmark size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                  {code} · {formatMoney(amounts[code], code)}
                </span>
                <span className="block truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                  {meta.note}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-[11.5px] leading-relaxed" style={{ color: "var(--body)", opacity: 0.75 }}>
        You'll be redirected to a secure checkout page where you can pay with your chosen method.
      </p>
    </div>
  );
}