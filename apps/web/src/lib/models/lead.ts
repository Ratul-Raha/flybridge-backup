import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { createMarketingAttributionSchema } from "@/lib/models/marketing-attribution";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "follow-up",
  "converted",
  "not-interested",
  "unqualified",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "waitlist",
  "seminar",
  "inquiry",
  "checkout",
  "signup",
  "form",
  "manual",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

const leadInterestSchema = new Schema(
  {
    itemType: { type: String, trim: true, maxlength: 40 },
    itemId: { type: String, trim: true, maxlength: 100 },
    title: { type: String, trim: true, maxlength: 200 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadNoteSchema = new Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const leadSchema = new Schema(
  {
    /** Optional linked account; a lead can exist before the person signs up. */
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    /** The list this lead belongs to. Every lead belongs to exactly one list. */
    list: { type: Schema.Types.ObjectId, ref: "LeadList", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    source: { type: String, enum: LEAD_SOURCES, default: "manual", index: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: "medium", index: true },
    /** Admin team member responsible for following up. */
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    /** Values for admin-defined custom fields (LeadField), keyed by field name. */
    customFields: { type: Schema.Types.Mixed, default: {} },
    attribution: { type: createMarketingAttributionSchema(), default: undefined },
    interests: { type: [leadInterestSchema], default: [] },
    notes: { type: [leadNoteSchema], default: [] },
    tags: { type: [String], default: [] },
    followUpAt: { type: Date, default: null },
    lastContactedAt: { type: Date, default: null },
    lastActivityAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One lead per email, but allow email-less leads (phone only).
leadSchema.index({ email: 1 }, { unique: true, sparse: true });
leadSchema.index({ status: 1, followUpAt: 1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ owner: 1, status: 1 });
leadSchema.index({ list: 1, createdAt: -1 });

export type LeadNote = InferSchemaType<typeof leadNoteSchema>;
export type LeadDoc = InferSchemaType<typeof leadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Lead =
  (mongoose.models.Lead as mongoose.Model<LeadDoc>) ??
  mongoose.model<LeadDoc>("Lead", leadSchema);
