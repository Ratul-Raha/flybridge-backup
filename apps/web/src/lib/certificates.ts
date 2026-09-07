import "server-only";

import { connectDb } from "@/lib/db";
import { Certificate, type CertificateDoc, type CertificateGradeSnapshot } from "@/lib/models/certificate";
import type { HydratedDocument, Types } from "mongoose";

const CERT_ID_PATTERN = /^FB-\d{4}-\d{6}$/;

export function isValidCertId(value: string): boolean {
  return CERT_ID_PATTERN.test(value.toUpperCase());
}

export function generateCertId(): string {
  const year = new Date().getFullYear();
  return `FB-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Returns the single verifiable certificate for a (user, course) pair, creating
 * it on first eligible issuance. The certId becomes the permanent identity
 * printed on the PDF and embedded in its QR code.
 */
export async function findOrCreateCertificate({
  userId,
  userName,
  userEmail,
  courseId,
  courseTitle,
  courseSlug,
  grade,
}: {
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  courseId: Types.ObjectId;
  courseTitle: string;
  courseSlug: string;
  grade: CertificateGradeSnapshot | null;
}): Promise<HydratedDocument<CertificateDoc>> {
  await connectDb();

  let cert = await Certificate.findOne({ user: userId, course: courseId });
  if (cert) {
    if (cert.status !== "issued") cert.status = "issued";
    if (grade && !cert.grade) cert.grade = grade;
    await cert.save();
    return cert;
  }

  let certId = generateCertId();
  for (let i = 0; i < 5; i++) {
    const clash = await Certificate.exists({ certId });
    if (!clash) break;
    certId = generateCertId();
  }

  try {
    cert = await Certificate.create({
      certId,
      user: userId,
      userName,
      userEmail,
      course: courseId,
      courseTitle,
      courseSlug,
      grade,
      issuedAt: new Date(),
    });
    return cert;
  } catch (error) {
    // Unique (user, course) collision from a concurrent issuance — fetch it.
    cert = await Certificate.findOne({ user: userId, course: courseId });
    if (cert) return cert;
    throw error;
  }
}