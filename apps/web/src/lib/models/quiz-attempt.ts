import mongoose, { Schema, type InferSchemaType } from "mongoose";

const quizAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    moduleIndex: { type: Number, required: true },
    lessonIndex: { type: Number, required: true },
    questions: { type: Schema.Types.Mixed, required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, course: 1, moduleIndex: 1, lessonIndex: 1 });

export type QuizAttemptDoc = InferSchemaType<typeof quizAttemptSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const QuizAttempt =
  (mongoose.models.QuizAttempt as mongoose.Model<QuizAttemptDoc>) ??
  mongoose.model<QuizAttemptDoc>("QuizAttempt", quizAttemptSchema);
