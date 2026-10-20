import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { deleteMediaRef } from "@/lib/storage";

const MAX_RESOURCES = 500;

type BulkAction = "publish" | "unpublish" | "delete" | "public" | "members";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const rawIds: unknown = body.resourceIds;
    if (!Array.isArray(rawIds)) {
      return NextResponse.json({ error: "resourceIds must be an array" }, { status: 400 });
    }

    const resourceIds = Array.from(
      new Set(
        rawIds
          .filter((id): id is string => typeof id === "string")
          .filter((id) => Types.ObjectId.isValid(id))
      )
    ).slice(0, MAX_RESOURCES);

    if (resourceIds.length === 0) {
      return NextResponse.json({ error: "No valid resources selected" }, { status: 400 });
    }

    const action = body.action as BulkAction;
    if (!["publish", "unpublish", "delete", "public", "members"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDb();

    if (action === "delete") {
      const resources = await Resource.find({ _id: { $in: resourceIds } });
      const foundIds = resources.map((r) => r._id);
      if (foundIds.length > 0) {
        await Resource.deleteMany({ _id: { $in: foundIds } });
        await Promise.all(
          resources.flatMap((r) => {
            const jobs: Promise<unknown>[] = [];
            if (r.publicId) jobs.push(deleteMediaRef(r.publicId, r.fileType));
            if (r.thumbnailPublicId) jobs.push(deleteMediaRef(r.thumbnailPublicId, "image"));
            return jobs;
          })
        );
      }
      return NextResponse.json({ ok: true, deleted: foundIds.length });
    }

    if (action === "public" || action === "members") {
      const update =
        action === "public"
          ? { $set: { access: "public" as const, price: 0 }, $unset: { prices: "" } }
          : { $set: { access: "members" as const } };
      const result = await Resource.updateMany({ _id: { $in: resourceIds } }, update);
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    const published = action === "publish";
    const result = await Resource.updateMany(
      { _id: { $in: resourceIds } },
      { $set: { published, publishedAt: published ? new Date() : null } }
    );

    return NextResponse.json({ ok: true, updated: result.modifiedCount });
  } catch (error) {
    console.error("resources bulk POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
