import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Notification } from "@/lib/models/notification";

export async function GET(request: Request) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 50);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: session.userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: session.userId, read: false }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        seminarId: n.seminar ? n.seminar.toString() : null,
        registrationId: n.registration ? n.registration.toString() : null,
        courseSlug: n.courseSlug ?? null,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("notifications list error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const result = await Notification.updateMany(
      { recipient: session.userId, read: false },
      { $set: { read: true } }
    );
    return NextResponse.json({ ok: true, modified: result.modifiedCount });
  } catch (error) {
    console.error("notifications mark all read error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}