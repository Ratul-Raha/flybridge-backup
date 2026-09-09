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
  | "lt"
  | "has_enrolled"
  | "has_resource_download"
  | "has_readiness_run"
  | "has_certificate"
  | "progress_gte"
  | "progress_lt";

export type ActionType = "send_email" | "send_notification" | "webhook" | "delay";

export type DelayUnit = "seconds" | "minutes" | "hours" | "days";

/** Delays up to this budget run synchronously inside the event request. Anything
 *  longer is persisted as a scheduled (pending) run and resumed by the cron. */
export const SYNC_DELAY_MAX_MS = 60_000;

/** Hard cap for a single delay step (365 days). */
export const MAX_DELAY_MS = 365 * 24 * 60 * 60 * 1000;

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
  templateId?: string;
  subject?: string;
  body?: string;
  title?: string;
  message?: string;
  roles?: string;
  url?: string;
  method?: "POST" | "GET";
  headers?: string;
  duration?: number;
  unit?: DelayUnit;
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
