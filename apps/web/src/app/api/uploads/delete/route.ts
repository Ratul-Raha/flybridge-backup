import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { destroyAsset } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const publicId = typeof body.publicId === "string" ? body.publicId.trim() : "";
    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }
    await destroyAsset(publicId, typeof body.resourceType === "string" ? body.resourceType : undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("uploads delete error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
