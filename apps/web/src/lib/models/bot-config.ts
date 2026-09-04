import mongoose, { Schema, type InferSchemaType } from "mongoose";

const botConfigSchema = new Schema(
  {
    name: { type: String, default: "Bridge Ops", trim: true },
    avatar: { type: String, default: "" },
    greeting: {
      type: String,
      default: "Hi! I'm Bridge Ops, your FlyBridge admin assistant. Ask me anything about your business data or operations.",
      trim: true,
    },
    tone: {
      type: String,
      enum: ["formal", "casual", "balanced"],
      default: "balanced",
    },
    detailLevel: {
      type: String,
      enum: ["concise", "detailed", "balanced"],
      default: "balanced",
    },
    systemPrompt: { type: String, default: "" },
    maxConversationLength: { type: Number, default: 50, min: 5, max: 200 },
  },
  { timestamps: true }
);

export type BotConfigDoc = InferSchemaType<typeof botConfigSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotConfig =
  (mongoose.models.BotConfig as mongoose.Model<BotConfigDoc>) ??
  mongoose.model<BotConfigDoc>("BotConfig", botConfigSchema);
