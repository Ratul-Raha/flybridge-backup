import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One row per click through a tracked email link (`/e/{token}`). Used for
 * click counts and to see which template/campaign a visit came from; the
 * landing page also carries utm_* params so GA4 attributes the session.
 */
const emailClickSchema = new Schema(
  {
    /** Campaign slug (template id, "automation", "admin-bulk", …). */
    campaign: { type: String, trim: true, lowercase: true, default: "email" },
    templateId: { type: String, trim: true },
    /** Recipient the email was addressed to; batch sends omit it. */
    recipient: { type: String, trim: true, lowercase: true },
    /** Where the recipient was sent after the redirect. */
    destination: { type: String, trim: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    referrer: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailClickSchema.index({ campaign: 1, createdAt: -1 });
emailClickSchema.index({ recipient: 1, createdAt: -1 });
emailClickSchema.index({ createdAt: -1 });

export type EmailClickDoc = InferSchemaType<typeof emailClickSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const EmailClick =
  (mongoose.models.EmailClick as mongoose.Model<EmailClickDoc>) ??
  mongoose.model<EmailClickDoc>("EmailClick", emailClickSchema);
