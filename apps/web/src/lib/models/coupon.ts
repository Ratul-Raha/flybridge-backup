import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  COUPON_APPLIES_TO,
  COUPON_TYPES,
  type CouponAppliesTo,
  type CouponType,
} from "@/lib/coupon-rules";

const couponSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, min: 0, required: true },
    currency: { type: String, enum: ["USD", "BDT"], default: "BDT", uppercase: true },
    appliesTo: { type: String, enum: COUPON_APPLIES_TO, default: "all" },
    minSubtotal: { type: Number, min: 0, default: 0 },
    maxRedemptions: { type: Number, min: 1, default: null },
    maxUsesPerUser: { type: Number, min: 0, default: 1 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type CouponDoc = InferSchemaType<typeof couponSchema> & {
  _id: mongoose.Types.ObjectId;
  type: CouponType;
  appliesTo: CouponAppliesTo;
  createdAt: Date;
  updatedAt: Date;
};

export const Coupon =
  (mongoose.models.Coupon as mongoose.Model<CouponDoc>) ??
  mongoose.model<CouponDoc>("Coupon", couponSchema);
