import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Automation } from "@/lib/models/automation";
import { AutomationRun } from "@/lib/models/automation-run";
import { graphValidationErrors } from "@/lib/automation/graph";
import type { AutomationGraph } from "@/lib/automation/types";

type AutomationBody = {
  name: string;
  description: string;
  active: boolean;
  nodes: AutomationGraph["nodes"];
  edges: AutomationGraph["edges"];
};

function parseBody(body: unknown): AutomationBody | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name.trim()) {
    return { error: "Name is required" };
  }
  if (!Array.isArray(b.nodes) || !Array.isArray(b.edges)) {
    return { error: "nodes and edges are required" };
  }
  return {
    name: b.name.trim(),
    description: typeof b.description === "string" ? b.description.trim() : "",
    active: b.active === true,
    nodes: b.nodes as AutomationGraph["nodes"],
    edges: b.edges as AutomationGraph["edges"],
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const automations = await Automation.find()
      .sort({ createdAt: -1 })
      .lean();

    const lastRuns = await AutomationRun.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$automation",
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          eventName: { $first: "$eventName" },
        },
      },
    ]);
    const runMap = new Map(
      lastRuns.map((r) => [r._id.toString(), { status: r.status, createdAt: r.createdAt, eventName: r.eventName }])
    );

    return NextResponse.json({
      automations: automations.map((a) => ({
        id: a._id.toString(),
        name: a.name,
        description: a.description,
        active: a.active,
        nodes: a.nodes ?? [],
        edges: a.edges ?? [],
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        lastRun: runMap.get(a._id.toString()) ?? null,
      })),
    });
  } catch (error) {
    console.error("automations GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const raw = await request.json();
    const body = parseBody(raw);
    if ("error" in body) {
      return NextResponse.json({ error: body.error }, { status: 400 });
    }

    const errors = graphValidationErrors({ nodes: body.nodes, edges: body.edges });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    await connectDb();
    const automation = await Automation.create({
      name: body.name,
      description: body.description,
      active: body.active,
      nodes: body.nodes,
      edges: body.edges,
      createdBy: session.userId,
      updatedBy: session.userId,
    });

    return NextResponse.json({ id: automation._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("automations POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
