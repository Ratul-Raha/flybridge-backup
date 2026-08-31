import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { Notification } from "@/lib/models/notification";
import { CourseProgress } from "@/lib/models/course-progress";
import { ACCOUNT_TYPES, SUBSCRIPTION_TYPES } from "@/lib/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const user = await User.findById(params.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [enrollments, registrations, downloads, readiness, certs, counts] =
      await Promise.all([
        CourseEnrollment.find({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate("course", "title slug image badge price currency")
          .lean(),
        SeminarRegistration.find({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate("seminar", "title dateTime type price")
          .lean(),
        ResourceDownload.find({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate("resource", "title fileType fileUrl")
          .lean(),
        ReadinessRun.find({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        CourseProgress.find({ user: user._id })
          .sort({ certificateDownloadedAt: -1 })
          .limit(100)
          .populate("course", "title slug image")
          .lean(),
        Promise.all([
          CourseEnrollment.countDocuments({ user: user._id }),
          SeminarRegistration.countDocuments({ user: user._id }),
          ResourceDownload.countDocuments({ user: user._id }),
          ReadinessRun.countDocuments({ user: user._id }),
          CourseProgress.countDocuments({ user: user._id }),
        ]),
      ]);

    const [
      totalCourses,
      totalSeminars,
      totalDownloads,
      totalReadiness,
      totalCertificates,
    ] = counts;

    const certificateDownloaded =
      certs.find((c) => (c.certificateDownloadCount ?? 0) > 0) != null;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        avatar: user.avatar ?? null,
        accountType: user.accountType,
        subscription: user.subscription,
        createdAt: user.createdAt,
      },
      stats: {
        totalCourses,
        totalSeminars,
        totalDownloads,
        totalReadiness,
        totalCertificates,
        certificateDownloaded,
        latestReadinessScore: readiness[0]?.score ?? null,
      },
      certificates: certs.map((c) => {
        const course = c.course as
          | { _id: { toString(): string }; title?: string; slug?: string; image?: string }
          | null;
        return {
          id: c._id.toString(),
          course: course
            ? {
                id: course._id.toString(),
                title: course.title ?? "Unknown course",
                slug: course.slug ?? "",
                image: course.image ?? null,
              }
            : null,
          issued: Boolean(c.certificateIssued),
          downloadedAt: c.certificateDownloadedAt ?? null,
          downloadCount: c.certificateDownloadCount ?? 0,
        };
      }),
      courses: enrollments.map((e) => ({
        id: e._id.toString(),
        course: e.course
          ? {
              id: (e.course as { _id: { toString(): string } })._id.toString(),
              title: (e.course as { title?: string }).title,
              slug: (e.course as { slug?: string }).slug,
              image: (e.course as { image?: string }).image ?? null,
              badge: (e.course as { badge?: string }).badge ?? "",
              price: (e.course as { price?: number }).price ?? 0,
              currency: (e.course as { currency?: string }).currency ?? "USD",
            }
          : null,
        status: e.status,
        createdAt: e.createdAt,
      })),
      seminars: registrations.map((r) => ({
        id: r._id.toString(),
        seminar: r.seminar
          ? {
              id: (r.seminar as { _id: { toString(): string } })._id.toString(),
              title: (r.seminar as { title?: string }).title,
              dateTime: (r.seminar as { dateTime?: Date }).dateTime,
              type: (r.seminar as { type?: string }).type,
              price: (r.seminar as { price?: number }).price,
            }
          : null,
        createdAt: r.createdAt,
      })),
      downloads: downloads.map((d) => ({
        id: d._id.toString(),
        resource: d.resource
          ? {
              id: (d.resource as { _id: { toString(): string } })._id.toString(),
              title: (d.resource as { title?: string }).title,
              fileType: (d.resource as { fileType?: string }).fileType,
              fileUrl: (d.resource as { fileUrl?: string }).fileUrl,
            }
          : null,
        createdAt: d.createdAt,
      })),
      readiness: readiness.map((r) => ({
        id: r._id.toString(),
        score: r.score,
        label: r.label ?? "",
        country: r.country ?? "",
        degreeLevel: r.degreeLevel ?? "",
        createdAt: r.createdAt,
        categories:
          ((r.result as { categories?: { id: string; label?: string; pct?: number }[] } | null)
            ?.categories ?? []).map((c) => ({
              id: c.id,
              label: c.label ?? "",
              pct: c.pct ?? 0,
            })),
      })),
    });
  } catch (error) {
    console.error("admin/users/[id] error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.subscription && SUBSCRIPTION_TYPES.includes(body.subscription)) {
      user.subscription = body.subscription;
    }
    if (body.accountType && ACCOUNT_TYPES.includes(body.accountType)) {
      user.accountType = body.accountType;
    }

    await user.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/users PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (session.userId && user._id.toString() === session.userId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const userId = user._id;
    await Promise.all([
      CourseEnrollment.deleteMany({ user: userId }),
      SeminarRegistration.deleteMany({ user: userId }),
      ResourceDownload.deleteMany({ user: userId }),
      ReadinessRun.deleteMany({ user: userId }),
      Notification.deleteMany({ recipient: userId }),
      CourseProgress.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/users DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
