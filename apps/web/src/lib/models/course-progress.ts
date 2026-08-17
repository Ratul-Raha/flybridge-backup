import mongoose, { Schema, type InferSchemaType } from "mongoose";

const quizScoreSchema = new Schema(
  {
    moduleIndex: { type: Number, required: true },
    lessonIndex: { type: Number, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    attempts: { type: Number, default: 1 },
  },
  { _id: false }
);

const courseProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    watchedLessons: { type: [Number], default: [] },
    quizScores: { type: [quizScoreSchema], default: [] },
    overallPercentage: { type: Number, default: 0, min: 0, max: 100 },
    totalQuizzes: { type: Number, default: 0 },
    completedQuizzes: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

export type QuizScoreEntry = {
  moduleIndex: number;
  lessonIndex: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  attempts: number;
};

export type CourseProgressDoc = InferSchemaType<typeof courseProgressSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CourseProgress =
  (mongoose.models.CourseProgress as mongoose.Model<CourseProgressDoc>) ??
  mongoose.model<CourseProgressDoc>("CourseProgress", courseProgressSchema);
