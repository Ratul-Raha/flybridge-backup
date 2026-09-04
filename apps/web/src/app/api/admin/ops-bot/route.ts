import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { streamOpsBotReply, confirmToolAction } from "@/lib/ai/ops-bot";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatBody = {
  message?: string;
  conversationId?: string | null;
};

type ConfirmBody = {
  auditLogId?: string;
};

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "confirm") {
    return handleConfirm(request, session.userId ?? session.uid);
  }

  let body: ChatBody = {};
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const controller = new AbortController();

  request.signal.addEventListener("abort", () => controller.abort());

  try {
    const stream = streamOpsBotReply(
      body.conversationId ?? null,
      body.message.trim(),
      session.userId ?? session.uid,
      session.name,
      controller.signal
    );

    const sse = new ReadableStream<Uint8Array>({
      async start(sseController) {
        try {
          for await (const chunk of stream) {
            sseController.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          }
        } catch (error) {
          if ((error as Error).name === "AbortError") return;
          console.error("[ops-bot] Stream error:", error);
          const msg =
            error instanceof Error
              ? error.message.includes("LLM request failed")
                ? "AI provider error — please try again"
                : error.message.includes("GROQ_API_KEY")
                  ? "AI provider not configured"
                  : error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")
                    ? "Could not reach AI provider — check your connection"
                    : "Stream interrupted"
              : "Stream interrupted";
          sseController.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`
            )
          );
        } finally {
          sseController.close();
        }
      },
      cancel() {
        controller.abort();
      },
    });

    return new NextResponse(sse, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[ops-bot] Error:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: message.includes("GROQ_API_KEY") ? message : "Something went wrong" },
      { status: 500 }
    );
  }
}

async function handleConfirm(request: NextRequest, userId: string) {
  let body: ConfirmBody = {};
  try {
    body = (await request.json()) as ConfirmBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.auditLogId) {
    return NextResponse.json({ error: "auditLogId is required" }, { status: 400 });
  }

  try {
    const result = await confirmToolAction(body.auditLogId, userId);
    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Confirmation failed" },
      { status: 400 }
    );
  }
}
