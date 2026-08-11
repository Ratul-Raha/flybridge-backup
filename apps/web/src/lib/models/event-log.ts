import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { EVENT_NAMES } from "@/lib/events/types";

const eventLogSchema = new Schema(
  {
    name: { type: String, enum: EVENT_NAMES, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "completed", "partial", "failed"],
      default: "pending",
    },
    handlers: [
      {
        name: { type: String, required: true },
        status: { type: String, enum: ["success", "failed"], required: true },
        error: { type: String },
        durationMs: { type: Number },
        _id: false,
      },
    ],
    automationsRun: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventLogSchema.index({ createdAt: -1 });

export type EventLogDoc = InferSchemaType<typeof eventLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const EventLog =
  (mongoose.models.EventLog as mongoose.Model<EventLogDoc>) ??
  mongoose.model<EventLogDoc>("EventLog", eventLogSchema);
