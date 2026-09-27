import mongoose, { Schema, type InferSchemaType } from "mongoose";

const enrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    status: { type: String, enum: ["active", "expired"], default: "active" },
    /**
     * Usage counters. These never gate content — they only decide whether the
     * 3-day refund is still available. Crossing REFUND_LESSON_LIMIT lessons or
     * REFUND_MOCK_LIMIT mock exams forfeits the refund for good.
     */
    lessonsPlayed: { type: Number, min: 0, default: 0 },
    mockTestsPlayed: { type: Number, min: 0, default: 0 },
    refundForfeitedAt: { type: Date, default: null },
    refundForfeitedReason: { type: String, enum: ["lessons", "mock", "manual"], default: null },
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export type CourseEnrollmentDoc = InferSchemaType<typeof enrollmentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseEnrollment =
  (mongoose.models.CourseEnrollment as mongoose.Model<CourseEnrollmentDoc>) ??
  mongoose.model<CourseEnrollmentDoc>("CourseEnrollment", enrollmentSchema);
