import mongoose, { Schema, type InferSchemaType } from "mongoose";

const botAccessSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    botAccess: { type: Boolean, default: true },
    readTools: { type: Boolean, default: true },
    writeTools: { type: Boolean, default: true },
    destructiveTools: { type: Boolean, default: false },
    configAccess: { type: Boolean, default: false },
    dailyMessageLimit: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export type BotAccessDoc = InferSchemaType<typeof botAccessSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotAccess =
  (mongoose.models.BotAccess as mongoose.Model<BotAccessDoc>) ??
  mongoose.model<BotAccessDoc>("BotAccess", botAccessSchema);
