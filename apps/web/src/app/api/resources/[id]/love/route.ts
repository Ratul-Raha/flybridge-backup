import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { ResourceLove } from "@/lib/models/resource-love";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limited = rateLimit(`resource:love:${clientIp(request)}`, 60, 60_000);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many requests — try again in a minute" }, { status: 429 });
    }

    await connectDb();

    const resource = await Resource.findById(params.id).select("_id").lean();
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const existing = await ResourceLove.findOne({ resource: resource._id, user: session.userId });
    let loved: boolean;
    if (existing) {
      await existing.deleteOne();
      loved = false;
    } else {
      await ResourceLove.create({ resource: resource._id, user: session.userId });
      loved = true;
    }

    const loveCount = await ResourceLove.countDocuments({ resource: resource._id });

    return NextResponse.json({ loved, loveCount });
  } catch (error) {
    console.error("resource love POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
