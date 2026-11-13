import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { GoogleFormIntegration } from "@/lib/models/google-form-integration";

export const dynamic = "force-dynamic";

function serializeIntegration(i: {
  _id: { toString(): string };
  name: string;
  key: string;
  formId?: string | null;
  fieldMap?: { source?: string | null; target?: string | null }[];
  emailField?: string | null;
  enabled?: boolean;
  submissionCount?: number;
  lastSubmissionAt?: Date | null;
  createdAt?: Date | null;
}) {
  return {
    id: i._id.toString(),
    name: i.name,
    key: i.key,
    formId: i.formId ?? "",
    fieldMap: (i.fieldMap ?? []).map((f) => ({ source: f.source ?? "", target: f.target ?? "" })),
    emailField: i.emailField ?? "",
    enabled: Boolean(i.enabled),
    submissionCount: i.submissionCount ?? 0,
    lastSubmissionAt: i.lastSubmissionAt ?? null,
    createdAt: i.createdAt ?? null,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const integrations = await GoogleFormIntegration.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ integrations: integrations.map((i) => serializeIntegration(i as never)) });
  } catch (error) {
    console.error("admin/integrations/google-forms GET error", error);
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
    if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });

    const key = randomBytes(24).toString("hex");
    const integration = await GoogleFormIntegration.create({
      name,
      key,
      formId: typeof body.formId === "string" ? body.formId.trim().slice(0, 200) : undefined,
      fieldMap: [],
      emailField: "",
      enabled: true,
      createdBy: session.userId ?? null,
    });

    return NextResponse.json({ integration: serializeIntegration(integration as never) }, { status: 201 });
  } catch (error) {
    console.error("admin/integrations/google-forms POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
