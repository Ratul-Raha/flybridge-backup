import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course, type CourseDoc } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress, type CourseProgressDoc } from "@/lib/models/course-progress";
import { calculateGrade, type GradeResult } from "@/lib/grading";
import { findOrCreateCertificate } from "@/lib/certificates";
import type { CertificateGradeSnapshot } from "@/lib/models/certificate";
import type { HydratedDocument } from "mongoose";

type PopulatedUser = {
  _id: unknown;
  name?: string;
  email?: string;
};

type MemberCertData = {
  course: CourseDoc;
  user: PopulatedUser | null;
  progress: HydratedDocument<CourseProgressDoc> | null;
  grade: GradeResult | null;
  eligible: boolean;
};

async function loadMemberCertificate(params: {
  courseKey: string;
  userId: string;
}): Promise<MemberCertData> {
  if (!Types.ObjectId.isValid(params.userId)) {
    throw new ApiError("Invalid user", 400);
  }

  await connectDb();

  const isObjectId = Types.ObjectId.isValid(params.courseKey);
  const course = await Course.findOne(
    isObjectId ? { _id: params.courseKey } : { slug: params.courseKey.toLowerCase() }
  );
  if (!course) {
    throw new ApiError("Course not found", 404);
  }

  const enrollment = await CourseEnrollment.findOne({
    course: course._id,
    user: params.userId,
  }).populate("user", "name email");

  if (!enrollment) {
    throw new ApiError("User is not enrolled in this course", 404);
  }

  const user = (enrollment.user ?? null) as PopulatedUser | null;

  const progress = await CourseProgress.findOne({
    course: course._id,
    user: params.userId,
  });

  const totalLessons = (course.modules ?? []).reduce(
    (n, m) => n + (m.lessons?.length ?? 0),
    0
  );

  const grade = progress
    ? calculateGrade(
        (progress.quizScores ?? []) as { score: number }[],
        totalLessons
      )
    : null;

  const eligible = Boolean(
    grade && grade.passed && grade.completedQuizzes === grade.totalQuizzes
  );

  return { course, user, progress, grade, eligible };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function recipientName(user: PopulatedUser | null, userId: string): string {
  if (user?.name) return user.name;
  return `Student ${userId.slice(-4)}`;
}

function recipientEmail(user: PopulatedUser | null): string {
  return user?.email ?? "no-email@flybridge.ca";
}

async function issueForMember(data: MemberCertData, userId: string) {
  const { course, user, progress, grade, eligible } = data;
  if (!eligible) {
    return { eligible: false as const, grade, progress };
  }

  if (progress && !progress.certificateIssued) {
    progress.certificateIssued = true;
    await progress.save();
  }

  const cert = await findOrCreateCertificate({
    userId: new Types.ObjectId(userId),
    userName: recipientName(user, userId),
    userEmail: recipientEmail(user),
    courseId: course._id,
    courseTitle: course.title,
    courseSlug: course.slug,
    grade: grade ? toGradeSnapshot(grade) : null,
  });

  return {
    eligible: true as const,
    grade,
    progress,
    certificate: cert,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await loadMemberCertificate({
      courseKey: params.id,
      userId: params.userId,
    });

    const { eligible, grade } = data;

    if (!eligible) {
      return NextResponse.json({
        eligible: false,
        grade,
        userName: recipientName(data.user, params.userId),
        message:
          "This member has not completed all quizzes at 60% or higher yet.",
      });
    }

    const result = await issueForMember(data, params.userId);
    if (!result.eligible || !result.certificate) {
      return NextResponse.json({ eligible: false, grade }, { status: 200 });
    }

    const cert = result.certificate;
    return NextResponse.json({
      eligible: true,
      certificateIssued: true,
      certId: cert.certId,
      userName: cert.userName,
      userEmail: cert.userEmail,
      courseTitle: data.course.title,
      courseSlug: data.course.slug,
      grade,
      issuedAt: cert.issuedAt.toISOString(),
      downloadCount: cert.downloadCount ?? 0,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("member certificate error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await loadMemberCertificate({
      courseKey: params.id,
      userId: params.userId,
    });

    const result = await issueForMember(data, params.userId);
    if (!result.eligible || !result.certificate) {
      return NextResponse.json(
        { error: "Member not eligible", eligible: false },
        { status: 200 }
      );
    }

    if (result.progress) {
      result.progress.certificateDownloadedAt = new Date();
      result.progress.certificateDownloadCount =
        (result.progress.certificateDownloadCount ?? 0) + 1;
      await result.progress.save();
    }

    const cert = result.certificate;
    cert.downloadCount = (cert.downloadCount ?? 0) + 1;
    await cert.save();

    return NextResponse.json({ ok: true, certId: cert.certId });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("member certificate download tracking error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function toGradeSnapshot(grade: GradeResult): CertificateGradeSnapshot {
  return {
    percentage: grade.percentage,
    grade: grade.grade,
    performance: grade.performance,
    englishLevel: grade.englishLevel,
    totalQuizzes: grade.totalQuizzes,
    completedQuizzes: grade.completedQuizzes,
  };
}