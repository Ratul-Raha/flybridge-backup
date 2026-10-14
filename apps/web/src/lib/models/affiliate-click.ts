import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * One row per visit through an affiliate link (`/r/CODE`). Used for click
 * counts and to reconstruct where a conversion came from; the last click before
 * a purchase is the one that earns the commission.
 */
const affiliateClickSchema = new Schema(
  {
    affiliate: { type: Schema.Types.ObjectId, ref: "Affiliate", required: true, index: true },
    /** Unique id also carried in the visitor cookie. */
    clickId: { type: String, required: true, trim: true, unique: true, index: true },
    code: { type: String, trim: true, uppercase: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    referrer: { type: String, trim: true },
    landingPage: { type: String, trim: true },
    /** Where the visitor was sent after the redirect. */
    destination: { type: String, trim: true },
    utm: {
      source: { type: String, trim: true },
      medium: { type: String, trim: true },
      campaign: { type: String, trim: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

affiliateClickSchema.index({ affiliate: 1, createdAt: -1 });
affiliateClickSchema.index({ createdAt: -1 });

export type AffiliateClickDoc = InferSchemaType<typeof affiliateClickSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const AffiliateClick =
  (mongoose.models.AffiliateClick as mongoose.Model<AffiliateClickDoc>) ??
  mongoose.model<AffiliateClickDoc>("AffiliateClick", affiliateClickSchema);
