import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
  clearAiSettings,
  loadAiSettings,
  saveAiSettings,
} from "@/lib/ai/settings";
import { isAiProviderId } from "@/lib/ai/provider";
import { museConfigured, museTranscribeModel } from "@/lib/speech/meta";

function keyConfigured(value: string | undefined): boolean {
  return !!value && !value.includes("placeholder");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const state = await loadAiSettings({ force: true });

    return NextResponse.json({
      provider: state.provider,
      source: state.source,
      configured: {
        groq: keyConfigured(process.env.GROQ_API_KEY),
        gemini: keyConfigured(process.env.GEMINI_API_KEY),
        grok: keyConfigured(process.env.GROK_API_KEY),
      },
      transcription: {
        provider: "meta" as const,
        model: museTranscribeModel(),
        configured: museConfigured(),
      },
    });
  } catch (error) {
    console.error("ai-settings GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json()) as { provider?: unknown };
    if (!isAiProviderId(body.provider)) {
      return NextResponse.json(
        { error: "Invalid provider — must be groq, gemini, or grok" },
        { status: 400 }
      );
    }

    const state = await saveAiSettings({ provider: body.provider });
    return NextResponse.json({ ok: true, provider: state.provider, source: state.source });
  } catch (error) {
    console.error("ai-settings PUT error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const state = await clearAiSettings();
    return NextResponse.json({ ok: true, provider: state.provider, source: state.source });
  } catch (error) {
    console.error("ai-settings DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
