import mongoose, { Schema, type InferSchemaType } from "mongoose";

const mockTestEnrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bundle: { type: Schema.Types.ObjectId, ref: "MockTestBundle", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    /** Set to "expired" when the bundle order is refunded, to take the access back. */
    status: { type: String, enum: ["active", "expired"], default: "active", index: true },
    /**
     * Stamped when the holder submits a mock exam, which forfeits the 3-day
     * refund (REFUND_BUNDLE_MOCK_LIMIT is 0). The number of sittings is derived
     * from the attempts, so this is the timestamp for the admin view, not the
     * count itself.
     */
    refundForfeitedAt: { type: Date, default: null },
    refundForfeitedReason: { type: String, enum: ["lessons", "mock", "manual"], default: null },
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