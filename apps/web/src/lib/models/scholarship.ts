import mongoose, { Schema, type InferSchemaType } from "mongoose";

const scholarshipSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true, index: true },
    rawText: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    country: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    level: {
      type: String,
      enum: ["any", "undergraduate", "graduate", "postgraduate", "school"],
      default: "any",
      index: true,
    },
    amount: { type: String, trim: true },
    deadline: { type: String, trim: true },
    eligibility: { type: String, trim: true },
    applyUrl: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type ScholarshipDoc = InferSchemaType<typeof scholarshipSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Scholarship =
  (mongoose.models.Scholarship as mongoose.Model<ScholarshipDoc>) ??
  mongoose.model<ScholarshipDoc>("Scholarship", scholarshipSchema);