import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Affiliate } from "@/lib/models/affiliate";
import { AffiliateClick } from "@/lib/models/affiliate-click";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE_SECONDS,
  encodeAffiliateCookie,
  newAffiliateClickId,
  normalizeAffiliateCode,
} from "@/lib/affiliate";

/**
 * Fallback attribution for when an affiliate shares a raw page URL with
 * `?ref=CODE` instead of a `/r/CODE` link. Logs the click and sets the same
 * last-click cookie, so the sale is still credited.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // A malformed body is not worth failing the page over.
  }

  const code = normalizeAffiliateCode(body.code);
  if (!code || !/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(code)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await connectDb();
    const affiliate = await Affiliate.findOne({ code, status: "active" })
      .select("_id code")
      .lean();
    if (!affiliate) return NextResponse.json({ ok: false });

    const clickId = newAffiliateClickId();
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwardedFor || request.headers.get("x-real-ip")?.trim() || "";
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";

    await AffiliateClick.create({
      affiliate: affiliate._id,
      clickId,
      code: affiliate.code,
      ip: ip.slice(0, 100),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "",
      referrer: request.headers.get("referer")?.slice(0, 500) ?? "",
      landingPage: path,
      destination: path,
    }).catch((error) => {
      // Tracking must never block the page.
      console.error("affiliate ref click record failed", error);
    });

    const response = NextResponse.json({ ok: true });
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
    return response;
  } catch (error) {
    console.error("affiliate ref capture error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
