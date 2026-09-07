import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const CERTIFICATE_STATUSES = ["issued", "revoked"] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

const gradeSnapshotSchema = new Schema(
  {
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true },
    englishLevel: { type: String, required: true },
    totalQuizzes: { type: Number, required: true, min: 0 },
    completedQuizzes: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * One verifiable certificate per (user, course). The certId printed on the
 * certificate and encoded in its QR code is stored here so a third party can
 * look it up and confirm authenticity without any account.
 *
 * Recipient/course data is snapshotted at issuance time so the record always
 * reflects exactly what was printed on the certificate, even if the user or
 * course is later renamed.
 */
const certificateSchema = new Schema(
  {
    certId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseTitle: { type: String, required: true },
    courseSlug: { type: String, required: true, lowercase: true, trim: true },
    issuedAt: { type: Date, default: Date.now },
    grade: { type: gradeSnapshotSchema, default: null },
    status: {
      type: String,
      enum: CERTIFICATE_STATUSES,
      default: "issued",
    },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

export type CertificateGradeSnapshot = {
  percentage: number;
  grade: string;
  englishLevel: string;
  totalQuizzes: number;
  completedQuizzes: number;
};

export type CertificateDoc = InferSchemaType<typeof certificateSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  grade: CertificateGradeSnapshot | null;
};

export const Certificate =
  (mongoose.models.Certificate as mongoose.Model<CertificateDoc>) ??
  mongoose.model<CertificateDoc>("Certificate", certificateSchema);