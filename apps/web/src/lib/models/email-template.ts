import mongoose, { Schema, type InferSchemaType } from "mongoose";

const emailTemplateOverrideSchema = new Schema(
  {
    templateId: { type: String, required: true, unique: true, trim: true },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

emailTemplateOverrideSchema.index({ updatedAt: -1 });

export type EmailTemplateOverrideDoc = InferSchemaType<typeof emailTemplateOverrideSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const EmailTemplateOverride =
  (mongoose.models.EmailTemplateOverride as mongoose.Model<EmailTemplateOverrideDoc>) ??
  mongoose.model<EmailTemplateOverrideDoc>("EmailTemplateOverride", emailTemplateOverrideSchema);