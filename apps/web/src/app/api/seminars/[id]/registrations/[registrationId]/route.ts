import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { SeminarRegistration } from "@/lib/models/seminar";
import { Notification } from "@/lib/models/notification";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; registrationId: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const registration = await SeminarRegistration.findOneAndDelete({
      _id: params.registrationId,
      seminar: params.id,
    });

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    await Notification.deleteMany({ registration: registration._id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("registration delete error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}