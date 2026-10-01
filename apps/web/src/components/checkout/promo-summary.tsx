"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMoney } from "@/lib/pricing";

export type PromoPricing = {
  subtotal: number;
  discount: number;
  total: number;
  label: string | null;
  code: string | null;
  currency: string;
};

export function PromoSummary({
  itemType,
  itemId,
  currency,
  baseAmount,
  onCodeChange,
  onPricingChange,
}: {
  itemType: "resource" | "mock-bundle" | "seminar";
  itemId: string;
  currency: string;
  baseAmount: number;
  onCodeChange?: (code: string | null) => void;
  onPricingChange?: (pricing: PromoPricing | null) => void;
}) {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<PromoPricing | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const codeChangeRef = useRef(onCodeChange);
  const pricingChangeRef = useRef(onPricingChange);
  useEffect(() => {
    codeChangeRef.current = onCodeChange;
    pricingChangeRef.current = onPricingChange;
  });

  const fetchPricing = useCallback(
    async (code?: string) => {
      if (!user) return null;
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          itemId,
          currency,
          code: code?.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not apply promo code");
      return data as PromoPricing;
    },
    [user, itemType, itemId, currency]
  );

  useEffect(() => {
    if (!user) {
      setPricing(null);
      pricingChangeRef.current?.(null);
      return;
    }
    let active = true;
    fetchPricing(appliedCode ?? undefined)
      .then((data) => {
        if (!active) return;
        setPricing(data);
        pricingChangeRef.current?.(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, fetchPricing, appliedCode]);

  const applyCode = async () => {
    const value = promoCode.trim();
    if (!value) return;
    setApplying(true);
    setPromoError(null);
    try {
      const data = await fetchPricing(value);
      if (data) {
        setPricing(data);
        pricingChangeRef.current?.(data);
      }
      setAppliedCode(value);
      codeChangeRef.current?.(value);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Could not apply promo code");
    } finally {
      setApplying(false);
    }
  };

  const displayCurrency = pricing?.currency ?? currency;
  const hasDiscount = !!pricing && pricing.discount > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)" }}>
      {user && (
        <>
          <div className="flex items-center justify-between text-[13px]">
            <span style={{ color: "var(--body)" }}>Subtotal</span>
            <span style={{ color: "var(--ink)" }}>
              {formatMoney(pricing?.subtotal ?? baseAmount, displayCurrency)}
            </span>
          </div>
          {hasDiscount && (
            <div className="flex items-center justify-between text-[13px]" style={{ color: "#1E8E5A" }}>
              <span>{pricing!.label ?? "Discount"}</span>
              <span>-{formatMoney(pricing!.discount, displayCurrency)}</span>
            </div>
          )}
          <div
            className="flex items-center justify-between border-t pt-2.5 text-[14px] font-bold"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <span>Total</span>
            <span>{formatMoney(pricing?.total ?? baseAmount, displayCurrency)}</span>
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setPromoCode(value);
            // Only an empty field retracts the code. Reporting every keystroke
            // would hand the parent a half-typed code it never validated, and
            // the order would be created with it.
            if (!value.trim()) {
              setAppliedCode(null);
              codeChangeRef.current?.(null);
            }
          }}
          placeholder="Promo code"
          className="w-full rounded-xl border bg-white px-3.5 py-2 text-[13px] uppercase outline-none transition-colors placeholder:text-body/50 focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        />
        <button
          type="button"
          onClick={applyCode}
          disabled={applying || !promoCode.trim() || !user}
          className="shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          title={!user ? "Sign in to apply a code" : undefined}
        >
          {applying ? "Applying…" : "Apply"}
        </button>
      </div>
      {promoError && (
        <p className="text-[12px] font-medium" style={{ color: "#C0392B" }}>
          {promoError}
        </p>
      )}
      {!user && (
        <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
          Sign in to use a promo code.
        </p>
      )}
    </div>
  );
}
