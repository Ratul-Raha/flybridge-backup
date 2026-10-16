import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { ResourceComment } from "@/lib/models/resource-comment";

type RouteContext = { params: { id: string; commentId: string } };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!/^[a-f\d]{24}$/i.test(params.commentId)) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await connectDb();

    const resource = await Resource.findById(params.id).select("_id").lean();
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const isManager = session.role === "admin" || session.role === "moderator";
    const filter: Record<string, unknown> = {
      _id: params.commentId,
      resource: resource._id,
    };
    if (!isManager) filter.user = session.userId;

    const deleted = await ResourceComment.findOneAndDelete(filter);
    if (!deleted) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("resource comment DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
