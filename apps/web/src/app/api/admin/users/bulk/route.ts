import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { CourseEnrollment } from "@/lib/models/enrollment";
import { SeminarRegistration } from "@/lib/models/seminar";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ReadinessRun } from "@/lib/models/readiness-run";
import { CourseProgress } from "@/lib/models/course-progress";
import { Notification } from "@/lib/models/notification";
import { ACCOUNT_TYPES, SUBSCRIPTION_TYPES } from "@/lib/roles";

const MAX_USERS = 1000;

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const userIds: unknown = body?.userIds;
    const action: unknown = body?.action;

    if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > MAX_USERS) {
      return NextResponse.json({ error: `Select between 1 and ${MAX_USERS} users` }, { status: 400 });
    }
    if (action !== "subscription" && action !== "accountType" && action !== "delete") {
      return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
    }

    await connectDb();
    const ids = [...new Set(userIds.map(String))];

    if (action === "subscription") {
      const value = body?.value;
      if (typeof value !== "string" || !(SUBSCRIPTION_TYPES as readonly string[]).includes(value)) {
        return NextResponse.json({ error: "Invalid subscription value" }, { status: 400 });
      }
      const result = await User.updateMany({ _id: { $in: ids } }, { $set: { subscription: value } });
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    if (action === "accountType") {
      const value = body?.value;
      if (typeof value !== "string" || !(ACCOUNT_TYPES as readonly string[]).includes(value)) {
        return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
      }
      const result = await User.updateMany({ _id: { $in: ids } }, { $set: { accountType: value } });
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    // delete
    const safeIds = ids.filter((id) => id !== session.userId);
    if (safeIds.length === 0) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }
    await Promise.all([
      CourseEnrollment.deleteMany({ user: { $in: safeIds } }),
      SeminarRegistration.deleteMany({ user: { $in: safeIds } }),
      ResourceDownload.deleteMany({ user: { $in: safeIds } }),
      ReadinessRun.deleteMany({ user: { $in: safeIds } }),
      CourseProgress.deleteMany({ user: { $in: safeIds } }),
      Notification.deleteMany({ recipient: { $in: safeIds } }),
      User.deleteMany({ _id: { $in: safeIds } }),
    ]);
    return NextResponse.json({ ok: true, deleted: safeIds.length });
  } catch (error) {
    console.error("admin/users/bulk error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}