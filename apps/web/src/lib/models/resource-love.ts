import mongoose, { Schema, type InferSchemaType } from "mongoose";

const resourceLoveSchema = new Schema(
  {
    resource: { type: Schema.Types.ObjectId, ref: "Resource", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

resourceLoveSchema.index({ resource: 1, user: 1 }, { unique: true });

export type ResourceLoveDoc = InferSchemaType<typeof resourceLoveSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ResourceLove =
  (mongoose.models.ResourceLove as mongoose.Model<ResourceLoveDoc>) ??
  mongoose.model<ResourceLoveDoc>("ResourceLove", resourceLoveSchema);
