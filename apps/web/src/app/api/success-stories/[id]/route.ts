import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { SuccessStory } from "@/lib/models/success-story";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

function invalidId(id: string) {
  return !/^[0-9a-fA-F]{24}$/.test(id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (invalidId(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const story = await SuccessStory.findById(params.id);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (typeof body.name === "string" && body.name.trim()) {
      story.name = body.name.trim();
    }
    if (typeof body.origin === "string") {
      story.origin = body.origin.trim();
    }
    if (typeof body.originCode === "string") {
      story.originCode = body.originCode.trim().toUpperCase();
    }
    if (typeof body.destination === "string") {
      story.destination = body.destination.trim();
    }
    if (typeof body.destinationCode === "string") {
      story.destinationCode = body.destinationCode.trim().toUpperCase();
    }

    const visaType = body.visaType === "work" ? "work" : body.visaType === "student" ? "student" : null;
    if (visaType) story.visaType = visaType;

    if (typeof body.universityName === "string") {
      story.universityName = story.visaType === "student" ? body.universityName.trim() : "";
    }
    if (typeof body.cityName === "string") {
      story.cityName = story.visaType === "work" ? body.cityName.trim() : "";
    }
    if (typeof body.story === "string") {
      story.story = body.story.trim();
    }
    if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
      story.imageUrl = body.imageUrl.trim();
    }
    if (typeof body.imagePublicId === "string") {
      story.imagePublicId = body.imagePublicId.trim() || undefined;
    }
    if (typeof body.active === "boolean") {
      story.active = body.active;
    }

    await story.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("success-stories PATCH error", error);
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
  if (invalidId(params.id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await connectDb();
    const story = await SuccessStory.findByIdAndDelete(params.id);
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("success-stories DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
