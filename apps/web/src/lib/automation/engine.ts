import "server-only";

import { Automation, type AutomationDoc } from "@/lib/models/automation";
import { AutomationRun } from "@/lib/models/automation-run";
import { evaluateCondition } from "./conditions";
import { executeAction } from "./actions";
import type { AutomationNode, AutomationRunStep } from "./types";
import type { EventName, EventPayload } from "@/lib/events/types";

const MAX_STEPS = 100;

export type AutomationRunSummary = {
  automationId: string;
  automationName: string;
  status: string;
};

type LeanAutomation = AutomationDoc & { nodes: AutomationNode[] };

async function executeAutomation(
  automation: LeanAutomation,
  trigger: AutomationNode,
  event: EventName,
  payload: EventPayload,
  eventLogId: string | undefined
): Promise<AutomationRunSummary> {
  const startedAt = new Date();
  const steps: AutomationRunStep[] = [];
  const visited = new Set<string>();

  const pushStep = (step: Omit<AutomationRunStep, "durationMs">, started: number) => {
    steps.push({ ...step, durationMs: Date.now() - started });
  };

  const nextNodes = (nodeId: string, handle?: "true" | "false"): string[] =>
    automation.edges
      .filter((e) => e.source === nodeId && (!handle || e.sourceHandle === handle))
      .map((e) => e.target);

  const walk = async (node: AutomationNode) => {
    if (visited.has(node.id)) return;
    if (steps.length >= MAX_STEPS) return;
    visited.add(node.id);
    const started = Date.now();

    if (node.type === "trigger") {
      pushStep({ nodeId: node.id, nodeType: "trigger", status: "success" }, started);
      for (const next of nextNodes(node.id)) {
        const n = automation.nodes.find((x) => x.id === next);
        if (n) await walk(n);
      }
      return;
    }

    if (node.type === "end") {
      pushStep({ nodeId: node.id, nodeType: "end", status: "success" }, started);
      return;
    }

    if (node.type === "condition") {
      const result = evaluateCondition(
        node.data.field ?? "",
        node.data.operator,
        node.data.value,
        payload
      );
      pushStep(
        {
          nodeId: node.id,
          nodeType: "condition",
          status: "success",
          detail: { result: result ? "true" : "false" },
        },
        started
      );
      const handle: "true" | "false" = result ? "true" : "false";
      const next = nextNodes(node.id, handle);
      for (const target of next) {
        const n = automation.nodes.find((x) => x.id === target);
        if (n) await walk(n);
      }
      return;
    }

    if (node.type === "action") {
      const result = await executeAction(node, payload);
      if (result.ok) {
        pushStep(
          {
            nodeId: node.id,
            nodeType: "action",
            actionType: node.data.actionType,
            status: "success",
            detail: result.detail,
          },
          started
        );
      } else {
        pushStep(
          {
            nodeId: node.id,
            nodeType: "action",
            actionType: node.data.actionType,
            status: "failed",
            error: result.error,
          },
          started
        );
      }
      for (const target of nextNodes(node.id)) {
        const n = automation.nodes.find((x) => x.id === target);
        if (n) await walk(n);
      }
      return;
    }
  };

  await walk(trigger);

  const actionSteps = steps.filter((s) => s.nodeType === "action");
  const failed = actionSteps.filter((s) => s.status === "failed");
  const status =
    failed.length > 0
      ? failed.length === actionSteps.length
        ? "failed"
        : "completed_with_errors"
      : "completed";

  await AutomationRun.create({
    automation: automation._id,
    automationName: automation.name,
    eventName: event,
    eventLog: eventLogId,
    status,
    steps,
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
  const automations = (await Automation.find({
    active: true,
    "nodes.type": "trigger",
  }).lean()) as LeanAutomation[];

  const summaries: AutomationRunSummary[] = [];
  for (const automation of automations) {
    const trigger = automation.nodes.find((n) => n.type === "trigger");
    if (!trigger || trigger.data?.event !== event) continue;
    summaries.push(await executeAutomation(automation, trigger, event, payload, eventLogId));
  }
  return summaries;
}
