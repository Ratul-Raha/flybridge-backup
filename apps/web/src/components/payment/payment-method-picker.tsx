"use client";

import { Check, CreditCard, Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/pricing";

export type PickableCurrency = "USD" | "BDT";

export type PickerPrices = { USD?: number; BDT?: number } | null | undefined;

type OptionMeta = {
  code: PickableCurrency;
  title: string;
  subtitle: string;
  methods: string[];
};

const OPTIONS: OptionMeta[] = [
  {
    code: "USD",
    title: "Card payment",
    subtitle: "Pay with international cards via Stripe",
    methods: ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"],
  },
  {
    code: "BDT",
    title: "EPS · bKash",
    subtitle: "Local Bangladeshi payments via EPS",
    methods: ["bKash", "Nagad", "Rocket", "Upay", "MY Cash", "Cards"],
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

  const pricePair = [
    usd ? formatMoney(usd, "USD") : null,
    bdt ? formatMoney(bdt, "BDT") : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="space-y-3">
      {pricePair.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl border bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
            Price
          </span>
          <span className="text-[13px] font-bold" style={{ color: "var(--brand-2)" }}>
            {pricePair.join(" / ")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {OPTIONS.filter(
          (o) =>
            (o.code === "USD" && usd !== null) || (o.code === "BDT" && bdt !== null)
        ).map((option) => {
          const selected = value === option.code;
          const amount = option.code === "USD" ? usd : bdt;
          const Icon = option.code === "USD" ? CreditCard : Smartphone;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              className="flex flex-col gap-3 rounded-xl border bg-white p-4 text-left transition-all duration-200"
              style={{
                borderColor: selected ? "var(--brand-2)" : "var(--line)",
                boxShadow: selected ? "0 8px 22px -12px rgba(47,95,224,0.45)" : "none",
              }}
            >
              <span className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: selected ? "var(--brand-soft)" : "var(--bg-soft)",
                    color: selected ? "var(--brand-2)" : "var(--body)",
                  }}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="block truncate text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                      {option.title}
                    </span>
                    {selected && (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "var(--brand-2)", color: "#fff" }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[11.5px]" style={{ color: "var(--body)" }}>
                    {option.subtitle}
                  </span>
                </span>
              </span>

              {amount !== null && (
                <span className="block text-[15px] font-bold" style={{ color: "var(--brand-2)" }}>
                  {formatMoney(amount, option.code)}
                </span>
              )}

              <span className="flex flex-wrap gap-1.5">
                {option.methods.map((method) => (
                  <span
                    key={method}
                    className="rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium"
                    style={{
                      borderColor: selected ? "var(--brand-2)" : "var(--line)",
                      background: selected ? "var(--brand-soft)" : "var(--bg-soft)",
                      color: "var(--body)",
                    }}
                  >
                    {method}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--body)", opacity: 0.75 }}>
        You'll be redirected to a secure checkout page to complete your payment.
      </p>
    </div>
  );
}