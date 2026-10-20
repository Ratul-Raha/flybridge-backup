const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com").replace(/\/+$/, "");
const MAX_DESTINATION = 1800;
const MAX_LABEL = 120;

export type VerifiedOutboundLink = {
  destination: string;
  label: string;
};

export function isOutboundLinkTrackingEnabled(): boolean {
  return true;
}

/**
 * Client-safe `/api/go` path for an external URL. The server re-validates the
 * destination (protocol + SSRF guard) before redirecting, so this only needs
 * to refuse same-site and non-http(s) targets.
 */
export function outboundLink(rawUrl: string, meta: { label?: string } = {}): string | null {
  const url = rawUrl.trim();
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.origin === SITE_URL) return null;
  const destination = parsed.toString();
  if (destination.length > MAX_DESTINATION) return null;

  const params = new URLSearchParams({ u: destination });
  if (meta.label) params.set("l", meta.label.slice(0, MAX_LABEL));
  return `/api/go?${params.toString()}`;
}

export function parseOutboundDestination(
  rawUrl: string | null | undefined,
  label: string | null | undefined
): VerifiedOutboundLink | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url || url.length > MAX_DESTINATION) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return {
    destination: parsed.toString(),
    label: (label ?? "").slice(0, MAX_LABEL),
  };
}
