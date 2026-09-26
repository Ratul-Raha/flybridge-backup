export type MetaEventName =
  | "ViewContent"
  | "InitiateCheckout"
  | "Lead"
  | "AddToCart"
  | "Purchase";

type Fbq = (
  command: "track",
  name: MetaEventName,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: unknown;
  }
}

/**
 * Browser-side Meta Pixel tracker. No-ops until the pixel script has loaded,
 * so call sites never have to care whether tracking is configured.
 *
 * Purchase is intentionally absent: orders complete server-side after the buyer
 * leaves for bKash/Nagad/Stripe, so it is reported via the Conversions API in
 * lib/meta-capi.ts instead. Firing it here as well would double-count.
 */
export function trackMetaEvent(
  name: MetaEventName,
  params: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  fbq("track", name, params);
}
