import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { emitEvent } from "@/lib/events/emit";

async function withCounts(seminars: SeminarDocLike[], includeUrl = false) {
  const counts = await SeminarRegistration.aggregate([
    { $group: { _id: "$seminar", count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return seminars.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    description: s.description,
    dateTime: s.dateTime,
    image: s.image ?? null,
    type: s.type,
    price: s.price,
    url: includeUrl ? (s.url ?? null) : null,
    duration: s.duration ?? null,
    registrations: map.get(s._id.toString()) ?? 0,
  }));
}

type SeminarDocLike = {
  _id: { toString(): string };
  title: string;
  description?: string;
  dateTime: Date;
  image?: string | null;
  type: string;
  price?: number;
  url?: string | null;
  duration?: string | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  try {
    await connectDb();

    let session = null;
    if (all) {
      session = await readSession();
      if (!session || (session.role !== "admin" && session.role !== "moderator")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const query = all ? {} : {};
    const seminars = await Seminar.find(query).sort({ dateTime: -1 });
    return NextResponse.json({
      seminars: await withCounts(seminars as SeminarDocLike[], all),
    });
  } catch (error) {
    console.error("seminars GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const dateTime = body.dateTime ? new Date(body.dateTime) : null;
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!dateTime || isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: "A valid date/time is required" }, { status: 400 });
    }

    const type = body.type === "paid" ? "paid" : "free";

    const seminar = await Seminar.create({
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      dateTime,
      image: typeof body.image === "string" ? body.image.trim() || undefined : undefined,
      type,
      price: type === "paid" ? Number(body.price) || 0 : 0,
      url: typeof body.url === "string" ? body.url.trim() || undefined : undefined,
      duration: typeof body.duration === "string" ? body.duration.trim() || undefined : undefined,
      createdBy: session.userId,
    });

    await emitEvent("seminar.created", {
      seminar: {
        id: seminar._id.toString(),
        title: seminar.title,
        description: seminar.description,
        dateTime: seminar.dateTime.toISOString(),
        duration: seminar.duration,
        type: seminar.type,
        price: seminar.price,
        url: seminar.url,
        image: seminar.image,
      },
      actor: { name: session?.name, email: session?.email, userId: session?.userId },
    });

    return NextResponse.json({ seminar: seminar.toObject() }, { status: 201 });
  } catch (error) {
    console.error("seminars POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
