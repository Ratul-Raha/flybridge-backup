import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotConversation } from "@/lib/models/bot-conversation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

  const conversations = await BotConversation.find()
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .populate("adminUser", "name email")
    .lean();

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      status: c.status,
      messageCount: c.messageCount,
      toolsUsed: c.toolsUsed,
      adminUser: (c.adminUser as { name?: string; email?: string } | null)?.name ?? "Unknown",
      startedAt: c.createdAt,
      lastMessageAt: c.lastMessageAt,
    })),
  });
}
