import "server-only";

import type { AiMessage, AiStreamChunk } from "@/lib/ai/provider";
import { getProvider } from "@/lib/ai/provider";
import { loadKnowledgeBase, retrieveKnowledge, type RetrievedChunk } from "@/lib/ai/knowledge";

export type ChatRequestMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatStreamResult = {
  stream: ReadableStream<AiStreamChunk>;
  sources: RetrievedChunk[];
};

const MAX_HISTORY = 12;

export async function buildSystemPrompt(query: string): Promise<{
  system: string;
  sources: RetrievedChunk[];
}> {
  const chunks = await loadKnowledgeBase();
  const sources = retrieveKnowledge(chunks, query);

  const knowledge = sources.length
    ? sources
        .map((s) => `### ${s.heading}\n${s.content}`)
        .join("\n\n---\n\n")
    : "(No matching knowledge was found for this question.)";

  const system = [
    "You are Bridge, the friendly support assistant for FlyBridge Education Group —",
    "a company that helps international students and professionals study, work and build",
    "a career abroad. You answer visitors' questions using ONLY the knowledge base below.",
    "",
    "## Rules",
    "- Answer directly and helpfully, in the same language the visitor uses.",
    "- Base every answer on the knowledge base. Never invent programs, prices, dates or policies.",
    "- If the knowledge base does not contain the answer, say so honestly and point the",
    "  visitor to the relevant page (e.g. /programs, /seminars) or to contact the team.",
    "- When you mention a specific program or seminar, include its link as a markdown",
    "  link with descriptive anchor text, e.g. [Student Visa Blueprint](https://flybridgeedu.com/programs/study-visa-prep-us),",
    "  using exactly the links provided in the knowledge base. Never invent URLs.",
    "- Keep answers concise. Use short paragraphs or bullets when it helps.",
    "- Do not claim to be human. You are the FlyBridge support bot.",
    "",
    "## Knowledge base",
    knowledge,
  ].join("\n");

  return { system, sources };
}

export async function streamChatReply(
  messages: ChatRequestMessage[]
): Promise<ChatStreamResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content.trim() ?? "";

  const { system, sources } = await buildSystemPrompt(query);

  const history: AiMessage[] = messages
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));

  const provider = await getProvider();
  const stream = await provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system,
    messages: history,
  });

  return { stream, sources };
}
