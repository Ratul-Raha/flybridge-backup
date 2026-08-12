import type { EventName } from "@/lib/events/types";
import { EVENT_NAMES } from "@/lib/events/types";
import { MAX_DELAY_SECONDS, type AutomationGraph, type AutomationNode, type AutomationEdge } from "./types";

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function createNode(type: AutomationNode["type"], event?: EventName): AutomationNode {
  switch (type) {
    case "trigger":
      return {
        id: makeId("trigger"),
        type: "trigger",
        data: { event: event ?? EVENT_NAMES[0] },
      };
    case "condition":
      return {
        id: makeId("cond"),
        type: "condition",
        data: { field: "", operator: "equals", value: "" },
      };
    case "action":
      return {
        id: makeId("action"),
        type: "action",
        data: {
          actionType: "delay",
          duration: 5,
          unit: "minutes",
        },
      };
    case "end":
      return { id: makeId("end"), type: "end", data: {} };
  }
}

export function createEdge(source: string, target: string, sourceHandle?: "true" | "false"): AutomationEdge {
  return {
    id: makeId("edge"),
    source,
    target,
    sourceHandle,
    label: sourceHandle === "true" ? "YES" : sourceHandle === "false" ? "NO" : undefined,
  };
}

export function triggerEventOf(graph: AutomationGraph): EventName | null {
  const trigger = graph.nodes.find((n) => n.type === "trigger");
  const event = trigger?.data.event;
  return event && EVENT_NAMES.includes(event) ? event : null;
}

export function graphValidationErrors(graph: AutomationGraph): string[] {
  const errors: string[] = [];
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (ids.size !== graph.nodes.length) {
    errors.push("Duplicate node ids detected.");
  }
  const triggers = graph.nodes.filter((n) => n.type === "trigger");
  if (triggers.length === 0) errors.push("An automation needs exactly one trigger node.");
  if (triggers.length > 1) errors.push("Only one trigger node is allowed.");
  if (triggers.length === 1) {
    const event = triggers[0].data.event;
    if (!event || !EVENT_NAMES.includes(event)) {
      errors.push("The trigger node must have a valid event selected.");
    }
  }
  if (graph.nodes.length === 0) errors.push("Add at least a trigger and an end node.");

  for (const edge of graph.edges) {
    if (!ids.has(edge.source)) errors.push(`Edge "${edge.id}" references a missing source node.`);
    if (!ids.has(edge.target)) errors.push(`Edge "${edge.id}" references a missing target node.`);
  }

  for (const node of graph.nodes) {
    if (node.type === "action") {
      const actionType = node.data.actionType;
      if (!actionType) errors.push("Every action node needs a type selected.");
      if (actionType === "webhook" && !(node.data.url ?? "").trim()) {
        errors.push("A webhook action needs a URL.");
      }
      if (actionType === "send_email") {
        const to = node.data.to;
        if (!to || !to.value) errors.push("An email action needs recipients configured.");
      }
      if (actionType === "delay") {
        const duration = Number(node.data.duration ?? 0);
        if (!(duration > 0)) errors.push("A delay action needs a duration greater than zero.");
        const seconds = duration * (node.data.unit === "seconds" ? 1 : 60);
        if (seconds > MAX_DELAY_SECONDS) {
          errors.push(`A delay can be at most ${MAX_DELAY_SECONDS} seconds (${MAX_DELAY_SECONDS / 60} minutes).`);
        }
      }
    }
    if (node.type === "condition") {
      if (!(node.data.field ?? "").trim()) errors.push("Every condition node needs a field.");
      const outEdges = graph.edges.filter((e) => e.source === node.id);
      if (outEdges.length === 0) errors.push("A condition node needs at least one YES / NO branch.");
      const handles = new Set(outEdges.map((e) => e.sourceHandle));
      if (!handles.has("true") || !handles.has("false")) {
        errors.push(`Condition node "${node.id}" should have both YES and NO branches.`);
      }
    }
  }

  const ends = graph.nodes.filter((n) => n.type === "end");
  if (ends.length === 0) errors.push("Add at least one end node to close the flow.");

  return errors;
}