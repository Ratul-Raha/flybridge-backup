import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Certificate } from "@/lib/models/certificate";
import { isValidCertId } from "@/lib/certificates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * PUBLIC certificate verification endpoint (no auth required).
 *
 * The QR code printed on every certificate encodes a URL that lands here:
 * GET /api/verify/:certId. Anyone scanning the QR can confirm the recipient,
 * course, issue date and grade against our records.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { certId: string } }
) {
  const rl = rateLimit(`verify:${clientIp(request)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { valid: false, reason: "rate_limited" },
      { status: 429 }
    );
  }

  const certId = (params.certId ?? "").toUpperCase().trim();
  if (!isValidCertId(certId)) {
    return NextResponse.json(
      { valid: false, reason: "invalid" },
      { status: 400 }
    );
  }

  try {
    await connectDb();

    const cert = await Certificate.findOne({ certId }).lean();

    if (!cert) {
      return NextResponse.json(
        { valid: false, reason: "not_found" },
        { status: 404 }
      );
    }

    if (cert.status !== "issued") {
      return NextResponse.json(
        { valid: false, reason: "revoked", certId },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        certId: cert.certId,
        recipientName: cert.userName,
        courseTitle: cert.courseTitle,
        courseSlug: cert.courseSlug,
        issuedAt: cert.issuedAt,
        grade: cert.grade,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("certificate verification error", error);
    return NextResponse.json(
      { valid: false, reason: "error" },
      { status: 500 }
    );
  }
}