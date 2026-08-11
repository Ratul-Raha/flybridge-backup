import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { EventLog } from "@/lib/models/event-log";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 100, 200);
    await connectDb();
    const logs = await EventLog.find().sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l._id.toString(),
        name: l.name,
        status: l.status,
        handlers: l.handlers,
        automationsRun: l.automationsRun,
        payload: l.payload,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("event-log GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
