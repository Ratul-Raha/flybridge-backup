import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const AFFILIATE_PAYOUT_STATUSES = ["paid", "failed"] as const;
export type AffiliatePayoutStatus = (typeof AFFILIATE_PAYOUT_STATUSES)[number];

/**
 * A manual payout record. Staff send the money (bKash/bank/other) and then log
 * it here; creating the record is what flips the included conversions to `paid`.
 * There is no automated transfer — this is the ledger entry for one.
 */
const affiliatePayoutSchema = new Schema(
  {
    affiliate: { type: Schema.Types.ObjectId, ref: "Affiliate", required: true, index: true },
    amount: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "BDT", trim: true, uppercase: true },
    method: { type: String, trim: true, default: "bKash" },
    /** External transfer reference (bKash trx id, bank ref, etc.). */
    reference: { type: String, trim: true },
    conversions: { type: [Schema.Types.ObjectId], ref: "AffiliateConversion", default: [] },
    status: { type: String, enum: AFFILIATE_PAYOUT_STATUSES, default: "paid", index: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

affiliatePayoutSchema.index({ affiliate: 1, createdAt: -1 });
affiliatePayoutSchema.index({ createdAt: -1 });

export type AffiliatePayoutDoc = InferSchemaType<typeof affiliatePayoutSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AffiliatePayout =
  (mongoose.models.AffiliatePayout as mongoose.Model<AffiliatePayoutDoc>) ??
  mongoose.model<AffiliatePayoutDoc>("AffiliatePayout", affiliatePayoutSchema);
