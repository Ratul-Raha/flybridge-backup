import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { LeadList } from "@/lib/models/lead-list";
import { Lead } from "@/lib/models/lead";
import { LeadField } from "@/lib/models/lead-field";
import { generateLeadFormSlug, resolveLeadList } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const lists = await LeadList.find().sort({ isDefault: -1, name: 1 });

    // Lists created before public forms existed get a slug on first load.
    for (const list of lists) {
      if (!list.formSlug) {
        list.formSlug = await generateLeadFormSlug(list.name);
        await list.save();
      }
    }

    // Fields created before per-list scoping belonged to every list. Attach
    // them to the default list so existing custom values keep a home.
    const defaultListId = await resolveLeadList();
    if (defaultListId) {
      await LeadField.updateMany(
        { $or: [{ list: null }, { list: { $exists: false } }] },
        { $set: { list: defaultListId } }
      );
    }

    const counts = await Lead.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: "$list", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c._id) countMap.set(String(c._id), c.count);
    }
    return NextResponse.json({
      lists: lists.map((l) => ({
        id: l._id.toString(),
        name: l.name,
        description: l.description ?? "",
        isDefault: Boolean(l.isDefault),
        formSlug: l.formSlug ?? "",
        formEnabled: l.formEnabled !== false,
        leadCount: countMap.get(l._id.toString()) ?? 0,
      })),
    });
  } catch (error) {
    console.error("admin/lead-lists GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name) return NextResponse.json({ error: "A list name is required" }, { status: 400 });

    const description = typeof body.description === "string" ? body.description.trim().slice(0, 300) : "";

    const existing = await LeadList.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    if (existing) {
      return NextResponse.json({ error: "A list with that name already exists" }, { status: 409 });
    }

    const list = await LeadList.create({
      name,
      description,
      isDefault: false,
      formSlug: await generateLeadFormSlug(name),
      formEnabled: true,
    });

    return NextResponse.json(
      {
        list: {
          id: list._id.toString(),
          name: list.name,
          description: list.description ?? "",
          isDefault: false,
          formSlug: list.formSlug ?? "",
          formEnabled: list.formEnabled !== false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "A list with that name already exists" }, { status: 409 });
    }
    console.error("admin/lead-lists POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
