import { NextRequest, NextResponse } from "next/server";

import { streamChatReply, type ChatRequestMessage } from "@/lib/ai/chat";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatBody = {
  messages?: unknown;
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(`chat:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: ChatBody = {};
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const messages: ChatRequestMessage[] = [];
  for (const raw of body.messages) {
    const role = (raw as { role?: unknown }).role;
    const content = (raw as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid message shape" }, { status: 400 });
    }
    messages.push({ role, content });
  }

  if (messages.filter((m) => m.role === "user").length === 0) {
    return NextResponse.json({ error: "At least one user message is required" }, { status: 400 });
  }

  try {
    const { stream, sources } = await streamChatReply(messages);

    const encoder = new TextEncoder();
    const sse = stream.pipeThrough(
      new TransformStream<import("@/lib/ai/provider").AiStreamChunk, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ ...chunk })}\n\n`)
          );
        },
      })
    );

    return new NextResponse(sse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Knowledge-Sources": encodeURIComponent(
          sources.map((s) => `${s.source}:${s.heading}`).join("|")
        ),
      },
    });
  } catch (error) {
    console.error("chat error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
