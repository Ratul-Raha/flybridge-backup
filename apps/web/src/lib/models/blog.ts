import mongoose, { Schema, type InferSchemaType } from "mongoose";

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, trim: true },
    content: { type: String, trim: true },
    contentHtml: { type: String, trim: true },
    category: { type: String, trim: true, index: true },
    cover: { type: String, trim: true },
    coverPublicId: { type: String, trim: true },
    author: { type: String, trim: true },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, index: true },
    viewCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

blogSchema.index({ published: 1, publishedAt: -1 });

export type BlogDoc = InferSchemaType<typeof blogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Blog =
  (mongoose.models.Blog as mongoose.Model<BlogDoc>) ??
  mongoose.model<BlogDoc>("Blog", blogSchema);