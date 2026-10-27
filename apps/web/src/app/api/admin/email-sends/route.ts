import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { dashboardSelectionFromParams } from "@/lib/admin/dashboard-range";
import { getEmailSendAnalytics } from "@/lib/admin/email-sends";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const selection = dashboardSelectionFromParams(request.nextUrl.searchParams);
    return NextResponse.json(await getEmailSendAnalytics(selection));
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("email send analytics error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
