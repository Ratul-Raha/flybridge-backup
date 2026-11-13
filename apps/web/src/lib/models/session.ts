import mongoose from "mongoose";

export type SessionDoc = mongoose.Document & {
  user: mongoose.Types.ObjectId;
  sessionId: string;
  deviceName: string;
  userAgent?: string;
  lastSeenAt: Date;
  createdAt: Date;
};

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true },
    deviceName: { type: String, trim: true, default: "Unknown device" },
    userAgent: { type: String, trim: true, default: "" },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, sessionId: 1 }, { unique: true });
sessionSchema.index({ user: 1, lastSeenAt: -1 });

export const Session =
  (mongoose.models.Session as mongoose.Model<SessionDoc>) ||
  mongoose.model<SessionDoc>("Session", sessionSchema);
