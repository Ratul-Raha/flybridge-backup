import mongoose, { Schema, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    firebaseUid: { type: String, index: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    address: { type: addressSchema, default: {} },
    accountType: {
      type: String,
      enum: ["admin", "moderator", "user"],
      default: "user",
      index: true,
    },
    subscription: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
      index: true,
    },
    signupSource: { type: String, default: null },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const User =
  (mongoose.models.User as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", userSchema);
