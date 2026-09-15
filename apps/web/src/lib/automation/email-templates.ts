import type { EventName } from "@/lib/events/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  previewBody: string;
  events: EventName[];
  subject: string;
  /** Full HTML email source, rendered by the engine's `renderEmailTemplate`.
   *  Can be edited by admins from /dashboard/admin/email-templates. */
  body: string;
};

const EMAIL_SHELL_HEAD = `<!DOCTYPE html>
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
      <a href="{{siteUrl}}" style="text-decoration:none;">
        <img src="{{siteUrl}}/transparent-logo-light.png" alt="FlyBridge Education Group" width="150" style="width:150px;height:auto;display:block;"/>
      </a>
    </td>
  </tr>`;

const EMAIL_SHELL_FOOT = `
  <tr>
    <td style="background:#122043;padding:24px 28px;">
      <p style="margin:0 0 6px;color:#ffffff;font-weight:700;font-size:13px;">FlyBridge Education Group</p>
      <p style="margin:0 0 14px;color:#9AA6C2;font-size:12px;">From dream to destination — helping students reach their goals.</p>
      <p style="margin:0 0 10px;font-size:12px;">
        <a href="{{siteUrl}}/programs" style="color:#9AA6C2;text-decoration:underline;margin-right:14px;">Programs</a>
        <a href="{{siteUrl}}/seminars" style="color:#9AA6C2;text-decoration:underline;margin-right:14px;">Seminars</a>
        <a href="{{siteUrl}}/resources" style="color:#9AA6C2;text-decoration:underline;">Resources</a>
      </p>
      <p style="margin:0;color:#5E6B8C;font-size:11px;">© {{now|year}} FlyBridge Education Group. All rights reserved.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

function withShell(inner: string): string {
  return EMAIL_SHELL_HEAD + inner + EMAIL_SHELL_FOOT;
}

const CHIP = (label: string, inner: string) =>
  `<span style="display:inline-block;background:#F1F4FB;border:1px solid #E3E8F1;border-radius:999px;font-size:12px;color:#475069;padding:7px 12px;margin:0 6px 8px 0;white-space:nowrap;">${label}&nbsp;<b style="color:#122043;">${inner}</b></span>`;

const CHIP_BLOCK = (chips: string) =>
  chips ? `<tr><td style="padding:18px 28px 0;">${chips}</td></tr>` : "";

const HERO = (path: string) =>
  `{{#if ${path}}}<tr><td style="padding:26px 28px 0;"><img src="{{${path}}}" alt="" width="544" style="width:100%;max-width:544px;height:auto;border-radius:14px;display:block;outline:none;"/></td></tr>{{/if}}`;

const TEXT_BLOCK = (eyebrow: string, title: string, copy?: string) =>
  `<tr><td style="padding:26px 28px 0;">
    ${eyebrow ? `<p style="margin:0 0 6px;color:#0FA968;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">${eyebrow}</p>` : ""}
    <h1 style="margin:0;color:#122043;font-size:22px;font-weight:800;line-height:1.35;">${title}</h1>
    ${copy ? `<p style="margin:10px 0 0;color:#4A5570;font-size:14px;line-height:1.7;">${copy}</p>` : ""}
  </td></tr>`;

const CTA = (href: string, label: string) =>
  `<tr><td style="padding:22px 28px 0;">
    <a href="${href}" style="display:block;background:#0FA968;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 20px;border-radius:12px;text-align:center;">${label}</a>
  </td></tr>`;

const NOTE = (text: string) =>
  `<tr><td style="padding:14px 28px 0;"><p style="margin:0;color:#8B93A7;font-size:12px;line-height:1.6;">${text}</p></td></tr>`;

const SPACER = `<tr><td style="height:28px;"></td></tr>`;

const seminarChipsBlock = (): string => {
  const chips =
    `{{#if seminar.dateTime}}${CHIP("When", "{{seminar.dateTime|date}}")}{{/if}}` +
    `{{#if seminar.duration}}${CHIP("Duration", "{{seminar.duration}}")}{{/if}}` +
    `{{#if seminar.type === "paid"}}${CHIP("Type", "Paid · {{seminar.price}}")}{{/if}}` +
    `{{#if seminar.type === "free"}}${CHIP("Type", "Free")}{{/if}}`;
  return CHIP_BLOCK(chips);
};

const SECTION_LABEL = (text: string) =>
  `<tr><td style="padding:26px 40px 0;"><p style="margin:0;color:#122043;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1.4px;">${text}</p></td></tr>`;

const CHECKLIST = (items: string[]) => {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:0 0 13px;"><p style="margin:0;color:#4A5570;font-size:14px;line-height:1.65;"><span style="color:#0FA968;font-weight:800;">&#10003;</span>&nbsp;&nbsp;${item}</p></td></tr>`
    )
    .join("");
  return `<tr><td style="padding:20px 40px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;border:1px solid #E5EAF3;background:#F7FAFC;">
      <tr><td style="padding:22px 24px;">${rows}</td></tr>
    </table>
  </td></tr>`;
};

const SIGN_OFF = (text: string, title: string) =>
  `<tr><td style="padding:24px 40px 0;"><p style="margin:0;color:#4A5570;font-size:13px;line-height:1.6;">${text}<br/><span style="color:#8B93A7;">${title}</span></p></td></tr>`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "registration-confirmation",
    name: "Registration confirmation",
    description: "Thank the registrant and confirm their seminar spot.",
    previewBody:
      'Confirms the registrant\'s spot with the seminar\'s photo, date, duration and a "Join the seminar" button.',
    events: ["seminar.registration_created"],
    subject: "You're registered — {{seminar.title}} · FlyBridge",
    body: withShell(
      HERO("seminar.image") +
        TEXT_BLOCK(
          "Registration confirmed",
          "{{user.name}}, you're registered!",
          'Thank you for reserving your spot for "{{seminar.title}}". Your seat is saved — full details below.'
        ) +
        seminarChipsBlock() +
        CTA("{{#if seminar.url}}{{seminar.url}}{{else}}{{siteUrl}}{{/if}}", "Join the seminar") +
        NOTE("Questions? Reply to this email or visit flybridgeedu.com for help.") +
        SPACER
    ),
  },
  {
    id: "seminar-announcement",
    name: "Seminar announcement",
    description: "Announce a newly published seminar to everyone.",
    previewBody: "Announces the seminar with its photo, description, date and a register button.",
    events: ["seminar.created"],
    subject: "New seminar — {{seminar.title}}",
    body: withShell(
      HERO("seminar.image") +
        TEXT_BLOCK("New seminar", "{{#if seminar.title}}{{seminar.title}}{{else}}Seminar{{/if}}", "{{seminar.description}}") +
        seminarChipsBlock() +
        CTA("{{#if seminar.url}}{{seminar.url}}{{else}}{{siteUrl}}{{/if}}", "Register now") +
        NOTE("Seats are limited — save your spot today.") +
        SPACER
    ),
  },
  {
    id: "seminar-reminder",
    name: "Seminar reminder",
    description: "Remind attendees that a seminar is coming up.",
    previewBody: "A friendly reminder with the seminar details and a join button.",
    events: ["seminar.registration_created", "seminar.created", "seminar.updated"],
    subject: "Reminder: {{seminar.title}} is coming up",
    body: withShell(
      HERO("seminar.image") +
        TEXT_BLOCK(
          "Seminar reminder",
          "{{#if seminar.title}}{{seminar.title}}{{else}}Seminar{{/if}}",
          "Don't forget — this seminar is happening soon. We can't wait to see you there."
        ) +
        seminarChipsBlock() +
        CTA("{{#if seminar.url}}{{seminar.url}}{{else}}{{siteUrl}}{{/if}}", "Join now") +
        SPACER
    ),
  },
  {
    id: "resource-announcement",
    name: "Resource announcement",
    description: "Announce a newly published resource.",
    previewBody: "Showcases the resource cover, category, type, access level and a view button.",
    events: ["resource.created"],
    subject: "New resource — {{resource.title}}",
    body: withShell(
      HERO("resource.thumbnail") +
        TEXT_BLOCK("New resource", "{{#if resource.title}}{{resource.title}}{{else}}Resource{{/if}}", "{{resource.description}}") +
        CHIP_BLOCK(
          `{{#if resource.category}}${CHIP("Category", "{{resource.category}}")}{{/if}}` +
            `{{#if resource.fileType}}${CHIP("Type", "{{resource.fileType|upper}}")}{{/if}}` +
            `{{#if resource.access === "members"}}${CHIP("Access", "Members · ${{resource.price}}")}{{/if}}` +
            `{{#if resource.access === "public"}}${CHIP("Access", "Public")}{{/if}}`
        ) +
        CTA("{{siteUrl}}/resources", "View resource") +
        SPACER
    ),
  },
  {
    id: "course-announcement",
    name: "Course announcement",
    description: "Announce a newly launched course.",
    previewBody: "Announces the course with its photo, badge, description, price and an explore button.",
    events: ["course.launched"],
    subject: "New course — {{course.title}}",
    body: withShell(
      HERO("course.image") +
        TEXT_BLOCK(
          "{{#if course.badge}}New course · {{course.badge}}{{else}}New course{{/if}}",
          "{{#if course.title}}{{course.title}}{{else}}Course{{/if}}",
          "{{course.desc}}"
        ) +
        CHIP_BLOCK(`{{#if course.price}}${CHIP("Price", "{{course.price}}")}{{/if}}`) +
        CTA("{{#if course.slug}}{{siteUrl}}/programs/{{course.slug}}{{else}}{{siteUrl}}/programs{{/if}}", "Explore the course") +
        NOTE("Start learning today and take the next step toward your dream.") +
        SPACER
    ),
  },
  {
    id: "order-fulfilled",
    name: "Order confirmation",
    description: "Confirm an order and thank the customer after payment or free enrollment.",
    previewBody:
      "Confirms the order with a success banner, item list, total paid, and a start-learning CTA button.",
    events: ["order.fulfilled"],
    subject: "Order confirmed — {{order.id}}",
    body: withShell(
      `<tr><td style="background:linear-gradient(135deg,#10B981,#059669);padding:40px 28px 36px;text-align:center;">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);margin:0 auto 16px;line-height:56px;font-size:28px;text-align:center;">&#10003;</div>
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Order confirmed</p>
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Thank you, {{user.name|first}}!</h1>
      </td></tr>` +
        TEXT_BLOCK(
          "",
          "{{#if order.total === 0}}Your enrollment is confirmed{{else}}Your payment was successful{{/if}}",
          "Your order is complete and confirmed. Below you'll find everything you need to get started right away."
        ) +
        `<tr><td style="padding:20px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFB;border:1px solid #E3E8F1;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:16px 24px;">
                <p style="margin:0 0 3px;color:#8B93A7;font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Order ID</p>
                <p style="margin:0;color:#122043;font-size:14px;font-weight:700;font-family:'Courier New',monospace;">#{{order.id|shortid}}</p>
              </td>
              <td align="right" style="padding:16px 24px;">
                <p style="margin:0 0 3px;color:#8B93A7;font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Date</p>
                <p style="margin:0;color:#122043;font-size:13px;font-weight:600;">{{now|date}}</p>
              </td>
            </tr>
          </table>
        </td></tr>` +
        `{{#if order.items.0}}
        <tr><td style="padding:24px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E3E8F1;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#F8FAFB;padding:12px 24px;border-bottom:1px solid #E3E8F1;">
                <p style="margin:0;color:#8B93A7;font-size:10.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Items</p>
              </td>
            </tr>
            {{#each order.items}}
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid #F1F4FB;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#122043;font-size:14px;font-weight:600;">{{#if title}}{{title}}{{else}}{{itemType}}{{/if}}</td>
                    <td align="right" style="color:#122043;font-size:14px;font-weight:700;white-space:nowrap;padding-left:16px;">{{#if price === 0}}<span style="color:#10B981;">Free</span>{{else}}{{order.currency}} {{#if price}}{{price|number}}{{else}}0{{/if}}{{/if}}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;"><span style="display:inline-block;background:#F1F4FB;border:1px solid #E3E8F1;border-radius:999px;font-size:10.5px;color:#5B6478;padding:3px 8px;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">{{itemType}}</span></td>
                    <td></td>
                  </tr>
                </table>
              </td>
            </tr>
            {{/each}}
            {{#if order.total !== 0}}
            <tr>
              <td style="padding:16px 24px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#5B6478;font-size:13px;font-weight:500;">Total paid</td>
                    <td align="right" style="color:#122043;font-size:18px;font-weight:800;">{{order.currency}} {{order.total|number}}</td>
                  </tr>
                </table>
              </td>
            </tr>
            {{/if}}
          </table>
        </td></tr>
        {{/if}}` +
        `{{#if order.items.0.itemType === "course"}}
        <tr><td align="center" style="padding:30px 28px 0;">
          <a href="{{#if course.slug}}{{siteUrl}}/programs/{{course.slug}}/learn{{else}}{{siteUrl}}/dashboard{{/if}}" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:15px 40px;border-radius:12px;box-shadow:0 6px 16px -6px rgba(16,185,129,0.5);">Start learning</a>
        </td></tr>
        {{else}}
        <tr><td align="center" style="padding:30px 28px 0;">
          <a href="{{siteUrl}}/dashboard" style="display:inline-block;background:#10B981;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:15px 40px;border-radius:12px;box-shadow:0 6px 16px -6px rgba(16,185,129,0.5);">Go to dashboard</a>
        </td></tr>
        {{/if}}` +
        `<tr><td style="padding:28px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF8;border:1px solid #D1FAE5;border-radius:14px;">
            <tr>
              <td style="padding:20px 22px;">
                <p style="margin:0 0 8px;color:#122043;font-size:13px;font-weight:700;">What's next?</p>
                <p style="margin:0;color:#4A5570;font-size:12.5px;line-height:1.7;">Head to your dashboard to access your courses, track your progress, and manage your account. You can revisit your materials anytime.</p>
              </td>
            </tr>
          </table>
        </td></tr>` +
        NOTE("If you have any questions about your order, reply to this email or visit flybridgeedu.com for help.") +
        SPACER
    ),
  },
  {
    id: "welcome",
    name: "Welcome",
    description: "Welcome a brand new user to FlyBridge.",
    events: ["user.registered"],
    subject: "Welcome to FlyBridge, {{user.name}}! Let's get started",
    previewBody: "A warm, branded welcome with quick links to programs, live seminars and free resources.",
    body: withShell(
      `<tr><td style="padding:36px 40px 8px;" align="center">
          <span style="display:inline-block;background:#E2F6EE;color:#0FA968;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:7px 14px;border-radius:999px;">Welcome to FlyBridge</span>
          <h1 style="margin:18px 0 0;color:#122043;font-size:28px;font-weight:800;line-height:1.25;letter-spacing:-0.02em;">Welcome aboard, {{user.name|first}} 🎉</h1>
          <p style="margin:14px 0 0;color:#5B6478;font-size:15px;line-height:1.75;">
            You're now part of a global community of ambitious students. FlyBridge helps you build an
            international future through practical, step-by-step education — at your own pace, anywhere in the world.
          </p>
        </td></tr>` +
        `<tr><td style="padding:30px 40px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;border:1px solid #E5EAF3;">
            <tr><td style="padding:24px 24px 20px;background:#F7FAFC;border-radius:16px;">
              <p style="margin:0 0 14px;color:#122043;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1.4px;">Your first steps</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:0 0 14px;"><p style="margin:0;color:#4A5570;font-size:14px;line-height:1.6;"><span style="color:#0FA968;font-weight:800;">✓</span>&nbsp; Explore <a href="{{siteUrl}}/programs" style="color:#122043;font-weight:700;text-decoration:underline;">programs</a> that match your goals</p></td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px;"><p style="margin:0;color:#4A5570;font-size:14px;line-height:1.6;"><span style="color:#0FA968;font-weight:800;">✓</span>&nbsp; Join a <a href="{{siteUrl}}/seminars" style="color:#122043;font-weight:700;text-decoration:underline;">live seminar</a> — free, expert-led</p></td>
                </tr>
                <tr>
                  <td style="padding:0;"><p style="margin:0;color:#4A5570;font-size:14px;line-height:1.6;"><span style="color:#0FA968;font-weight:800;">✓</span>&nbsp; Grab free <a href="{{siteUrl}}/resources" style="color:#122043;font-weight:700;text-decoration:underline;">resources</a> &amp; checklists</p></td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>` +
        `<tr><td align="center" style="padding:28px 40px 0;">
          <a href="{{siteUrl}}/programs" style="display:inline-block;background:#0FA968;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:15px 36px;border-radius:12px;box-shadow:0 8px 20px -8px rgba(15,169,104,0.55);">Start exploring</a>
        </td></tr>` +
        `<tr><td align="center" style="padding:18px 40px 0;">
          <p style="margin:0;color:#8B93A7;font-size:13px;">Prefer to meet us live? <a href="{{siteUrl}}/seminars" style="color:#0FA968;font-weight:700;text-decoration:none;">Browse upcoming seminars →</a></p>
        </td></tr>` +
        `<tr><td align="center" style="padding:24px 40px 0;">
          <p style="margin:0;color:#8B93A7;font-size:12px;line-height:1.7;">Questions? Just reply to this email — our team is happy to help you get started.</p>
        </td></tr>` +
        `<tr><td style="height:44px;"></td></tr>`
    ),
  },
  {
    id: "nurture-welcome",
    name: "Welcome to Flybridge",
    description: "Instant welcome after signup — ecosystem positioning with dashboard quick links.",
    events: ["user.registered"],
    subject: "Welcome to Flybridge Education Group! 🎓",
    previewBody:
      "Warm welcome + first steps: free foundation modules, IELTS study materials and the Study Abroad Readiness tool.",
    body: withShell(
      TEXT_BLOCK(
        "Welcome aboard",
        "Hi {{user.name|first}}, welcome to Flybridge Education Group!",
        "We are thrilled to have you as part of our global learning community. At Flybridge, our goal is simple: to help you master IELTS and guide you step-by-step toward studying in top international destinations like the UK, Canada, and Australia."
      ) +
        SECTION_LABEL("What you can do right now on your dashboard") +
        CHECKLIST([
          "Explore our free foundation modules.",
          "Access high-quality IELTS study materials and cheatsheets.",
          "Assess your Study Abroad eligibility with our tools.",
        ]) +
        CTA("{{siteUrl}}/dashboard", "Log in to your dashboard") +
        NOTE("Log in to your account anytime at flybridgeedu.com/dashboard.") +
        SIGN_OFF("Md Rasel Ahammed", "Founder &amp; CEO, Flybridge Education Group") +
        SPACER
    ),
  },
  {
    id: "nurture-course",
    name: "Free Spoken & IELTS Foundation nudge",
    description: "Day-3 nudge to enroll in the free Spoken & IELTS Foundation Course.",
    events: ["user.registered"],
    subject: "Have you claimed your free IELTS Spoken & Foundation Course?",
    previewBody: "Reminds the student to enroll in the free course and lists the benefits.",
    body: withShell(
      TEXT_BLOCK(
        "A quick check-in",
        "Hi {{user.name|first}}, have you claimed your free course yet?",
        "Have you enrolled in our Free Spoken & IELTS Foundation Course? If you haven't started, you're missing out on structured lessons designed to build your core grammar, fluency, and test-taking strategies."
      ) +
        SECTION_LABEL("Why enroll today?") +
        CHECKLIST([
          "100% Free self-paced video modules.",
          "Practical techniques for Reading, Listening, Speaking, and Writing.",
          "Earn a Certificate upon passing your quizzes!",
        ]) +
        CTA("{{siteUrl}}/programs/easy-smart-spoken-english", "Enroll in the Free Course Now") +
        NOTE("(If you've already enrolled, keep going! Lesson 2 is waiting for you.)") +
        SIGN_OFF("Best,", "Flybridge Academic Team") +
        SPACER
    ),
  },
  {
    id: "nurture-resources",
    name: "Free resources & practice sheets",
    description: "Day-6 push for the free IELTS practice resources inside the student portal.",
    events: ["user.registered"],
    subject: "Free Download: Essential IELTS Reading & Speaking Practice Sheets 📚",
    previewBody:
      "Curated practice workbooks and strategy guides with a download CTA.",
    body: withShell(
      TEXT_BLOCK(
        "Smart preparation",
        "Hi {{user.name|first}}, practice with the right materials",
        "Smart preparation is all about practicing with the right materials. We have curated free IELTS practice workbooks, vocabulary sheets, and strategy frameworks inside your student portal."
      ) +
        SECTION_LABEL("Featured Resources Available Now") +
        CHECKLIST([
          "IELTS Reading Pattern Recognition Guide",
          "Speaking Part 2 &amp; 3 Cue Card Templates",
          "Listening Keyword Location Techniques",
        ]) +
        CTA("{{siteUrl}}/resources", "Access &amp; Download Your Free Resources") +
        NOTE("Download them today and practice alongside your daily study schedule.") +
        SIGN_OFF("Happy Learning,", "Flybridge Education Group") +
        SPACER
    ),
  },
  {
    id: "nurture-readiness",
    name: "Study Abroad readiness assessment",
    description: "Day-9 nudge to run the AI-powered Study Abroad Readiness Checker.",
    events: ["user.registered"],
    subject: "How ready are you to Study Abroad? (Check your Readiness Score) ✈️",
    previewBody:
      "Friendly nudge toward the AI Readiness Checker with a 'check now' CTA.",
    body: withShell(
      TEXT_BLOCK(
        "Study abroad",
        "How ready are you, {{user.name|first}}?",
        "Preparing for IELTS is only half the journey — the real goal is securing your place at a top foreign university."
      ) +
        `<tr><td style="padding:14px 40px 0;"><p style="margin:0;color:#4A5570;font-size:14px;line-height:1.7;">Have you checked your Study Abroad Readiness Score on Flybridge yet? Our AI-powered Readiness Checker evaluates your academic profile, country preferences, and budget to give you an instant assessment.</p></td></tr>` +
        CTA("{{siteUrl}}/readiness", "Check Your Readiness Score Now") +
        NOTE("(Already completed your assessment? Great job! Our counselors will review your profile shortlists.)") +
        SIGN_OFF("Best regards,", "Flybridge International Advisory Team") +
        SPACER
    ),
  },
  {
    id: "nurture-certificate",
    name: "Certificate motivation & completion push",
    description: "Day-12 (or 50%+ progress) push to finish quizzes and earn the verified certificate.",
    events: ["user.registered", "course.progress_updated"],
    subject: "Earn your Official Flybridge Certificate of Completion! 🏆",
    previewBody:
      "Motivates completion with next steps and the resume-course CTA.",
    body: withShell(
      TEXT_BLOCK(
        "Your achievement",
        "Show off your progress, {{user.name|first}}!",
        "Did you know? Achieving a 60% pass mark or higher across your course quizzes unlocks your Official Flybridge Certificate of Completion!"
      ) +
        `<tr><td style="padding:14px 40px 0;"><p style="margin:0;color:#4A5570;font-size:14px;line-height:1.7;">Each certificate comes with a unique Verification ID and QR Code, making it a great addition to your professional profile or portfolio.</p></td></tr>` +
        SECTION_LABEL("Your Next Steps") +
        CHECKLIST([
          "Complete your remaining course lessons.",
          "Pass the end-of-module quizzes with at least 60%.",
          "Download your verified certificate directly from your dashboard!",
        ]) +
        CTA("{{siteUrl}}/dashboard/courses/mine", "Resume Course &amp; Get Certified") +
        NOTE("Finish your course today and show off your achievement!") +
        SIGN_OFF("Warmly,", "Ahmed Rasel — Founder &amp; CEO, Flybridge Education Group") +
        SPACER
    ),
  },
];

export function emailTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function emailTemplatesForEvent(event: EventName | null): EmailTemplate[] {
  if (!event) return EMAIL_TEMPLATES;
  return EMAIL_TEMPLATES.filter((t) => t.events.includes(event));
}