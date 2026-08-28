import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Scholarship, type ScholarshipDoc } from "@/lib/models/scholarship";

type PublicScholarshipDto = {
  id: string;
  institution: string;
  title: string;
  country: string;
  countryCode: string;
  level: string;
  amount: string;
  deadline: string;
  imageUrl: string;
};

function toPublicDto(s: ScholarshipDoc): PublicScholarshipDto {
  return {
    id: s._id.toString(),
    institution: s.institution,
    title: s.title ?? "",
    country: s.country ?? "",
    countryCode: s.countryCode ?? "",
    level: s.level,
    amount: s.amount ?? "",
    deadline: s.deadline ?? "",
    imageUrl: s.imageUrl ?? "",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    await connectDb();

    if (id) {
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }
      const scholarship = await Scholarship.findOne({ _id: id, active: true });
      if (!scholarship) {
        return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
      }
      return NextResponse.json({ scholarship: toPublicDto(scholarship as ScholarshipDoc) });
    }

    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 60), 1), 120);
    const scholarships = await Scholarship.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    return NextResponse.json({
      scholarships: scholarships.map(toPublicDto),
      total: scholarships.length,
    });
  } catch (error) {
    console.error("public scholarships GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}