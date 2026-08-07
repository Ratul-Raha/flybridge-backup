import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Notification } from "@/lib/models/notification";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const notification = await Notification.findOne({
      _id: params.id,
      recipient: session.userId,
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({ ok: true, id: notification._id.toString() });
  } catch (error) {
    console.error("notification mark read error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}