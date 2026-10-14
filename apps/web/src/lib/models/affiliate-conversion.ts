import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const AFFILIATE_CONVERSION_STATUSES = [
  "pending",
  "approved",
  "paid",
  "reversed",
] as const;
export type AffiliateConversionStatus = (typeof AFFILIATE_CONVERSION_STATUSES)[number];

/**
 * The commission ledger. One row per affiliated order — the unique index on
 * `order` is what makes recording idempotent when `order.fulfilled` fires.
 * Balances are derived from this collection rather than cached, so they can
 * never drift from the source of truth.
 */
const affiliateConversionSchema = new Schema(
  {
    affiliate: { type: Schema.Types.ObjectId, ref: "Affiliate", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    itemType: { type: String, trim: true },
    itemId: { type: String, trim: true },
    itemTitle: { type: String, trim: true },
    /** Net paid amount of the order. */
    orderTotal: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", trim: true, uppercase: true },
    /** Rate snapshot, so changing an affiliate's percent never rewrites history. */
    commissionPercent: { type: Number, min: 0, max: 100, default: 0 },
    commissionAmount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: AFFILIATE_CONVERSION_STATUSES,
      default: "pending",
      index: true,
    },
    /** When a pending conversion becomes payable (after the refund window). */
    availableAt: { type: Date, default: null },
    clickId: { type: String, trim: true },
    payout: { type: Schema.Types.ObjectId, ref: "AffiliatePayout", default: null, index: true },
    reversedAt: { type: Date, default: null },
    reversedReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// One commission per order, ever.
affiliateConversionSchema.index({ order: 1 }, { unique: true });
affiliateConversionSchema.index({ affiliate: 1, status: 1, createdAt: -1 });
affiliateConversionSchema.index({ currency: 1, status: 1, availableAt: 1 });

export type AffiliateConversionDoc = InferSchemaType<typeof affiliateConversionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AffiliateConversion =
  (mongoose.models.AffiliateConversion as mongoose.Model<AffiliateConversionDoc>) ??
  mongoose.model<AffiliateConversionDoc>("AffiliateConversion", affiliateConversionSchema);
