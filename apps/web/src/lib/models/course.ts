import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { COURSE_CATEGORIES } from "@/lib/course-categories";

export { COURSE_CATEGORIES, isCourseCategory, type CourseCategory } from "@/lib/course-categories";

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    duration: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    pdfUrl: { type: String, trim: true },
    content: { type: String, trim: true },
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

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pdfUrl: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const pricesSchema = new Schema(
  { USD: { type: Number, min: 0 }, BDT: { type: Number, min: 0 } },
  { _id: false }
);

/**
 * A course's own price cut. It is deliberately part of the course rather than a
 * separate promotion: one record, one toggle, and the same price for everyone.
 * `price` is the price everyone pays while it runs; the course's normal
 * `prices.BDT` stays the original it is compared against.
 */
const discountSchema = new Schema(
  {
    active: { type: Boolean, default: false },
    name: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, default: 0 },
    startsAt: { type: Date, default: null },
    // No end date means it runs until someone unticks the active box.
    endsAt: { type: Date, default: null },
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
    category: {
      type: String,
      enum: COURSE_CATEGORIES,
      default: null,
      index: true,
    },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    level: { type: String, trim: true },
    language: { type: String, trim: true },
    pace: { type: String, trim: true },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", trim: true },
    prices: { type: pricesSchema },
    discount: { type: discountSchema, default: () => ({}) },
    waitlistEnabled: { type: Boolean, default: false, index: true },
    wishlistDiscountPercent: { type: Number, min: 0, max: 100, default: 0 },
    image: { type: String, trim: true },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
    upcoming: { type: Boolean, default: false },
    certificateEnabled: { type: Boolean, default: true },
    modules: { type: [moduleSchema], default: [] },
    books: { type: [bookSchema], default: [] },
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
  certificateEnabled: boolean;
};

export const Course =
  (mongoose.models.Course as mongoose.Model<CourseDoc>) ??
  mongoose.model<CourseDoc>("Course", courseSchema);
