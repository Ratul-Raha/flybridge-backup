import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { PRACTICE_SET_STATUSES } from "@/lib/practice/schema";

const practiceSetSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    courseSlug: { type: String, required: true, trim: true },
    courseTitle: { type: String, required: true, trim: true },
    category: { type: String, default: null },
    moduleIndex: { type: Number, required: true, min: 0 },
    lessonIndex: { type: Number, default: null, min: 0 },
    skill: { type: String, required: true, trim: true },
    setNumber: { type: Number, required: true, min: 1 },
    title: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: [...PRACTICE_SET_STATUSES],
      default: "draft",
      index: true,
    },
    s3Key: { type: String, required: true, trim: true },
    s3Ref: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true, default: "" },
    questionCount: { type: Number, min: 0, default: 0 },
    passageCount: { type: Number, min: 0, default: 0 },
    typeCounts: { type: Schema.Types.Mixed, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

practiceSetSchema.index(
  { course: 1, moduleIndex: 1, lessonIndex: 1, skill: 1, setNumber: 1 },
  { unique: true }
);

export type PracticeSetDoc = InferSchemaType<typeof practiceSetSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PracticeSet =
  (mongoose.models.PracticeSet as mongoose.Model<PracticeSetDoc>) ??
  mongoose.model<PracticeSetDoc>("PracticeSet", practiceSetSchema);
