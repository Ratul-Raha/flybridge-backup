/**
 * The money half of discount resolution, kept free of `server-only` and Mongoose
 * so the arithmetic that decides what a shopper is charged can be tested directly.
 * `lib/discounts.ts` owns the database gates; this owns the numbers.
 */

export type DiscountCandidate = {
  id?: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  currency?: string;
  code?: string;
};

export type PricedDiscount = {
  subtotal: number;
  discount: number;
  total: number;
  discountId?: string;
  code?: string;
  label?: string;
};

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A fixed amount is only worth anything in the currency it was written in. */
export function appliesInCurrency(candidate: DiscountCandidate, currency: string): boolean {
  if (candidate.type !== "fixed") return true;
  return (candidate.currency ?? "USD").toUpperCase() === currency.toUpperCase();
}

export function savingsFor(
  candidate: DiscountCandidate,
  amount: number,
  currency: string
): number | null {
  if (!appliesInCurrency(candidate, currency)) return null;
  if (candidate.type === "fixed") {
    return roundMoney(Math.min(candidate.value, amount));
  }
  return roundMoney(Math.min((amount * candidate.value) / 100, amount));
}

/**
 * The shopper always gets the cheapest total. Ties go to a discount they typed a
 * code for, so the code they entered is the one that lands on the order, and
 * otherwise the first candidate wins so the result is stable across requests.
 */
export function pickBestCandidate(
  candidates: DiscountCandidate[],
  amount: number,
  currency: string
): { candidate: DiscountCandidate; savings: number } | null {
  let best: { candidate: DiscountCandidate; savings: number } | null = null;
  for (const candidate of candidates) {
    const savings = savingsFor(candidate, amount, currency);
    if (savings === null || savings <= 0) continue;
    if (!best || savings > best.savings || (savings === best.savings && candidate.code)) {
      best = { candidate, savings };
    }
  }
  return best;
}

export function priceFrom(
  candidates: DiscountCandidate[],
  amount: number,
  currency: string
): PricedDiscount {
  const subtotal = roundMoney(amount);
  const best = pickBestCandidate(candidates, subtotal, currency);
  const discount = best ? roundMoney(Math.min(best.savings, subtotal)) : 0;
  return {
    subtotal,
    discount,
    total: roundMoney(subtotal - discount),
    discountId: best?.candidate.id,
    code: best?.candidate.code,
    label: best?.candidate.label,
  };
}
