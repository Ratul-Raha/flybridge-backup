import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export const KNOWLEDGE_DIR = path.join(process.cwd(), "src", "lib", "ai", "knowledge");

export type KnowledgeChunk = {
  id: string;
  source: string;
  heading: string;
  content: string;
  tokens: string[];
};

export type RetrievedChunk = {
  source: string;
  heading: string;
  content: string;
};

const KB_CACHE = new Map<string, { promise: Promise<KnowledgeChunk[]>; expiresAt: number }>();

/** Dynamic sources (seminars from the database, programs from code) are
 * regenerated at most this often, so stale warm instances self-heal. */
const KB_TTL_MS = 60_000;

/** Loads every .md file in the knowledge base plus the dynamic sources
 * (seminars from the database, programs from code), split into
 * heading-scoped chunks. */
export function loadKnowledgeBase(cache = true): Promise<KnowledgeChunk[]> {
  const key = KNOWLEDGE_DIR;
  if (cache) {
    const entry = KB_CACHE.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.promise;
  }

  const promise = (async () => {
    const [staticChunks, dynamicChunks] = await Promise.all([
      loadStaticChunks(),
      loadDynamicChunks(),
    ]);
    return [...staticChunks, ...dynamicChunks];
  })();

  KB_CACHE.set(key, { promise, expiresAt: Date.now() + KB_TTL_MS });
  return promise;
}

async function loadStaticChunks(): Promise<KnowledgeChunk[]> {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(KNOWLEDGE_DIR).catch(() => []);
  const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

  const chunks: KnowledgeChunk[] = [];
  for (const file of mdFiles) {
    const raw = await readFile(path.join(KNOWLEDGE_DIR, file), "utf8");
    chunks.push(...splitMarkdown(file, raw));
  }
  return chunks;
}

async function loadDynamicChunks(): Promise<KnowledgeChunk[]> {
  const { generateDynamicChunks } = await import("@/lib/ai/knowledge-sources");
  return generateDynamicChunks();
}

export function reloadKnowledgeBase(): Promise<KnowledgeChunk[]> {
  KB_CACHE.delete(KNOWLEDGE_DIR);
  return loadKnowledgeBase(false);
}

function splitMarkdown(source: string, raw: string): KnowledgeChunk[] {
  const lines = raw.split(/\r?\n/);
  const chunks: KnowledgeChunk[] = [];
  let heading = source;
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (!content) return;
    chunks.push({
      id: `${source}:${heading}`,
      source,
      heading,
      content,
      tokens: tokenize(`${heading}\n${content}`),
    });
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      flush();
      heading = match[2].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "for", "to", "of", "in",
  "on", "at", "with", "from", "by", "is", "are", "was", "were", "be", "been",
  "can", "will", "would", "should", "do", "does", "did", "have", "has", "had",
  "it", "this", "that", "these", "those", "as", "so", "you", "your", "we",
  "our", "i", "me", "my", "what", "which", "who", "how", "where", "when",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Lightweight keyword retrieval — scores chunks by query-token overlap.
 * Swap this for an embeddings pipeline later without touching the route.
 */
export function retrieveKnowledge(
  chunks: KnowledgeChunk[],
  query: string,
  limit = 4,
  maxCharsPerChunk = 1400
): RetrievedChunk[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = chunks
    .map((chunk) => {
      let score = 0;
      for (const token of queryTokens) {
        score += chunk.tokens.filter((t) => t === token).length;
      }
      // Slight boost for matches inside the heading itself.
      const headingTokens = new Set(tokenize(chunk.heading));
      for (const token of queryTokens) {
        if (headingTokens.has(token)) score += 1.5;
      }
      return { chunk, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ chunk }) => ({
    source: chunk.source,
    heading: chunk.heading,
    content: chunk.content.length > maxCharsPerChunk
      ? `${chunk.content.slice(0, maxCharsPerChunk).trimEnd()}…`
      : chunk.content,
  }));
}
