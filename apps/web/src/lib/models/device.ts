import mongoose from "mongoose";

export type DeviceDoc = mongoose.Document & {
  user: mongoose.Types.ObjectId;
  deviceId: string;
  deviceName: string;
  userAgent?: string;
  lastSeenAt: Date;
  createdAt: Date;
};

const deviceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String, trim: true, default: "Unknown device" },
    userAgent: { type: String, trim: true, default: "" },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

export const Device =
  (mongoose.models.Device as mongoose.Model<DeviceDoc>) ||
  mongoose.model<DeviceDoc>("Device", deviceSchema);