import "server-only";

import { connectDb } from "@/lib/db";
import { BotConfig } from "@/lib/models/bot-config";
import { BotTool } from "@/lib/models/bot-tool";
import { BotRule } from "@/lib/models/bot-rule";
import { BotKnowledge } from "@/lib/models/bot-knowledge";
import { BotConversation } from "@/lib/models/bot-conversation";
import { BotMessage } from "@/lib/models/bot-message";
import { BotAuditLog } from "@/lib/models/bot-audit-log";
import { OPS_TOOLS, getToolSchemaForLLM } from "@/lib/ai/ops-tools";
import { executeTool, type ToolResult } from "@/lib/ops/tool-runner";

export type OpsToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type OpsStreamChunk =
  | { type: "text"; text: string }
  | { type: "tool_call"; toolCall: OpsToolCall }
  | { type: "confirmation"; auditLogId: string; preview: ToolResult["confirmationPreview"] }
  | { type: "tool_result"; toolId: string; result: ToolResult }
  | { type: "done"; conversationId: string };

function buildSystemPrompt(
  botConfig: { name: string; tone: string; detailLevel: string; systemPrompt: string; greeting: string },
  rules: Array<{ title: string; content: string; priority: string }>,
  knowledgeChunks: Array<{ text: string; heading: string }>
): string {
  const toneMap: Record<string, string> = {
    formal: "You are a professional, formal, and precise assistant.",
    casual: "You are a friendly, casual, and approachable assistant.",
    balanced: "You are a helpful and professional assistant with a warm tone.",
  };

  const detailMap: Record<string, string> = {
    concise: "Keep responses brief and to the point. Use bullet points and short sentences.",
    detailed: "Provide thorough, detailed responses with context and explanations.",
    balanced: "Provide clear, well-structured responses. Be thorough when needed, concise when possible.",
  };

  let prompt = `${toneMap[botConfig.tone] ?? toneMap.balanced}

${detailMap[botConfig.detailLevel] ?? detailMap.balanced}

You are "${botConfig.name}", an internal operations assistant for FlyBridge Education Group. You help admin team members manage their business by querying data and performing actions.

## Capabilities
You have access to tools that can query the FlyBridge database and perform business actions. Use them whenever the user's request requires looking up or modifying data.

## Rules
- Always use the appropriate tool when the user asks about data or wants to perform an action.
- For read-only queries, execute the tool immediately and present the results clearly.
- For write actions (create, update, delete, send), the tool will return a confirmation preview. Present this to the user and wait for them to confirm before proceeding.
- Never make up data. Always use tools to get real information.
- When presenting data, format it clearly with headers, bullet points, or tables.
- If you're unsure what the user wants, ask for clarification.
- You can reference multiple tools in sequence if needed.
- Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

  if (rules.length > 0) {
    prompt += "\n\n## Business Rules & Policies\nThe following rules are active. Follow them when relevant:\n\n";
    for (const rule of rules.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1);
    })) {
      prompt += `### ${rule.title}\n${rule.content}\n\n`;
    }
  }

  if (knowledgeChunks.length > 0) {
    prompt += "\n## Knowledge Base\nThe following context may help you answer questions:\n\n";
    for (const chunk of knowledgeChunks) {
      prompt += `### ${chunk.heading || "Context"}\n${chunk.text}\n\n`;
    }
  }

  if (botConfig.systemPrompt) {
    prompt += `\n## Additional Instructions\n${botConfig.systemPrompt}\n`;
  }

  return prompt;
}

function retrieveKnowledgeChunks(
  query: string,
  chunks: Array<{ text: string; heading: string }>
): Array<{ text: string; heading: string }> {
  if (chunks.length === 0) return [];

  const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);

  const scored = chunks.map((chunk) => {
    const chunkTokens = chunk.text.toLowerCase().split(/\W+/).filter(Boolean);
    const chunkHeading = chunk.heading.toLowerCase().split(/\W+/).filter(Boolean);
    let score = 0;
    for (const qt of queryTokens) {
      for (const ct of chunkTokens) {
        if (ct === qt) score += 1;
        else if (ct.includes(qt) || qt.includes(ct)) score += 0.5;
      }
      for (const ht of chunkHeading) {
        if (ht === qt) score += 2;
      }
    }
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .filter((s) => s.score > 0)
    .map((s) => s.chunk);
}

type ApiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> }
  | { role: "tool"; tool_call_id: string; content: string };

async function streamLLMResponse(
  systemPrompt: string,
  messages: ApiMessage[],
  tools: ReturnType<typeof getToolSchemaForLLM>,
  signal?: AbortSignal
): Promise<ReadableStream<{ text?: string; toolCall?: OpsToolCall; done: boolean }>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const apiMessages: ApiMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      stream: true,
      temperature: 0.3,
      max_tokens: 4096,
      messages: apiMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      const toolCallsById = new Map<string, { name: string; argChunks: string[] }>();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            let parsed: unknown;
            try {
              parsed = JSON.parse(payload);
            } catch {
              continue;
            }

            const payload_obj = parsed as Record<string, unknown>;
            const choices = payload_obj.choices as Array<Record<string, unknown>> | undefined;
            const choice = choices?.[0] as Record<string, unknown> | undefined;
            const delta = choice?.delta as Record<string, unknown> | undefined;
            if (!delta) continue;

            const content = delta.content as string | undefined;
            if (content) {
              controller.enqueue({ text: content, done: false });
            }

            const toolCallsDelta = delta.tool_calls as Array<Record<string, unknown>> | undefined;
            if (toolCallsDelta) {
              for (const tc of toolCallsDelta) {
                const tcId = (tc.id as string) ?? `tc_${tc.index}`;
                if (!toolCallsById.has(tcId)) {
                  toolCallsById.set(tcId, { name: "", argChunks: [] });
                }
                const existing = toolCallsById.get(tcId)!;
                const func = tc.function as Record<string, unknown> | undefined;
                const funcName = func?.name as string | undefined;
                const funcArgs = func?.arguments as string | undefined;
                if (funcName) existing.name = funcName;
                if (funcArgs) existing.argChunks.push(funcArgs);
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        throw error;
      } finally {
        reader.releaseLock();

        for (const [tcId, tc] of toolCallsById) {
          if (!tc.name) continue;
          let args: Record<string, unknown> = {};
          const raw = tc.argChunks.join("");
          if (raw) {
            try {
              args = JSON.parse(raw);
            } catch {
              console.warn(`[ops-bot] Malformed tool args for ${tc.name}:`, raw.slice(0, 200));
            }
          }
          controller.enqueue({ toolCall: { id: tcId, name: tc.name, arguments: args }, done: false });
        }

        controller.enqueue({ done: true });
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

export async function* streamOpsBotReply(
  conversationId: string | null,
  userMessage: string,
  userId: string,
  userName: string,
  signal?: AbortSignal
): AsyncGenerator<OpsStreamChunk> {
  await connectDb();

  // Load or create conversation
  let conversation;
  if (conversationId) {
    conversation = await BotConversation.findById(conversationId).lean();
    if (!conversation) {
      conversation = await BotConversation.create({
        adminUser: userId,
        title: userMessage.slice(0, 80),
      });
      conversation = conversation.toObject();
    }
  } else {
    conversation = await BotConversation.create({
      adminUser: userId,
      title: userMessage.slice(0, 80),
    });
    conversation = conversation.toObject();
  }

  const convId = conversation._id.toString();

  // Load bot config (or use defaults)
  const rawConfig = await BotConfig.findOne().lean();
  let botConfig: { name: string; avatar: string; greeting: string; tone: string; detailLevel: string; systemPrompt: string; maxConversationLength: number };
  if (!rawConfig) {
    const created = await BotConfig.create({});
    botConfig = {
      name: created.name,
      avatar: created.avatar,
      greeting: created.greeting,
      tone: created.tone,
      detailLevel: created.detailLevel,
      systemPrompt: created.systemPrompt,
      maxConversationLength: created.maxConversationLength,
    };
  } else {
    botConfig = {
      name: rawConfig.name ?? "Bridge Ops",
      avatar: rawConfig.avatar ?? "",
      greeting: rawConfig.greeting ?? "",
      tone: rawConfig.tone ?? "balanced",
      detailLevel: rawConfig.detailLevel ?? "balanced",
      systemPrompt: rawConfig.systemPrompt ?? "",
      maxConversationLength: rawConfig.maxConversationLength ?? 50,
    };
  }

  // Load enabled tools config
  const enabledTools = await BotTool.find({ enabled: true }).lean();
  const enabledToolIds = new Set(enabledTools.map((t) => t.toolId));

  // Load active rules
  const rules = await BotRule.find({ status: "active" }).sort({ priority: 1 }).lean();

  // Load knowledge sources
  const knowledgeSources = await BotKnowledge.find({ status: "active" }).lean();
  const allChunks: Array<{ text: string; heading: string }> = [];
  for (const source of knowledgeSources) {
    for (const chunk of source.chunks) {
      allChunks.push({ text: chunk.text, heading: chunk.heading ?? "" });
    }
  }

  // Retrieve relevant chunks
  const relevantChunks = retrieveKnowledgeChunks(userMessage, allChunks);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(
    {
      name: botConfig.name ?? "Bridge Ops",
      tone: botConfig.tone ?? "balanced",
      detailLevel: botConfig.detailLevel ?? "balanced",
      systemPrompt: botConfig.systemPrompt ?? "",
      greeting: botConfig.greeting ?? "",
    },
    rules.map((r) => ({ title: r.title, content: r.content, priority: r.priority })),
    relevantChunks
  );

  // Load conversation history
  const historyMessages = await BotMessage.find({ conversation: convId })
    .sort({ createdAt: 1 })
    .limit(40)
    .lean();

  // Build API messages from history
  const apiMessages: ApiMessage[] = historyMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Add current user message
  apiMessages.push({ role: "user", content: userMessage });

  // Save user message
  await BotMessage.create({
    conversation: convId,
    role: "user",
    content: userMessage,
  });

  // Get tool schemas for LLM
  const toolSchemas = getToolSchemaForLLM().filter((t) =>
    enabledToolIds.has(t.function.name)
  );

  const MAX_TURNS = 4;
  let fullText = "";
  let needsConfirmation = false;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (signal?.aborted) break;

    const stream = await streamLLMResponse(systemPrompt, apiMessages, toolSchemas, signal);
    const reader = stream.getReader();

    let turnText = "";
    const toolCalls: OpsToolCall[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value.done) break;

        if (value.text) {
          turnText += value.text;
          yield { type: "text", text: value.text };
        }

        if (value.toolCall) {
          toolCalls.push(value.toolCall);
          yield { type: "tool_call", toolCall: value.toolCall };
        }
      }
    } finally {
      reader.releaseLock();
    }

    fullText += turnText;

    if (toolCalls.length === 0) break;

    // Build assistant message with tool calls for the API
    const assistantApiMsg: ApiMessage = {
      role: "assistant",
      content: turnText || "",
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
      })),
    };
    apiMessages.push(assistantApiMsg);

    // Execute tool calls and collect results
    const toolResultMessages: ApiMessage[] = [];

    for (const tc of toolCalls) {
      const toolDef = OPS_TOOLS.find((t) => t.name === tc.name);
      const toolConfig = enabledTools.find((t) => t.toolId === tc.name);
      const requiresConfirm =
        toolConfig?.confirmationRequired === "always" ||
        (toolConfig?.confirmationRequired === "destructive" && toolDef ? true : false) ||
        (!toolConfig && tc.name.startsWith("delete_"));

      const ctx = { userId, userName };
      const result = await executeTool(tc.name, tc.arguments, ctx, false);

      if (result.requiresConfirmation && requiresConfirm) {
        const auditLog = await BotAuditLog.create({
          adminUser: userId,
          conversation: convId,
          message: userMessage,
          toolId: tc.name,
          parameters: tc.arguments,
          confirmed: false,
          status: "pending_confirmation" as unknown as "success",
          result: result.confirmationPreview,
        });

        await BotMessage.create({
          conversation: convId,
          role: "assistant",
          content: turnText,
          toolCalls: [
            {
              toolId: tc.name,
              parameters: tc.arguments,
              result: result.confirmationPreview,
              status: "pending_confirmation",
              confirmed: false,
            },
          ],
          pendingConfirmation: auditLog._id,
        });

        yield {
          type: "confirmation",
          auditLogId: auditLog._id.toString(),
          preview: result.confirmationPreview,
        };
        needsConfirmation = true;
        break;
      }

      const execResult = await executeTool(tc.name, tc.arguments, ctx, true);

      await BotAuditLog.create({
        adminUser: userId,
        conversation: convId,
        message: userMessage,
        toolId: tc.name,
        parameters: tc.arguments,
        confirmed: true,
        status: execResult.success ? "success" : "error",
        result: execResult.data ?? execResult.error,
        error: execResult.error ?? "",
      });

      await BotConversation.updateOne(
        { _id: convId },
        { $addToSet: { toolsUsed: tc.name } }
      );

      yield { type: "tool_result", toolId: tc.name, result: execResult };

      toolResultMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(execResult),
      });
    }

    if (needsConfirmation) break;

    // Add tool results to messages for the next LLM turn
    apiMessages.push(...toolResultMessages);
  }

  // Save assistant message
  if (fullText) {
    await BotMessage.create({
      conversation: convId,
      role: "assistant",
      content: fullText,
    });
  }

  // Update conversation metadata
  await BotConversation.updateOne(
    { _id: convId },
    {
      $set: { lastMessageAt: new Date() },
      $inc: { messageCount: 2 },
    }
  );

  yield { type: "done", conversationId: convId };
}

export async function confirmToolAction(
  auditLogId: string,
  userId: string
): Promise<ToolResult> {
  await connectDb();

  const auditLog = await BotAuditLog.findById(auditLogId).lean();
  if (!auditLog) throw new Error("Audit log not found");
  if (auditLog.adminUser.toString() !== userId) throw new Error("Unauthorized");
  if (auditLog.confirmed) throw new Error("Already confirmed");

  const result = await executeTool(auditLog.toolId, auditLog.parameters, { userId, userName: "" }, true);

  await BotAuditLog.updateOne(
    { _id: auditLogId },
    {
      $set: {
        confirmed: true,
        status: result.success ? "success" : "error",
        result: result.data ?? result.error,
        error: result.error ?? "",
      },
    }
  );

  // Update the pending message
  await BotMessage.updateOne(
    { pendingConfirmation: auditLogId },
    {
      $set: {
        "toolCalls.0.status": result.success ? "success" : "error",
        "toolCalls.0.confirmed": true,
        "toolCalls.0.result": result.data ?? result.error,
      },
    }
  );

  return result;
}
