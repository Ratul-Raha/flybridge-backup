import mongoose, { Schema, type InferSchemaType } from "mongoose";

const botToolSchema = new Schema(
  {
    toolId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["data", "action"],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    confirmationRequired: {
      type: String,
      enum: ["always", "never", "destructive"],
      default: "always",
    },
    accessLevel: {
      type: String,
      enum: ["admin", "moderator", "all"],
      default: "admin",
    },
    customInstructions: { type: String, default: "" },
    parameters: { type: Schema.Types.Mixed, default: {} },
    isDestructive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type BotToolDoc = InferSchemaType<typeof botToolSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotTool =
  (mongoose.models.BotTool as mongoose.Model<BotToolDoc>) ??
  mongoose.model<BotToolDoc>("BotTool", botToolSchema);
