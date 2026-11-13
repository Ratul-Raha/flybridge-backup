import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { LeadField, LEAD_FIELD_TYPES } from "@/lib/models/lead-field";

export const dynamic = "force-dynamic";

function serializeField(f: {
  _id: { toString(): string };
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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const fields = await LeadField.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
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

    const name = typeof body.name === "string" ? body.name.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 60) : "";
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 120) : "";
    if (!name || !label) return NextResponse.json({ error: "Field name and label are required" }, { status: 400 });

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

    if (await LeadField.exists({ name })) {
      return NextResponse.json({ error: "A field with that name already exists" }, { status: 409 });
    }

    const count = await LeadField.countDocuments();
    const field = await LeadField.create({
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
