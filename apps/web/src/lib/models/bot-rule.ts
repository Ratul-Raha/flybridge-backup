import mongoose, { Schema, type InferSchemaType } from "mongoose";

const botRuleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["customer_service", "pricing", "content", "operations"],
      default: "operations",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "draft", "disabled"],
      default: "active",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export type BotRuleDoc = InferSchemaType<typeof botRuleSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotRule =
  (mongoose.models.BotRule as mongoose.Model<BotRuleDoc>) ??
  mongoose.model<BotRuleDoc>("BotRule", botRuleSchema);
