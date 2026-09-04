import mongoose, { Schema, type InferSchemaType } from "mongoose";

const botConversationSchema = new Schema(
  {
    adminUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New conversation", trim: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    messageCount: { type: Number, default: 0 },
    toolsUsed: { type: [String], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

botConversationSchema.index({ adminUser: 1, lastMessageAt: -1 });

export type BotConversationDoc = InferSchemaType<typeof botConversationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotConversation =
  (mongoose.models.BotConversation as mongoose.Model<BotConversationDoc>) ??
  mongoose.model<BotConversationDoc>("BotConversation", botConversationSchema);
