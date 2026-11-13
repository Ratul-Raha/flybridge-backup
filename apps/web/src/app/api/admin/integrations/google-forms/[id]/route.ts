import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { GoogleFormIntegration } from "@/lib/models/google-form-integration";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();
    const integration = await GoogleFormIntegration.findById(params.id);
    if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 });

    if (typeof body.name === "string" && body.name.trim()) {
      integration.name = body.name.trim().slice(0, 120);
    }
    if (typeof body.formId === "string") {
      integration.formId = body.formId.trim().slice(0, 200) || undefined;
    }
    if (typeof body.emailField === "string") {
      integration.emailField = body.emailField.trim().slice(0, 120);
    }
    if (typeof body.enabled === "boolean") {
      integration.enabled = body.enabled;
    }
    if (Array.isArray(body.fieldMap)) {
      const mapped = body.fieldMap
        .map((f) => {
          const source = typeof (f as { source?: unknown }).source === "string" ? (f as { source: string }).source : "";
          const target = typeof (f as { target?: unknown }).target === "string" ? (f as { target: string }).target : "";
          return { source: source.trim().slice(0, 200), target: target.trim().slice(0, 60) };
        })
        .filter((f) => f.source && f.target);
      integration.set("fieldMap", mapped);
    }
    await integration.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/integrations/google-forms PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const integration = await GoogleFormIntegration.findById(params.id);
    if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    await integration.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/integrations/google-forms DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
