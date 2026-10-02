import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";
import { signMediaUrl } from "@/lib/storage";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

/**
 * Returns playable media URLs for a listening test. Uploaded audio is stored as
 * a private `s3://` ref (see /api/uploads/presign), which the browser cannot
 * load directly — so we sign it here, gated exactly like the test itself.
 * Public URLs and YouTube links pass through unchanged.
 */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const manager = isManager(session);

  try {
    await connectDb();
    const test = await MockTest.findById(params.id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    if (!manager) {
      if (test.status !== "published") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const ownership = await resolveMockTestOwnership(session.userId);
      if (!testIsOwned(ownership, test)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [audioUrl, videoUrl] = await Promise.all([
      signMediaUrl(test.content?.audioUrl),
      signMediaUrl(test.content?.videoUrl),
    ]);

    return NextResponse.json({ audioUrl, videoUrl });
  } catch (error) {
    console.error("mock-test media GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
