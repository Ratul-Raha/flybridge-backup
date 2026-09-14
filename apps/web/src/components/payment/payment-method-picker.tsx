"use client";

import { Check } from "lucide-react";
import { formatMoney } from "@/lib/pricing";

export type PickableCurrency = "USD" | "BDT";

export type PickerPrices = { USD?: number; BDT?: number } | null | undefined;

type OptionDef = {
  code: PickableCurrency;
  name: string;
  priceLabel: string;
  methods: string[];
  logo: string;
  logoInvert?: boolean;
  background: string;
  accent: string;
  pill: string;
};

const OPTIONS: OptionDef[] = [
  {
    code: "USD",
    name: "Stripe",
    priceLabel: "USD",
    methods: ["Visa", "Mastercard", "Amex", "Apple Pay"],
    logo: "/payments/stripe.svg",
    logoInvert: true,
    background: "linear-gradient(135deg, #635BFF 0%, #5438FF 100%)",
    accent: "#635BFF",
    pill: "#FFFFFF",
  },
  {
    code: "BDT",
    name: "EPS",
    priceLabel: "BDT",
    methods: ["bKash", "Nagad", "Rocket", "Upay"],
    logo: "/payments/eps.png",
    background: "linear-gradient(135deg, #1C7A5E 0%, #0D6B4F 100%)",
    accent: "#1C7A5E",
    pill: "#FFFFFF",
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

  const amountFor = (code: PickableCurrency) => (code === "USD" ? usd : bdt);

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

      <div className="flex flex-col gap-3">
        {OPTIONS.filter((o) => {
          if (o.code === "USD") return usd !== null;
          return bdt !== null;
        }).map((option) => {
          const selected = value === option.code;
          const amount = amountFor(option.code);
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              aria-pressed={selected}
              className="relative w-full overflow-hidden rounded-2xl p-5 text-center transition-all duration-200"
              style={{
                background: option.background,
                boxShadow: selected
                  ? `0 18px 40px -18px ${option.accent}80`
                  : "0 8px 24px -16px rgba(0,0,0,0.28)",
                outline: selected ? `3px solid ${option.accent}` : "none",
                outlineOffset: 2,
              }}
            >
              <span
                className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors duration-200"
                style={{
                  borderColor: selected ? "#fff" : "rgba(255,255,255,0.45)",
                  background: selected ? "#fff" : "transparent",
                }}
              >
                {selected && <Check size={11} strokeWidth={4} style={{ color: option.accent }} />}
              </span>

              <span className="mx-auto mb-3 flex h-12 w-32 items-center justify-center rounded-xl bg-white px-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={option.logo}
                  alt={option.name}
                  width={100}
                  height={26}
                  style={{
                    height: 26,
                    width: "auto",
                    objectFit: "contain",
                    ...(option.logoInvert ? { filter: "brightness(0) invert(1)" } : null),
                  }}
                />
              </span>

              {amount !== null && (
                <span className="block text-[20px] font-extrabold leading-tight text-white">
                  {formatMoney(amount, option.code)}
                </span>
              )}
              <span className="mt-1 block text-[12px] font-medium text-white/80">
                {option.methods.join(" · ")}
              </span>

              <span
                className="mt-3.5 inline-flex w-full items-center justify-center rounded-xl py-2.5 text-[14px] font-bold transition-transform duration-200 group-hover:scale-[1.02]"
                style={{ background: option.pill, color: option.accent }}
              >
                Pay with {option.name}
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