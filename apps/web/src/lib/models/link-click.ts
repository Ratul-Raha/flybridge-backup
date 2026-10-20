import mongoose, { Schema, type InferSchemaType } from "mongoose";

const LINK_CLICK_KINDS = ["resource_open", "resource_download", "email", "affiliate", "outbound"] as const;

/**
 * One row per tracked link click from any surface (resource files, email
 * links, affiliate links, and wrapped outbound CTAs). Shares the same
 * attribution shape as ResourceDownload so reports can group every channel
 * together and anonymous clicks are counted alongside member clicks.
 */
const linkClickSchema = new Schema(
  {
    kind: { type: String, enum: LINK_CLICK_KINDS, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    visitorKey: { type: String, required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: "Resource", required: false, index: true },
    affiliate: { type: Schema.Types.ObjectId, ref: "Affiliate", required: false, index: true },
    emailRecipient: { type: String, default: "" },
    templateId: { type: String, default: "" },
    destination: { type: String, default: "" },
    label: { type: String, default: "" },
    source: { type: String, default: "direct" },
    medium: { type: String, default: "direct" },
    campaign: { type: String, default: "" },
    campaignId: { type: String, default: "" },
    adsetId: { type: String, default: "" },
    adId: { type: String, default: "" },
    content: { type: String, default: "" },
    term: { type: String, default: "" },
    page: { type: String, default: "" },
    landingPage: { type: String, default: "" },
    referrer: { type: String, default: "" },
    fbclid: { type: String, default: "" },
    gclid: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

linkClickSchema.index({ kind: 1, createdAt: -1 });
linkClickSchema.index({ createdAt: -1 });
linkClickSchema.index({ source: 1, createdAt: -1 });
linkClickSchema.index({ campaign: 1, createdAt: -1 });
linkClickSchema.index({ visitorKey: 1, createdAt: -1 });
linkClickSchema.index({ resource: 1, createdAt: -1 });

export type LinkClickDoc = InferSchemaType<typeof linkClickSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const LinkClick =
  (mongoose.models.LinkClick as mongoose.Model<LinkClickDoc>) ??
  mongoose.model<LinkClickDoc>("LinkClick", linkClickSchema);
