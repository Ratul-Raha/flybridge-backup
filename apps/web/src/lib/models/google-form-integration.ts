import mongoose, { Schema, type InferSchemaType } from "mongoose";

const fieldMapSchema = new Schema(
  {
    source: { type: String, trim: true },
    target: { type: String, trim: true },
  },
  { _id: false }
);

const googleFormIntegrationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    /** Secret key used in the public webhook path. */
    key: { type: String, required: true, unique: true, index: true },
    /** Reference to the Google Form, for display only. */
    formId: { type: String, trim: true },
    /** Maps a form question title -> a lead field name (core or custom). */
    fieldMap: { type: [fieldMapSchema], default: [] },
    /** Name of the question that carries the email (used as the lead anchor). */
    emailField: { type: String, trim: true },
    enabled: { type: Boolean, default: true },
    submissionCount: { type: Number, default: 0 },
    lastSubmissionAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export type GoogleFormIntegrationDoc = InferSchemaType<typeof googleFormIntegrationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const GoogleFormIntegration =
  (mongoose.models.GoogleFormIntegration as mongoose.Model<GoogleFormIntegrationDoc>) ??
  mongoose.model<GoogleFormIntegrationDoc>(
    "GoogleFormIntegration",
    googleFormIntegrationSchema
  );
