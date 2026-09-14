"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MULTI_CURRENCY_CODES,
  CURRENCY_SYMBOLS,
  convertAmount,
  formatMoney,
  fromBaseUsd,
  type SupportedCurrency,
} from "@/lib/pricing";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  /** Format a USD-normalized amount in the selected display currency. */
  moneyUsd: (amountUsd: number) => string;
  /** Convert an amount from its source currency into the selected display currency. */
  money: (amount: number, from?: string) => string;
};

const STORAGE_KEY = "flybridge.currency";

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("USD");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && (MULTI_CURRENCY_CODES as readonly string[]).includes(stored)) {
        setCurrencyState(stored as SupportedCurrency);
      }
    } catch {}
  }, []);

  const setCurrency = useCallback((c: SupportedCurrency) => {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      moneyUsd: (amountUsd) => formatMoney(fromBaseUsd(amountUsd, currency), currency),
      money: (amount, from) => formatMoney(convertAmount(amount, from ?? "USD", currency), currency),
    }),
    [currency, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within <CurrencyProvider>");
  return ctx;
}

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-soft)" }}>
      {MULTI_CURRENCY_CODES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setCurrency(code)}
          aria-pressed={currency === code}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold rounded-md px-2.5 py-1.5 transition-all"
          style={
            currency === code
              ? { background: "var(--brand)", color: "#fff", boxShadow: "0 1px 3px rgba(15,169,104,0.3)" }
              : { color: "var(--body)" }
          }
        >
          <span className="text-[10.5px]">{CURRENCY_SYMBOLS[code]}</span>
          {code}
        </button>
      ))}
    </div>
  );
}