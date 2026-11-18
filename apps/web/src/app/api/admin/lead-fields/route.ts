import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { LeadField, LEAD_FIELD_TYPES } from "@/lib/models/lead-field";
import { resolveLeadList } from "@/lib/leads";

export const dynamic = "force-dynamic";

function serializeField(f: {
  _id: { toString(): string };
  list?: Types.ObjectId | null;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: { value?: string; label?: string }[];
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}) {
  return {
    id: f._id.toString(),
    list: f.list ? f.list.toString() : null,
    name: f.name,
    label: f.label,
    type: f.type,
    placeholder: f.placeholder ?? "",
    options: (f.options ?? []).map((o) => ({ value: o.value ?? "", label: o.label ?? o.value ?? "" })),
    isRequired: Boolean(f.isRequired),
    sortOrder: f.sortOrder ?? 0,
    isActive: Boolean(f.isActive),
  };
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const listId = request.nextUrl.searchParams.get("listId");
    const filter: Record<string, unknown> = {};
    if (listId && Types.ObjectId.isValid(listId)) {
      filter.list = new Types.ObjectId(listId);
    }
    const fields = await LeadField.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({ fields: fields.map((f) => serializeField(f as never)) });
  } catch (error) {
    console.error("admin/lead-fields GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();

    const requestedListId = typeof body.listId === "string" ? body.listId : "";
    const listId = await resolveLeadList(requestedListId || null);
    if (!listId) return NextResponse.json({ error: "A lead list is required" }, { status: 400 });

    const baseName = typeof body.name === "string" ? body.name.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 60) : "";
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 120) : "";
    if (!baseName || !label) return NextResponse.json({ error: "Field name and label are required" }, { status: 400 });

    // Field names stay globally unique because they key a lead's custom values.
    // When the same id is used on another list, derive a suffixed id instead.
    let name = baseName;
    const conflict = await LeadField.findOne({ name }).select("list").lean();
    if (conflict) {
      if (conflict.list && String(conflict.list) === String(listId)) {
        return NextResponse.json({ error: "This list already has a field with that name" }, { status: 409 });
      }
      let suffix = 2;
      do {
        name = `${baseName.slice(0, 56)}_${suffix}`;
        suffix += 1;
      } while (await LeadField.exists({ name }));
    }

    const type = (LEAD_FIELD_TYPES as readonly string[]).includes(String(body.type)) ? String(body.type) : "text";
    const placeholder = typeof body.placeholder === "string" ? body.placeholder.trim().slice(0, 200) : "";
    const isRequired = body.isRequired === true;

    let options: { value: string; label: string }[] = [];
    if (type === "select" && Array.isArray(body.options)) {
      options = body.options
        .map((o) => {
          const v = typeof (o as { value?: unknown }).value === "string" ? ((o as { value: string }).value) : "";
          const l = typeof (o as { label?: unknown }).label === "string" ? ((o as { label: string }).label) : v;
          return { value: v.trim(), label: l.trim() || v.trim() };
        })
        .filter((o) => o.value);
    }

    const count = await LeadField.countDocuments({ list: listId });
    const field = await LeadField.create({
      list: listId,
      name,
      label,
      type: type as never,
      placeholder,
      options,
      isRequired,
      sortOrder: count,
      isActive: true,
    });

    return NextResponse.json({ field: serializeField(field as never) }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "A field with that name already exists" }, { status: 409 });
    }
    console.error("admin/lead-fields POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
