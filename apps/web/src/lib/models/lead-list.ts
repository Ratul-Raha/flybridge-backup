import mongoose, { Schema, type InferSchemaType } from "mongoose";

const leadListSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 300 },
    /** A default list exists so every lead can land in a list without staff picking one. */
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

leadListSchema.index({ name: 1 }, { unique: true });

export type LeadListDoc = InferSchemaType<typeof leadListSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LeadList =
  (mongoose.models.LeadList as mongoose.Model<LeadListDoc>) ??
  mongoose.model<LeadListDoc>("LeadList", leadListSchema);
