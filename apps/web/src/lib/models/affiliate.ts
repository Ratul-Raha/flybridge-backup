import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const AFFILIATE_STATUSES = ["active", "suspended"] as const;
export type AffiliateStatus = (typeof AFFILIATE_STATUSES)[number];

export const AFFILIATE_PAYOUT_METHODS = ["bKash", "bank", "other"] as const;
export type AffiliatePayoutMethod = (typeof AFFILIATE_PAYOUT_METHODS)[number];

/**
 * How an affiliate is paid. Held as their own selectable method plus whatever
 * account details that method needs — kept free-form so a new method (Nagad,
 * Rocket, wire) does not need a migration.
 */
const payoutDetailsSchema = new Schema(
  {
    method: { type: String, enum: AFFILIATE_PAYOUT_METHODS, default: "bKash" },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    routingNumber: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const affiliateSchema = new Schema(
  {
    /** Optional linked account; an affiliate can be external with no login. */
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    status: { type: String, enum: AFFILIATE_STATUSES, default: "active", index: true },
    /** Percentage of the net order total paid as commission. */
    commissionPercent: { type: Number, min: 0, max: 100, default: 20 },
    /** Payout currency; commissions are earned and reported per-currency. */
    currency: { type: String, enum: ["USD", "BDT"], default: "BDT", uppercase: true },
    payoutMethod: { type: String, enum: AFFILIATE_PAYOUT_METHODS, default: "bKash" },
    payoutDetails: { type: payoutDetailsSchema, default: {} },
    notes: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    suspendedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

affiliateSchema.index({ createdAt: -1 });

export type AffiliateDoc = InferSchemaType<typeof affiliateSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Affiliate =
  (mongoose.models.Affiliate as mongoose.Model<AffiliateDoc>) ??
  mongoose.model<AffiliateDoc>("Affiliate", affiliateSchema);
