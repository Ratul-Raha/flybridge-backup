import mongoose, { Schema, type InferSchemaType } from "mongoose";

const paymentSettingsSchema = new Schema(
  {
    _id: { type: String, default: "gateways" },
    stripe: {
      mode: { type: String, enum: ["test", "live"], default: "test" },
    },
    eps: {
      mode: { type: String, enum: ["sandbox", "production"], default: "sandbox" },
    },
  },
  { timestamps: true }
);

export type PaymentSettingsDoc = InferSchemaType<typeof paymentSettingsSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

export const PaymentSettings =
  (mongoose.models.PaymentSettings as mongoose.Model<PaymentSettingsDoc>) ??
  mongoose.model<PaymentSettingsDoc>("PaymentSettings", paymentSettingsSchema);