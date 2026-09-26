import { NextRequest, NextResponse } from "next/server";
import { ReportError, requireAdminReport } from "@/lib/reporting";
import { AnalyticsConfigError, isAnalyticsConfigured, missingAnalyticsEnv } from "@/lib/analytics/ga";
import { trafficSource, TRAFFIC_WINDOWS } from "@/lib/analytics/traffic";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminReport();
  } catch (error) {
    if (error instanceof ReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("analytics/traffic auth error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  // Surfaced as setup guidance rather than an error, so the dashboard can tell an
  // admin exactly which env vars are missing instead of just failing.
  if (!isAnalyticsConfigured()) {
    return NextResponse.json({
      configured: false,
      missing: missingAnalyticsEnv(),
      windows: TRAFFIC_WINDOWS,
    });
  }

  const raw = Number(request.nextUrl.searchParams.get("minutes"));
  const minutes = TRAFFIC_WINDOWS.includes(raw as (typeof TRAFFIC_WINDOWS)[number])
    ? raw
    : 30;

  try {
    const data = await trafficSource(minutes);
    return NextResponse.json({ configured: true, data });
  } catch (error) {
    if (error instanceof AnalyticsConfigError) {
      return NextResponse.json({ configured: false, missing: error.missing });
    }
    console.error("analytics/traffic error", error);
    return NextResponse.json({ error: "Could not read Google Analytics traffic" }, { status: 502 });
  }
}
