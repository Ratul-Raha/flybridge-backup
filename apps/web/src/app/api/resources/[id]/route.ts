import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { isResourceCategory } from "@/lib/resource-categories";
import { sanitizePrices, cleanPrices } from "@/lib/pricing";
import { deleteMediaRef } from "@/lib/storage";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    const session = await readSession();
    const includeUrl = isManager(session) || resource.access === "public";
    return NextResponse.json({
      resource: {
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description ?? "",
        category: resource.category,
        fileType: resource.fileType,
        fileUrl: includeUrl ? resource.fileUrl : "",
        fileName: includeUrl ? (resource.fileName ?? null) : null,
        fileSize: resource.fileSize ?? 0,
        thumbnail: resource.thumbnail ?? null,
        releaseDate: resource.releaseDate,
        access: resource.access,
        price: resource.price ?? 0,
        prices: cleanPrices(resource.prices),
        featured: resource.featured ?? false,
      },
    });
  } catch (error) {
    console.error("resource GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
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

    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) {
      resource.title = body.title.trim();
    }
    if (typeof body.description === "string") {
      resource.description = body.description.trim();
    }
    if (typeof body.category === "string") {
      const category = body.category.trim();
      if (isResourceCategory(category)) resource.category = category;
    }
    if (typeof body.fileUrl === "string" && body.fileUrl.trim()) {
      resource.fileUrl = body.fileUrl.trim();
    }
    if (typeof body.fileName === "string") {
      resource.fileName = body.fileName.trim() || undefined;
    }
    if (typeof body.fileSize === "number") {
      resource.fileSize = body.fileSize;
    }
    if (typeof body.publicId === "string") {
      resource.publicId = body.publicId.trim() || undefined;
    }
    if (typeof body.thumbnail === "string") {
      resource.thumbnail = body.thumbnail.trim() || undefined;
    }
    if (typeof body.thumbnailPublicId === "string") {
      resource.thumbnailPublicId = body.thumbnailPublicId.trim() || undefined;
    }
    if (typeof body.fileType === "string") {
      resource.fileType = body.fileType;
    }
    if (body.releaseDate) {
      const releaseDate = new Date(body.releaseDate);
      if (!isNaN(releaseDate.getTime())) resource.releaseDate = releaseDate;
    }
    if (body.access === "public" || body.access === "members") {
      resource.access = body.access;
      if (body.access === "members" && typeof body.price === "number") {
        resource.price = Math.max(0, body.price);
      }
      if (body.access === "members") {
        const prices = sanitizePrices(body.prices);
        if (prices) resource.prices = prices;
      }
      if (body.access === "public") {
        resource.price = 0;
        resource.prices = undefined;
      }
    }
    if (typeof body.featured === "boolean") {
      resource.featured = body.featured;
    }

    await resource.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("resources PATCH error", error);
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
    const resource = await Resource.findByIdAndDelete(params.id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (resource.publicId) {
      await deleteMediaRef(resource.publicId, resource.fileType);
    }
    if (resource.thumbnailPublicId) {
      await deleteMediaRef(resource.thumbnailPublicId, "image");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("resources DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
