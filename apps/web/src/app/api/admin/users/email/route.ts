import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { User } from "@/lib/models/user";
import { sendEmail } from "@/lib/email";
import { renderEmailSubject, renderEmailTemplate } from "@/lib/automation/render";

const MAX_RECIPIENTS = 1000;
const MAX_PERSONALIZED = 200;
const MAX_SUBJECT = 200;
const MAX_HTML = 200_000;
const HAS_PLACEHOLDERS = /\{\{\s*[\w.]+/;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    const userIds: unknown = body?.userIds;
    const subject: unknown = body?.subject;
    const html: unknown = body?.html;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "No recipients selected" }, { status: 400 });
    }
    if (userIds.length > MAX_RECIPIENTS) {
      return NextResponse.json({ error: `Select at most ${MAX_RECIPIENTS} recipients` }, { status: 400 });
    }
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

    const ids = [...new Set(userIds.map(String))];
    const users = await User.find({ _id: { $in: ids } }, { name: 1, email: 1 }).lean();
    const recipients = users
      .filter((u) => u.email)
      .map((u) => ({ id: u._id.toString(), name: u.name as string, email: u.email as string }));

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients have an email address" }, { status: 400 });
    }

    const personalized = HAS_PLACEHOLDERS.test(subject) || HAS_PLACEHOLDERS.test(html);
    if (personalized && recipients.length > MAX_PERSONALIZED) {
      return NextResponse.json(
        { error: `Templates with {{placeholders}} support at most ${MAX_PERSONALIZED} recipients` },
        { status: 400 }
      );
    }

    const failed: string[] = [];
    if (personalized) {
      for (const r of recipients) {
        const payload = { user: { name: r.name, email: r.email, id: r.id } };
        const res = await sendEmail({
          to: r.email,
          subject: renderEmailSubject(subject, payload),
          html: renderEmailTemplate(html, payload),
        });
        if (!res.ok) failed.push(r.email);
      }
    } else {
      for (const batch of chunk(recipients, 100)) {
        const res = await sendEmail({
          to: batch.map((r) => r.email),
          subject: subject.trim(),
          html,
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
    console.error("admin/users/email error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}