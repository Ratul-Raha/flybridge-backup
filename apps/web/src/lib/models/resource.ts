import mongoose, { Schema, type InferSchemaType } from "mongoose";

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    fileType: {
      type: String,
      enum: ["pdf", "image", "video", "audio", "other"],
      default: "other",
    },
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true },
    fileSize: { type: Number, min: 0, default: 0 },
    publicId: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    thumbnailPublicId: { type: String, trim: true },
    releaseDate: { type: Date, default: Date.now, index: true },
    access: { type: String, enum: ["free", "paid"], default: "free", index: true },
    price: { type: Number, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type ResourceDoc = InferSchemaType<typeof resourceSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Resource =
  (mongoose.models.Resource as mongoose.Model<ResourceDoc>) ??
  mongoose.model<ResourceDoc>("Resource", resourceSchema);
