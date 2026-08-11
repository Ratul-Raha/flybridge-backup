import mongoose, { Schema, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["seminar_registration", "seminar_created", "course_launched", "automation"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    seminar: { type: Schema.Types.ObjectId, ref: "Seminar" },
    registration: { type: Schema.Types.ObjectId, ref: "SeminarRegistration" },
    courseSlug: { type: String },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const NOTIFICATION_TYPES = [
  "seminar_registration",
  "seminar_created",
  "course_launched",
  "automation",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Notification =
  (mongoose.models.Notification as mongoose.Model<NotificationDoc>) ??
  mongoose.model<NotificationDoc>("Notification", notificationSchema);