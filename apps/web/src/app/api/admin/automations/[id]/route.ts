import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Automation } from "@/lib/models/automation";
import { AutomationRun } from "@/lib/models/automation-run";
import { graphValidationErrors } from "@/lib/automation/graph";
import type { AutomationGraph } from "@/lib/automation/types";

function parseBody(body: unknown): AutomationGraph & { name: string; description: string; active: boolean } | { error: string } {
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const automation = await Automation.findById(params.id).lean();
    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: automation._id.toString(),
      name: automation.name,
      description: automation.description,
      active: automation.active,
      nodes: automation.nodes,
      edges: automation.edges,
      createdAt: automation.createdAt,
      updatedAt: automation.updatedAt,
    });
  } catch (error) {
    console.error("automation GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const automation = await Automation.findById(params.id);
    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    automation.name = body.name;
    automation.description = body.description;
    automation.active = body.active;
    automation.nodes = body.nodes as never;
    automation.edges = body.edges as never;
    automation.updatedBy = session.userId as never;
    await automation.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("automation PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const automation = await Automation.findByIdAndDelete(params.id);
    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }
    await AutomationRun.deleteMany({ automation: automation._id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("automation DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
