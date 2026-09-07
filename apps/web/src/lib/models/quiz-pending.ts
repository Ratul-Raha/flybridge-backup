import mongoose, { Schema, type InferSchemaType } from "mongoose";

const quizPendingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    moduleIndex: { type: Number, required: true },
    lessonIndex: { type: Number, required: true },
    questions: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

quizPendingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
quizPendingSchema.index({ user: 1, course: 1, moduleIndex: 1, lessonIndex: 1 });

export type QuizPendingDoc = InferSchemaType<typeof quizPendingSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const QuizPending =
  (mongoose.models.QuizPending as mongoose.Model<QuizPendingDoc>) ??
  mongoose.model<QuizPendingDoc>("QuizPending", quizPendingSchema);