import mongoose, { Schema, type InferSchemaType } from "mongoose";

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    duration: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
  },
  { _id: false }
);

const moduleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    lessons: { type: [lessonSchema], default: [] },
  },
  { _id: false }
);

const courseSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    badge: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    level: { type: String, trim: true },
    language: { type: String, trim: true },
    pace: { type: String, trim: true },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", trim: true },
    image: { type: String, trim: true },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    upcoming: { type: Boolean, default: false },
    modules: { type: [moduleSchema], default: [] },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type LessonDoc = InferSchemaType<typeof lessonSchema>;
export type ModuleDoc = InferSchemaType<typeof moduleSchema>;

export type CourseDoc = InferSchemaType<typeof courseSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Course =
  (mongoose.models.Course as mongoose.Model<CourseDoc>) ??
  mongoose.model<CourseDoc>("Course", courseSchema);
