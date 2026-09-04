import mongoose, { Schema, type InferSchemaType } from "mongoose";

const pushSubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

pushSubscriptionSchema.index({ user: 1, createdAt: -1 });

export type PushSubscriptionDoc = InferSchemaType<typeof pushSubscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PushSubscription =
  (mongoose.models.PushSubscription as mongoose.Model<PushSubscriptionDoc>) ??
  mongoose.model<PushSubscriptionDoc>("PushSubscription", pushSubscriptionSchema);
