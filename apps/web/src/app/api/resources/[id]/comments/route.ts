import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { ResourceComment } from "@/lib/models/resource-comment";
import { RESOURCE_COUNTS_TAG } from "@/lib/resource-counts";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const resource = await Resource.findById(params.id).select("_id").lean();
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const session = await readSession();
    const isManager = session?.role === "admin" || session?.role === "moderator";

    const [comments, total] = await Promise.all([
      ResourceComment.find({ resource: resource._id })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ResourceComment.countDocuments({ resource: resource._id }),
    ]);

    return NextResponse.json({
      comments: comments.map((c) => {
        const u = c.user as any;
        return {
          id: c._id.toString(),
          body: c.body,
          userId: u?._id ? u._id.toString() : null,
          userName: u?.name ?? "Member",
          userAvatar: u?.avatar ?? null,
          canDelete: Boolean(session?.userId) && (isManager || u?._id?.toString() === session!.userId),
          createdAt: c.createdAt,
        };
      }),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("resource comments GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limited = rateLimit(`resource:comment:${clientIp(request)}`, 10, 60_000);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many comments — try again in a minute" }, { status: 429 });
    }

    const body = await request.json();
    const text = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";
    if (!text) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    await connectDb();

    const resource = await Resource.findById(params.id).select("_id").lean();
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const comment = await ResourceComment.create({
      resource: resource._id,
      user: session.userId,
      body: text,
    });

    revalidateTag(RESOURCE_COUNTS_TAG);

    return NextResponse.json(
      { ok: true, created: true, id: comment._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("resource comments POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
