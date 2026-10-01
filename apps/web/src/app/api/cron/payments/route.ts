import { NextRequest, NextResponse } from "next/server";
import { sweepPendingOrders } from "@/lib/payments/sweep";

/**
 * Cron endpoint (see /vercel.json) that reconciles "stale" pending orders with
 * their payment gateway. Backstop for payments the browser redirect never
 * delivered — the buyer closed the tab or lost connection before EPS handed
 * them back — and for any IPN that failed to arrive.
 *
 * @security Guarded by CRON_SECRET — header `x-cron-secret` or
 * `Authorization: Bearer <secret>`.
 */
export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 501 });
  }

  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sweepPendingOrders();
  return NextResponse.json({ ok: true, ...result });
}