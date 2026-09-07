import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { calculateGrade, type GradeResult } from "@/lib/grading";
import { findOrCreateCertificate } from "@/lib/certificates";
import type { CertificateGradeSnapshot } from "@/lib/models/certificate";
import { Types } from "mongoose";

/**
 * Server-side gate for certificate issuance.
 *
 * Prevents a user from downloading a certificate for a course they have not
 * actually completed. Completion is recomputed on the server (average quiz
 * score >= 60% and every lesson quiz submitted) — it can never be faked by
 * the client, which is entirely responsible for generating the PDF.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Staff (admin/moderator) may access the route at any time to download a
  // certificate for ANY course — bypassing enrollment, visibility, and the
  // completion gate. Regular users must actually complete the course (all
  // lessons quizzed at >=60%).
  const isManager =
    session.role === "admin" || session.role === "moderator";

  try {
    await connectDb();

    const course = await Course.findOne(
      isManager
        ? { _id: params.id }
        : { _id: params.id, $or: [{ published: true }, { upcoming: true }] }
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrolled = await CourseEnrollment.exists({
      user: session.userId,
      course: course._id,
      status: "active",
    });
    if (!enrolled && !isManager) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const totalLessons = (course.modules ?? []).reduce(
      (n, m) => n + (m.lessons?.length ?? 0),
      0
    );

    const progress = await CourseProgress.findOne({
      user: session.userId,
      course: course._id,
    });

    if (!isManager) {
      if (!progress) {
        return NextResponse.json(
          { error: "Course not completed", eligible: false },
          { status: 403 }
        );
      }

      const grade = calculateGrade(
        progress.quizScores as { score: number }[],
        totalLessons
      );

      const eligible =
        grade.passed && grade.completedQuizzes === grade.totalQuizzes;

      if (!eligible) {
        return NextResponse.json(
          {
            error: "Course not completed",
            eligible: false,
            grade,
          },
          { status: 403 }
        );
      }

      if (!progress.certificateIssued) {
        progress.certificateIssued = true;
        await progress.save();
      }

      const cert = await findOrCreateCertificate({
        userId: new Types.ObjectId(session.userId),
        userName: session.name,
        userEmail: session.email,
        courseId: course._id,
        courseTitle: course.title,
        courseSlug: course.slug,
        grade: toGradeSnapshot(grade),
      });

      return NextResponse.json({
        eligible: true,
        certificateIssued: true,
        certId: cert.certId,
        courseTitle: course.title,
        courseSlug: course.slug,
        grade,
        issuedAt: cert.issuedAt.toISOString(),
        downloadCount: cert.downloadCount ?? 0,
      });
    }

    // Manager: issue unconditionally; mark the progress flag when a doc exists.
    const grade = progress
      ? calculateGrade(
          progress.quizScores as { score: number }[],
          totalLessons
        )
      : undefined;

    if (progress && !progress.certificateIssued) {
      progress.certificateIssued = true;
      await progress.save();
    }

    const cert = await findOrCreateCertificate({
      userId: new Types.ObjectId(session.userId),
      userName: session.name,
      userEmail: session.email,
      courseId: course._id,
      courseTitle: course.title,
      courseSlug: course.slug,
      grade: grade ? toGradeSnapshot(grade) : null,
    });

    return NextResponse.json({
      eligible: true,
      certificateIssued: true,
      certId: cert.certId,
      courseTitle: course.title,
      courseSlug: course.slug,
      grade: grade ?? null,
      issuedAt: cert.issuedAt.toISOString(),
      downloadCount: cert.downloadCount ?? 0,
    });
  } catch (error) {
    console.error("certificate issuance error", error);
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}

/**
 * Records that the current user downloaded/printed their certificate for a
 * course. This powers per-user and per-course "certificate downloaded" stats.
 *
 * Uses the same server-side gate as GET() so the download can only be recorded
 * once the user is actually eligible, and never for courses they haven't
 * completed.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Staff (admin/moderator) may access the route at any time (to verify/preview
  // or download for any course) without enrollment, visibility, or completion
  // gates. Regular users are subject to them.
  const isManager =
    session.role === "admin" || session.role === "moderator";

  try {
    await connectDb();

    const course = await Course.findOne(
      isManager
        ? { _id: params.id }
        : { _id: params.id, $or: [{ published: true }, { upcoming: true }] }
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrolled = await CourseEnrollment.exists({
      user: session.userId,
      course: course._id,
      status: "active",
    });
    if (!enrolled && !isManager) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const totalLessons = (course.modules ?? []).reduce(
      (n, m) => n + (m.lessons?.length ?? 0),
      0
    );

    const progress = await CourseProgress.findOne({
      user: session.userId,
      course: course._id,
    });

    if (!isManager) {
      if (!progress) {
        return NextResponse.json(
          { error: "Course not completed", eligible: false },
          { status: 403 }
        );
      }

      const grade = calculateGrade(
        progress.quizScores as { score: number }[],
        totalLessons
      );

      const eligible =
        grade.passed && grade.completedQuizzes === grade.totalQuizzes;

      if (!eligible) {
        return NextResponse.json(
          { error: "Course not completed", eligible: false },
          { status: 403 }
        );
      }
    }

    const grade = progress
      ? calculateGrade(
          progress.quizScores as { score: number }[],
          totalLessons
        )
      : undefined;

    if (progress) {
      progress.certificateIssued = true;
      progress.certificateDownloadedAt = new Date();
      progress.certificateDownloadCount =
        (progress.certificateDownloadCount ?? 0) + 1;
      await progress.save();
    }

    const cert = await findOrCreateCertificate({
      userId: new Types.ObjectId(session.userId),
      userName: session.name,
      userEmail: session.email,
      courseId: course._id,
      courseTitle: course.title,
      courseSlug: course.slug,
      grade: grade ? toGradeSnapshot(grade) : null,
    });
    cert.downloadCount = (cert.downloadCount ?? 0) + 1;
    await cert.save();

    return NextResponse.json({ ok: true, certId: cert.certId });
  } catch (error) {
    console.error("certificate download tracking error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function toGradeSnapshot(grade: GradeResult): CertificateGradeSnapshot {
  return {
    percentage: grade.percentage,
    grade: grade.grade,
    englishLevel: grade.englishLevel,
    totalQuizzes: grade.totalQuizzes,
    completedQuizzes: grade.completedQuizzes,
  };
}
