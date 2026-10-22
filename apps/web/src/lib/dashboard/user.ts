import "server-only";

import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db";
import { USER_DASHBOARD_TAG } from "@/lib/dashboard/tags";
import {
  ReadinessRun,
  serializeReadinessRun,
  type StoredReadinessRun,
} from "@/lib/models/readiness-run";
import { SeminarRegistration, type SeminarDoc } from "@/lib/models/seminar";
import { Resource } from "@/lib/models/resource";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";
import { Notification } from "@/lib/models/notification";
import { Scholarship } from "@/lib/models/scholarship";
import { calculateGrade } from "@/lib/grading";
import { computeMyRank, type MyRankResult } from "@/lib/leaderboard";

export type UserDashboardCourse = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  progress: { percentage: number; passed: boolean } | null;
};

export type UserDashboardSeminar = {
  id: string;
  title: string;
  dateTime: string;
  type: "free" | "paid";
};

export type UserDashboardScholarship = {
  id: string;
  institution: string;
  title: string;
  country: string;
  countryCode: string;
  amount: string;
  deadline: string;
};

export type UserDashboardData = {
  assessment: StoredReadinessRun | null;
  seminarCount: number;
  seminars: UserDashboardSeminar[];
  resourceCount: number;
  courses: UserDashboardCourse[];
  scholarships: UserDashboardScholarship[];
  unread: number | null;
  rank: MyRankResult | null;
};

async function getUserDashboardDataUncached(
  userId: string,
  email: string
): Promise<UserDashboardData> {
  await connectDb();

  const [latestRun, registrations, resourceCount, enrollments, unread, rank, scholarshipDocs] =
    await Promise.all([
      ReadinessRun.findOne({ user: userId }).sort({ createdAt: -1 }),
      SeminarRegistration.find({
        $or: [{ user: userId }, { email: email.toLowerCase() }],
      })
        .sort({ createdAt: -1 })
        .populate<{ seminar: SeminarDoc }>("seminar"),
      Resource.countDocuments(),
      CourseEnrollment.find({ user: userId, status: "active" })
        .select("course")
        .lean(),
      Notification.countDocuments({ recipient: userId, read: false }),
      computeMyRank(userId, { periodDays: 7 }).catch(() => null),
      Scholarship.find({ active: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

  const seminars = registrations
    .filter((r) => r.seminar)
    .map((r) => ({
      id: r.seminar._id.toString(),
      title: r.seminar.title,
      dateTime: r.seminar.dateTime.toISOString(),
      type: r.seminar.type,
    }));

  const courseIds = (enrollments ?? []).map((e) => e.course);
  const courses: UserDashboardCourse[] = [];

  if (courseIds.length > 0) {
    const [courseDocs, progressDocs] = await Promise.all([
      Course.find({ _id: { $in: courseIds } })
        .select("slug title image modules")
        .lean(),
      CourseProgress.find({ user: userId, course: { $in: courseIds } }).lean(),
    ]);

    const progressByCourse = new Map<string, { percentage: number; passed: boolean }>();
    for (const p of progressDocs) {
      const courseDoc = courseDocs.find(
        (c) => c._id.toString() === p.course.toString()
      );
      const totalLessons = (courseDoc?.modules ?? []).reduce(
        (n, m) => n + (m.lessons?.length ?? 0),
        0
      );
      const grade = calculateGrade(
        p.quizScores as { score: number }[],
        totalLessons
      );
      progressByCourse.set(p.course.toString(), {
        percentage: grade.percentage,
        passed: grade.passed,
      });
    }

    for (const c of courseDocs) {
      courses.push({
        id: c._id.toString(),
        slug: c.slug,
        title: c.title,
        image: c.image ?? null,
        progress: progressByCourse.get(c._id.toString()) ?? null,
      });
    }

    courses.sort(
      (a, b) => (b.progress?.percentage ?? 0) - (a.progress?.percentage ?? 0)
    );
  }

  return {
    assessment: latestRun ? serializeReadinessRun(latestRun) : null,
    seminarCount: seminars.length,
    seminars: seminars.slice(0, 3),
    resourceCount,
    courses: courses.slice(0, 3),
    scholarships: scholarshipDocs.map((s) => ({
      id: s._id.toString(),
      institution: s.institution,
      title: s.title ?? "",
      country: s.country ?? "",
      countryCode: s.countryCode ?? "",
      amount: s.amount ?? "",
      deadline: s.deadline ?? "",
    })),
    unread,
    rank,
  };
}

export const getUserDashboardData = unstable_cache(
  async (userId: string, email: string) => getUserDashboardDataUncached(userId, email),
  ["user-dashboard-data"],
  { revalidate: 60, tags: [USER_DASHBOARD_TAG] }
);
