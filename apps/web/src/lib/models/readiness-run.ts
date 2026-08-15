import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ReadinessAnswers, ReadinessResult } from "@/lib/readiness/questions";

const readinessRunSchema = new Schema(
  {
    runId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    report: { type: String, default: "" },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    label: { type: String, default: "" },
    country: { type: String, default: "" },
    degreeLevel: { type: String, default: "" },
  },
  { timestamps: true }
);

readinessRunSchema.index({ user: 1, createdAt: -1 });

export type ReadinessRunDoc = InferSchemaType<typeof readinessRunSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredReadinessRun = {
  id: string;
  runId: string;
  answers: ReadinessAnswers;
  result: ReadinessResult;
  report: string;
  score: number;
  label: string;
  country: string;
  degreeLevel: string;
  createdAt: string;
  updatedAt: string;
};

export const ReadinessRun =
  (mongoose.models.ReadinessRun as mongoose.Model<ReadinessRunDoc>) ??
  mongoose.model<ReadinessRunDoc>("ReadinessRun", readinessRunSchema);

export function serializeReadinessRun(
  doc: ReadinessRunDoc
): StoredReadinessRun {
  return {
    id: doc._id.toString(),
    runId: doc.runId,
    answers: doc.answers as ReadinessAnswers,
    result: doc.result as ReadinessResult,
    report: doc.report ?? "",
    score: doc.score,
    label: doc.label ?? "",
    country: doc.country ?? "",
    degreeLevel: doc.degreeLevel ?? "",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
