import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotConversation } from "@/lib/models/bot-conversation";
import { BotMessage } from "@/lib/models/bot-message";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDb();

  const conversation = await BotConversation.findById(id)
    .populate("adminUser", "name email")
    .lean();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await BotMessage.find({ conversation: id })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({
    conversation: {
      id: conversation._id.toString(),
      title: conversation.title,
      status: conversation.status,
      messageCount: conversation.messageCount,
      toolsUsed: conversation.toolsUsed,
      adminUser: (conversation.adminUser as { name?: string; email?: string } | null)?.name ?? "Unknown",
      startedAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
    },
    messages: messages.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls,
      createdAt: m.createdAt,
    })),
  });
}
