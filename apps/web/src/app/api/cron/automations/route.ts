import { NextRequest, NextResponse } from "next/server";
import { resumeDuePendingRuns } from "@/lib/automation/engine";

/**
 * Cron endpoint (see /vercel.json) that sweeps due automation runs. Long
 * "Wait N days" delay nodes persist a pending run; this route resumes any that
 * have reached their scheduled time.
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

  const result = await resumeDuePendingRuns();
  return NextResponse.json({ ok: true, ...result });
}