import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ORDER_STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"] as const;
export const ORDER_ITEM_TYPES = ["course", "seminar", "resource"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItemType = (typeof ORDER_ITEM_TYPES)[number];

const orderItemSchema = new Schema(
  {
    itemType: { type: String, enum: ORDER_ITEM_TYPES, required: true },
    itemId: { type: String, required: true },
    title: { type: String, trim: true },
    price: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "BDT", trim: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    gateway: { type: String, trim: true },
    gatewayRef: { type: String, trim: true },
  },
  { timestamps: true }
);

export type OrderItem = InferSchemaType<typeof orderItemSchema>;

export type OrderDoc = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Order =
  (mongoose.models.Order as mongoose.Model<OrderDoc>) ??
  mongoose.model<OrderDoc>("Order", orderSchema);
