export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "Lead"
  | "AddToCart";

type Fbq = (
  command: "track",
  name: MetaEventName,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: unknown;
    __flybridgeMetaQueue?: { name: MetaEventName; params: Record<string, unknown> }[];
  }
}

/**
 * Browser-side Meta Pixel tracker. Events wait in a small queue if the loader
 * has not initialized yet; without a configured pixel, tracking is a no-op.
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
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return;
  const fbq = window.fbq;
  if (typeof fbq === "function") {
    fbq("track", name, params);
    return;
  }
  (window.__flybridgeMetaQueue ??= []).push({ name, params });
}
