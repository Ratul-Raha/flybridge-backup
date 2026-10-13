import "server-only";

import { createHash } from "node:crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

function md5(value: string): string {
  return createHash("md5").update(value.trim().toLowerCase()).digest("hex");
}

/** Meta expects digits only, no "+" or separators. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type MetaPurchaseInput = {
  /** Stable per-order id so Meta can dedupe retries. */
  eventId: string;
  orderId: string;
  email?: string | null;
  phone?: string | null;
  value: number;
  currency: string;
  contentIds: string[];
  eventSourceUrl: string;
  contentName?: string;
  fbc?: string | null;
  fbp?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

export function isMetaPurchaseEnabled(): boolean {
  return Boolean(PIXEL_ID && ACCESS_TOKEN);
}

/**
 * Server-side Purchase event.
 *
 * Mobile banking (bKash/Nagad/Rocket) and card checkout both bounce the buyer
 * off-site, so a browser-only pixel loses most purchases. This runs from
 * fulfillOrder, the single funnel every gateway funnels through.
 *
 * Resolves with Meta's `fbtrace_id`, which is what Meta support asks for when
 * reconciling reported against received event counts.
 */
export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<string> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return "";

  const userData: Record<string, unknown> = {};
  if (input.email) userData.em = [md5(input.email)];
  if (input.phone) {
    const phone = normalizePhone(input.phone);
    if (phone) userData.ph = [md5(phone)];
  }
  if (input.fbc) userData.fbc = input.fbc;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: new URL(input.eventSourceUrl, `${SITE_URL}/`).toString(),
        user_data: userData,
        custom_data: {
          currency: input.currency.toUpperCase(),
          value: input.value,
          content_ids: input.contentIds,
          content_type: "product",
          order_id: input.orderId,
          ...(input.contentName ? { content_name: input.contentName } : {}),
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Meta CAPI ${res.status}: ${detail.slice(0, 300)}`);
  }

  // The Graph API answers 200 even when it rejects the payload — a wrong pixel
  // id, a bad token or a malformed field comes back as `events_received: 0` with
  // an `errors` array. Checking only the status code makes every one of those
  // look like a success, and the purchase would be silently lost.
  const body = (await res.json().catch(() => null)) as {
    events_received?: number;
    fbtrace_id?: string;
    errors?: { message?: string; code?: number }[];
  } | null;

  if (body?.errors?.length) {
    const detail = body.errors
      .map((e) => `[${e.code ?? "?"}] ${e.message ?? "unknown"}`)
      .join("; ");
    throw new Error(`Meta CAPI rejected the event: ${detail.slice(0, 300)}`);
  }

  if (typeof body?.events_received === "number" && body.events_received === 0) {
    throw new Error("Meta CAPI received 0 events (check the pixel id and access token)");
  }

  return body?.fbtrace_id ?? "";
}
