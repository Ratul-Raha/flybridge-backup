import type { NextRequest } from "next/server";
import { AFFILIATE_COOKIE, parseAffiliateCookie, type AffiliateRef } from "@/lib/affiliate";

/**
 * Resolves the affiliate that should be credited for an order from the
 * last-click cookie set by `/r/[code]`. Returns null when the visitor has no
 * affiliate cookie.
 */
export function affiliateFromRequest(request: NextRequest): AffiliateRef | null {
  const cookie = request.cookies.get(AFFILIATE_COOKIE)?.value?.trim();
  if (!cookie) return null;
  return parseAffiliateCookie(cookie.slice(0, 2000)) ?? null;
}
