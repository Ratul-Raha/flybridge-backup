import mongoose, { Schema, type InferSchemaType } from "mongoose";

const botAuditLogSchema = new Schema(
  {
    adminUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "BotConversation",
      index: true,
    },
    message: { type: String, required: true },
    toolId: { type: String, required: true, index: true },
    parameters: { type: Schema.Types.Mixed, default: {} },
    confirmed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["success", "error", "cancelled", "pending_confirmation"],
      required: true,
    },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: "" },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

botAuditLogSchema.index({ adminUser: 1, createdAt: -1 });
botAuditLogSchema.index({ createdAt: -1 });

export type BotAuditLogDoc = InferSchemaType<typeof botAuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotAuditLog =
  (mongoose.models.BotAuditLog as mongoose.Model<BotAuditLogDoc>) ??
  mongoose.model<BotAuditLogDoc>("BotAuditLog", botAuditLogSchema);
