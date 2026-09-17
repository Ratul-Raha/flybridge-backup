import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Course } from "@/lib/models/course";
import { CourseWishlist } from "@/lib/models/wishlist";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; entryId: string } }
) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const key = params.id;
    const isObjectId = Types.ObjectId.isValid(key);
    const course = await Course.findOne(
      isObjectId ? { _id: key } : { slug: key.toLowerCase() }
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const deleted = await CourseWishlist.findOneAndDelete({
      _id: params.entryId,
      course: course._id,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Wishlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("wishlist delete error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}