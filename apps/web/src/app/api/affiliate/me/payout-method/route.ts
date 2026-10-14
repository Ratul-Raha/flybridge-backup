import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Affiliate } from "@/lib/models/affiliate";
import { parsePayoutDetails } from "@/lib/affiliate";

export async function PATCH(request: NextRequest) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();
    const affiliate = await Affiliate.findOne({
      $or: [{ user: session.userId }, { email: session.email?.toLowerCase() }],
    });
    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const details = parsePayoutDetails(body.payoutDetails ?? body);
    affiliate.payoutMethod = details.method;
    affiliate.payoutDetails = details;
    await affiliate.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("affiliate payout-method PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
