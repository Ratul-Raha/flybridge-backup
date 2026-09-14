"use client";

import { Check, CreditCard, Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/pricing";

export type PickableCurrency = "USD" | "BDT";

export type PickerPrices = { USD?: number; BDT?: number } | null | undefined;

type OptionDef = {
  code: PickableCurrency;
  brand: string;
  title: string;
  note: string;
  methods: string[];
};

const OPTIONS: OptionDef[] = [
  {
    code: "USD",
    brand: "Stripe",
    title: "International cards",
    note: "Secure card checkout · USD",
    methods: ["Visa", "Mastercard", "Amex", "Apple Pay"],
  },
  {
    code: "BDT",
    brand: "bKash",
    title: "Mobile wallet · BDT",
    note: "Instant local payment",
    methods: ["bKash", "Nagad", "Rocket", "Upay"],
  },
];

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

  const pair: { code: PickableCurrency; amount: number }[] = [];
  if (usd !== null) pair.push({ code: "USD", amount: usd });
  if (bdt !== null) pair.push({ code: "BDT", amount: bdt });

  return (
    <div className="space-y-3">
      {pair.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border bg-white px-4 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
            Amount
          </span>
          <span className="flex flex-wrap items-baseline gap-1.5">
            {pair.map((p, i) => (
              <span key={p.code} className="inline-flex items-baseline gap-1.5">
                {i > 0 && <span className="text-[12px]" style={{ color: "var(--body)" }}>/</span>}
                <span className="text-[15px] font-bold" style={{ color: "var(--brand-2)" }}>
                  {formatMoney(p.amount, p.code)}
                </span>
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5">
        {OPTIONS.filter(
          (o) => (o.code === "USD" && usd !== null) || (o.code === "BDT" && bdt !== null)
        ).map((option) => {
          const selected = value === option.code;
          const amount = option.code === "USD" ? usd : bdt;
          const Icon = option.code === "USD" ? CreditCard : Smartphone;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              aria-pressed={selected}
              className="flex items-start gap-3.5 rounded-xl border bg-white p-4 text-left transition-all duration-200"
              style={{
                borderColor: selected ? "var(--brand-2)" : "var(--line)",
                boxShadow: selected
                  ? "0 10px 26px -14px rgba(47,95,224,0.4)"
                  : "none",
              }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: selected ? "var(--brand-soft)" : "var(--bg-soft)",
                  color: selected ? "var(--brand-2)" : "var(--body)",
                }}
              >
                <Icon size={20} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>
                    {option.brand}
                    <span className="ml-1.5 font-medium text-[12px]" style={{ color: "var(--body)" }}>
                      {option.title}
                    </span>
                  </span>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200"
                    style={{
                      borderColor: selected ? "var(--brand-2)" : "var(--line)",
                      background: selected ? "var(--brand-2)" : "transparent",
                    }}
                  >
                    {selected && <Check size={11} strokeWidth={3.5} style={{ color: "#fff" }} />}
                  </span>
                </span>

                <span className="mt-0.5 block text-[11.5px]" style={{ color: "var(--body)" }}>
                  {amount !== null && (
                    <span className="font-semibold" style={{ color: "var(--brand-2)" }}>
                      {formatMoney(amount, option.code)}{" "}
                    </span>
                  )}
                  {option.note}
                </span>

                <span className="mt-2 flex flex-wrap gap-1.5">
                  {option.methods.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-[0.04em]"
                      style={{
                        borderColor: selected ? "var(--brand-2)" : "var(--line)",
                        background: selected ? "var(--brand-soft)" : "var(--bg-soft)",
                        color: "var(--body)",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--body)", opacity: 0.75 }}>
        You&apos;ll be redirected to a secure payment page to complete checkout.
      </p>
    </div>
  );
}