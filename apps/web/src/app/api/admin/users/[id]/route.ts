import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ReadinessRun } from "@/lib/models/readiness-run";
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

    const [registrations, downloads, readiness] = await Promise.all([
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
      ReadinessRun.find({ user: user._id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

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
        totalSeminars: registrations.length,
        totalDownloads: downloads.length,
        totalReadiness: readiness.length,
      },
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
