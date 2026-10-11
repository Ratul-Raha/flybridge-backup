import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrdersStats } from "@/lib/admin/orders-stats";
import { MULTI_CURRENCY_CODES, type SupportedCurrency } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = request.nextUrl.searchParams.get("currency") ?? "USD";
  const currency = (MULTI_CURRENCY_CODES as readonly string[]).includes(raw.toUpperCase())
    ? (raw.toUpperCase() as SupportedCurrency)
    : "USD";

  try {
    return NextResponse.json(await getOrdersStats(currency));
  } catch (error) {
    console.error("orders-stats error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
