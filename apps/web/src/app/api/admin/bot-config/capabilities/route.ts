import { NextResponse } from "next/server";
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

  const enabledTools = await BotTool.find({ enabled: true }).lean();
  const enabledIds = new Set(enabledTools.map((t) => t.toolId));

  const tools = OPS_TOOLS.map((tool) => {
    const paramEntries = Object.entries(tool.parameters.properties);
    return {
      name: tool.name,
      displayName: tool.name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: tool.description,
      enabled: enabledIds.has(tool.name),
      category: tool.description.includes("REQUIRES CONFIRMATION") ? "action" : "data",
      destructive: tool.description.includes("DESTRUCTIVE"),
      parameters: paramEntries.map(([key, prop]) => ({
        name: key,
        type: prop.type,
        description: prop.description ?? "",
        enum: prop.enum,
        required: tool.parameters.required?.includes(key) ?? false,
      })),
    };
  });

  const dataTools = tools.filter((t) => t.category === "data");
  const actionTools = tools.filter((t) => t.category === "action");

  return NextResponse.json({
    features: [
      {
        name: "Database Access",
        description: "Query and manage all FlyBridge data — users, orders, courses, seminars, scholarships, automations, and events.",
        icon: "database",
      },
      {
        name: "Tool Calling",
        description: "Automatically selects and calls the right tool based on your question. No need to remember command names.",
        icon: "wrench",
      },
      {
        name: "Multi-Turn Conversations",
        description: "Maintains conversation context. Ask follow-up questions and the bot remembers what you discussed.",
        icon: "message",
      },
      {
        name: "Confirmation Flow",
        description: "Write actions (create, update, delete, send) require explicit confirmation before executing. Destructive actions always ask.",
        icon: "shield",
      },
      {
        name: "Audit Trail",
        description: "Every tool call and action is logged with who did it, what parameters were used, and the result.",
        icon: "scroll",
      },
      {
        name: "Customizable Persona",
        description: "Adjust the bot's name, tone, detail level, and system prompt to match your team's workflow.",
        icon: "bot",
      },
    ],
    tools,
    summary: {
      total: tools.length,
      data: dataTools.length,
      action: actionTools.length,
      enabled: tools.filter((t) => t.enabled).length,
    },
  });
}
