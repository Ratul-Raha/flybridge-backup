import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { generateBlogPost } from "@/lib/ai/blog";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!subject && !title) {
      return NextResponse.json(
        { error: "Provide at least a subject or title" },
        { status: 400 }
      );
    }

    const result = await generateBlogPost(
      subject || title,
      title || subject
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("blog generate error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}