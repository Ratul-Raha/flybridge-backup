import mongoose, { Schema, type InferSchemaType } from "mongoose";

const resourceDownloadSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    resource: { type: Schema.Types.ObjectId, ref: "Resource", required: true, index: true },
    visitorKey: { type: String, required: true, index: true },
    kind: { type: String, enum: ["open", "download"], default: "download", index: true },
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

resourceDownloadSchema.index({ user: 1, createdAt: -1 });
resourceDownloadSchema.index({ createdAt: -1 });
resourceDownloadSchema.index({ source: 1, createdAt: -1 });
resourceDownloadSchema.index({ campaign: 1, createdAt: -1 });
resourceDownloadSchema.index({ visitorKey: 1, createdAt: -1 });

export type ResourceDownloadDoc = InferSchemaType<typeof resourceDownloadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ResourceDownload =
  (mongoose.models.ResourceDownload as mongoose.Model<ResourceDownloadDoc>) ??
  mongoose.model<ResourceDownloadDoc>("ResourceDownload", resourceDownloadSchema);
