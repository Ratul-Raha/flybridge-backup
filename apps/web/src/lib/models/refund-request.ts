import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { REFUND_REASON_MAX_LENGTH, REFUND_REASONS } from "@/lib/refund-policy";

export const REFUND_REQUEST_STATUSES = [
  "pending",
  "approved",
  "declined",
  "refunded",
  "failed",
] as const;

export type RefundRequestStatus = (typeof REFUND_REQUEST_STATUSES)[number];

/**
 * What the collection will accept: the live list, `""` for a student who wrote
 * the reason out, and `prefer_not_to_say`, which shipped for a few hours and
 * still has rows behind it. Staff decisions re-save the whole document, so a
 * stored value outside the enum would leave those claims impossible to decide.
 */
const STORED_REASON_CODES = [...REFUND_REASONS, "", "prefer_not_to_say"] as const;

const refundRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    /**
     * Points at whichever enrollment backs the order — CourseEnrollment for a
     * course, MockTestEnrollment for a bundle. It is what a payout revokes.
     */
    enrollment: { type: Schema.Types.ObjectId, ref: "CourseEnrollment", default: null },
    /** Denormalised so the claim still reads correctly if the course is renamed. */
    itemId: { type: String, required: true },
    itemTitle: { type: String, trim: true },
    /** "course" | "mock-bundle" — decides which collection a payout revokes. */
    itemType: { type: String, trim: true },
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", trim: true },
    gateway: { type: String, trim: true },
    /** The pick from the student's reason list, or "" when they wrote it out. */
    reasonCode: {
      type: String,
      enum: STORED_REASON_CODES,
      default: "",
      index: true,
    },
    /**
     * The student's own words, kept raw and never summarised. Required by
     * `resolveRefundReason` whenever `reasonCode` is empty.
     */
    reason: { type: String, trim: true, maxlength: REFUND_REASON_MAX_LENGTH },
    status: {
      type: String,
      enum: REFUND_REQUEST_STATUSES,
      default: "pending",
      index: true,
    },
    /** Usage snapshot at claim time — the audit trail for a forfeited claim. */
    lessonsPlayedAtClaim: { type: Number, min: 0, default: 0 },
    mockTestsPlayedAtClaim: { type: Number, min: 0, default: 0 },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    gatewayRefundId: { type: String, trim: true },
    /** Set when an automatic gateway refund failed, so staff can pay out manually. */
    failureReason: { type: String, trim: true },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// At most one live claim per order: pending, approved or already refunded.
refundRequestSchema.index(
  { order: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "approved", "refunded"] },
    },
  }
);

export type RefundRequestDoc = InferSchemaType<typeof refundRequestSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RefundRequest =
  (mongoose.models.RefundRequest as mongoose.Model<RefundRequestDoc>) ??
  mongoose.model<RefundRequestDoc>("RefundRequest", refundRequestSchema);
