import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Lead, LEAD_PRIORITIES, type LeadPriority } from "@/lib/models/lead";
import { LeadField } from "@/lib/models/lead-field";
import { parseCsv } from "@/lib/csv";
import { isLeadSource, resolveLeadList, sanitizeCustomFields } from "@/lib/leads";

const NAME_KEYS = ["name", "full name", "fullname", "first name", "contact name", "lead name"];
const EMAIL_KEYS = ["email", "e-mail", "email address", "mail"];
const PHONE_KEYS = ["phone", "mobile", "phone number", "contact", "mobile number"];
const SOURCE_KEYS = ["source"];
const PRIORITY_KEYS = ["priority"];

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const csv = typeof body.csv === "string" ? body.csv : "";
    const rows = parseCsv(csv);
    if (!rows) {
      return NextResponse.json({ error: "No valid CSV rows found" }, { status: 400 });
    }
    if (rows.length > 5000) {
      return NextResponse.json({ error: "Import is limited to 5,000 rows at a time" }, { status: 400 });
    }

    await connectDb();

    const listId = await resolveLeadList(
      typeof body.listId === "string" ? body.listId : null
    );

    const fieldDocs = await LeadField.find({ isActive: true }).lean();
    const knownCustomNames = new Set(fieldDocs.map((f) => f.name.toLowerCase()));

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const name = pick(row, NAME_KEYS);
      const email = pick(row, EMAIL_KEYS).toLowerCase();
      const phone = pick(row, PHONE_KEYS);
      const sourceRaw = pick(row, SOURCE_KEYS);
      const priorityRaw = pick(row, PRIORITY_KEYS).toLowerCase();

      if (!name && !email && !phone) {
        skipped++;
        continue;
      }
      if (email && (await Lead.exists({ email }))) {
        skipped++;
        continue;
      }

      const customFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        const lower = key.toLowerCase();
        if (NAME_KEYS.includes(lower) || EMAIL_KEYS.includes(lower) || PHONE_KEYS.includes(lower) || SOURCE_KEYS.includes(lower) || PRIORITY_KEYS.includes(lower)) {
          continue;
        }
        if (value.trim()) customFields[key] = value;
      }

      const priority: LeadPriority = (LEAD_PRIORITIES as readonly string[]).includes(priorityRaw)
        ? (priorityRaw as LeadPriority)
        : "medium";

      try {
        await Lead.create({
          list: listId,
          name: name || email.split("@")[0] || "Lead",
          email: email || undefined,
          phone: phone || undefined,
          status: "new",
          source: isLeadSource(sourceRaw) ? sourceRaw : "manual",
          priority,
          customFields: sanitizeCustomFields(customFields),
          lastActivityAt: new Date(),
        });
        created++;
      } catch (e) {
        if ((e as { code?: number })?.code === 11000) {
          skipped++;
        } else {
          errors.push(`Row for "${name || email || phone}" failed`);
        }
      }
    }

    return NextResponse.json({ ok: true, created, skipped, errors });
  } catch (error) {
    console.error("admin/leads/import error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
