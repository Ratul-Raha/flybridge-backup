import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { EmailClick } from "@/lib/models/email-click";
import { verifyEmailLink, withEmailUtm } from "@/lib/email-tracking";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const home = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  const verified = verifyEmailLink(params.token);
  if (!verified) return home;

  const destination = withEmailUtm(verified.destination, verified.campaign);
  const response = NextResponse.redirect(new URL(destination, request.nextUrl.origin));

  try {
    await connectDb();
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwardedFor || request.headers.get("x-real-ip")?.trim() || "";

    await EmailClick.create({
      campaign: verified.campaign,
      templateId: verified.templateId ?? "",
      recipient: verified.recipient ?? "",
      destination: destination.slice(0, 500),
      ip: ip.slice(0, 100),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? "",
      referrer: request.headers.get("referer")?.slice(0, 500) ?? "",
    }).catch((error) => {
      // Click tracking must never block the redirect.
      console.error("email click record failed", error);
    });
  } catch (error) {
    console.error("email redirect error", error);
  }

  return response;
}
