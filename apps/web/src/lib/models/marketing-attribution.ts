import { Schema } from "mongoose";

export function createMarketingAttributionSchema() {
  const touchSchema = new Schema(
    {
      source: { type: String, trim: true, maxlength: 100 },
      medium: { type: String, trim: true, maxlength: 100 },
      campaign: { type: String, trim: true, maxlength: 180 },
      campaignId: { type: String, trim: true, maxlength: 100 },
      adsetId: { type: String, trim: true, maxlength: 100 },
      adId: { type: String, trim: true, maxlength: 100 },
      content: { type: String, trim: true, maxlength: 180 },
      term: { type: String, trim: true, maxlength: 180 },
      landingPage: { type: String, trim: true, maxlength: 300 },
      referrer: { type: String, trim: true, maxlength: 300 },
      fbclid: { type: String, trim: true, maxlength: 500 },
      gclid: { type: String, trim: true, maxlength: 500 },
      capturedAt: { type: String, trim: true, maxlength: 40 },
    },
    { _id: false }
  );

  return new Schema(
    {
      firstTouch: { type: touchSchema, default: undefined },
      lastTouch: { type: touchSchema, default: undefined },
      fbc: { type: String, trim: true, maxlength: 1000 },
      fbp: { type: String, trim: true, maxlength: 1000 },
      fbclid: { type: String, trim: true, maxlength: 500 },
      gclid: { type: String, trim: true, maxlength: 500 },
      ip: { type: String, trim: true, maxlength: 100 },
      userAgent: { type: String, trim: true, maxlength: 500 },
    },
    { _id: false }
  );
}
