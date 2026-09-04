import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotTool } from "@/lib/models/bot-tool";
import { OPS_TOOLS } from "@/lib/ai/ops-tools";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  // Seed default tools if none exist
  const count = await BotTool.countDocuments();
  if (count === 0) {
    const defaults = OPS_TOOLS.map((tool) => ({
      toolId: tool.name,
      name: tool.name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: tool.description,
      category: tool.description.includes("REQUIRES CONFIRMATION") ? "action" : "data",
      enabled: true,
      confirmationRequired: tool.description.includes("DESTRUCTIVE")
        ? "destructive"
        : tool.description.includes("REQUIRES CONFIRMATION")
        ? "always"
        : "never",
      accessLevel: "admin" as const,
      customInstructions: "",
      parameters: tool.parameters,
      isDestructive: tool.description.includes("DESTRUCTIVE"),
    }));
    await BotTool.insertMany(defaults);
  } else {
    // Sync any new tools added to OPS_TOOLS that aren't in the DB yet
    const existing = new Set(
      (await BotTool.find({}, { toolId: 1 }).lean()).map((t) => t.toolId)
    );
    const newTools = OPS_TOOLS.filter((t) => !existing.has(t.name)).map((tool) => ({
      toolId: tool.name,
      name: tool.name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: tool.description,
      category: tool.description.includes("REQUIRES CONFIRMATION") ? "action" : "data",
      enabled: true,
      confirmationRequired: tool.description.includes("DESTRUCTIVE")
        ? "destructive"
        : tool.description.includes("REQUIRES CONFIRMATION")
        ? "always"
        : "never",
      accessLevel: "admin" as const,
      customInstructions: "",
      parameters: tool.parameters,
      isDestructive: tool.description.includes("DESTRUCTIVE"),
    }));
    if (newTools.length > 0) await BotTool.insertMany(newTools);
  }

  const tools = await BotTool.find().sort({ category: 1, toolId: 1 }).lean();

  return NextResponse.json({
    tools: tools.map((t) => ({
      id: t._id.toString(),
      toolId: t.toolId,
      name: t.name,
      description: t.description,
      category: t.category,
      enabled: t.enabled,
      confirmationRequired: t.confirmationRequired,
      accessLevel: t.accessLevel,
      customInstructions: t.customInstructions,
      isDestructive: t.isDestructive,
    })),
  });
}

export async function PUT(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  let body: { updates?: Array<{ toolId: string; changes: Record<string, unknown> }> } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.updates)) {
    return NextResponse.json({ error: "updates array is required" }, { status: 400 });
  }

  const results = [];
  for (const update of body.updates) {
    const allowed = ["name", "enabled", "confirmationRequired", "accessLevel", "customInstructions"];
    const set: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in update.changes) set[key] = update.changes[key];
    }
    const tool = await BotTool.findOneAndUpdate(
      { toolId: update.toolId },
      { $set: set },
      { new: true }
    ).lean();
    if (tool) {
      results.push({
        id: tool._id.toString(),
        toolId: tool.toolId,
        name: tool.name,
        enabled: tool.enabled,
        confirmationRequired: tool.confirmationRequired,
        accessLevel: tool.accessLevel,
      });
    }
  }

  return NextResponse.json({ tools: results });
}
