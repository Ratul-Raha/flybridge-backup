import mongoose, { Schema, type InferSchemaType } from "mongoose";

const aiSettingsSchema = new Schema(
  {
    _id: { type: String, default: "provider" },
    provider: { type: String, enum: ["groq", "gemini", "grok"], default: "groq" },
  },
  { timestamps: true }
);

export type AiSettingsDoc = InferSchemaType<typeof aiSettingsSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

export const AiSettings =
  (mongoose.models.AiSettings as mongoose.Model<AiSettingsDoc>) ??
  mongoose.model<AiSettingsDoc>("AiSettings", aiSettingsSchema);
