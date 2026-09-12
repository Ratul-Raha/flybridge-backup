import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const MOCK_TEST_ATTEMPT_STATUSES = ["in_progress", "submitted", "graded"] as const;

export type MockTestAttemptStatus = (typeof MOCK_TEST_ATTEMPT_STATUSES)[number];

const mockTestAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    test: { type: Schema.Types.ObjectId, ref: "MockTest", required: true, index: true },
    bundle: { type: Schema.Types.ObjectId, ref: "MockTestBundle", index: true },
    status: {
      type: String,
      enum: MOCK_TEST_ATTEMPT_STATUSES,
      default: "in_progress",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    timedOut: { type: Boolean, default: false },
    answers: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

mockTestAttemptSchema.index({ user: 1, test: 1, status: 1 });

export type MockTestAttemptDoc = InferSchemaType<typeof mockTestAttemptSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const MockTestAttempt =
  (mongoose.models.MockTestAttempt as mongoose.Model<MockTestAttemptDoc>) ??
  mongoose.model<MockTestAttemptDoc>("MockTestAttempt", mockTestAttemptSchema);