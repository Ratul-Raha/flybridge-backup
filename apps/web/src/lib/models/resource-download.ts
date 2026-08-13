import mongoose, { Schema, type InferSchemaType } from "mongoose";

const resourceDownloadSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: "Resource", required: true, index: true },
  },
  { timestamps: true }
);

resourceDownloadSchema.index({ user: 1, createdAt: -1 });

export type ResourceDownloadDoc = InferSchemaType<typeof resourceDownloadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ResourceDownload =
  (mongoose.models.ResourceDownload as mongoose.Model<ResourceDownloadDoc>) ??
  mongoose.model<ResourceDownloadDoc>("ResourceDownload", resourceDownloadSchema);
