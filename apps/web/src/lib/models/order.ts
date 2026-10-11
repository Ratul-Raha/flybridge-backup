import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ORDER_STATUSES = ["pending", "completed", "failed", "cancelled", "refunded"] as const;
export const ORDER_ITEM_TYPES = ["course", "seminar", "resource", "mock-bundle"] as const;

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

const orderAttributionSchema = new Schema(
  {
    fbc: { type: String, trim: true },
    fbp: { type: String, trim: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { _id: false }
);

const orderMetaSchema = new Schema(
  {
    reported: { type: Boolean, default: false },
    reportedAt: { type: Date },
    /** Graph API trace id — what Meta support asks for when reconciling counts. */
    traceId: { type: String, trim: true },
    error: { type: String, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    /** Kept only so orders placed under the old promo codes still read back. */
    discountCode: { type: String, trim: true, uppercase: true },
    discountLabel: { type: String, trim: true },
    total: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", trim: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    /** When the payment was confirmed and access granted. Starts the 3-day refund
     *  window. Orders completed before this field existed fall back to updatedAt. */
    completedAt: { type: Date, default: null },
    gateway: { type: String, trim: true },
    gatewayRef: { type: String, trim: true },
    merchantTransactionId: { type: String, trim: true },
    gatewayMode: { type: String, trim: true },
    /** Meta click ids + request context, captured at order creation so the
     *  Conversions API can match the server-side Purchase to the ad click. */
    attribution: { type: orderAttributionSchema, default: undefined },
    /** Whether the server-side Purchase actually reached Meta, and what it said. */
    meta: { type: orderMetaSchema, default: undefined },
  },
  { timestamps: true }
);

orderSchema.index(
  { user: 1, "items.itemId": 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [{ status: "pending" }, { status: "completed" }],
    },
  }
);

orderSchema.index({ currency: 1, status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export type OrderItem = InferSchemaType<typeof orderItemSchema>;

export type OrderDoc = InferSchemaType<typeof orderSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Order =
  (mongoose.models.Order as mongoose.Model<OrderDoc>) ??
  mongoose.model<OrderDoc>("Order", orderSchema);
