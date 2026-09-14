export const MULTI_CURRENCY_CODES = ["USD", "BDT"] as const;
export type SupportedCurrency = (typeof MULTI_CURRENCY_CODES)[number];

export type CurrencyPrices = Partial<Record<SupportedCurrency, number>>;
export type StoredPrices = { [K in SupportedCurrency]?: number | null | undefined };

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  BDT: "৳",
};

export type PriceInput = {
  price?: number;
  currency?: string;
  prices?: CurrencyPrices | null;
};

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function sanitizePrices(raw: unknown): CurrencyPrices | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const out: CurrencyPrices = {};
  for (const code of MULTI_CURRENCY_CODES) {
    if (isNonNegativeNumber(record[code])) out[code] = record[code];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function cleanPrices(raw: StoredPrices | null | undefined): CurrencyPrices {
  if (!raw || typeof raw !== "object") return {};
  const out: CurrencyPrices = {};
  for (const code of MULTI_CURRENCY_CODES) {
    if (isNonNegativeNumber(raw[code])) out[code] = raw[code];
  }
  return out;
}

export function priceFor(p: PriceInput, code: string): number | undefined {
  if (isNonNegativeNumber(p.prices?.[code as SupportedCurrency])) {
    return p.prices![code as SupportedCurrency];
  }
  if ((code ?? "").toUpperCase() === (p.currency ?? "USD").toUpperCase()) {
    return p.price;
  }
  return undefined;
}

export function priceEntries(p: PriceInput): { amount: number; currency: string }[] {
  const entries: { amount: number; currency: string }[] = [];
  const primaryCurrency = (p.currency ?? "USD").toUpperCase();
  if (isNonNegativeNumber(p.price)) {
    entries.push({ amount: p.price, currency: primaryCurrency });
  }
  for (const code of MULTI_CURRENCY_CODES) {
    if (code === primaryCurrency) continue;
    if (isNonNegativeNumber(p.prices?.[code])) {
      entries.push({ amount: p.prices![code], currency: code });
    }
  }
  return entries;
}

export function formatMoney(amount: number, code: string): string {
  const currency = (code ?? "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[currency];
  const value = Number.isInteger(amount)
    ? amount.toLocaleString("en-US")
    : amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return symbol ? `${symbol}${value}` : `${value} ${currency}`;
}

export function formatPriceText(p: PriceInput): string {
  const entries = priceEntries(p).filter((e) => e.amount > 0);
  if (entries.length === 0) return "Free";
  return entries.map((e) => formatMoney(e.amount, e.currency)).join(" · ");
}

export function priceTextFor(p: PriceInput, code: string): string {
  const currency = (code ?? "").toUpperCase();
  let amount: number | undefined;
  if (currency === "BDT") amount = p.prices?.BDT;
  else amount = p.price;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "Free";
  }
  return formatMoney(amount, currency || "USD");
}