import mongoose, { Schema, type InferSchemaType } from "mongoose";

const pricesSchema = new Schema(
  { USD: { type: Number, min: 0 }, BDT: { type: Number, min: 0 } },
  { _id: false }
);

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    fileType: {
      type: String,
      enum: ["pdf", "image", "video", "audio", "other", "link"],
      default: "other",
    },
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true },
    fileSize: { type: Number, min: 0, default: 0 },
    publicId: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    thumbnailPublicId: { type: String, trim: true },
    releaseDate: { type: Date, default: Date.now, index: true },
    access: { type: String, enum: ["public", "members"], default: "public", index: true },
    price: { type: Number, min: 0, default: 0 },
    prices: { type: pricesSchema },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date },
    youtubeUrl: { type: String, trim: true },
    viewCount: { type: Number, default: 0 },
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
