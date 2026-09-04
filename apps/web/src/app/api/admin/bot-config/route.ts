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

  const chan = config.channels as
    | { telegram?: { enabled?: boolean; botToken?: string; chatIds?: string[]; events?: string[] } }
    | undefined;

  return NextResponse.json({
    id: config._id.toString(),
    name: config.name,
    avatar: config.avatar,
    greeting: config.greeting,
    tone: config.tone,
    detailLevel: config.detailLevel,
    systemPrompt: config.systemPrompt,
    maxConversationLength: config.maxConversationLength,
    channels: {
      telegram: {
        enabled: chan?.telegram?.enabled ?? false,
        botToken: chan?.telegram?.botToken ?? "",
        chatIds: chan?.telegram?.chatIds ?? [],
        events: chan?.telegram?.events ?? [],
      },
    },
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

  const allowed = [
    "name",
    "avatar",
    "greeting",
    "tone",
    "detailLevel",
    "systemPrompt",
    "maxConversationLength",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  let config = await BotConfig.findOne();

  // Merge telegram channel changes onto the existing config instead of
  // wholesale-replacing `channels`. This keeps unsubmitted fields (e.g.
  // chatIds when a client only sends { enabled }) from being wiped.
  const bodyChannels = body.channels as { telegram?: Record<string, unknown> } | undefined;
  if (bodyChannels && typeof bodyChannels === "object") {
    const prev =
      (config?.channels as { telegram?: Record<string, unknown> } | undefined)?.telegram ?? {};
    const t = bodyChannels.telegram ?? {};
    updates.channels = {
      telegram: {
        enabled: typeof t.enabled === "boolean" ? t.enabled : Boolean(prev.enabled),
        botToken: typeof t.botToken === "string" ? t.botToken : String(prev.botToken ?? ""),
        chatIds: Array.isArray(t.chatIds)
          ? t.chatIds.map(String)
          : Array.isArray(prev.chatIds)
            ? prev.chatIds
            : [],
        events: Array.isArray(t.events)
          ? t.events.map(String)
          : Array.isArray(prev.events)
            ? prev.events
            : [],
      },
    };
  }

  if (!config) {
    config = await BotConfig.create(updates);
  } else {
    await config.updateOne({ $set: updates });
    config = await BotConfig.findById(config._id);
  }

  const chan = config!.channels as
    | { telegram?: { enabled?: boolean; botToken?: string; chatIds?: string[]; events?: string[] } }
    | undefined;

  return NextResponse.json({
    id: config!._id.toString(),
    name: config!.name,
    avatar: config!.avatar,
    greeting: config!.greeting,
    tone: config!.tone,
    detailLevel: config!.detailLevel,
    systemPrompt: config!.systemPrompt,
    maxConversationLength: config!.maxConversationLength,
    channels: {
      telegram: {
        enabled: chan?.telegram?.enabled ?? false,
        botToken: chan?.telegram?.botToken ?? "",
        chatIds: chan?.telegram?.chatIds ?? [],
        events: chan?.telegram?.events ?? [],
      },
    },
  });
}
