import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource, type ResourceDoc } from "@/lib/models/resource";
import { isResourceCategory } from "@/lib/resource-categories";

type ResourceDto = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number;
  thumbnail: string | null;
  releaseDate: Date;
  access: "free" | "paid";
  price: number;
  featured: boolean;
};

function toDto(r: ResourceDoc): ResourceDto {
  return {
    id: r._id.toString(),
    title: r.title,
    description: r.description ?? "",
    category: r.category,
    fileType: r.fileType,
    fileUrl: r.fileUrl,
    fileName: r.fileName ?? null,
    fileSize: r.fileSize ?? 0,
    thumbnail: r.thumbnail ?? null,
    releaseDate: r.releaseDate,
    access: r.access,
    price: r.price ?? 0,
    featured: r.featured ?? false,
  };
}

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const mine = searchParams.get("mine") === "true";

  try {
    const session = await readSession();
    await connectDb();

    if (all) {
      if (!isManager(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const resources = await Resource.find().sort({ releaseDate: -1 });
      return NextResponse.json({ resources: resources.map(toDto) });
    }

    if (mine) {
      if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const resources = await Resource.find({ access: "paid" }).sort({ releaseDate: -1 });
      return NextResponse.json({ resources: resources.map(toDto) });
    }

    const resources = await Resource.find().sort({ releaseDate: -1 });
    return NextResponse.json({ resources: resources.map(toDto) });
  } catch (error) {
    console.error("resources GET error", error);
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

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!fileUrl) return NextResponse.json({ error: "A file must be uploaded" }, { status: 400 });
    if (!isResourceCategory(category)) {
      return NextResponse.json({ error: "A valid category is required" }, { status: 400 });
    }

    const access = body.access === "paid" ? "paid" : "free";
    const releaseDate = body.releaseDate ? new Date(body.releaseDate) : new Date();
    if (isNaN(releaseDate.getTime())) {
      return NextResponse.json({ error: "Invalid published date" }, { status: 400 });
    }

    const resource = await Resource.create({
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      category,
      fileType: typeof body.fileType === "string" ? body.fileType : "other",
      fileUrl,
      fileName: typeof body.fileName === "string" ? body.fileName.trim() || undefined : undefined,
      fileSize: Number(body.fileSize) || 0,
      publicId: typeof body.publicId === "string" ? body.publicId.trim() || undefined : undefined,
      thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() || undefined : undefined,
      thumbnailPublicId:
        typeof body.thumbnailPublicId === "string" ? body.thumbnailPublicId.trim() || undefined : undefined,
      releaseDate,
      access,
      price: access === "paid" ? Math.max(0, Number(body.price) || 0) : 0,
      featured: body.featured === true,
      createdBy: session!.userId,
    });

    return NextResponse.json({ resource: toDto(resource as ResourceDoc) }, { status: 201 });
  } catch (error) {
    console.error("resources POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
