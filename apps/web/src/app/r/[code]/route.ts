import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateClick } from "@/lib/models/affiliate-click";
import { trackLinkClick } from "@/lib/link-click-tracking";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  encodeAffiliateCookie,
  newAffiliateClickId,
  normalizeAffiliateCode,
} from "@/lib/affiliate";

/**
 * Only same-origin absolute paths are allowed, so the link cannot be turned
 * into an open redirect to another site.
 */
function safeDestination(request: NextRequest): string {
  const to = request.nextUrl.searchParams.get("to") ?? "";
  if (to.startsWith("/") && !to.startsWith("//") && !to.startsWith("/\\")) return to;
  return "/";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = normalizeAffiliateCode(params.code);
  const destination = safeDestination(request);
  const response = NextResponse.redirect(new URL(destination, request.nextUrl.origin));

  if (!code) return response;

  try {
    await connectDb();
    const affiliate = await Affiliate.findOne({ code, status: "active" })
      .select("_id code")
      .lean();
    if (!affiliate) return response;

    const clickId = newAffiliateClickId();
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwardedFor || request.headers.get("x-real-ip")?.trim() || "";
    const params2 = request.nextUrl.searchParams;
    const session = await readSession();

    await AffiliateClick.create({
      affiliate: affiliate._id,
      clickId,
      code: affiliate.code,
      ip: ip.slice(0, 100),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "",
      referrer: request.headers.get("referer")?.slice(0, 500) ?? "",
      landingPage: destination.slice(0, 300),
      destination: destination.slice(0, 300),
      utm: {
        source: params2.get("utm_source")?.slice(0, 100) ?? "",
        medium: params2.get("utm_medium")?.slice(0, 100) ?? "",
        campaign: params2.get("utm_campaign")?.slice(0, 180) ?? "",
      },
    }).catch((error) => {
      // Click tracking must never block the redirect.
      console.error("affiliate click record failed", error);
    });

    await trackLinkClick({
      request,
      kind: "affiliate",
      page: "",
      userId: session?.userId,
      affiliate: { _id: affiliate._id },
      destination: destination.slice(0, 500),
      label: `affiliate:${affiliate.code}`,
    });

    response.cookies.set(
      AFFILIATE_COOKIE,
      encodeAffiliateCookie({
        affiliateId: affiliate._id.toString(),
        code: affiliate.code,
        clickId,
      }),
      {
        maxAge: AFFILIATE_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      }
    );
  } catch (error) {
    console.error("affiliate redirect error", error);
  }

  return response;
}
