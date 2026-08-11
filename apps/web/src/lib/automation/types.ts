import type { EventName } from "@/lib/events/types";

export type AutomationNodeType = "trigger" | "condition" | "action" | "end";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "exists"
  | "not_exists"
  | "gt"
  | "lt";

export type ActionType = "send_email" | "send_notification" | "webhook";

export type RecipientSetting = {
  mode: "path" | "fixed" | "role";
  value: string;
};

export type AutomationNodeData = {
  event?: EventName;
  field?: string;
  operator?: ConditionOperator;
  value?: string;
  actionType?: ActionType;
  to?: RecipientSetting;
  subject?: string;
  body?: string;
  title?: string;
  message?: string;
  roles?: string;
  url?: string;
  method?: "POST" | "GET";
  headers?: string;
};

export type AutomationNode = {
  id: string;
  type: AutomationNodeType;
  data: AutomationNodeData;
};

export type AutomationEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: "true" | "false";
  label?: string;
};

export type AutomationGraph = {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
};

export type AutomationRunStep = {
  nodeId: string;
  nodeType: AutomationNodeType;
  actionType?: ActionType;
  status: "success" | "failed" | "skipped";
  error?: string;
  durationMs?: number;
  detail?: unknown;
};
