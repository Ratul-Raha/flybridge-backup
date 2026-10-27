import "server-only";

import { Resend } from "resend";

import { rewriteEmailLinks } from "./email-tracking";

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------

export type EmailTrackingContext = {
  /** Campaign slug stored on click rows and copied into utm_campaign. */
  campaign?: string;
  templateId?: string;
  /** Set false to leave links untouched (e.g. purely transactional mail). */
  trackLinks?: boolean;
  /** Send origin recorded on the EmailSend log row (bulk/automation/…). */
  kind?: "bulk" | "automation" | "transactional" | "test";
  /** User id of the admin who triggered the send (for the audit trail). */
  triggeredBy?: string;
};

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  /** Click-tracking context; same-site links are wrapped in `/e/{token}`
   *  redirects unless `trackLinks: false` or tracking is unconfigured. */
  tracking?: EmailTrackingContext;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from ?? process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("email: RESEND_API_KEY / EMAIL_FROM not configured");
    return { ok: false, error: "Email not configured" };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (to.length === 0) {
    return { ok: false, error: "No recipients" };
  }

  const html =
    input.tracking?.trackLinks === false
      ? input.html
      : rewriteEmailLinks(input.html, {
          campaign: input.tracking?.campaign,
          templateId: input.tracking?.templateId,
          // Per-recipient tokens only when a single address is sent; batch
          // sends share one token so the same HTML works for the whole chunk.
          recipient: to.length === 1 ? to[0] : undefined,
        });

  try {
    const resend = new Resend(apiKey);
    const results = await Promise.all(
      chunk(to, 100).map((batch) =>
        resend.emails.send({
          from,
          to: batch,
          subject: input.subject,
          html,
        })
      )
    );
    const firstError = results.find((r) => r.error);
    if (firstError?.error) {
      console.error("email send error", firstError.error);
      await logSend(input, to.length, "failed", firstError.error.message);
      return { ok: false, error: firstError.error.message };
    }
    await logSend(input, to.length, "sent");
    return { ok: true };
  } catch (e) {
    console.error("email send exception", e);
    await logSend(input, to.length, "failed", e instanceof Error ? e.message : "Unknown error");
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

async function logSend(
  input: SendEmailInput,
  recipients: number,
  status: "sent" | "failed",
  error?: string,
): Promise<void> {
  try {
    const { connectDb } = await import("./db");
    await connectDb();
    const { EmailSend } = await import("./models/email-send");
    await EmailSend.create({
      kind: input.tracking?.kind ?? "transactional",
      campaign: input.tracking?.campaign ?? "email",
      templateId: input.tracking?.templateId,
      subject: input.subject.slice(0, 300),
      recipients,
      status,
      error,
      triggeredBy: input.tracking?.triggeredBy,
    });
  } catch (logError) {
    // Logging must never break the send itself.
    console.error("email send logging error", logError);
  }
}
