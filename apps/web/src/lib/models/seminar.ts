import mongoose, { Schema, type InferSchemaType } from "mongoose";

const pricesSchema = new Schema(
  { USD: { type: Number, min: 0 }, BDT: { type: Number, min: 0 } },
  { _id: false }
);

const seminarSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dateTime: { type: Date, required: true, index: true },
    image: { type: String },
    type: { type: String, enum: ["free", "paid"], default: "free" },
    price: { type: Number, min: 0, default: 0 },
    prices: { type: pricesSchema },
    url: { type: String, trim: true },
    duration: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type SeminarDoc = InferSchemaType<typeof seminarSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

seminarSchema.index({ createdAt: -1 });

export const Seminar =
  (mongoose.models.Seminar as mongoose.Model<SeminarDoc>) ??
  mongoose.model<SeminarDoc>("Seminar", seminarSchema);

const registrationSchema = new Schema(
  {
    seminar: {
      type: Schema.Types.ObjectId,
      ref: "Seminar",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

registrationSchema.index({ seminar: 1, email: 1 }, { unique: true });
registrationSchema.index({ createdAt: -1 });
registrationSchema.index({ email: 1 });

export type RegistrationDoc = InferSchemaType<typeof registrationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SeminarRegistration =
  (mongoose.models.SeminarRegistration as mongoose.Model<RegistrationDoc>) ??
  mongoose.model<RegistrationDoc>("SeminarRegistration", registrationSchema);