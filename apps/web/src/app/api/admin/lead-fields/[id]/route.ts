import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { LeadField, LEAD_FIELD_TYPES } from "@/lib/models/lead-field";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();
    const field = await LeadField.findById(params.id);
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

    if (typeof body.label === "string" && body.label.trim()) field.label = body.label.trim().slice(0, 120);
    if (typeof body.placeholder === "string") field.placeholder = body.placeholder.trim().slice(0, 200);
    if (typeof body.type === "string" && (LEAD_FIELD_TYPES as readonly string[]).includes(body.type)) {
      field.type = body.type as never;
    }
    if (typeof body.isRequired === "boolean") field.isRequired = body.isRequired;
    if (typeof body.isActive === "boolean") field.isActive = body.isActive;
    if (Array.isArray(body.options) && field.type === "select") {
      const mapped = body.options
        .map((o) => {
          const v = typeof (o as { value?: unknown }).value === "string" ? ((o as { value: string }).value) : "";
          const l = typeof (o as { label?: unknown }).label === "string" ? ((o as { label: string }).label) : v;
          return { value: v.trim(), label: l.trim() || v.trim() };
        })
        .filter((o) => o.value);
      field.set("options", mapped);
    }
    await field.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/lead-fields PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const field = await LeadField.findById(params.id);
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });
    await field.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/lead-fields DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
