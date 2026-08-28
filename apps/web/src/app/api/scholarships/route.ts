import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Scholarship, type ScholarshipDoc } from "@/lib/models/scholarship";
import { emitEvent } from "@/lib/events/emit";

type ScholarshipDto = {
  id: string;
  institution: string;
  rawText: string;
  title: string;
  description: string;
  country: string;
  countryCode: string;
  level: string;
  amount: string;
  deadline: string;
  eligibility: string;
  applyUrl: string;
  imageUrl: string;
  active: boolean;
  createdAt: Date;
};

function toDto(s: ScholarshipDoc): ScholarshipDto {
  return {
    id: s._id.toString(),
    institution: s.institution,
    rawText: s.rawText ?? "",
    title: s.title ?? "",
    description: s.description ?? "",
    country: s.country ?? "",
    countryCode: s.countryCode ?? "",
    level: s.level,
    amount: s.amount ?? "",
    deadline: s.deadline ?? "",
    eligibility: s.eligibility ?? "",
    applyUrl: s.applyUrl ?? "",
    imageUrl: s.imageUrl ?? "",
    active: s.active ?? true,
    createdAt: s.createdAt,
  };
}

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  try {
    const session = await readSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDb();

    if (all) {
      if (!isManager(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const scholarships = await Scholarship.find().sort({ createdAt: -1 });
      return NextResponse.json({ scholarships: scholarships.map(toDto) });
    }

    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50), 1), 100);
    const scholarships = await Scholarship.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    return NextResponse.json({ scholarships: scholarships.map(toDto) });
  } catch (error) {
    console.error("scholarships GET error", error);
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

    const institution = typeof body.institution === "string" ? body.institution.trim() : "";
    const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";
    if (!institution) return NextResponse.json({ error: "Institution name is required" }, { status: 400 });
    if (!rawText) return NextResponse.json({ error: "Scholarship text is required" }, { status: 400 });

    const level = ["any", "undergraduate", "graduate", "postgraduate", "school"].includes(body.level)
      ? body.level
      : "any";

    const scholarship = await Scholarship.create({
      institution,
      rawText,
      title: typeof body.title === "string" ? body.title.trim() || institution : institution,
      description: typeof body.description === "string" ? body.description.trim() : "",
      country: typeof body.country === "string" ? body.country.trim() : "",
      countryCode: typeof body.countryCode === "string" ? body.countryCode.trim().toUpperCase() : "",
      level,
      amount: typeof body.amount === "string" ? body.amount.trim() : "",
      deadline: typeof body.deadline === "string" ? body.deadline.trim() : "",
      eligibility: typeof body.eligibility === "string" ? body.eligibility.trim() : "",
      applyUrl: typeof body.applyUrl === "string" ? body.applyUrl.trim() : "",
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : "",
      imagePublicId: typeof body.imagePublicId === "string" ? body.imagePublicId.trim() || undefined : undefined,
      active: body.active !== false,
      createdBy: session!.userId,
    });

    await emitEvent("scholarship.created", {
      scholarship: {
        id: scholarship._id.toString(),
        institution: scholarship.institution,
        title: scholarship.title ?? scholarship.institution,
        country: scholarship.country ?? null,
        countryCode: scholarship.countryCode ?? null,
        level: scholarship.level,
        amount: scholarship.amount ?? null,
        deadline: scholarship.deadline ?? null,
      },
    });

    return NextResponse.json({ scholarship: toDto(scholarship as ScholarshipDoc) }, { status: 201 });
  } catch (error) {
    console.error("scholarships POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}