import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource, type ResourceDoc } from "@/lib/models/resource";
import { ResourceDownload } from "@/lib/models/resource-download";
import { isResourceCategory } from "@/lib/resource-categories";
import { sanitizePrices, cleanPrices } from "@/lib/pricing";
import { emitEvent } from "@/lib/events/emit";

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
  access: "public" | "members";
  price: number;
  prices: { USD?: number; BDT?: number };
  featured: boolean;
  downloadCount: number;
};

function toDto(r: ResourceDoc, includeUrl = false): ResourceDto {
  return {
    id: r._id.toString(),
    title: r.title,
    description: r.description ?? "",
    category: r.category,
    fileType: r.fileType,
    fileUrl: includeUrl ? r.fileUrl : "",
    fileName: includeUrl ? (r.fileName ?? null) : null,
    fileSize: r.fileSize ?? 0,
    thumbnail: r.thumbnail ?? null,
    releaseDate: r.releaseDate,
    access: r.access,
    price: r.price ?? 0,
    prices: cleanPrices(r.prices),
    featured: r.featured ?? false,
    downloadCount: 0,
  };
}

async function withDownloadCounts(resources: ResourceDoc[], includeUrl = false, days?: number): Promise<ResourceDto[]> {
  const match = days && days > 0 ? { createdAt: { $gte: lastNDays(days) } } : {};
  const rows = await ResourceDownload.aggregate<{ _id: string; count: number }>([
    { $match: match },
    { $group: { _id: "$resource", count: { $sum: 1 } } },
  ]);
  const counts = new Map(rows.map((r) => [r._id.toString(), r.count]));
  return resources.map((r) => ({ ...toDto(r, includeUrl), downloadCount: counts.get(r._id.toString()) ?? 0 }));
}

function lastNDays(n: number) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (n - 1));
  return from;
}

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const mine = searchParams.get("mine") === "true";
  const daysParam = Number(searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(Math.trunc(daysParam), 365) : undefined;

  try {
    const session = await readSession();
    await connectDb();

    if (all) {
      if (!isManager(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const resources = await Resource.find().sort({ releaseDate: -1 });
      return NextResponse.json({ resources: await withDownloadCounts(resources, true, days) });
    }

    if (mine) {
      if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const resources = await Resource.find({ access: "members" }).sort({ releaseDate: -1 });
      return NextResponse.json({ resources: await withDownloadCounts(resources, false, days) });
    }

    const resources = await Resource.find().sort({ releaseDate: -1 });
    return NextResponse.json({ resources: await withDownloadCounts(resources, false, days) });
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

    const access = body.access === "members" ? "members" : "public";
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
      thumbnail:
        typeof body.thumbnail === "string" ? body.thumbnail.trim() || undefined : undefined,
      thumbnailPublicId:
        typeof body.thumbnailPublicId === "string"
          ? body.thumbnailPublicId.trim() || undefined
          : undefined,
      releaseDate,
      access,
      price: access === "members" ? Math.max(0, Number(body.price) || 0) : 0,
      prices: access === "members" ? sanitizePrices(body.prices) : undefined,
      featured: body.featured === true,
      createdBy: session!.userId,
    });

    await emitEvent("resource.created", {
      resource: {
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description ?? null,
        category: resource.category,
        fileType: resource.fileType,
        thumbnail: resource.thumbnail ?? null,
        access: resource.access,
        price: resource.price,
      },
      actor: { name: session?.name, email: session?.email, userId: session?.userId },
    });

    return NextResponse.json({ resource: toDto(resource as ResourceDoc) }, { status: 201 });
  } catch (error) {
    console.error("resources POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
