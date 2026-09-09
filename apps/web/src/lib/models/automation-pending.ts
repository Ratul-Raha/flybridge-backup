import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { AutomationNode, AutomationEdge, AutomationRunStep } from "@/lib/automation/types";
import { EVENT_NAMES } from "@/lib/events/types";

/**
 * A paused automation run waiting on a long (day-level) delay. The cron sweeps
 * due runs, reloads the graph from `snapshot`, and resumes execution from
 * `resumeNodeId`, appending new steps to the same AutomationRun (`runId`).
 */
const automationPendingSchema = new Schema(
  {
    automation: { type: Schema.Types.ObjectId, ref: "Automation", required: true, index: true },
    automationName: { type: String, default: "" },
    eventName: { type: String, enum: EVENT_NAMES, required: true },
    eventLog: { type: Schema.Types.ObjectId, ref: "EventLog" },
    runId: { type: Schema.Types.ObjectId, ref: "AutomationRun", required: true },
    triggerNodeId: { type: String, required: true },
    resumeNodeIds: { type: [String], required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    snapshot: {
      nodes: { type: [Schema.Types.Mixed], default: [] },
      edges: { type: [Schema.Types.Mixed], default: [] },
    },
    steps: { type: [Schema.Types.Mixed], default: [] },
    visited: { type: [String], default: [] },
    runAfter: { type: Date, required: true, index: true },
    nextAttemptAt: { type: Date, index: true },
    status: { type: String, enum: ["pending", "done", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

automationPendingSchema.index({ status: 1, nextAttemptAt: 1 });

export type AutomationPendingDoc = InferSchemaType<typeof automationPendingSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredPendingNode = AutomationNode;
export type StoredPendingEdge = AutomationEdge;
export type StoredPendingStep = AutomationRunStep;

export const AutomationPending =
  (mongoose.models.AutomationPending as mongoose.Model<AutomationPendingDoc>) ??
  mongoose.model<AutomationPendingDoc>("AutomationPending", automationPendingSchema);