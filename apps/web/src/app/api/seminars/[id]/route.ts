import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { reloadKnowledgeBase } from "@/lib/ai/knowledge";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const seminar = await Seminar.findById(params.id);
    if (!seminar) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) {
      seminar.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      seminar.description = body.description.trim();
    }
    if (body.dateTime) {
      const dateTime = new Date(body.dateTime);
      if (!isNaN(dateTime.getTime())) seminar.dateTime = dateTime;
    }
    if (typeof body.image === "string") {
      seminar.image = body.image.trim() || undefined;
    }
    if (body.type === "free" || body.type === "paid") {
      seminar.type = body.type;
      if (body.type === "paid" && typeof body.price === "number") {
        seminar.price = body.price;
      }
      if (body.type === "free") seminar.price = 0;
    }
    if (typeof body.url === "string") {
      seminar.url = body.url.trim() || undefined;
    }
    if (typeof body.duration === "string") {
      seminar.duration = body.duration.trim() || undefined;
    }

    await seminar.save();
    reloadKnowledgeBase().catch((e) => console.error("knowledge base reload error", e));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("seminars PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const seminar = await Seminar.findByIdAndDelete(params.id);
    if (!seminar) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }
    await SeminarRegistration.deleteMany({ seminar: seminar._id });
    reloadKnowledgeBase().catch((e) => console.error("knowledge base reload error", e));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("seminars DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}