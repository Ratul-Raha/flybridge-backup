export const WISHLIST_PENDING_KEY = "flybridge_pending_wishlist";

export type WishlistDiscount = {
  /** Percent off, as a whole number (e.g. 10). Zero means no discount. */
  percent: number;
  /** How much the discount takes off the already-discounted price. */
  amount: number;
  /** The final price after the general discount and the wishlist discount. */
  price: number;
};

/**
 * The wishlist discount is applied on top of the course's own (general)
 * discount: first the general discount lowers the list price, then the
 * waitlist percent takes a further cut off that already-discounted amount.
 * The two discounts stack sequentially rather than being added together.
 */
export function applyWishlistDiscount(price: number, percent: number): WishlistDiscount {
  const pct =
    typeof percent === "number" && Number.isFinite(percent)
      ? Math.min(100, Math.max(0, percent))
      : 0;
  if (pct <= 0 || !Number.isFinite(price) || price <= 0) {
    return { percent: 0, amount: 0, price };
  }

  const final = roundMoney(price * (1 - pct / 100));
  // Never let a bad percent make the price go below zero.
  const safe = Math.max(0, final);
  const amount = roundMoney(price - safe);

  return { percent: pct, amount, price: safe };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
