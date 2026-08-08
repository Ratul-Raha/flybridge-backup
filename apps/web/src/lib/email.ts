import "server-only";

import { Resend } from "resend";

const NAVY = "#122043";
const INK = "#122043";
const BODY = "#5B6478";
const MUTED = "#8B93A7";
const LINE = "#E7EAF2";
const BG_SOFT = "#F6F8FC";
const BRAND = "#0FA968";
const BRAND_SOFT = "#E2F6EE";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

function siteUrl(path = ""): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

type ShellOptions = {
  eyebrow: string;
  hero?: string;
  body: string;
  footerNote?: string;
};

function shell({ eyebrow, hero, body, footerNote }: ShellOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${BG_SOFT};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_SOFT};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid ${LINE};">

          <!-- Header -->
          <tr>
            <td style="background:#FFFFFF;border-bottom:1px solid ${LINE};padding:22px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <a href="${siteUrl("/")}" style="text-decoration:none;">
                      <img src="${siteUrl("/logo-light.png")}" alt="FlyBridge Education Group" width="150" style="width:150px;max-width:150px;height:auto;display:inline-block;" />
                    </a>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="color:${BRAND};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">${eyebrow}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${hero ? `<tr><td>${hero}</td></tr>` : ""}

          <!-- Body -->
          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${NAVY};padding:26px 32px;text-align:center;">
              <a href="${siteUrl("/")}" style="text-decoration:none;">
                <img src="${siteUrl("/logo-dark.png")}" alt="FlyBridge" width="120" style="width:120px;max-width:120px;height:auto;display:inline-block;opacity:0.92;" />
              </a>
              <div style="color:${MUTED};font-size:11px;line-height:1.8;margin-top:10px;">
                FlyBridge Education Group · Toronto, Canada<br />
                <a href="${siteUrl("/programs")}" style="color:${MUTED};text-decoration:none;">Programs</a> ·
                <a href="${siteUrl("/seminars")}" style="color:${MUTED};text-decoration:none;">Seminars</a> ·
                <a href="${siteUrl("/success-stories")}" style="color:${MUTED};text-decoration:none;">Success stories</a> ·
                <a href="${siteUrl("/faq")}" style="color:${MUTED};text-decoration:none;">FAQ</a><br />
                ${footerNote ?? `© ${new Date().getFullYear()} FlyBridge Education Group. All rights reserved.`}
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

function heroImage(image: string | null | undefined, fallbackLabel: string, fallbackGradient: string): string {
  if (image) {
    return `<img src="${image}" alt="" width="600" style="width:100%;height:230px;object-fit:cover;display:block;" />`;
  }
  return `<div style="height:230px;background:${fallbackGradient};display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-size:17px;font-weight:700;letter-spacing:0.5px;">${fallbackLabel}</div>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:999px;">${label} →</a>`;
}

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from ?? process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("email: RESEND_API_KEY / EMAIL_FROM not configured");
    return { ok: false, error: "Email not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Recipient = {
  name: string;
  email: string;
  phone?: string | null;
};

export type SeminarEmailData = {
  id?: string;
  title: string;
  description?: string | null;
  dateTime: Date;
  duration?: string | null;
  type: "free" | "paid";
  price?: number;
  url?: string | null;
  image?: string | null;
};

export type CourseEmailData = {
  slug: string;
  title: string;
  desc?: string;
  badge?: string;
  price?: string;
  image?: string;
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

function seminarDetailsTable(seminar: SeminarEmailData): string {
  const badgeBg = seminar.type === "paid" ? "#6B4CE0" : BRAND;
  const badgeText =
    seminar.type === "paid"
      ? `Paid${seminar.price ? ` · $${seminar.price}` : ""}`
      : "Free";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_SOFT};border-radius:16px;padding:18px 20px;margin-bottom:22px;">
    <tr>
      <td style="padding:6px 0;font-size:13px;color:${BODY};">📅 Date & time</td>
      <td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;text-align:right;">${formatDate(seminar.dateTime)}</td>
    </tr>
    ${seminar.duration ? `<tr><td style="padding:6px 0;font-size:13px;color:${BODY};">⏱ Duration</td><td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;text-align:right;">${seminar.duration}</td></tr>` : ""}
    <tr>
      <td style="padding:6px 0;font-size:13px;color:${BODY};">💳 Ticket</td>
      <td style="padding:6px 0;text-align:right;">
        <span style="display:inline-block;background:${badgeBg};color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:5px 12px;border-radius:999px;">${badgeText}</span>
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// 1. Registration confirmation
// ---------------------------------------------------------------------------

function registrationTemplate(recipient: Recipient, seminar: SeminarEmailData): string {
  const banner =
    seminar.image ??
    (seminar.type === "paid"
      ? "linear-gradient(135deg,#6B4CE0,#2F5FE0)"
      : "linear-gradient(135deg,#0FA968,#18A97A)");

  const body = `
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND};margin-bottom:10px;">Registration confirmed ✓</div>
    <h1 style="margin:0 0 6px 0;font-size:24px;color:${INK};letter-spacing:-0.3px;line-height:1.25;">${seminar.title}</h1>
    <div style="font-size:13px;color:${BODY};margin-bottom:20px;">You're on the list, ${recipient.name} — see you there!</div>

    ${seminarDetailsTable(seminar)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_SOFT};border-radius:16px;padding:0 20px 18px 20px;margin-bottom:22px;">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${BODY};">📞 Phone</td>
        <td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;text-align:right;">${recipient.phone ?? "—"}</td>
      </tr>
    </table>

    ${seminar.description ? `<p style="font-size:14px;line-height:1.7;color:${BODY};margin:0 0 22px 0;">${seminar.description}</p>` : ""}

    ${seminar.url ? ctaButton(seminar.url, "Join the seminar") : ""}

    <p style="font-size:12px;line-height:1.6;color:${MUTED};margin:22px 0 0 0;">
      A link to the live session will also appear on this seminar's page in your
      <a href="${siteUrl("/dashboard")}" style="color:${BRAND};text-decoration:none;">FlyBridge dashboard</a>.
      Add the date to your calendar so you don't miss it.
    </p>`;

  return shell({
    eyebrow: "Seminar Registration",
    hero: seminar.image
      ? heroImage(seminar.image, "", "")
      : `<div style="height:230px;background:${banner};background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-size:18px;font-weight:600;text-align:center;">FlyBridge Seminar</div>`,
    body,
    footerNote: `You received this email because you registered for "${seminar.title}".`,
  });
}

export async function sendSeminarRegistrationEmail(
  recipient: Recipient,
  seminar: SeminarEmailData
): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to: recipient.email,
    subject: `You're registered — ${seminar.title} · FlyBridge`,
    html: registrationTemplate(recipient, seminar),
  });
}

// ---------------------------------------------------------------------------
// 2. New seminar announcement (advertisement to all users)
// ---------------------------------------------------------------------------

function newSeminarTemplate(seminar: SeminarEmailData): string {
  const body = `
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND};margin-bottom:10px;">New seminar — seats are limited</div>
    <h1 style="margin:0 0 8px 0;font-size:26px;color:${INK};letter-spacing:-0.3px;line-height:1.25;">${seminar.title}</h1>
    <div style="font-size:14px;line-height:1.7;color:${BODY};margin-bottom:22px;">${seminar.description ?? "Join us for a practical, expert-led session."}</div>

    ${seminarDetailsTable(seminar)}

    ${ctaButton(seminar.url ?? siteUrl("/seminars"), "Register now")}

    <p style="font-size:12px;line-height:1.6;color:${MUTED};margin:22px 0 0 0;">
      Not sure this fits? Explore all upcoming seminars at
      <a href="${siteUrl("/seminars")}" style="color:${BRAND};text-decoration:none;">flybridgeedu.com/seminars</a>.
    </p>`;

  return shell({
    eyebrow: "New Seminar",
    hero: heroImage(seminar.image, "FlyBridge Seminar", "linear-gradient(135deg,#0FA968,#18A97A)"),
    body,
    footerNote: "You received this email because you're part of the FlyBridge community.",
  });
}

export async function sendNewSeminarAnnouncement(
  seminar: SeminarEmailData
): Promise<{ ok: boolean; error?: string; recipients: number }> {
  const { default: mongoose } = await import("mongoose");
  await import("@/lib/db").then((m) => m.connectDb());

  const users = await mongoose
    .connection
    .collection("users")
    .find({ email: { $regex: /@/ } }, { projection: { email: 1, _id: 0 } })
    .limit(500)
    .toArray();

  const emails = users.map((u) => u.email as string);
  if (emails.length === 0) {
    return { ok: true, recipients: 0 };
  }

  const result = await sendEmail({
    to: emails,
    subject: `New seminar — ${seminar.title} · FlyBridge`,
    html: newSeminarTemplate(seminar),
  });
  return { ...result, recipients: emails.length };
}

// ---------------------------------------------------------------------------
// 3. Course launch announcement (advertisement to all users)
// ---------------------------------------------------------------------------

function newCourseTemplate(course: CourseEmailData): string {
  const body = `
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND};margin-bottom:10px;">${course.badge ?? "New course"} — now available</div>
    <h1 style="margin:0 0 8px 0;font-size:26px;color:${INK};letter-spacing:-0.3px;line-height:1.25;">${course.title}</h1>
    <div style="font-size:14px;line-height:1.7;color:${BODY};margin-bottom:22px;">${course.desc ?? "A brand new course from FlyBridge Education Group."}</div>

    ${course.price ? `<div style="background:${BRAND_SOFT};border-radius:16px;padding:16px 20px;margin-bottom:22px;text-align:center;">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND};margin-bottom:2px;">Intro offer</div>
      <div style="font-size:22px;font-weight:700;color:${INK};">${course.price}</div>
    </div>` : ""}

    ${ctaButton(siteUrl(`/programs/${course.slug}`), "Explore the course")}

    <p style="font-size:12px;line-height:1.6;color:${MUTED};margin:22px 0 0 0;">
      See all programs at
      <a href="${siteUrl("/programs")}" style="color:${BRAND};text-decoration:none;">flybridgeedu.com/programs</a>.
    </p>`;

  return shell({
    eyebrow: "Course Launch",
    hero: heroImage(course.image, "FlyBridge Course", "linear-gradient(135deg,#6B4CE0,#2F5FE0)"),
    body,
    footerNote: "You received this email because you're part of the FlyBridge community.",
  });
}

export async function sendCourseLaunchEmail(
  course: CourseEmailData
): Promise<{ ok: boolean; error?: string; recipients: number }> {
  const { default: mongoose } = await import("mongoose");
  await import("@/lib/db").then((m) => m.connectDb());

  const users = await mongoose
    .connection
    .collection("users")
    .find({ email: { $regex: /@/ } }, { projection: { email: 1, _id: 0 } })
    .limit(500)
    .toArray();

  const emails = users.map((u) => u.email as string);
  if (emails.length === 0) {
    return { ok: true, recipients: 0 };
  }

  const result = await sendEmail({
    to: emails,
    subject: `New course — ${course.title} · FlyBridge`,
    html: newCourseTemplate(course),
  });
  return { ...result, recipients: emails.length };
}
