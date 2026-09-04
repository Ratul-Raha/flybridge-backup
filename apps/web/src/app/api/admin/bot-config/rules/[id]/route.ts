import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotRule } from "@/lib/models/bot-rule";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDb();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = ["title", "content", "category", "priority", "status"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const rule = await BotRule.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  return NextResponse.json({
    rule: {
      id: rule._id.toString(),
      title: rule.title,
      content: rule.content,
      category: rule.category,
      priority: rule.priority,
      status: rule.status,
      createdAt: rule.createdAt,
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDb();

  const rule = await BotRule.findByIdAndDelete(id).lean();
  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
