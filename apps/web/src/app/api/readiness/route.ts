import { NextRequest, NextResponse } from "next/server";
import {
  computeReadiness,
  isReadinessAnswer,
} from "@/lib/readiness/questions";
import { generateReadinessReport } from "@/lib/ai/readiness";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = rateLimit(`readiness:${clientIp(request)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: { answers?: unknown } = {};
  try {
    body = (await request.json()) as { answers?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isReadinessAnswer(body.answers)) {
    return NextResponse.json(
      { error: "Please answer every question before generating your score" },
      { status: 400 }
    );
  }

  try {
    const result = computeReadiness(body.answers);
    const reportStream = await generateReadinessReport(result);

    const encoder = new TextEncoder();
    const sse = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ score: result })}\n\n`)
        );
        const reader = reportStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value.text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: value.text })}\n\n`)
              );
            }
          }
        } catch (error) {
          console.error("readiness stream error", error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
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
    console.error("readiness error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}