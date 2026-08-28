import mongoose, { Schema, type InferSchemaType } from "mongoose";

const successStorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    origin: { type: String, trim: true },
    originCode: { type: String, trim: true },
    destination: { type: String, trim: true },
    destinationCode: { type: String, trim: true },
    visaType: { type: String, enum: ["student", "work"], default: "student", index: true },
    universityName: { type: String, trim: true },
    cityName: { type: String, trim: true },
    story: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type SuccessStoryDoc = InferSchemaType<typeof successStorySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SuccessStory =
  (mongoose.models.SuccessStory as mongoose.Model<SuccessStoryDoc>) ??
  mongoose.model<SuccessStoryDoc>("SuccessStory", successStorySchema);
