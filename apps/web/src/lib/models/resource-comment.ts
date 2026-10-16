import mongoose, { Schema, type InferSchemaType } from "mongoose";

const resourceCommentSchema = new Schema(
  {
    resource: { type: Schema.Types.ObjectId, ref: "Resource", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
  },
  { timestamps: true }
);

resourceCommentSchema.index({ resource: 1, createdAt: -1 });

export type ResourceCommentDoc = InferSchemaType<typeof resourceCommentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ResourceComment =
  (mongoose.models.ResourceComment as mongoose.Model<ResourceCommentDoc>) ??
  mongoose.model<ResourceCommentDoc>("ResourceComment", resourceCommentSchema);
