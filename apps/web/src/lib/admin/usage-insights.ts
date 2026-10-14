import "server-only";

import { getProvider, type AiMessage } from "@/lib/ai/provider";
import type { AdminUsageAnalytics } from "@/lib/admin/overview-analytics-types";

export type UsageInsightSeverity = "positive" | "neutral" | "warning";

export type UsageInsight = {
  title: string;
  detail: string;
  severity: UsageInsightSeverity;
};

export type UsageInsights = {
  summary: string;
  insights: UsageInsight[];
};

const SYSTEM = [
  "You are a product analytics writer for FlyBridge, an education platform for international students.",
  "You receive aggregate, anonymised usage metrics for a time window and must explain what they mean to the platform team.",
  "Write in plain, confident English. Be concrete and reference the numbers you were given.",
  "Never invent data that is not in the payload. If data is sparse, say so.",
  "Return strict JSON only, shaped as:",
  '{"summary": string, "insights": [{"title": string, "detail": string, "severity": "positive" | "neutral" | "warning"}]}',
  "Provide 3 to 5 insights. The summary must be a single paragraph of at most 80 words.",
].join(" ");

function compactPayload(analytics: AdminUsageAnalytics) {
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  return {
    window: analytics.range.label,
    metrics: analytics.metrics,
    totals: {
      pageViews: sum(analytics.usageTrend.pageViews),
      lessonViews: sum(analytics.usageTrend.lessonViews),
      quizStarts: sum(analytics.usageTrend.quizStarts),
      quizAttempts: sum(analytics.usageTrend.quizAttempts),
    },
    topPages: analytics.topPages.slice(0, 6).map((page) => ({
      path: page.path,
      views: page.views,
      members: page.members,
    })),
    topLessons: analytics.topLessons.slice(0, 6).map((lesson) => ({
      course: lesson.courseTitle,
      lesson: lesson.lessonTitle,
      views: lesson.views,
      members: lesson.members,
    })),
    topQuizzes: analytics.topQuizzes.slice(0, 6).map((quiz) => ({
      course: quiz.courseTitle,
      lesson: quiz.lessonTitle,
      attempts: quiz.attempts,
      averageScore: quiz.averageScore,
    })),
  };
}

function extractJsonObject(text: string): Record<string, unknown> {
  const candidate = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("AI did not return a JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
}

function severity(value: unknown): UsageInsightSeverity {
  return value === "positive" || value === "warning" ? value : "neutral";
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export async function generateUsageInsights(
  analytics: AdminUsageAnalytics,
): Promise<UsageInsights> {
  const provider = await getProvider();
  const stream = await provider.streamChat({
    model: process.env.AI_MODEL ?? "",
    system: SYSTEM,
    messages: [
      { role: "user", content: JSON.stringify(compactPayload(analytics)) },
    ] satisfies AiMessage[],
    jsonMode: true,
    maxTokens: 1400,
  });

  const reader = stream.getReader();
  let full = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += value.text;
    }
  } finally {
    reader.releaseLock();
  }

  const json = extractJsonObject(full);
  const rawInsights = Array.isArray(json.insights) ? json.insights : [];
  const insights: UsageInsight[] = rawInsights
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        title: cleanText(item.title),
        detail: cleanText(item.detail),
        severity: severity(item.severity),
      };
    })
    .filter((entry) => entry.title && entry.detail)
    .slice(0, 5);

  return {
    summary: cleanText(json.summary),
    insights,
  };
}
