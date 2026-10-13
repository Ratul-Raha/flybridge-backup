import { NextRequest, NextResponse } from "next/server";
import { MULTI_CURRENCY_CODES, type SupportedCurrency } from "@/lib/pricing";
import { ReportError, requireAdminReport } from "@/lib/reporting";
import { getMarketingAnalytics } from "@/lib/admin/marketing-analytics";
import { parseMarketingPeriod } from "@/lib/marketing-analytics-period";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminReport();
  } catch (error) {
    if (error instanceof ReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("analytics/summary auth error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  const period = parseMarketingPeriod(request.nextUrl.searchParams.get("period"));
  const rawCurrency = request.nextUrl.searchParams.get("currency")?.toUpperCase() ?? "BDT";
  const currency = (MULTI_CURRENCY_CODES as readonly string[]).includes(rawCurrency)
    ? (rawCurrency as SupportedCurrency)
    : "BDT";

  try {
    const data = await getMarketingAnalytics(period, currency);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    console.error("analytics/summary error", error);
    return NextResponse.json({ error: "Could not calculate marketing analytics" }, { status: 500 });
  }
}
