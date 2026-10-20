import crypto from "node:crypto";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com").replace(/\/+$/, "");

const MAX_DESTINATION = 1800;
const MAX_CAMPAIGN = 100;
const MAX_TEMPLATE_ID = 100;
const MAX_RECIPIENT = 200;

const HREF_RE = /(\bhref\s*=\s*)(["'])([^"']*)\2/gi;

export type EmailLinkMeta = {
  campaign?: string;
  templateId?: string;
  recipient?: string;
};

export type VerifiedEmailLink = {
  /** Root-relative destination path including query/hash. */
  destination: string;
  campaign: string;
  templateId?: string;
  recipient?: string;
};

/** Sign + redirect secret. AUTH_SECRET is the fallback so tracking works
 *  without extra setup; set EMAIL_TRACKING_SECRET to rotate independently. */
function secret(): string {
  return process.env.EMAIL_TRACKING_SECRET ?? process.env.AUTH_SECRET ?? "";
}

export function isEmailLinkTrackingEnabled(): boolean {
  return secret().length > 0;
}

export function emailCampaignSlug(campaign: string | undefined): string {
  return (campaign ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_CAMPAIGN);
}

/** Same-site destination as a root-relative path, or null for external links. */
export function sameSitePath(rawUrl: string): string | null {
  const url = rawUrl.trim();
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.origin !== SITE_URL) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/** Signed `/e/{token}` URL for a same-site link; null when tracking is
 *  disabled or the URL points off-site (never an open redirect). */
export function signEmailLink(rawUrl: string, meta: EmailLinkMeta = {}): string | null {
  const key = secret();
  if (!key) return null;
  const destination = sameSitePath(rawUrl);
  if (!destination || destination.length > MAX_DESTINATION) return null;

  const payload: Record<string, string> = { d: destination };
  if (meta.campaign) payload.c = emailCampaignSlug(meta.campaign);
  if (meta.templateId) payload.t = meta.templateId.slice(0, MAX_TEMPLATE_ID);
  if (meta.recipient) payload.e = meta.recipient.trim().toLowerCase().slice(0, MAX_RECIPIENT);

  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = crypto.createHmac("sha256", key).update(body).digest();
  return `${body}.${mac.toString("base64url")}`;
}

export function verifyEmailLink(token: string | undefined | null): VerifiedEmailLink | null {
  const key = secret();
  if (!key || !token) return null;
  const sep = token.lastIndexOf(".");
  if (sep <= 0 || sep === token.length - 1) return null;
  const body = token.slice(0, sep);

  const expected = crypto.createHmac("sha256", key).update(body).digest();
  const provided = Buffer.from(token.slice(sep + 1), "base64url");
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const fields = parsed as Record<string, unknown>;
  const destination = fields.d;
  if (
    typeof destination !== "string" ||
    destination.length === 0 ||
    destination.length > MAX_DESTINATION ||
    !destination.startsWith("/") ||
    destination.startsWith("//")
  ) {
    return null;
  }
  return {
    destination,
    campaign: typeof fields.c === "string" && fields.c ? fields.c : "email",
    templateId: typeof fields.t === "string" && fields.t ? fields.t : undefined,
    recipient: typeof fields.e === "string" && fields.e ? fields.e : undefined,
  };
}

/** Append utm_* params (unless already present) and return a root-relative
 *  path so GA4 and first-party attribution can attribute the landing. */
export function withEmailUtm(destination: string, campaign: string): string {
  try {
    const url = new URL(destination, SITE_URL);
    if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", "email");
    if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", "email");
    if (!url.searchParams.has("utm_campaign")) {
      url.searchParams.set("utm_campaign", emailCampaignSlug(campaign) || "email");
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return destination;
  }
}

/** Wrap every same-site `href` in the rendered HTML with a signed `/e/{token}`
 *  link. External links, mailto/tel and anchors are left untouched. */
export function rewriteEmailLinks(html: string, meta: EmailLinkMeta = {}): string {
  if (!isEmailLinkTrackingEnabled() || !html.includes("href")) return html;
  return html.replace(HREF_RE, (match, attr: string, quote: string, href: string) => {
    const trimmed = href.trim();
    if (!trimmed || trimmed.startsWith("#") || /^(mailto:|tel:|data:)/i.test(trimmed)) return match;
    const token = signEmailLink(trimmed, meta);
    if (!token) return match;
    return `${attr}${quote}${SITE_URL}/e/${token}${quote}`;
  });
}
