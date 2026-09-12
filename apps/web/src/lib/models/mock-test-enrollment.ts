import mongoose, { Schema, type InferSchemaType } from "mongoose";

const mockTestEnrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bundle: { type: Schema.Types.ObjectId, ref: "MockTestBundle", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

mockTestEnrollmentSchema.index({ user: 1, bundle: 1 }, { unique: true });

export type MockTestEnrollmentDoc = InferSchemaType<typeof mockTestEnrollmentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const MockTestEnrollment =
  (mongoose.models.MockTestEnrollment as mongoose.Model<MockTestEnrollmentDoc>) ??
  mongoose.model<MockTestEnrollmentDoc>("MockTestEnrollment", mockTestEnrollmentSchema);