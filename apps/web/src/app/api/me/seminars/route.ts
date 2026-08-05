import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { SeminarRegistration, type SeminarDoc } from "@/lib/models/seminar";

export async function GET() {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();

    const registrations = await SeminarRegistration.find({
      $or: [{ user: session.userId }, { email: session.email.toLowerCase() }],
    })
      .sort({ createdAt: -1 })
      .populate<{ seminar: SeminarDoc }>("seminar");

    return NextResponse.json({
      seminars: registrations
        .filter((r) => r.seminar)
        .map((r) => ({
          id: r.seminar._id.toString(),
          title: r.seminar.title,
          description: r.seminar.description ?? null,
          dateTime: r.seminar.dateTime,
          image: r.seminar.image ?? null,
          type: r.seminar.type,
          price: r.seminar.price,
          url: r.seminar.url ?? null,
          duration: r.seminar.duration ?? null,
          registeredAt: r.createdAt,
        })),
    });
  } catch (error) {
    console.error("my seminars GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
