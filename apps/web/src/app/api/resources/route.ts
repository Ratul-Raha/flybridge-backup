import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource, type ResourceDoc } from "@/lib/models/resource";
import { ResourceDownload } from "@/lib/models/resource-download";
import { ResourceComment } from "@/lib/models/resource-comment";
import { ResourceLove } from "@/lib/models/resource-love";
import { RESOURCE_COUNTS_TAG } from "@/lib/resource-counts";
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
  viewCount: number;
  commentCount: number;
  loveCount: number;
  lovedByMe: boolean;
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
    viewCount: r.viewCount ?? 0,
    commentCount: 0,
    loveCount: 0,
    lovedByMe: false,
  };
}

/**
 * Aggregating downloads/comments/loves scans the whole collection on every
 * listing request. These counts are derived, approximate, and safe to reuse for
 * a short window, so they're cached and invalidated by the write routes.
 */
type ResourceCounts = {
  downloads: Record<string, number>;
  comments: Record<string, number>;
  loves: Record<string, number>;
};

const getResourceCounts = unstable_cache(
  async (days?: number): Promise<ResourceCounts> => {
    await connectDb();
    const match = days && days > 0 ? { createdAt: { $gte: lastNDays(days) } } : {};
    const [downloadRows, commentRows, loveRows] = await Promise.all([
      ResourceDownload.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: "$resource", count: { $sum: 1 } } },
      ]),
      ResourceComment.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$resource", count: { $sum: 1 } } },
      ]),
      ResourceLove.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$resource", count: { $sum: 1 } } },
      ]),
    ]);
    return {
      downloads: Object.fromEntries(
        downloadRows.map((r) => [r._id.toString(), r.count])
      ),
      comments: Object.fromEntries(commentRows.map((r) => [r._id.toString(), r.count])),
      loves: Object.fromEntries(loveRows.map((r) => [r._id.toString(), r.count])),
    };
  },
  ["resource-counts"],
  { revalidate: 60, tags: [RESOURCE_COUNTS_TAG] }
);

async function withDownloadCounts(
  resources: ResourceDoc[],
  includeUrl = false,
  days?: number,
  userId?: string
): Promise<ResourceDto[]> {
  const counts = await getResourceCounts(days);

  let lovedIds = new Set<string>();
  if (userId) {
    const mine = await ResourceLove.find({ user: userId }).select("resource").lean();
    lovedIds = new Set(mine.map((l) => l.resource.toString()));
  }

  return resources.map((r) => {
    const id = r._id.toString();
    return {
      ...toDto(r, includeUrl),
      downloadCount: counts.downloads[id] ?? 0,
      commentCount: counts.comments[id] ?? 0,
      loveCount: counts.loves[id] ?? 0,
      lovedByMe: lovedIds.has(id),
    };
  });
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
      return NextResponse.json({ resources: await withDownloadCounts(resources, true, days, session?.userId) });
    }

    if (mine) {
      if (!session || !session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const resources = await Resource.find({ access: "members" }).sort({ releaseDate: -1 });
      return NextResponse.json({ resources: await withDownloadCounts(resources, false, days, session.userId) });
    }

    const resources = await Resource.find().sort({ releaseDate: -1 });
    return NextResponse.json({ resources: await withDownloadCounts(resources, false, days, session?.userId) });
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
