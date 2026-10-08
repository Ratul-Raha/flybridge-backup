import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Resource } from "@/lib/models/resource";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    const resource = await Resource.findByIdAndUpdate(
      params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).select("viewCount");
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    return NextResponse.json({ viewCount: resource.viewCount ?? 1 });
  } catch (error) {
    console.error("resource view POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
