import type { EventName, EventPayload, SeminarPayload, UserPayload } from "@/lib/events/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  events: EventName[];
  subject: string;
  previewBody: string;
  html: (payload: EventPayload) => string;
};

type Chip = { label: string; value: string };

function absUrl(u?: string | null): string | null {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith("/") ? u : `/${u}`}`;
}

function esc(v?: string | number | null): string {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>FlyBridge</title>
</head>
<body style="margin:0;padding:0;background:#EEF2F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F9;padding:28px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E3E8F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td style="background:#122043;padding:22px 28px;">
      <a href="${SITE_URL}" style="text-decoration:none;">
        <img src="${SITE_URL}/logo-light.png" alt="FlyBridge Education Group" width="150" style="width:150px;height:auto;display:block;"/>
      </a>
    </td>
  </tr>
  ${inner}
  <tr>
    <td style="background:#122043;padding:24px 28px;">
      <p style="margin:0 0 6px;color:#ffffff;font-weight:700;font-size:13px;">FlyBridge Education Group</p>
      <p style="margin:0 0 14px;color:#9AA6C2;font-size:12px;">From dream to destination — helping students reach their goals.</p>
      <p style="margin:0 0 10px;font-size:12px;">
        <a href="${SITE_URL}/programs" style="color:#9AA6C2;text-decoration:underline;margin-right:14px;">Programs</a>
        <a href="${SITE_URL}/seminars" style="color:#9AA6C2;text-decoration:underline;margin-right:14px;">Seminars</a>
        <a href="${SITE_URL}/resources" style="color:#9AA6C2;text-decoration:underline;">Resources</a>
      </p>
      <p style="margin:0;color:#5E6B8C;font-size:11px;">© ${new Date().getFullYear()} FlyBridge Education Group. All rights reserved.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function hero(src?: string | null): string {
  const u = absUrl(src);
  if (!u) return "";
  return `<tr><td style="padding:26px 28px 0;"><img src="${u}" alt="" width="544" style="width:100%;max-width:544px;height:auto;border-radius:14px;display:block;outline:none;"/></td></tr>`;
}

function textBlock(eyebrow: string, title: string, copy?: string): string {
  return `<tr><td style="padding:26px 28px 0;">
    ${eyebrow ? `<p style="margin:0 0 6px;color:#0FA968;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">${esc(eyebrow)}</p>` : ""}
    <h1 style="margin:0;color:#122043;font-size:22px;font-weight:800;line-height:1.35;">${esc(title)}</h1>
    ${copy ? `<p style="margin:10px 0 0;color:#4A5570;font-size:14px;line-height:1.7;">${esc(copy)}</p>` : ""}
  </td></tr>`;
}

function chipRow(rows: Chip[]): string {
  const bits = rows
    .filter((r) => r.value)
    .map(
      (r) =>
        `<span style="display:inline-block;background:#F1F4FB;border:1px solid #E3E8F1;border-radius:999px;font-size:12px;color:#475069;padding:7px 12px;margin:0 6px 8px 0;white-space:nowrap;">${esc(r.label)}&nbsp;<b style="color:#122043;">${esc(r.value)}</b></span>`
    );
  if (bits.length === 0) return "";
  return `<tr><td style="padding:18px 28px 0;">${bits.join("")}</td></tr>`;
}

function cta(href: string | null | undefined, label: string): string {
  const h = absUrl(href) ?? SITE_URL;
  return `<tr><td style="padding:22px 28px 0;">
    <a href="${h}" style="display:block;background:#0FA968;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 20px;border-radius:12px;text-align:center;">${esc(label)}</a>
  </td></tr>`;
}

function note(text: string): string {
  return `<tr><td style="padding:14px 28px 0;"><p style="margin:0;color:#8B93A7;font-size:12px;line-height:1.6;">${esc(text)}</p></td></tr>`;
}

function spacer(): string {
  return `<tr><td style="height:28px;"></td></tr>`;
}

function seminarChips(s: SeminarPayload): Chip[] {
  return [
    { label: "When", value: fmtDate(s.dateTime) },
    { label: "Duration", value: s.duration ?? "" },
    { label: "Type", value: s.type === "paid" ? `Paid · ${s.price ?? ""}` : s.type === "free" ? "Free" : "" },
  ];
}

function firstName(name?: string | null): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || "there";
}

function welcomeCard(emoji: string, title: string, desc: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="border:1px solid #E5EAF3;border-radius:16px;padding:22px 12px 18px;background:#FFFFFF;">
        <span style="display:inline-block;width:44px;height:44px;line-height:46px;border-radius:14px;background:#EEF4FE;font-size:21px;">${emoji}</span>
        <p style="margin:12px 0 5px;color:#102A43;font-size:14px;font-weight:800;">${esc(title)}</p>
        <p style="margin:0;color:#5B6B8C;font-size:12px;line-height:1.6;">${esc(desc)}</p>
        <p style="margin:10px 0 0;"><a href="${href}" style="color:#2563EB;font-size:12px;font-weight:700;text-decoration:none;">Learn more →</a></p>
      </td>
    </tr>
  </table>`;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "registration-confirmation",
    name: "Registration confirmation",
    description: "Thank the registrant and confirm their seminar spot.",
    events: ["seminar.registration_created"],
    subject: "You're registered — {{seminar.title}} · FlyBridge",
    previewBody:
      'Confirms the registrant\'s spot with the seminar\'s photo, date, duration and a "Join the seminar" button.',
    html: (payload: EventPayload) => {
      const s = (payload.seminar ?? {}) as SeminarPayload;
      const u = (payload.user ?? {}) as UserPayload;
      return shell(
        hero(s.image) +
          textBlock(
            "Registration confirmed",
            `${u.name}, you're registered!`,
            `Thank you for reserving your spot for "${s.title}". Your seat is saved — full details below.`
          ) +
          chipRow(seminarChips(s)) +
          cta(s.url, "Join the seminar") +
          note("Questions? Reply to this email or visit flybridgeedu.com for help.") +
          spacer()
      );
    },
  },
  {
    id: "seminar-announcement",
    name: "Seminar announcement",
    description: "Announce a newly published seminar to everyone.",
    events: ["seminar.created"],
    subject: "New seminar — {{seminar.title}}",
    previewBody: "Announces the seminar with its photo, description, date and a register button.",
    html: (payload: EventPayload) => {
      const s = (payload.seminar ?? {}) as SeminarPayload;
      return shell(
        hero(s.image) +
          textBlock("New seminar", s.title ?? "Seminar", s.description ?? "") +
          chipRow(seminarChips(s)) +
          cta(s.url, "Register now") +
          note("Seats are limited — save your spot today.") +
          spacer()
      );
    },
  },
  {
    id: "seminar-reminder",
    name: "Seminar reminder",
    description: "Remind attendees that a seminar is coming up.",
    events: ["seminar.registration_created", "seminar.created", "seminar.updated"],
    subject: "Reminder: {{seminar.title}} is coming up",
    previewBody: "A friendly reminder with the seminar details and a join button.",
    html: (payload: EventPayload) => {
      const s = (payload.seminar ?? {}) as SeminarPayload;
      return shell(
        hero(s.image) +
          textBlock(
            "Seminar reminder",
            s.title ?? "Seminar",
            "Don't forget — this seminar is happening soon. We can't wait to see you there."
          ) +
          chipRow(seminarChips(s)) +
          cta(s.url, "Join now") +
          spacer()
      );
    },
  },
  {
    id: "resource-announcement",
    name: "Resource announcement",
    description: "Announce a newly published resource.",
    events: ["resource.created"],
    subject: "New resource — {{resource.title}}",
    previewBody: "Showcases the resource cover, category, type, access level and a view button.",
    html: (payload: EventPayload) => {
      const r = (payload.resource ?? {}) as {
        title?: string;
        description?: string | null;
        category?: string;
        fileType?: string;
        thumbnail?: string | null;
        access?: "free" | "paid";
        price?: number;
      };
      return shell(
        hero(r.thumbnail) +
          textBlock("New resource", r.title ?? "Resource", r.description ?? "") +
          chipRow([
            { label: "Category", value: r.category ?? "" },
            { label: "Type", value: (r.fileType ?? "").toUpperCase() },
            {
              label: "Access",
              value: r.access === "paid" ? `Paid · ${r.price ?? ""}` : r.access === "free" ? "Free" : "",
            },
          ]) +
          cta(`${SITE_URL}/resources`, "View resource") +
          spacer()
      );
    },
  },
  {
    id: "course-announcement",
    name: "Course announcement",
    description: "Announce a newly launched course.",
    events: ["course.launched"],
    subject: "New course — {{course.title}}",
    previewBody: "Announces the course with its photo, badge, description, price and an explore button.",
    html: (payload: EventPayload) => {
      const c = (payload.course ?? {}) as {
        slug?: string;
        title?: string;
        desc?: string;
        badge?: string;
        price?: string;
        image?: string;
      };
      return shell(
        hero(c.image) +
          textBlock(c.badge ? `New course · ${c.badge}` : "New course", c.title ?? "Course", c.desc ?? "") +
          chipRow([{ label: "Price", value: c.price ?? "" }]) +
          cta(c.slug ? `${SITE_URL}/programs/${c.slug}` : `${SITE_URL}/programs`, "Explore the course") +
          note("Start learning today and take the next step toward your dream.") +
          spacer()
      );
    },
  },
  {
    id: "welcome",
    name: "Welcome",
    description: "Welcome a brand new user to FlyBridge.",
    events: ["user.registered"],
    subject: "Welcome to FlyBridge, {{user.name}}! Let's get started",
    previewBody: "A warm, branded welcome with quick links to programs, live seminars and free resources.",
    html: (payload: EventPayload) => {
      const u = (payload.user ?? {}) as UserPayload;
      const who = firstName(u.name);
      return shell(
        `<tr><td style="height:6px;background:#10B981;padding:0;"></td></tr>` +
          `<tr><td align="center" style="padding:44px 40px 0;">
            <p style="margin:0 0 12px;color:#10B981;font-size:11px;font-weight:800;letter-spacing:2.2px;text-transform:uppercase;">Welcome to FlyBridge</p>
            <h1 style="margin:0;color:#102A43;font-size:27px;font-weight:800;line-height:1.3;letter-spacing:-0.01em;">Welcome aboard, ${esc(who)}! 👋</h1>
          </td></tr>` +
          `<tr><td align="center" style="padding:16px 46px 0;">
            <p style="margin:0;color:#4A5570;font-size:15px;line-height:1.8;">
              You're now part of a global community of ambitious students. FlyBridge helps you build an
              international future through practical, step-by-step education — learn at your own pace,
              wherever you are.
            </p>
          </td></tr>` +
          `<tr><td style="padding:32px 26px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="32%" style="vertical-align:top;padding:0;">
                  ${welcomeCard("🎓", "Programs", "Structured courses to prepare for studying and working abroad.", `${SITE_URL}/programs`)}
                </td>
                <td width="2%"></td>
                <td width="32%" style="vertical-align:top;padding:0;">
                  ${welcomeCard("🎥", "Live seminars", "Free expert sessions — join live or catch the replay.", `${SITE_URL}/seminars`)}
                </td>
                <td width="2%"></td>
                <td width="32%" style="vertical-align:top;padding:0;">
                  ${welcomeCard("📚", "Resources", "Guides, checklists and tools — free for members.", `${SITE_URL}/resources`)}
                </td>
              </tr>
            </table>
          </td></tr>` +
          `<tr><td align="center" style="padding:36px 40px 0;">
            <a href="${SITE_URL}/programs" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:15px 34px;border-radius:12px;box-shadow:0 6px 16px -6px rgba(16,185,129,0.5);">Start exploring programs</a>
          </td></tr>` +
          `<tr><td align="center" style="padding:14px 40px 0;">
            <p style="margin:0;color:#5B6B8C;font-size:13px;">Prefer to meet us live? <a href="${SITE_URL}/seminars" style="color:#2563EB;font-weight:700;text-decoration:none;">Browse upcoming seminars →</a></p>
          </td></tr>` +
          `<tr><td align="center" style="padding:22px 40px 0;">
            <p style="margin:0;color:#8B93A7;font-size:12px;line-height:1.6;">Questions? Just reply to this email — our team is happy to help you get started.</p>
          </td></tr>` +
          `<tr><td style="height:44px;"></td></tr>`
      );
    },
  },
];

export function emailTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function emailTemplatesForEvent(event: EventName | null): EmailTemplate[] {
  if (!event) return EMAIL_TEMPLATES;
  return EMAIL_TEMPLATES.filter((t) => t.events.includes(event));
}