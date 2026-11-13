import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Lead, LEAD_STATUSES, LEAD_PRIORITIES } from "@/lib/models/lead";

const MAX_LEADS = 1000;

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idsRaw: unknown = body.ids;
    const action = body.action;

    if (!Array.isArray(idsRaw) || idsRaw.length === 0 || idsRaw.length > MAX_LEADS) {
      return NextResponse.json({ error: `Select between 1 and ${MAX_LEADS} leads` }, { status: 400 });
    }
    const ids = [...new Set(idsRaw.map(String))].filter((id) => Types.ObjectId.isValid(id));

    if (action !== "status" && action !== "priority" && action !== "owner" && action !== "delete") {
      return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
    }

    await connectDb();
    const match = { _id: { $in: ids } };

    if (action === "status") {
      const value = body.value;
      if (typeof value !== "string" || !(LEAD_STATUSES as readonly string[]).includes(value)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const convertedAt = value === "converted" ? new Date() : null;
      const result = await Lead.updateMany(match, {
        $set: { status: value, convertedAt, lastActivityAt: new Date() },
      });
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    if (action === "priority") {
      const value = body.value;
      if (typeof value !== "string" || !(LEAD_PRIORITIES as readonly string[]).includes(value)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
      const result = await Lead.updateMany(match, {
        $set: { priority: value, lastActivityAt: new Date() },
      });
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    if (action === "owner") {
      const value = body.value;
      let owner: Types.ObjectId | null = null;
      if (value === "me") {
        owner = session.userId ? new Types.ObjectId(session.userId) : null;
      } else if (typeof value === "string" && Types.ObjectId.isValid(value)) {
        owner = new Types.ObjectId(value);
      }
      const result = await Lead.updateMany(match, {
        $set: { owner, lastActivityAt: new Date() },
      });
      return NextResponse.json({ ok: true, updated: result.modifiedCount });
    }

    const result = await Lead.deleteMany(match);
    return NextResponse.json({ ok: true, deleted: result.deletedCount });
  } catch (error) {
    console.error("admin/leads/bulk error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
