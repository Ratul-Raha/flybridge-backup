import { NextRequest, NextResponse } from "next/server";
import {
  REPORT_REGISTRY,
  ReportError,
  requireAdminReport,
  type ReportName,
} from "@/lib/reporting";

export async function GET(
  request: NextRequest,
  { params }: { params: { report: string } }
) {
  const name = params.report as ReportName;
  if (!(name in REPORT_REGISTRY)) {
    return NextResponse.json({ error: "Unknown report" }, { status: 404 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days = Number.isFinite(daysParam)
    ? Math.min(Math.max(Math.trunc(daysParam), 7), 90)
    : 14;

  try {
    await requireAdminReport();
    const data = await REPORT_REGISTRY[name]({ days });
    return NextResponse.json({ report: name, data });
  } catch (error) {
    if (error instanceof ReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(`reports/${name} error`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}