import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { AutomationRunStep } from "@/lib/automation/types";
import { EVENT_NAMES } from "@/lib/events/types";

const runStepSchema = new Schema<AutomationRunStep>(
  {
    nodeId: { type: String, required: true },
    nodeType: { type: String, enum: ["trigger", "condition", "action", "end"], required: true },
    actionType: { type: String, enum: ["send_email", "send_notification", "webhook", "delay"] },
    status: { type: String, enum: ["success", "failed", "skipped"], required: true },
    error: { type: String },
    durationMs: { type: Number },
    detail: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const automationRunSchema = new Schema(
  {
    automation: { type: Schema.Types.ObjectId, ref: "Automation", required: true, index: true },
    automationName: { type: String, default: "" },
    eventName: { type: String, enum: EVENT_NAMES, required: true },
    eventLog: { type: Schema.Types.ObjectId, ref: "EventLog" },
    status: {
      type: String,
      enum: ["completed", "completed_with_errors", "failed"],
      default: "completed",
    },
    steps: { type: [runStepSchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

automationRunSchema.index({ eventLog: 1 });
automationRunSchema.index({ automation: 1, createdAt: -1 });

export type AutomationRunDoc = InferSchemaType<typeof automationRunSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AutomationRun =
  (mongoose.models.AutomationRun as mongoose.Model<AutomationRunDoc>) ??
  mongoose.model<AutomationRunDoc>("AutomationRun", automationRunSchema);
