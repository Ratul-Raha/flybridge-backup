import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest } from "@/lib/models/mock-test";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const rawTestIds: unknown = body?.testIds;
    if (
      !Array.isArray(rawTestIds) ||
      !rawTestIds.every(
        (id): id is string => typeof id === "string" && mongoose.Types.ObjectId.isValid(id),
      )
    ) {
      return NextResponse.json({ error: "A valid ordered test list is required" }, { status: 400 });
    }

    const testIds = rawTestIds.map((id) => id.toLowerCase());
    if (new Set(testIds).size !== testIds.length) {
      return NextResponse.json({ error: "The test list contains duplicates" }, { status: 400 });
    }

    await connectDb();
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }
    const bundle = await MockTestBundle.findById(params.id).select("_id").lean();
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    const currentTests = await MockTest.find({ bundle: bundle._id }).select("_id").lean();
    const currentIds = new Set(currentTests.map((test) => test._id.toString()));
    if (testIds.length !== currentIds.size || testIds.some((testId) => !currentIds.has(testId))) {
      return NextResponse.json(
        { error: "The test list changed. Reload the bundle and try again." },
        { status: 409 },
      );
    }

    if (testIds.length > 0) {
      await MockTest.bulkWrite(
        testIds.map((testId, order) => ({
          updateOne: {
            filter: {
              _id: new mongoose.Types.ObjectId(testId),
              bundle: bundle._id,
            },
            update: { $set: { order } },
          },
        })),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mock-test bundle order PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
