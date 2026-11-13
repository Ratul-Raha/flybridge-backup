import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { GoogleFormIntegration } from "@/lib/models/google-form-integration";
import { LEAD_PRIORITIES, type LeadPriority } from "@/lib/models/lead";
import { upsertLeadFromSignal } from "@/lib/leads";

export const dynamic = "force-dynamic";

const CORE_TARGETS = new Set(["name", "email", "phone", "source", "priority"]);

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    await connectDb();
    const integration = await GoogleFormIntegration.findOne({ key: params.key }).lean();
    if (!integration || !integration.enabled) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const raw = (body.response ?? body) as Record<string, unknown>;
    const values = new Map<string, string>();
    for (const [k, v] of Object.entries(raw)) {
      const key = k.trim();
      if (Array.isArray(v)) values.set(key, v.map(String).join(", "));
      else if (v !== null && v !== undefined) values.set(key, String(v));
    }

    const fieldMap = (integration.fieldMap ?? []) as { source?: string; target?: string }[];
    const byTarget = new Map<string, string>();
    for (const f of fieldMap) {
      const t = (f.target ?? "").trim().toLowerCase();
      const s = (f.source ?? "").trim();
      if (!t || !s) continue;
      const v = values.get(s);
      if (v) byTarget.set(t, v);
    }

    // Email: explicit mapping wins, then the configured email question, then any email-looking value.
    let email = byTarget.get("email") ?? "";
    if (!email && integration.emailField) email = values.get(integration.emailField) ?? "";
    if (!email) {
      for (const v of values.values()) {
        if (looksLikeEmail(v)) {
          email = v;
          break;
        }
      }
    }

    let name = byTarget.get("name") ?? "";
    if (!name) {
      for (const [k, v] of values.entries()) {
        if (/name/i.test(k)) {
          name = v;
          break;
        }
      }
    }

    const phone = byTarget.get("phone") ?? "";
    const source = byTarget.get("source") ?? "form";

    const customFields: Record<string, unknown> = {};
    for (const [t, v] of byTarget.entries()) {
      if (CORE_TARGETS.has(t)) continue;
      customFields[t] = v;
    }

    const rawPriority = byTarget.get("priority") ?? "";
    const priority: LeadPriority = (LEAD_PRIORITIES as readonly string[]).includes(rawPriority)
      ? (rawPriority as LeadPriority)
      : "medium";

    await upsertLeadFromSignal({
      name: name || null,
      email: email || null,
      phone: phone || null,
      source: "form",
      priority,
      customFields,
    });

    await GoogleFormIntegration.updateOne(
      { _id: integration._id },
      { $inc: { submissionCount: 1 }, $set: { lastSubmissionAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("google-forms webhook error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
