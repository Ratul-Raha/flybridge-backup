import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { AutomationRun } from "@/lib/models/automation-run";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 200);
    await connectDb();
    const runs = await AutomationRun.find({ automation: params.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      runs: runs.map((r) => ({
        id: r._id.toString(),
        automationName: r.automationName,
        eventName: r.eventName,
        status: r.status,
        steps: r.steps,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("automation runs GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
