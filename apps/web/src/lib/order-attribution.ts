import type { NextRequest } from "next/server";
import {
  fbcFromTouch,
  MARKETING_ATTRIBUTION_COOKIE,
  parseMarketingAttributionCookie,
  type OrderAttribution,
} from "@/lib/marketing-attribution";

function cookie(request: NextRequest, name: string): string | undefined {
  const value = request.cookies.get(name)?.value?.trim();
  return value ? value.slice(0, 1000) : undefined;
}

export function orderAttributionFromRequest(request: NextRequest): OrderAttribution {
  const history = parseMarketingAttributionCookie(
    cookie(request, MARKETING_ATTRIBUTION_COOKIE)
  );
  const fbclid =
    request.nextUrl.searchParams.get("fbclid")?.trim().slice(0, 500) ||
    history.lastTouch?.fbclid ||
    history.firstTouch?.fbclid ||
    undefined;
  const gclid =
    request.nextUrl.searchParams.get("gclid")?.trim().slice(0, 500) ||
    history.lastTouch?.gclid ||
    history.firstTouch?.gclid ||
    undefined;

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip")?.trim() || undefined;
  const lastTouchFbc = fbcFromTouch(history.lastTouch) ?? fbcFromTouch(history.firstTouch);

  return {
    ...history,
    fbclid,
    gclid,
    fbc: cookie(request, "_fbc") ?? cookie(request, "fbc") ?? lastTouchFbc,
    fbp: cookie(request, "_fbp") ?? cookie(request, "fbp"),
    ip: ip?.slice(0, 100),
    userAgent: request.headers.get("user-agent")?.slice(0, 500),
  };
}
