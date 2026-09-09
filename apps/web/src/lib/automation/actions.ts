import "server-only";

import { sendEmail } from "@/lib/email";
import { User } from "@/lib/models/user";
import { Notification } from "@/lib/models/notification";
import { connectDb } from "@/lib/db";
import { resolvePath } from "./conditions";
import { renderTemplate } from "./template";
import { emailTemplateById } from "./email-templates";
import { pushToUsers } from "@/lib/push";
import { assertSafeFetchUrl } from "@/lib/url-safety";
import { MAX_DELAY_MS, SYNC_DELAY_MAX_MS, type AutomationNode, type RecipientSetting } from "./types";
import type { EventPayload } from "@/lib/events/types";

export type ActionResult = {
  ok: boolean;
  error?: string;
  detail?: unknown;
};

async function resolveRecipients(
  setting: RecipientSetting,
  payload: EventPayload,
): Promise<string[]> {
  switch (setting.mode) {
    case "path": {
      const value = resolvePath(payload, setting.value);
      if (Array.isArray(value)) return value.map((v) => String(v));
      if (value) return [String(value)];
      return [];
    }
    case "fixed":
      return setting.value
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter(Boolean);
    case "role": {
      const emails = await User.find({ email: { $regex: /@/ } })
        .select("email")
        .limit(500)
        .lean();
      return emails.map((u) => u.email as string);
    }
    default:
      return [];
  }
}

async function actionSendEmail(node: AutomationNode, payload: EventPayload): Promise<ActionResult> {
  const data = node.data;
  const recipients = await resolveRecipients(
    data.to ?? { mode: "path", value: "user.email" },
    payload,
  );
  if (recipients.length === 0) {
    const mode = data.to?.mode ?? "path";
    return {
      ok: false,
      error:
        mode === "path"
          ? `No recipients resolved — payload path "${data.to?.value ?? "user.email"}" is empty for this event. Use "All registered users" or a fixed email list instead.`
          : "No recipients resolved for email action",
    };
  }
  const template = data.templateId ? emailTemplateById(data.templateId) : undefined;
  const subject = renderTemplate(
    template?.subject ?? data.subject ?? "FlyBridge notification",
    payload,
  );
  const html = template
    ? template.html(payload)
    : `<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0FA968;border-radius:16px 16px 0 0;padding:18px 24px;color:#fff;font-weight:700;letter-spacing:0.5px;">FlyBridge</div><div style="border:1px solid #E7EAF2;border-top:none;border-radius:0 0 16px 16px;padding:24px;color:#122043;font-size:14px;line-height:1.7;white-space:pre-wrap;">${renderTemplate(
        data.body ?? "",
        payload,
      )
        .replace(/</g, "&lt;")
        .replace(/\n/g, "<br/>")}</div></div>`;
  const result = await sendEmail({ to: recipients, subject, html });
  if (!result.ok) return { ok: false, error: result.error ?? "Email send failed" };
  return { ok: true, detail: { recipients: recipients.length } };
}

async function actionSendNotification(
  node: AutomationNode,
  payload: EventPayload,
): Promise<ActionResult> {
  const data = node.data;
  const title = renderTemplate(data.title ?? "Automation notification", payload);
  const message = renderTemplate(data.message ?? "", payload);

  const roleQuery = (data.roles ?? "staff")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
  const allowed: string[] = ["admin", "moderator", "user"];
  const roles =
    roleQuery.length > 0 ? roleQuery.filter((r) => allowed.includes(r)) : ["admin", "moderator"];
  if (roles.length === 0) return { ok: false, error: "Invalid recipient roles" };

  const recipients = await User.find({ accountType: { $in: roles as never } })
    .select("_id")
    .lean();
  if (recipients.length === 0) return { ok: true, detail: { recipients: 0 } };

  await Notification.insertMany(
    recipients.map((r) => ({
      recipient: r._id,
      type: "automation",
      title,
      message,
    })),
  );
  void pushToUsers(
    recipients.map((r) => r._id),
    { title, body: message, url: "/dashboard/notifications" },
    { urgency: "high" },
  ).catch((error) => {
    console.error("[push] failed to send automation notification:", error);
  });
  return { ok: true, detail: { recipients: recipients.length } };
}

async function actionDelay(node: AutomationNode): Promise<ActionResult> {
  const duration = Math.max(0, Number(node.data.duration ?? 0));
  if (duration <= 0) return { ok: false, error: "Delay duration must be greater than zero" };
  const unit = node.data.unit === "seconds"
    ? 1000
    : node.data.unit === "hours"
      ? 60 * 60 * 1000
      : node.data.unit === "days"
        ? 24 * 60 * 60 * 1000
        : 60 * 1000;
  const ms = Math.min(duration * unit, MAX_DELAY_MS);

  // Short delays (≤1 min) keep running synchronously inside the event request.
  if (ms <= SYNC_DELAY_MAX_MS) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return { ok: true, detail: { waitedMs: ms, duration, unit: node.data.unit ?? "minutes" } };
  }

  // Long delays can't block the request — the engine persists a scheduled run
  // that the cron resumes when the wait elapses.
  return {
    ok: true,
    detail: {
      scheduled: true,
      scheduleAt: new Date(Date.now() + ms).toISOString(),
      duration,
      unit: node.data.unit ?? "minutes",
    },
  };
}

async function actionWebhook(node: AutomationNode, payload: EventPayload): Promise<ActionResult> {
  const data = node.data;
  const url = (data.url ?? "").trim();
  if (!url) return { ok: false, error: "Webhook URL is required" };

  try {
    await assertSafeFetchUrl(url);
  } catch (error) {
    return { ok: false, error: `Webhook URL is not allowed: ${error instanceof Error ? error.message : "unsafe URL"}` };
  }

  let headers: Record<string, string> = {};
  if (data.headers) {
    try {
      headers = JSON.parse(data.headers);
    } catch {
      return { ok: false, error: "Webhook headers must be valid JSON" };
    }
  }

  const res = await fetch(url, {
    method: data.method ?? "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body:
      data.method === "GET"
        ? undefined
        : JSON.stringify({ event: node.data.event ?? null, payload }),
    signal: AbortSignal.timeout(10_000),
    redirect: "error",
  });
  if (!res.ok) {
    return { ok: false, error: `Webhook responded ${res.status}` };
  }
  return { ok: true, detail: { status: res.status } };
}

export async function executeAction(
  node: AutomationNode,
  payload: EventPayload,
): Promise<ActionResult> {
  await connectDb();
  switch (node.data.actionType) {
    case "send_email":
      return actionSendEmail(node, payload);
    case "send_notification":
      return actionSendNotification(node, payload);
    case "webhook":
      return actionWebhook(node, payload);
    case "delay":
      return actionDelay(node);
    default:
      return { ok: false, error: `Unknown action type: ${node.data.actionType ?? "none"}` };
  }
}
