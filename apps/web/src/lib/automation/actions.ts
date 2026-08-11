import "server-only";

import { sendEmail } from "@/lib/email";
import { User } from "@/lib/models/user";
import { Notification } from "@/lib/models/notification";
import { connectDb } from "@/lib/db";
import { resolvePath } from "./conditions";
import { renderTemplate } from "./template";
import type { AutomationNode, RecipientSetting } from "./types";
import type { EventPayload } from "@/lib/events/types";

export type ActionResult = {
  ok: boolean;
  error?: string;
  detail?: unknown;
};

async function resolveRecipients(setting: RecipientSetting, payload: EventPayload): Promise<string[]> {
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
      const emails = await User.find({ email: { $regex: /@/ } }, { projection: { email: 1 } })
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
  const recipients = await resolveRecipients(data.to ?? { mode: "path", value: "user.email" }, payload);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipients resolved for email action" };
  }
  const subject = renderTemplate(data.subject ?? "FlyBridge notification", payload);
  const body = renderTemplate(data.body ?? "", payload);
  const html = `<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;"><div style="background:#0FA968;border-radius:16px 16px 0 0;padding:18px 24px;color:#fff;font-weight:700;letter-spacing:0.5px;">FlyBridge</div><div style="border:1px solid #E7EAF2;border-top:none;border-radius:0 0 16px 16px;padding:24px;color:#122043;font-size:14px;line-height:1.7;white-space:pre-wrap;">${body.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</div></div>`;
  const result = await sendEmail({ to: recipients, subject, html });
  if (!result.ok) return { ok: false, error: result.error ?? "Email send failed" };
  return { ok: true, detail: { recipients: recipients.length } };
}

async function actionSendNotification(node: AutomationNode, payload: EventPayload): Promise<ActionResult> {
  const data = node.data;
  const title = renderTemplate(data.title ?? "Automation notification", payload);
  const message = renderTemplate(data.message ?? "", payload);

  const roleQuery = (data.roles ?? "staff").split(",").map((r) => r.trim()).filter(Boolean);
  const allowed: string[] = ["admin", "moderator", "user"];
  const roles = roleQuery.length > 0 ? roleQuery.filter((r) => allowed.includes(r)) : ["admin", "moderator"];
  if (roles.length === 0) return { ok: false, error: "Invalid recipient roles" };

  const recipients = await User.find({ accountType: { $in: roles as never } }).select("_id").lean();
  if (recipients.length === 0) return { ok: true, detail: { recipients: 0 } };

  await Notification.insertMany(
    recipients.map((r) => ({
      recipient: r._id,
      type: "automation",
      title,
      message,
    }))
  );
  return { ok: true, detail: { recipients: recipients.length } };
}

async function actionWebhook(node: AutomationNode, payload: EventPayload): Promise<ActionResult> {
  const data = node.data;
  const url = (data.url ?? "").trim();
  if (!url) return { ok: false, error: "Webhook URL is required" };

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
    body: data.method === "GET" ? undefined : JSON.stringify({ event: node.data.event ?? null, payload }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    return { ok: false, error: `Webhook responded ${res.status}` };
  }
  return { ok: true, detail: { status: res.status } };
}

export async function executeAction(node: AutomationNode, payload: EventPayload): Promise<ActionResult> {
  await connectDb();
  switch (node.data.actionType) {
    case "send_email":
      return actionSendEmail(node, payload);
    case "send_notification":
      return actionSendNotification(node, payload);
    case "webhook":
      return actionWebhook(node, payload);
    default:
      return { ok: false, error: `Unknown action type: ${node.data.actionType ?? "none"}` };
  }
}
