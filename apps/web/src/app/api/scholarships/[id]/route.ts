import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Scholarship } from "@/lib/models/scholarship";

const LEVELS = ["any", "undergraduate", "graduate", "postgraduate", "school"];

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

    const scholarship = await Scholarship.findById(params.id);
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }

    if (typeof body.institution === "string" && body.institution.trim()) {
      scholarship.institution = body.institution.trim();
    }
    if (typeof body.rawText === "string" && body.rawText.trim()) {
      scholarship.rawText = body.rawText.trim();
    }
    if (typeof body.title === "string") {
      const trimmed = body.title.trim();
      scholarship.title = trimmed || scholarship.institution;
    }
    if (typeof body.description === "string") {
      scholarship.description = body.description.trim();
    }
    if (typeof body.country === "string") {
      scholarship.country = body.country.trim();
    }
    if (typeof body.countryCode === "string") {
      scholarship.countryCode = body.countryCode.trim().toUpperCase();
    }
    if (LEVELS.includes(body.level)) {
      scholarship.level = body.level;
    }
    if (typeof body.amount === "string") {
      scholarship.amount = body.amount.trim();
    }
    if (typeof body.deadline === "string") {
      scholarship.deadline = body.deadline.trim();
    }
    if (typeof body.eligibility === "string") {
      scholarship.eligibility = body.eligibility.trim();
    }
    if (typeof body.applyUrl === "string") {
      scholarship.applyUrl = body.applyUrl.trim();
    }
    if (typeof body.imageUrl === "string") {
      scholarship.imageUrl = body.imageUrl.trim();
    }
    if (typeof body.imagePublicId === "string") {
      scholarship.imagePublicId = body.imagePublicId.trim() || undefined;
    }
    if (typeof body.active === "boolean") {
      scholarship.active = body.active;
    }

    await scholarship.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("scholarships PATCH error", error);
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
    const scholarship = await Scholarship.findByIdAndDelete(params.id);
    if (!scholarship) {
      return NextResponse.json({ error: "Scholarship not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("scholarships DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}