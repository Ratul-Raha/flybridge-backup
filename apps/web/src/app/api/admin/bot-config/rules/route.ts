import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotRule } from "@/lib/models/bot-rule";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();
  const rules = await BotRule.find().sort({ priority: 1, createdAt: -1 }).lean();

  return NextResponse.json({
    rules: rules.map((r) => ({
      id: r._id.toString(),
      title: r.title,
      content: r.content,
      category: r.category,
      priority: r.priority,
      status: r.status,
      createdBy: r.createdBy?.toString(),
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  let body: { title?: string; content?: string; category?: string; priority?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.title || !body.content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const rule = await BotRule.create({
    title: body.title,
    content: body.content,
    category: (body.category ?? "operations") as "customer_service" | "pricing" | "content" | "operations",
    priority: (body.priority ?? "medium") as "high" | "medium" | "low",
    status: "active",
    createdBy: session.userId,
  });

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
  }, { status: 201 });
}
