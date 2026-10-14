import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const USAGE_EVENT_TYPES = ["page_view", "lesson_view", "quiz_start"] as const;
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

const usageEventSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: String, enum: USAGE_EVENT_TYPES, required: true },
    path: { type: String, required: true, trim: true, maxlength: 300 },
    courseSlug: { type: String, trim: true, lowercase: true, maxlength: 120 },
    moduleIndex: { type: Number, min: 0 },
    lessonIndex: { type: Number, min: 0 },
  },
  { timestamps: true },
);

usageEventSchema.index({ user: 1, createdAt: -1 });
usageEventSchema.index({ event: 1, createdAt: -1 });
usageEventSchema.index({ event: 1, path: 1, createdAt: -1 });
usageEventSchema.index({ event: 1, courseSlug: 1, moduleIndex: 1, lessonIndex: 1, createdAt: -1 });

export type UsageEventDoc = InferSchemaType<typeof usageEventSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UsageEvent =
  (mongoose.models.UsageEvent as mongoose.Model<UsageEventDoc>) ??
  mongoose.model<UsageEventDoc>("UsageEvent", usageEventSchema);
