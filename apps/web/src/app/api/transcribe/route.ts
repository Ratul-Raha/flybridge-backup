import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import {
  MuseTranscriptionError,
  transcribeWithMuse,
  type MuseMode,
} from "@/lib/speech/meta";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Vercel caps serverless request bodies at ~4.5 MB. At 16 kHz mono
 *  16-bit PCM that is roughly two minutes of audio. */
const MAX_AUDIO_BYTES = 4_500_000;
const MIN_AUDIO_BYTES = 1_000;

const MODES: MuseMode[] = ["PUSH_TO_TALK", "ENDPOINTING", "DIARIZATION"];

function parseMode(value: FormDataEntryValue | null): MuseMode {
  return typeof value === "string" && (MODES as string[]).includes(value)
    ? (value as MuseMode)
    : "PUSH_TO_TALK";
}

function parseList(value: FormDataEntryValue | null): string[] | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, 20)
      : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!audio || typeof audio === "string") {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }
  if (audio.size < MIN_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "That recording was too short — please speak a little longer." },
      { status: 400 }
    );
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      {
        error:
          "That recording is too long. Keep each answer under about two minutes.",
      },
      { status: 413 }
    );
  }

  try {
    const result = await transcribeWithMuse({
      audio,
      mode: parseMode(form.get("mode")),
      languageBias: parseList(form.get("languageBias")),
      keywords: parseList(form.get("keywords")),
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof MuseTranscriptionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("transcribe error", error);
    return NextResponse.json(
      { error: "Could not transcribe that recording" },
      { status: 500 }
    );
  }
}
