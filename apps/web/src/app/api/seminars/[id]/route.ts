import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { revalidateUserDashboard } from "@/lib/dashboard/tags";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { sanitizePrices } from "@/lib/pricing";
import { emitEvent } from "@/lib/events/emit";

function isManager(
  session: { role: string; userId?: string; name?: string; email?: string } | null,
) {
  return session && (session.role === "admin" || session.role === "moderator");
}

const SEMINAR_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  dateTime: "Date & time",
  image: "Image",
  type: "Type",
  price: "Price",
  prices: "Prices",
  url: "Meeting link",
  duration: "Duration",
};

function eq(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return String(a ?? "") === String(b ?? "");
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const before: Record<string, unknown> = {};
    for (const key of Object.keys(SEMINAR_FIELD_LABELS)) before[key] = seminar.get(key);

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
      if (body.type === "paid") {
        const price = Number(body.price);
        if (!isNaN(price) && price >= 0) {
          seminar.price = price;
        }
        const prices = sanitizePrices(body.prices);
        if (prices) seminar.prices = prices;
      }
      if (body.type === "free") {
        seminar.price = 0;
        seminar.prices = undefined;
      }
    }
    if (typeof body.url === "string") {
      seminar.url = body.url.trim() || undefined;
    }
    if (typeof body.duration === "string") {
      seminar.duration = body.duration.trim() || undefined;
    }

    await seminar.save();
    const changedFields = Object.keys(SEMINAR_FIELD_LABELS)
      .filter((key) => key in body && !eq(before[key], seminar.get(key)))
      .map((key) => SEMINAR_FIELD_LABELS[key]);
    await emitEvent("seminar.updated", {
      seminar: { id: seminar._id.toString(), title: seminar.title },
      actor: { name: session?.name, email: session?.email, userId: session?.userId },
      changedFields,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("seminars PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
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
    revalidateUserDashboard();
    await emitEvent("seminar.deleted", {
      seminar: { id: seminar._id.toString(), title: seminar.title },
      actor: { name: session?.name, email: session?.email, userId: session?.userId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("seminars DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
