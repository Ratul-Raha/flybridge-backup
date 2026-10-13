"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Tag, X } from "lucide-react";
import type { OrderItemType } from "@/lib/models/order";
import { formatMoney } from "@/lib/pricing";

export type CouponQuote = {
  code: string;
  label: string;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  total: number;
  currency: string;
};

export function CouponCodeEntry({
  itemType,
  itemId,
  currency,
  onQuoteChange,
}: {
  itemType: OrderItemType;
  itemId: string;
  currency: string;
  onQuoteChange: (quote: CouponQuote | null) => void;
}) {
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<CouponQuote | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setCode("");
    setQuote(null);
    setApplying(false);
    setError(null);
    onQuoteChange(null);
    return () => {
      requestId.current += 1;
    };
  }, [itemId, itemType, currency, onQuoteChange]);

  const clearQuote = () => {
    setQuote(null);
    onQuoteChange(null);
  };

  const apply = async () => {
    const requestedCode = code.trim().toUpperCase();
    if (!requestedCode) return;
    const activeRequest = ++requestId.current;
    setApplying(true);
    setError(null);
    try {
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, currency, code: requestedCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not apply coupon");
      if (activeRequest !== requestId.current) return;
      const nextQuote = data as CouponQuote;
      setCode(nextQuote.code ?? requestedCode);
      setQuote(nextQuote);
      onQuoteChange(nextQuote);
    } catch (cause) {
      if (activeRequest !== requestId.current) return;
      clearQuote();
      setError(cause instanceof Error ? cause.message : "Could not apply coupon");
    } finally {
      if (activeRequest === requestId.current) setApplying(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
          <input
            type="text"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              if (quote) clearQuote();
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void apply();
              }
            }}
            disabled={applying}
            placeholder="Coupon code"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-[13px] uppercase outline-none transition-colors placeholder:normal-case placeholder:text-body/50 focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15 disabled:opacity-60"
            style={{ color: "var(--ink)" }}
          />
        </div>
        {quote ? (
          <button
            type="button"
            onClick={() => {
              setCode("");
              setError(null);
              clearQuote();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold"
            style={{ borderColor: "var(--line)", color: "var(--body)" }}
          >
            <X size={13} /> Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void apply()}
            disabled={applying || !code.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            {applying ? <Loader2 size={13} className="animate-spin" /> : null}
            {applying ? "Applying" : "Apply"}
          </button>
        )}
      </div>
      {quote && (
        <p className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#16834B" }}>
          <Check size={13} /> {quote.code} applied — save {formatMoney(quote.couponDiscount, quote.currency)}.
        </p>
      )}
      {error && <p className="text-[12px] font-medium" style={{ color: "#C0392B" }}>{error}</p>}
    </div>
  );
}
