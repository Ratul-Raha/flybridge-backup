import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { parseOutboundDestination } from "@/lib/outbound-link";
import { assertSafeRedirectUrl } from "@/lib/url-safety";
import { trackLinkClick } from "@/lib/link-click-tracking";

/**
 * Tracked exit for external CTAs (WhatsApp, scholarship apply, seminar links,
 * blog shares, …). Logs one click with full attribution, then redirects. The
 * destination is validated so the route cannot be turned into an SSRF proxy or
 * an open redirect to non-http(s) schemes.
 */
export async function GET(request: NextRequest) {
  const parsed = parseOutboundDestination(
    request.nextUrl.searchParams.get("u"),
    request.nextUrl.searchParams.get("l")
  );
  if (!parsed) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  try {
    assertSafeRedirectUrl(parsed.destination);
  } catch {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  const session = await readSession();

  try {
    await trackLinkClick({
      request,
      kind: "outbound",
      page: parsed.label,
      userId: session?.userId,
      destination: parsed.destination.slice(0, 500),
      label: parsed.label,
    });
  } catch (error) {
    console.error("outbound click tracking error", error);
  }

  const response = NextResponse.redirect(parsed.destination, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
