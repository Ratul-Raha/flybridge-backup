import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const seminar = await Seminar.findById(params.id);
    if (!seminar) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    const registration = await SeminarRegistration.findOne({
      seminar: seminar._id,
      $or: [{ user: session.userId }, { email: session.email.toLowerCase() }],
    });

    if (!registration) {
      return NextResponse.json(
        { error: "You are not registered for this seminar" },
        { status: 403 }
      );
    }

    const registrations = await SeminarRegistration.countDocuments({
      seminar: seminar._id,
    });

    return NextResponse.json({
      seminar: {
        id: seminar._id.toString(),
        title: seminar.title,
        description: seminar.description ?? null,
        dateTime: seminar.dateTime,
        image: seminar.image ?? null,
        type: seminar.type,
        price: seminar.price,
        url: seminar.url ?? null,
        duration: seminar.duration ?? null,
        registrations,
      },
      registration: {
        id: registration._id.toString(),
        name: registration.name,
        phone: registration.phone ?? null,
        email: registration.email,
        registeredAt: registration.createdAt,
      },
    });
  } catch (error) {
    console.error("my seminar detail GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}