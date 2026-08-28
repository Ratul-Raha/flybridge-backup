import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { SuccessStory, type SuccessStoryDoc } from "@/lib/models/success-story";

type StoryDto = {
  id: string;
  name: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  visaType: "student" | "work";
  universityName: string;
  cityName: string;
  story: string;
  imageUrl: string;
  active: boolean;
  createdAt: Date;
};

function toDto(s: SuccessStoryDoc): StoryDto {
  return {
    id: s._id.toString(),
    name: s.name,
    origin: s.origin ?? "",
    originCode: s.originCode ?? "",
    destination: s.destination ?? "",
    destinationCode: s.destinationCode ?? "",
    visaType: s.visaType,
    universityName: s.universityName ?? "",
    cityName: s.cityName ?? "",
    story: s.story ?? "",
    imageUrl: s.imageUrl ?? "",
    active: s.active ?? true,
    createdAt: s.createdAt,
  };
}

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

function invalidId(id: string) {
  return !/^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  try {
    const session = await readSession();
    await connectDb();

    if (all) {
      if (!isManager(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const stories = await SuccessStory.find().sort({ createdAt: -1 });
      return NextResponse.json({ stories: stories.map(toDto) });
    }

    const stories = await SuccessStory.find({ active: true }).sort({ createdAt: -1 });
    return NextResponse.json({ stories: stories.map(toDto) });
  } catch (error) {
    console.error("success-stories GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!body.imageUrl) return NextResponse.json({ error: "An image must be uploaded" }, { status: 400 });

    const visaType = body.visaType === "work" ? "work" : "student";

    const story = await SuccessStory.create({
      name,
      origin: typeof body.origin === "string" ? body.origin.trim() : "",
      originCode: typeof body.originCode === "string" ? body.originCode.trim().toUpperCase() : "",
      destination: typeof body.destination === "string" ? body.destination.trim() : "",
      destinationCode:
        typeof body.destinationCode === "string" ? body.destinationCode.trim().toUpperCase() : "",
      visaType,
      universityName:
        visaType === "student" && typeof body.universityName === "string"
          ? body.universityName.trim()
          : "",
      cityName:
        visaType === "work" && typeof body.cityName === "string" ? body.cityName.trim() : "",
      story: typeof body.story === "string" ? body.story.trim() : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      imagePublicId: typeof body.imagePublicId === "string" ? body.imagePublicId.trim() || undefined : undefined,
      active: body.active !== false,
      createdBy: session!.userId,
    });

    return NextResponse.json({ story: toDto(story as SuccessStoryDoc) }, { status: 201 });
  } catch (error) {
    console.error("success-stories POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
