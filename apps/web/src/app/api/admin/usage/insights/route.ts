import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getUsageAnalytics } from "@/lib/admin/overview-analytics";
import { generateUsageInsights } from "@/lib/admin/usage-insights";
import { dashboardSelectionFromParams } from "@/lib/admin/dashboard-range";
import { MULTI_CURRENCY_CODES, type SupportedCurrency } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = request.nextUrl.searchParams.get("currency") ?? "USD";
  const currency = (MULTI_CURRENCY_CODES as readonly string[]).includes(raw.toUpperCase())
    ? (raw.toUpperCase() as SupportedCurrency)
    : "USD";

  try {
    const selection = dashboardSelectionFromParams(request.nextUrl.searchParams);
    const analytics = await getUsageAnalytics(selection, currency);
    const insights = await generateUsageInsights(analytics);
    return NextResponse.json(insights);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("usage insights error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
