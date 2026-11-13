import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { LeadList } from "@/lib/models/lead-list";
import { Lead } from "@/lib/models/lead";
import { resolveLeadList } from "@/lib/leads";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();
    const list = await LeadList.findById(params.id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    if (typeof body.name === "string" && body.name.trim()) {
      list.name = body.name.trim().slice(0, 120);
    }
    if (typeof body.description === "string") {
      list.description = body.description.trim().slice(0, 300);
    }
    if (typeof body.isDefault === "boolean") {
      if (body.isDefault) {
        await LeadList.updateMany({ _id: { $ne: list._id } }, { $set: { isDefault: false } });
        list.isDefault = true;
      } else {
        list.isDefault = false;
      }
    }
    await list.save();

    return NextResponse.json({
      list: { id: list._id.toString(), name: list.name, description: list.description ?? "", isDefault: Boolean(list.isDefault) },
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "A list with that name already exists" }, { status: 409 });
    }
    console.error("admin/lead-lists PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const list = await LeadList.findById(params.id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    // Reassign leads to the default list before removing.
    const fallback = await resolveLeadList();
    await Lead.updateMany({ list: list._id }, { $set: { list: fallback } });
    await list.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/lead-lists DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
