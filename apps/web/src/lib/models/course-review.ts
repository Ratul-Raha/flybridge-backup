import mongoose, { Schema, type InferSchemaType } from "mongoose";

const courseReviewSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

courseReviewSchema.index({ course: 1, user: 1 }, { unique: true });

export type CourseReviewDoc = InferSchemaType<typeof courseReviewSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseReview =
  (mongoose.models.CourseReview as mongoose.Model<CourseReviewDoc>) ??
  mongoose.model<CourseReviewDoc>("CourseReview", courseReviewSchema);
