import mongoose, { Schema, type InferSchemaType } from "mongoose";

const toolCallSchema = new Schema(
  {
    toolId: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ["success", "error", "pending_confirmation"],
      default: "success",
    },
    confirmed: { type: Boolean, default: false },
    error: { type: String, default: "" },
  },
  { _id: false }
);

const botMessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "BotConversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, default: "" },
    toolCalls: { type: [toolCallSchema], default: [] },
    pendingConfirmation: {
      type: Schema.Types.ObjectId,
      ref: "BotAuditLog",
      default: null,
    },
  },
  { timestamps: true }
);

botMessageSchema.index({ conversation: 1, createdAt: 1 });

export type BotMessageDoc = InferSchemaType<typeof botMessageSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotMessage =
  (mongoose.models.BotMessage as mongoose.Model<BotMessageDoc>) ??
  mongoose.model<BotMessageDoc>("BotMessage", botMessageSchema);
