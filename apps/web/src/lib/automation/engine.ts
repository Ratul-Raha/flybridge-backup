import "server-only";

import mongoose from "mongoose";
import { Automation, type AutomationDoc } from "@/lib/models/automation";
import { AutomationRun } from "@/lib/models/automation-run";
import { AutomationPending } from "@/lib/models/automation-pending";
import { connectDb } from "@/lib/db";
import { evaluateCondition } from "./conditions";
import { executeAction } from "./actions";
import type { AutomationNode, AutomationRunStep, AutomationEdge } from "./types";
import type { EventName, EventPayload } from "@/lib/events/types";

const MAX_STEPS = 100;
const MAX_RESUME_ATTEMPTS = 5;

export type AutomationRunSummary = {
  automationId: string;
  automationName: string;
  status: string;
};

type LeanAutomation = AutomationDoc & { nodes: AutomationNode[] };

/** Structural shape used for both live automations and paused-run snapshots. */
type AutomationLike = {
  _id: { toString(): string };
  name: string;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
};

type RunContext = {
  steps: AutomationRunStep[];
  visited: Set<string>;
};

function summarizeStatus(steps: AutomationRunStep[]): "completed" | "completed_with_errors" | "failed" {
  const actionSteps = steps.filter((s) => s.nodeType === "action");
  const failed = actionSteps.filter((s) => s.status === "failed");
  if (failed.length === 0) return "completed";
  return failed.length === actionSteps.length ? "failed" : "completed_with_errors";
}

/** Thrown internally when a delay schedules a future resume instead of blocking. */
class FlowPaused extends Error {
  constructor(public scheduleAt: Date, public nodeId: string) {
    super("Flow paused on scheduled delay");
  }
}

async function walkNode(
  node: AutomationNode,
  automation: { nodes: AutomationNode[]; edges: AutomationEdge[] },
  ctx: RunContext,
  payload: EventPayload
): Promise<void> {
  if (ctx.visited.has(node.id)) return;
  if (ctx.steps.length >= MAX_STEPS) return;
  ctx.visited.add(node.id);
  const started = Date.now();

  const nextNodes = (nodeId: string, handle?: "true" | "false"): string[] =>
    automation.edges
      .filter((e) => e.source === nodeId && (!handle || e.sourceHandle === handle))
      .map((e) => e.target);

  const pushStep = (step: Omit<AutomationRunStep, "durationMs">) => {
    ctx.steps.push({ ...step, durationMs: Date.now() - started });
  };

  if (node.type === "trigger") {
    pushStep({ nodeId: node.id, nodeType: "trigger", status: "success", actionType: undefined });
    for (const next of nextNodes(node.id)) {
      const n = automation.nodes.find((x) => x.id === next);
      if (n) await walkNode(n, automation, ctx, payload);
    }
    return;
  }

  if (node.type === "end") {
    pushStep({ nodeId: node.id, nodeType: "end", status: "success", actionType: undefined });
    return;
  }

  if (node.type === "condition") {
    const result = await evaluateCondition(
      node.data.field ?? "",
      node.data.operator,
      node.data.value,
      payload
    );
    pushStep({
      nodeId: node.id,
      nodeType: "condition",
      status: "success",
      actionType: undefined,
      detail: { result: result ? "true" : "false" },
    });
    const handle: "true" | "false" = result ? "true" : "false";
    for (const target of nextNodes(node.id, handle)) {
      const n = automation.nodes.find((x) => x.id === target);
      if (n) await walkNode(n, automation, ctx, payload);
    }
    return;
  }

  if (node.type === "action") {
    const result = await executeAction(node, payload);
    if (result.ok) {
      pushStep({
        nodeId: node.id,
        nodeType: "action",
        actionType: node.data.actionType,
        status: "success",
        detail: result.detail,
      });
      const detail = result.detail as { scheduled?: boolean; scheduleAt?: string } | undefined;
      if (detail?.scheduled && detail.scheduleAt) {
        throw new FlowPaused(new Date(detail.scheduleAt), node.id);
      }
    } else {
      pushStep({
        nodeId: node.id,
        nodeType: "action",
        actionType: node.data.actionType,
        status: "failed",
        error: result.error,
      });
    }
    for (const target of nextNodes(node.id)) {
      const n = automation.nodes.find((x) => x.id === target);
      if (n) await walkNode(n, automation, ctx, payload);
    }
    return;
  }
}

function resumeTargets(edges: AutomationEdge[], nodeId: string): string[] {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}

async function persistPause(
  automation: AutomationLike,
  trigger: AutomationNode,
  event: EventName,
  payload: EventPayload,
  eventLogId: string | null | undefined,
  ctx: RunContext,
  resumed: {
    pausedNodeId: string;
    scheduleAt: Date;
    pendingId?: string;
    runId?: string;
    startedAt: Date;
  }
): Promise<AutomationRunSummary> {
  const resumeNodeIds = resumeTargets(automation.edges, resumed.pausedNodeId);
  const snapshotNodes = automation.nodes as AutomationNode[];
  const snapshotEdges = automation.edges as AutomationEdge[];

  let runId = resumed.runId;
  if (!runId) {
    const run = await AutomationRun.create({
      automation: automation._id as unknown as mongoose.Types.ObjectId,
      automationName: automation.name,
      eventName: event,
      eventLog: eventLogId,
      status: "scheduled",
      steps: ctx.steps,
      startedAt: resumed.startedAt,
    });
    runId = run._id.toString();
    await AutomationPending.create({
      automation: automation._id as unknown as mongoose.Types.ObjectId,
      automationName: automation.name,
      eventName: event,
      eventLog: eventLogId,
      runId,
      triggerNodeId: trigger.id,
      resumeNodeIds,
      payload,
      snapshot: { nodes: snapshotNodes, edges: snapshotEdges },
      steps: ctx.steps,
      visited: [...ctx.visited],
      runAfter: resumed.scheduleAt,
      nextAttemptAt: resumed.scheduleAt,
      status: "pending",
      attempts: 0,
    });
  } else {
    await AutomationPending.updateOne(
      { _id: resumed.pendingId },
      {
        $set: {
          resumeNodeIds,
          payload,
          runAfter: resumed.scheduleAt,
          nextAttemptAt: resumed.scheduleAt,
          steps: ctx.steps,
          visited: [...ctx.visited],
          error: "",
        },
      }
    );
    await AutomationRun.updateOne(
      { _id: runId },
      { $set: { status: "scheduled", steps: ctx.steps } }
    );
  }

  return {
    automationId: automation._id.toString(),
    automationName: automation.name,
    status: "scheduled",
  };
}

async function executeAutomation(
  automation: AutomationLike,
  trigger: AutomationNode,
  event: EventName,
  payload: EventPayload,
  eventLogId: string | undefined
): Promise<AutomationRunSummary> {
  const startedAt = new Date();
  const ctx: RunContext = { steps: [], visited: new Set<string>() };

  try {
    await walkNode(trigger, automation, ctx, payload);
  } catch (error) {
    if (error instanceof FlowPaused) {
      return persistPause(automation, trigger, event, payload, eventLogId, ctx, {
        pausedNodeId: error.nodeId,
        scheduleAt: error.scheduleAt,
        runId: undefined,
        pendingId: undefined,
        startedAt,
      });
    }
    throw error;
  }

  const status = summarizeStatus(ctx.steps);
  await AutomationRun.create({
    automation: automation._id as unknown as mongoose.Types.ObjectId,
    automationName: automation.name,
    eventName: event,
    eventLog: eventLogId,
    status,
    steps: ctx.steps,
    startedAt,
    finishedAt: new Date(),
  });

  return { automationId: automation._id.toString(), automationName: automation.name, status };
}

export async function runAutomationsForEvent(
  event: EventName,
  payload: EventPayload,
  eventLogId: string | undefined
): Promise<AutomationRunSummary[]> {
  await connectDb();
  const automations = (await Automation.find({
    active: true,
    "nodes.type": "trigger",
  }).lean()) as LeanAutomation[];

  const summaries: AutomationRunSummary[] = [];
  for (const automation of automations) {
    try {
      const trigger = automation.nodes.find((n) => n.type === "trigger");
      if (!trigger || trigger.data?.event !== event) continue;
      summaries.push(await executeAutomation(automation, trigger, event, payload, eventLogId));
    } catch (error) {
      console.error(`[automation] "${automation.name}" (${automation._id}) failed:`, error);
    }
  }
  return summaries;
}

interface LeanPending {
  _id: string;
  automation: string;
  automationName: string;
  eventName: EventName;
  eventLog?: string | null;
  runId: string;
  triggerNodeId: string;
  resumeNodeIds: string[];
  payload: EventPayload;
  snapshot: { nodes: AutomationNode[]; edges: AutomationEdge[] };
  steps: AutomationRunStep[];
  visited: string[];
  runAfter: Date;
  nextAttemptAt?: Date | null;
  status: string;
  attempts: number;
}

async function resumePending(pending: LeanPending): Promise<void> {
  const automation: AutomationLike = {
    _id: pending.automation,
    name: pending.automationName,
    nodes: pending.snapshot.nodes,
    edges: pending.snapshot.edges,
  };

  const ctx: RunContext = { steps: pending.steps ?? [], visited: new Set(pending.visited ?? []) };
  const baseCount = ctx.steps.length;

  try {
    for (const resumeId of pending.resumeNodeIds) {
      const node = pending.snapshot.nodes.find((n) => n.id === resumeId);
      if (node) await walkNode(node, automation, ctx, pending.payload);
    }
  } catch (error) {
    if (!(error instanceof FlowPaused)) {
      throw error;
    }
    // The resumed leg scheduled yet another delay — keep the chain going.
    const chain = pending.snapshot.nodes.filter((n) => n.type === "trigger")[0];
    const trigger = chain ?? ({ id: pending.triggerNodeId, type: "trigger", data: {} } as AutomationNode);
    await persistPause(
      automation,
      trigger,
      pending.eventName,
      pending.payload,
      pending.eventLog,
      ctx,
      {
        pausedNodeId: error.nodeId,
        scheduleAt: error.scheduleAt,
        pendingId: pending._id,
        runId: pending.runId,
        startedAt: new Date(),
      }
    );
    return;
  }

  const newSteps = ctx.steps.slice(baseCount);
  const status = summarizeStatus(newSteps);

  await AutomationPending.updateOne(
    { _id: pending._id },
    { $set: { status: "done", steps: ctx.steps, visited: [...ctx.visited] } }
  );
  await AutomationRun.updateOne(
    { _id: pending.runId },
    {
      $set: { status, finishedAt: new Date(), steps: ctx.steps },
    }
  );
}

export async function resumeDuePendingRuns(): Promise<{ resumed: number; failed: number }> {
  await connectDb();
  const due = (await AutomationPending.find({
    status: "pending",
    nextAttemptAt: { $lte: new Date() },
  }).lean()) as unknown as LeanPending[];

  let resumed = 0;
  let failed = 0;

  for (const pending of due) {
    const attempts = (pending.attempts ?? 0) + 1;
    if (attempts > MAX_RESUME_ATTEMPTS) {
      await AutomationPending.updateOne(
        { _id: pending._id },
        { $set: { status: "failed", error: "Exceeded maximum resume attempts" } }
      );
      failed++;
      continue;
    }
    try {
      await resumePending(pending);
      resumed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await AutomationPending.updateOne(
        { _id: pending._id },
        {
          $set: {
            attempts,
            error: message,
            status: attempts >= MAX_RESUME_ATTEMPTS ? "failed" : "pending",
            nextAttemptAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        }
      );
      console.error(`[automation] pending resume failed (${pending.automationName}):`, error);
      failed++;
    }
  }

  return { resumed, failed };
}