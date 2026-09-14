import mongoose, { Schema, type InferSchemaType } from "mongoose";

const pricesSchema = new Schema(
  { USD: { type: Number, min: 0 }, BDT: { type: Number, min: 0 } },
  { _id: false }
);

const mockTestBundleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true },
    badge: { type: String, trim: true },
    image: { type: String, trim: true },
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "USD", trim: true },
    prices: { type: pricesSchema },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type MockTestBundleDoc = InferSchemaType<typeof mockTestBundleSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const MockTestBundle =
  (mongoose.models.MockTestBundle as mongoose.Model<MockTestBundleDoc>) ??
  mongoose.model<MockTestBundleDoc>("MockTestBundle", mockTestBundleSchema);