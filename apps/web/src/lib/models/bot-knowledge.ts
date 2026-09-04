import mongoose, { Schema, type InferSchemaType } from "mongoose";

const knowledgeChunkSchema = new Schema(
  {
    text: { type: String, required: true },
    heading: { type: String, default: "" },
  },
  { _id: false }
);

const botKnowledgeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "file", "url", "database"],
      required: true,
    },
    content: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    url: { type: String, default: "" },
    dbCollection: { type: String, default: "" },
    chunks: { type: [knowledgeChunkSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "processing", "error"],
      default: "active",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export type BotKnowledgeDoc = InferSchemaType<typeof botKnowledgeSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BotKnowledge =
  (mongoose.models.BotKnowledge as mongoose.Model<BotKnowledgeDoc>) ??
  mongoose.model<BotKnowledgeDoc>("BotKnowledge", botKnowledgeSchema);
