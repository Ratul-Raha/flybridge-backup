import { NextRequest, NextResponse } from "next/server";

import { loadKnowledgeBase, reloadKnowledgeBase } from "@/lib/ai/knowledge";
import { readSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reload = searchParams.get("reload") === "true";

  try {
    if (reload) {
      const session = await readSession();
      if (!session || session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const chunks = reload ? await reloadKnowledgeBase() : await loadKnowledgeBase();
    const bySource = new Map<string, number>();
    for (const c of chunks) {
      bySource.set(c.source, (bySource.get(c.source) ?? 0) + 1);
    }

    return NextResponse.json({
      files: [...bySource.entries()].map(([file, chunks]) => ({ file, chunks })),
      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error("knowledge list error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
