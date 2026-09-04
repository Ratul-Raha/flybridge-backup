import "server-only";

import type { EventName } from "@/lib/events/types";
import { eventLabel } from "@/lib/events/catalog";

const TELEGRAM_API = "https://api.telegram.org";

export class TelegramError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message);
    this.name = "TelegramError";
  }
}

const CHAT_ID_RE = /^-?\d+$/;

export function isValidChatId(id: string): boolean {
  return CHAT_ID_RE.test(id);
}

/**
 * Translate Telegram API errors into messages that tell the admin how to fix
 * the problem, instead of exposing the raw API description.
 */
export function telegramErrorHint(error: unknown): string {
  if (!(error instanceof TelegramError)) {
    return error instanceof Error ? error.message : String(error);
  }
  const msg = error.message.toLowerCase();
  if (msg.includes("chat not found")) {
    return 'Telegram can\'t find this chat. Make sure you pressed "Start" on your bot (or added the bot to the group), and that the chat ID is correct — group & channel IDs usually start with "-" or "-100".';
  }
  if (msg.includes("bot was blocked") || msg.includes("bot blocked")) {
    return "This bot has been blocked by the user. Ask them to press Start again on the bot.";
  }
  if (msg.includes("bot was kicked") || msg.includes("removed from the group")) {
    return "The bot was removed from this group. Re-add the bot to the group and try again.";
  }
  if (msg.includes("too many requests")) {
    return "Telegram is rate-limiting this bot. Wait a few seconds and try again.";
  }
  if (error.code === 401 || msg.includes("unauthorized")) {
    return "Could not authenticate with this bot token. Check the token in @BotFather and update it here.";
  }
  return error.message;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode?: "HTML" | "MarkdownV2",
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const desc = (body as { description?: string })?.description ?? res.statusText;
    throw new TelegramError(`Telegram API error ${res.status}: ${desc}`, res.status);
  }
}

function val(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  return String(v);
}

function money(v: unknown, currency?: unknown): string {
  if (v === undefined || v === null) return "—";
  const num = typeof v === "number" ? v : Number(v);
  if (isNaN(num)) return String(v);
  const ccy = typeof currency === "string" ? currency.toUpperCase() : "USD";
  return `${(num / 100).toFixed(2)} ${ccy}`;
}

export function formatEventMessage(eventName: EventName, payload: Record<string, unknown>): string {
  const label = eventLabel(eventName);
  const lines: (string | null)[] = [`<b>${label}</b>`, ""];

  const user = payload.user as Record<string, unknown> | undefined;
  const seminar = payload.seminar as Record<string, unknown> | undefined;
  const course =
    (payload.course as Record<string, unknown> | undefined) ??
    (payload.enrollment as Record<string, unknown> | undefined);
  const order = payload.order as Record<string, unknown> | undefined;
  const resource = payload.resource as Record<string, unknown> | undefined;
  const scholarship = payload.scholarship as Record<string, unknown> | undefined;
  const actor = payload.actor as Record<string, unknown> | undefined;
  const changedFields =
    Array.isArray(payload.changedFields) && payload.changedFields.length
      ? (payload.changedFields as unknown[]).map((f) => String(f))
      : [];

  const actorLine = (): string | null =>
    actor?.name || actor?.email
      ? `By: ${val(actor?.name)}${actor?.email ? ` (${val(actor.email)})` : ""}`
      : null;
  const changedLine = (): string | null =>
    changedFields.length ? `Changed: <b>${changedFields.join(", ")}</b>` : null;

  const formatDateTime = (iso?: unknown): string | null => {
    if (typeof iso !== "string" || !iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };
  const orderStatus = (status?: unknown): string => String(status ?? "").toUpperCase();
  const priceLabel = (price?: unknown, currency?: unknown): string => {
    const ccy = typeof currency === "string" && currency ? currency.toUpperCase() : "USD";
    return `${money(price, currency)} ${ccy}`;
  };
  const semType = (t?: unknown): string => (t === "paid" ? "Paid" : t === "free" ? "Free" : val(t));

  switch (eventName) {
    case "user.registered":
      lines.push(
        `<b>${val(user?.name)}</b>`,
        `Email: ${val(user?.email)}`,
        user?.phone ? `Phone: ${val(user?.phone)}` : null,
        `Account type: ${val(user?.accountType)}`,
      );
      break;

    case "seminar.registration_created":
      lines.push(
        `By <b>${val(user?.name)}</b> (${val(user?.email)})`,
        user?.phone ? `Phone: ${val(user?.phone)}` : null,
        "",
        `Seminar: <b>${val(seminar?.title)}</b>`,
        seminar?.type ? `Type: ${semType(seminar.type)}` : null,
        seminar?.price !== undefined && seminar?.type === "paid"
          ? `Price: ${priceLabel(seminar.price)}`
          : seminar?.price !== undefined
            ? "Price: Free"
            : null,
        ...(formatDateTime(seminar?.dateTime)
          ? [`When: ${formatDateTime(seminar?.dateTime)}`]
          : []),
        seminar?.duration ? `Duration: ${val(seminar.duration)}` : null,
      );
      break;

    case "seminar.created":
      lines.push(
        `Seminar: <b>${val(seminar?.title)}</b>`,
        seminar?.type ? `Type: ${semType(seminar.type)}` : null,
        seminar?.price !== undefined && seminar?.type === "paid"
          ? `Price: ${priceLabel(seminar.price)}`
          : seminar?.price !== undefined
            ? "Price: Free"
            : null,
        ...(formatDateTime(seminar?.dateTime)
          ? [`When: ${formatDateTime(seminar?.dateTime)}`]
          : []),
        seminar?.duration ? `Duration: ${val(seminar.duration)}` : null,
        actorLine(),
      );
      break;

    case "seminar.updated":
      lines.push(`Seminar: <b>${val(seminar?.title)}</b>`, actorLine(), changedLine());
      break;

    case "seminar.deleted":
      lines.push(
        `Seminar: <b>${val(seminar?.title)}</b>`,
        actorLine(),
        "This seminar has been removed.",
      );
      break;

    case "course.launched":
      lines.push(
        `Course: <b>${val(course?.title)}</b>`,
        course?.badge ? `Badge: ${val(course.badge)}` : null,
        course?.price !== undefined ? `Price: ${priceLabel(course.price)}` : null,
      );
      break;

    case "course.created":
      lines.push(
        `Course: <b>${val(course?.title)}</b>`,
        course?.slug ? `Slug: ${val(course.slug)}` : null,
        course?.badge ? `Badge: ${val(course.badge)}` : null,
        course?.price !== undefined ? `Price: ${priceLabel(course.price)}` : null,
        actorLine(),
      );
      break;

    case "course.updated":
      lines.push(`Course: <b>${val(course?.title)}</b>`, actorLine(), changedLine());
      break;

    case "course.deleted":
      lines.push(
        `Course: <b>${val(course?.title)}</b>`,
        actorLine(),
        "This course has been removed.",
      );
      break;

    case "course.enrolled":
      lines.push(
        `Student: <b>${val(user?.name)}</b> (${val(user?.email)})`,
        `Course: <b>${val(course?.title)}</b>`,
        course?.slug ? `Slug: ${val(course.slug)}` : null,
        course?.price !== undefined ? `Price: ${priceLabel(course.price)}` : null,
      );
      break;

    case "order.created":
    case "order.fulfilled":
      lines.push(
        `Order: <b>#${val(order?.id).slice(-8)}</b>`,
        `By: ${val(user?.name)}${user?.email ? ` (${val(user.email)})` : ""}`,
      );
      if (Array.isArray(order?.items)) {
        const items = (order!.items as Record<string, unknown>[]).map((i) => {
          const title = val(i.title);
          const price =
            typeof i.price === "number" ? ` — ${priceLabel(String(i.price), order?.currency)}` : "";
          return `• ${title}${price}`;
        });
        if (items.length) {
          lines.push("Items:");
          lines.push(...items);
        }
      }
      lines.push(`Total: <b>${priceLabel(order?.total, order?.currency)}</b>`);
      lines.push(`Status: ${orderStatus(order?.status)}`);
      break;

    case "resource.created":
      lines.push(
        `Resource: <b>${val(resource?.title)}</b>`,
        resource?.category ? `Category: ${val(resource.category)}` : null,
        resource?.fileType ? `Type: ${val(resource.fileType)}` : null,
        resource?.access ? `Access: ${val(resource.access)}` : null,
        resource?.price !== undefined && Number(resource.price) > 0
          ? `Price: ${priceLabel(resource.price)}`
          : resource?.access === "members"
            ? "Price: Members"
            : "Price: Free",
        actorLine(),
      );
      break;

    case "scholarship.created":
      lines.push(
        `Scholarship: <b>${val(scholarship?.title)}</b>`,
        scholarship?.institution ? `Institution: ${val(scholarship.institution)}` : null,
        scholarship?.country ? `Country: ${val(scholarship.country)}` : null,
        scholarship?.level ? `Level: ${val(scholarship.level)}` : null,
        scholarship?.amount ? `Amount: ${val(scholarship.amount)}` : null,
        scholarship?.deadline ? `Deadline: ${val(scholarship.deadline)}` : null,
        actorLine(),
      );
      break;

    default:
      lines.push(`Event: ${val(eventName)}`);
      break;
  }

  return lines.filter((l): l is string => l !== null).join("\n");
}

export function formatTestMessage(botName: string): string {
  return [
    `<b>${botName} — Telegram Connected</b>`,
    "",
    "System notifications are now active.",
    `Timestamp: ${new Date().toISOString()}`,
  ].join("\n");
}
