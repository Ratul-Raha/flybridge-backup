import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";

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
    const seminar = await Seminar.findById(params.id);
    if (!seminar) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    const registrations = await SeminarRegistration.find({
      seminar: seminar._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      seminar: {
        id: seminar._id.toString(),
        title: seminar.title,
        dateTime: seminar.dateTime,
      },
      registrations: registrations.map((r) => ({
        id: r._id.toString(),
        name: r.name,
        phone: r.phone ?? null,
        email: r.email,
        registeredAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("seminar registrations error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}