import "server-only";

import type { AiMessage, AiStreamChunk } from "@/lib/ai/provider";

type StreamOptions = {
  url: string;
  apiKey: string;
  model: string;
  system: string;
  messages: AiMessage[];
  signal?: AbortSignal;
};

/** Parse an SSE "data: ..." line and return its JSON payload (null for [DONE]). */
function sseData(line: string): unknown | null {
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function choiceDelta(payload: unknown): string | undefined {
  const choice = (payload as { choices?: Array<{ delta?: { content?: string } }> }).choices?.[0];
  return choice?.delta?.content;
}

/** Streams an OpenAI-compatible chat completion as deltas. */
export async function streamOpenAiCompatible({
  url,
  apiKey,
  model,
  system,
  messages,
  signal,
}: StreamOptions): Promise<ReadableStream<AiStreamChunk>> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.3,
      max_tokens: 1024,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<AiStreamChunk>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const data = sseData(line);
            if (!data) continue;
            const delta = choiceDelta(data);
            if (delta) controller.enqueue({ text: delta, done: false });
          }
        }

        if (buffer) {
          const data = sseData(buffer);
          if (data) {
            const delta = choiceDelta(data);
            if (delta) controller.enqueue({ text: delta, done: false });
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        throw error;
      } finally {
        reader.releaseLock();
        controller.enqueue({ text: "", done: true });
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

/** Streams a canned reply (used by providers while they await a real key). */
export function placeholderStream(text: string): ReadableStream<AiStreamChunk> {
  const chunks = text.match(/[^]{1,24}/g) ?? [text];
  return new ReadableStream<AiStreamChunk>({
    async start(controller) {
      for (const chunk of chunks) {
        await new Promise((r) => setTimeout(r, 24));
        controller.enqueue({ text: chunk, done: false });
      }
      controller.enqueue({ text: "", done: true });
      controller.close();
    },
  });
}
