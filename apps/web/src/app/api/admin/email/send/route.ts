import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { User } from "@/lib/models/user";
import { sendEmail } from "@/lib/email";
import { renderEmailSubject, renderEmailTemplate } from "@/lib/automation/render";
import { resolveEmailTemplate } from "@/lib/automation/email-template-store";
import { emailCampaignSlug } from "@/lib/email-tracking";

const MAX_RECIPIENTS = 5000;
const MAX_PERSONALIZED = 200;
const MAX_SUBJECT = 200;
const MAX_HTML = 200_000;
const HAS_PLACEHOLDERS = /\{\{\s*[\w.]+/;
const ALLOWED_ROLES = ["admin", "moderator", "user"] as const;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

type AudienceInput =
  | { type: "all" }
  | { type: "role"; roles?: string[] }
  | { type: "emails"; emails?: string[] };

async function resolveAudience(audience: unknown): Promise<{ id: string; name: string; email: string }[]> {
  if (!audience || typeof audience !== "object") return [];
  const a = audience as AudienceInput;

  if (a.type === "emails") {
    const emails = Array.isArray(a.emails)
      ? [...new Set(a.emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))]
      : [];
    return emails.slice(0, MAX_RECIPIENTS).map((email) => ({ id: "", name: "", email }));
  }

  let query: Record<string, unknown>;
  if (a.type === "role") {
    const roles = Array.isArray(a.roles)
      ? a.roles.map(String).filter((r) => (ALLOWED_ROLES as readonly string[]).includes(r))
      : [];
    query = { accountType: { $in: roles.length > 0 ? roles : ALLOWED_ROLES } };
  } else {
    query = { accountType: { $in: [...ALLOWED_ROLES] } };
  }

  const users = await User.find({ ...query, email: { $regex: /@/ } })
    .select("name email")
    .limit(MAX_RECIPIENTS)
    .lean();
  return users
    .filter((u) => u.email)
    .map((u) => ({ id: u._id.toString(), name: (u.name as string) ?? "", email: u.email as string }));
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json().catch(() => null);
    const subject: unknown = body?.subject;
    const html: unknown = body?.html;
    const templateId: unknown = body?.templateId;
    const campaign: unknown = body?.campaign;

    if (typeof subject !== "string" || subject.trim().length === 0 || subject.length > MAX_SUBJECT) {
      return NextResponse.json({ error: "Subject is required (max 200 chars)" }, { status: 400 });
    }
    if (typeof html !== "string" || html.trim().length === 0 || html.length > MAX_HTML) {
      return NextResponse.json({ error: "Email HTML is required" }, { status: 400 });
    }
    if (/(<script[\s>]|<style[\s>])/i.test(html)) {
      return NextResponse.json({ error: "scripts/styles are not allowed in email HTML" }, { status: 400 });
    }

    await connectDb();

    const recipients = await resolveAudience(body?.audience);
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients resolved for this audience" }, { status: 400 });
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Select at most ${MAX_RECIPIENTS} recipients` },
        { status: 400 }
      );
    }

    // A template id fills in subject/body server-side (uses admin overrides).
    const tid = typeof templateId === "string" && templateId ? templateId : undefined;
    let effectiveSubject = subject.trim();
    let effectiveHtml = html;
    if (tid) {
      const template = await resolveEmailTemplate(tid);
      if (!template) return NextResponse.json({ error: "Unknown template" }, { status: 400 });
      effectiveSubject = template.subject || effectiveSubject;
      effectiveHtml = template.body || effectiveHtml;
    }

    const campaignSlug =
      emailCampaignSlug(typeof campaign === "string" ? campaign : tid ?? "") || "admin-campaign";

    const personalized = HAS_PLACEHOLDERS.test(effectiveSubject) || HAS_PLACEHOLDERS.test(effectiveHtml);
    if (personalized && recipients.length > MAX_PERSONALIZED) {
      return NextResponse.json(
        { error: `Templates with {{placeholders}} support at most ${MAX_PERSONALIZED} recipients` },
        { status: 400 }
      );
    }

    const failed: string[] = [];
    if (personalized) {
      for (const r of recipients) {
        const payload = { user: { id: r.id, name: r.name, email: r.email } };
        const res = await sendEmail({
          to: r.email,
          subject: renderEmailSubject(effectiveSubject, payload),
          html: renderEmailTemplate(effectiveHtml, payload),
          tracking: { campaign: campaignSlug, templateId: tid, kind: "bulk", triggeredBy: session.userId },
        });
        if (!res.ok) failed.push(r.email);
      }
    } else {
      for (const batch of chunk(recipients, 100)) {
        const res = await sendEmail({
          to: batch.map((r) => r.email),
          subject: effectiveSubject,
          html: effectiveHtml,
          tracking: { campaign: campaignSlug, templateId: tid, kind: "bulk", triggeredBy: session.userId },
        });
        if (!res.ok) failed.push(...batch.map((r) => r.email));
      }
    }

    return NextResponse.json({
      ok: true,
      sent: recipients.length - failed.length,
      total: recipients.length,
      failed,
    });
  } catch (error) {
    console.error("admin/email/send error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
