import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { AutomationNode, AutomationEdge } from "@/lib/automation/types";

const automationNodeSchema = new Schema<AutomationNode>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["trigger", "condition", "action", "end"], required: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const automationEdgeSchema = new Schema<AutomationEdge>(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, enum: ["true", "false"] },
    label: { type: String },
  },
  { _id: false }
);

const automationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    active: { type: Boolean, default: false },
    nodes: { type: [automationNodeSchema], default: [] },
    edges: { type: [automationEdgeSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

automationSchema.index({ active: 1, createdAt: -1 });

export type AutomationDoc = InferSchemaType<typeof automationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Automation =
  (mongoose.models.Automation as mongoose.Model<AutomationDoc>) ??
  mongoose.model<AutomationDoc>("Automation", automationSchema);
