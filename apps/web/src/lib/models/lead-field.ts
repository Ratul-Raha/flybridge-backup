import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const LEAD_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "email",
  "phone",
] as const;
export type LeadFieldType = (typeof LEAD_FIELD_TYPES)[number];

const leadFieldOptionSchema = new Schema(
  {
    value: { type: String, trim: true },
    label: { type: String, trim: true },
  },
  { _id: false }
);

const leadFieldSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: LEAD_FIELD_TYPES, default: "text" },
    placeholder: { type: String, trim: true, maxlength: 200 },
    options: { type: [leadFieldOptionSchema], default: [] },
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

leadFieldSchema.index({ name: 1 }, { unique: true });
leadFieldSchema.index({ sortOrder: 1 });

export type LeadFieldDoc = InferSchemaType<typeof leadFieldSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LeadField =
  (mongoose.models.LeadField as mongoose.Model<LeadFieldDoc>) ??
  mongoose.model<LeadFieldDoc>("LeadField", leadFieldSchema);
