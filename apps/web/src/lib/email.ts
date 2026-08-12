import "server-only";

import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
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

  try {
    const resend = new Resend(apiKey);
    const results = await Promise.all(
      chunk(to, 100).map((batch) =>
        resend.emails.send({
          from,
          to: batch,
          subject: input.subject,
          html: input.html,
        })
      )
    );
    const firstError = results.find((r) => r.error);
    if (firstError?.error) {
      console.error("email send error", firstError.error);
      return { ok: false, error: firstError.error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("email send exception", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
