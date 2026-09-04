import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotAuditLog } from "@/lib/models/bot-audit-log";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 50));

  const logs = await BotAuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("adminUser", "name email")
    .lean();

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l._id.toString(),
      adminUser: (l.adminUser as { name?: string; email?: string } | null)?.name ?? "Unknown",
      message: l.message,
      toolId: l.toolId,
      parameters: l.parameters,
      confirmed: l.confirmed,
      status: l.status,
      error: l.error,
      durationMs: l.durationMs,
      createdAt: l.createdAt,
    })),
  });
}
