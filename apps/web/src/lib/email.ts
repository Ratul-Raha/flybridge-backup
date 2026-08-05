import "server-only";

import { Resend } from "resend";

type SeminarEmailData = {
  title: string;
  description?: string | null;
  dateTime: Date;
  duration?: string | null;
  type: "free" | "paid";
  price?: number;
  url?: string | null;
  image?: string | null;
};

type Recipient = {
  name: string;
  email: string;
  phone?: string | null;
};

function formatDate(d: Date) {
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function template(recipient: Recipient, seminar: SeminarEmailData): string {
  const badgeBg = seminar.type === "paid" ? "#6B4CE0" : "#0FA968";
  const badgeText =
    seminar.type === "paid"
      ? `Paid${seminar.price ? ` · $${seminar.price}` : ""}`
      : "Free";
  const banner =
    seminar.image ??
    (seminar.type === "paid"
      ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
      : "linear-gradient(135deg,#0FA968,#18A97A)");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seminar registration confirmed</title>
</head>
<body style="margin:0;padding:0;background:#F6F8FC;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F8FC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #E7EAF2;">
          <tr>
            <td style="background:#122043;padding:26px 32px;text-align:center;">
              <div style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">FlyBridge <span style="color:#0FA968;">Education Group</span></div>
              <div style="color:#8B93A7;font-size:10px;letter-spacing:2.5px;margin-top:4px;text-transform:uppercase;">Seminar Registration</div>
            </td>
          </tr>

          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:220px;background:${banner};background-size:cover;background-position:center;">
                    ${
                      seminar.image
                        ? `<img src="${seminar.image}" alt="${seminar.title}" width="600" style="width:100%;height:220px;object-fit:cover;display:block;" />`
                        : `<div style="height:220px;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-size:18px;font-weight:600;text-align:center;">FlyBridge Seminar</div>`
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0FA968;margin-bottom:10px;">Registration confirmed ✓</div>
              <h1 style="margin:0 0 6px 0;font-size:24px;color:#122043;letter-spacing:-0.3px;line-height:1.25;">${seminar.title}</h1>
              <div style="font-size:13px;color:#5B6478;margin-bottom:20px;">You're on the list, ${recipient.name} — see you there!</div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F8FC;border-radius:16px;padding:18px 20px;margin-bottom:22px;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#5B6478;">📅 Date & time</td>
                  <td style="padding:6px 0;font-size:13px;color:#122043;font-weight:600;text-align:right;">${formatDate(seminar.dateTime)}</td>
                </tr>
                ${
                  seminar.duration
                    ? `<tr><td style="padding:6px 0;font-size:13px;color:#5B6478;">⏱ Duration</td><td style="padding:6px 0;font-size:13px;color:#122043;font-weight:600;text-align:right;">${seminar.duration}</td></tr>`
                    : ""
                }
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#5B6478;">💳 Ticket</td>
                  <td style="padding:6px 0;text-align:right;">
                    <span style="display:inline-block;background:${badgeBg};color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">${badgeText}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#5B6478;">📞 Phone</td>
                  <td style="padding:6px 0;font-size:13px;color:#122043;font-weight:600;text-align:right;">${recipient.phone ?? "—"}</td>
                </tr>
              </table>

              ${
                seminar.description
                  ? `<p style="font-size:14px;line-height:1.7;color:#5B6478;margin:0 0 22px 0;">${seminar.description}</p>`
                  : ""
              }

              ${
                seminar.url
                  ? `<a href="${seminar.url}" style="display:inline-block;background:#0FA968;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;">Join the seminar →</a>`
                  : ""
              }

              <p style="font-size:12px;line-height:1.6;color:#8B93A7;margin:22px 0 0 0;">
                A link to the live session will also appear on this seminar's page in your
                <a href="https://flybridgeedu.com/dashboard" style="color:#0FA968;text-decoration:none;">FlyBridge dashboard</a>.
                Add the date to your calendar so you don't miss it.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#122043;padding:22px 32px;text-align:center;">
              <div style="color:#8B93A7;font-size:11px;line-height:1.7;">
                FlyBridge Education Group · Toronto, Canada<br />
                © ${new Date().getFullYear()} FlyBridge Education Group. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendSeminarRegistrationEmail(
  recipient: Recipient,
  seminar: SeminarEmailData
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("email: RESEND_API_KEY / EMAIL_FROM not configured");
    return { ok: false, error: "Email not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: recipient.email,
      subject: `You're registered — ${seminar.title} · FlyBridge`,
      html: template(recipient, seminar),
    });
    if (error) {
      console.error("email send error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("email send exception", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}