import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotConfig } from "@/lib/models/bot-config";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  let config = await BotConfig.findOne().lean();
  if (!config) {
    const created = await BotConfig.create({});
    config = created.toObject();
  }

  return NextResponse.json({
    id: config._id.toString(),
    name: config.name,
    avatar: config.avatar,
    greeting: config.greeting,
    tone: config.tone,
    detailLevel: config.detailLevel,
    systemPrompt: config.systemPrompt,
    maxConversationLength: config.maxConversationLength,
  });
}

export async function PUT(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = ["name", "avatar", "greeting", "tone", "detailLevel", "systemPrompt", "maxConversationLength"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  let config = await BotConfig.findOne();
  if (!config) {
    config = await BotConfig.create(updates);
  } else {
    await config.updateOne({ $set: updates });
    config = await BotConfig.findById(config._id);
  }

  return NextResponse.json({
    id: config!._id.toString(),
    name: config!.name,
    avatar: config!.avatar,
    greeting: config!.greeting,
    tone: config!.tone,
    detailLevel: config!.detailLevel,
    systemPrompt: config!.systemPrompt,
    maxConversationLength: config!.maxConversationLength,
  });
}
