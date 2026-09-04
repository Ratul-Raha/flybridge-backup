import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { BotConfig } from "@/lib/models/bot-config";
import {
  sendTelegramMessage,
  formatTestMessage,
  telegramErrorHint,
} from "@/lib/notifications/telegram";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();
  const config = await BotConfig.findOne().lean();
  if (!config) {
    return NextResponse.json({ error: "Bot config not found" }, { status: 404 });
  }

  const telegram = (
    config.channels as
      { telegram?: { enabled?: boolean; botToken?: string; chatIds?: string[] } } | undefined
  )?.telegram;

  const botToken = telegram?.botToken ?? "";
  const chatIds = (telegram?.chatIds ?? []).filter(Boolean);

  if (!botToken) {
    return NextResponse.json({ error: "Telegram bot token is not configured" }, { status: 400 });
  }
  if (!chatIds.length) {
    return NextResponse.json({ error: "No Telegram chat ID configured" }, { status: 400 });
  }

  const message = formatTestMessage((config.name as string) ?? "Bridge Ops");

  const results = [];
  for (const chatId of chatIds) {
    try {
      await sendTelegramMessage(botToken, chatId, message, "HTML");
      results.push({ chatId, ok: true });
    } catch (error) {
      results.push({ chatId, ok: false, error: telegramErrorHint(error) });
    }
  }

  if (!results.some((r: { ok: boolean }) => r.ok)) {
    return NextResponse.json({ success: false, results }, { status: 400 });
  }

  return NextResponse.json({ success: true, results });
}
