import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One row per email send operation (a single `sendEmail` call), regardless of
 * how many recipients it targeted. Powers the admin "Emails" page: how many
 * emails were sent, and — joined with EmailClick — click/engagement rates.
 */
const emailSendSchema = new Schema(
  {
    /** Send origin: bulk campaign, automation action, transactional, test. */
    kind: { type: String, enum: ["bulk", "automation", "transactional", "test"], default: "bulk" },
    /** Campaign slug (template id, "admin-bulk", …). Matches EmailClick.campaign. */
    campaign: { type: String, trim: true, lowercase: true, default: "email" },
    templateId: { type: String, trim: true },
    subject: { type: String, trim: true },
    /** Number of recipient addresses this operation targeted. */
    recipients: { type: Number, default: 0 },
    /** Final outcome of the whole operation. */
    status: { type: String, enum: ["sent", "partial", "failed"], default: "sent" },
    error: { type: String, trim: true },
    triggeredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailSendSchema.index({ campaign: 1, createdAt: -1 });
emailSendSchema.index({ templateId: 1, createdAt: -1 });
emailSendSchema.index({ createdAt: -1 });

export type EmailSendDoc = InferSchemaType<typeof emailSendSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const EmailSend =
  (mongoose.models.EmailSend as mongoose.Model<EmailSendDoc>) ??
  mongoose.model<EmailSendDoc>("EmailSend", emailSendSchema);
