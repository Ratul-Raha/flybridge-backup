import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { emailTemplateById } from "@/lib/automation/email-templates";
import {
  resolveEmailTemplate,
  saveEmailTemplateOverride,
  resetEmailTemplateOverride,
} from "@/lib/automation/email-template-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!emailTemplateById(params.id)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  try {
    const resolved = await resolveEmailTemplate(params.id);
    return NextResponse.json(resolved ?? { subject: "", body: "" });
  } catch (error) {
    console.error("email-template GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const raw = await request.json();
    const subject = typeof raw?.subject === "string" ? raw.subject : "";
    const body = typeof raw?.body === "string" ? raw.body : "";
    const result = await saveEmailTemplateOverride(params.id, { subject, body }, session.userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Save failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("email-template PUT error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await resetEmailTemplateOverride(params.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Reset failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("email-template DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}