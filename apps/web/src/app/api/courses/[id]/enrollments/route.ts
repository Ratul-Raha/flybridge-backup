import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { CourseProgress } from "@/lib/models/course-progress";

type PopulatedUser = {
  _id: unknown;
  name?: string;
  email?: string;
  avatar?: string | null;
  phone?: string | null;
  subscription?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const course = await Course.findById(params.id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const [enrollments, progressDocs] = await Promise.all([
      CourseEnrollment.find({ course: course._id })
        .sort({ createdAt: -1 })
        .populate("user", "name email avatar phone subscription"),
      CourseProgress.find({ course: course._id }).lean(),
    ]);

    const progressByUser = new Map(
      progressDocs.map((p) => [String(p.user), p])
    );

    const members = enrollments.map((e) => {
      const u = (e.user ?? null) as PopulatedUser | null;
      const userId = u?._id ? String(u._id) : "";
      const p = userId ? progressByUser.get(userId) : undefined;
      const progress = p?.overallPercentage ?? 0;
      const completed = Boolean(p && (p.passed || progress >= 100));
      return {
        id: e._id.toString(),
        userId,
        name: u?.name ?? "Unknown member",
        email: u?.email ?? "—",
        phone: u?.phone ?? null,
        avatar: u?.avatar ?? null,
        subscription: u?.subscription ?? "free",
        status: e.status ?? "active",
        enrolledAt: e.createdAt,
        progress,
        passed: Boolean(p?.passed),
        certificateIssued: Boolean(p?.certificateIssued),
        completed,
      };
    });

    const total = members.length;
    const active = members.filter((m) => m.status === "active").length;
    const completedCount = members.filter((m) => m.completed).length;
    const certificates = members.filter((m) => m.certificateIssued).length;
    const avgProgress = total
      ? Math.round(members.reduce((sum, m) => sum + m.progress, 0) / total)
      : 0;

    return NextResponse.json({
      course: {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        price: course.price ?? 0,
        currency: course.currency ?? "BDT",
      },
      stats: {
        total,
        active,
        expired: total - active,
        completed: completedCount,
        certificates,
        avgProgress,
      },
      members,
    });
  } catch (error) {
    console.error("course enrollments error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
