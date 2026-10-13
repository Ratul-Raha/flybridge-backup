import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { createMarketingAttributionSchema } from "@/lib/models/marketing-attribution";

const wishlistSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    source: { type: String, default: "waitlist", trim: true },
    attribution: { type: createMarketingAttributionSchema(), default: undefined },
    discountPercent: { type: Number, default: 10 },
  },
  { timestamps: true }
);

wishlistSchema.index({ course: 1, email: 1 }, { unique: true, sparse: true });
wishlistSchema.index({ course: 1, user: 1 }, { unique: true, sparse: true });
wishlistSchema.index({ createdAt: 1 });

export type WishlistDoc = InferSchemaType<typeof wishlistSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseWishlist =
  (mongoose.models.CourseWishlist as mongoose.Model<WishlistDoc>) ??
  mongoose.model<WishlistDoc>("CourseWishlist", wishlistSchema);
