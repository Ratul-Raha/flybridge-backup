import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ORDER_ITEM_TYPES, type OrderItemType } from "@/lib/models/order";

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;
export const DISCOUNT_SCOPES = ["all", "selected"] as const;
export const DISCOUNT_AUDIENCES = [
  "everyone",
  "wishlist",
  "new-users",
  "emails",
] as const;
export const DISCOUNT_APPLIES_TO = [...ORDER_ITEM_TYPES, "all"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];
export type DiscountAudience = (typeof DISCOUNT_AUDIENCES)[number];
export type DiscountAppliesTo = OrderItemType | "all";

const discountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    code: {
      type: String,
      uppercase: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    type: { type: String, enum: DISCOUNT_TYPES, required: true },
    value: { type: Number, min: 0, required: true },
    currency: { type: String, default: "USD", trim: true, uppercase: true },
    appliesTo: { type: String, enum: DISCOUNT_APPLIES_TO, default: "course" },
    scope: { type: String, enum: DISCOUNT_SCOPES, default: "all" },
    courseIds: { type: [Schema.Types.ObjectId], ref: "Course", default: [] },
    audience: { type: String, enum: DISCOUNT_AUDIENCES, default: "everyone" },
    emails: { type: [String], default: [] },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    minSubtotal: { type: Number, min: 0, default: 0 },
    maxRedemptions: { type: Number, min: 0, default: null },
    maxUsesPerUser: { type: Number, min: 0, default: 1 },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type DiscountDoc = InferSchemaType<typeof discountSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Discount =
  (mongoose.models.Discount as mongoose.Model<DiscountDoc>) ??
  mongoose.model<DiscountDoc>("Discount", discountSchema);
