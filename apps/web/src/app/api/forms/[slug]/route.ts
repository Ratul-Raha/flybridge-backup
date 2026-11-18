import { NextRequest, NextResponse } from "next/server";
import { Lead } from "@/lib/models/lead";
import { findLeadListByFormSlug, getActiveFieldsForList, sanitizeCustomFields } from "@/lib/leads";

export const dynamic = "force-dynamic";

function isEmpty(value: unknown): boolean {
  if (typeof value === "boolean") return !value;
  return value === null || value === undefined || String(value).trim() === "";
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    // Silent honeypot: pretend success so bots do not retry.
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true });
    }

    const list = await findLeadListByFormSlug(params.slug);
    if (!list || list.formEnabled === false) {
      return NextResponse.json({ error: "This form is no longer available" }, { status: 404 });
    }

    // Lead creation/update below still needs the DB; the field helper connects
    // lazily, so no explicit connect call is required here.
    const fields = await getActiveFieldsForList(list._id, Boolean(list.isDefault));
    const fieldNames = new Set(fields.map((f) => f.name));

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";

    if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const submittedFields =
      body.customFields && typeof body.customFields === "object" && !Array.isArray(body.customFields)
        ? (body.customFields as Record<string, unknown>)
        : {};

    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(submittedFields)) {
      if (fieldNames.has(key)) filtered[key] = value;
    }
    const customFields = sanitizeCustomFields(filtered);

    for (const field of fields) {
      if (field.isRequired && isEmpty(customFields[field.name])) {
        return NextResponse.json(
          { error: `Please fill in "${field.label}"` },
          { status: 400 }
        );
      }
    }

    const existing = await Lead.findOne({ $or: [{ email }, ...(phone ? [{ phone }] : [])] });

    if (existing) {
      const set: Record<string, unknown> = {
        name,
        email,
        lastActivityAt: new Date(),
        customFields: {
          ...((existing.customFields as Record<string, unknown> | null | undefined) ?? {}),
          ...customFields,
        },
      };
      if (phone) set.phone = phone;
      if (!existing.list) set.list = list._id;
      await Lead.updateOne({ _id: existing._id }, { $set: set });
    } else {
      await Lead.create({
        list: list._id,
        name,
        email,
        phone: phone || undefined,
        status: "new",
        source: "form",
        priority: "medium",
        customFields,
        lastActivityAt: new Date(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      // A concurrent submission created the same lead first.
      return NextResponse.json({ ok: true });
    }
    console.error("public lead form error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
