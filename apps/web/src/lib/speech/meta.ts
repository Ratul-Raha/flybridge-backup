import "server-only";

const META_ASR_URL = "https://api.meta.ai/v1/asr/transcribe";
const DEFAULT_MODEL = "muse-voice-transcribe-1.0";

export type MuseMode = "PUSH_TO_TALK" | "ENDPOINTING" | "DIARIZATION";

export type MuseTurn = {
  turnId?: number;
  startMs?: number;
  endMs?: number;
  transcript?: string;
  speaker?: string;
};

export type MuseTranscription = {
  transcript: string;
  turns: MuseTurn[];
  audioDurationMs: number | null;
  sessionId: string | null;
};

export class MuseTranscriptionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MuseTranscriptionError";
    this.status = status;
  }
}

export function museConfigured(): boolean {
  const key = process.env.META_MODEL_API_KEY?.trim();
  return !!key && !key.includes("placeholder");
}

export function museTranscribeModel(): string {
  return process.env.META_TRANSCRIBE_MODEL?.trim() || DEFAULT_MODEL;
}

type TranscribeOptions = {
  audio: File;
  mode?: MuseMode;
  languageBias?: string[];
  keywords?: string[];
};

/**
 * Transcribes a WAV recording with Meta's Muse Voice Transcribe model.
 *
 * Meta's file endpoint accepts multipart/form-data with two parts: a
 * JSON `request` and the WAV `audio` file. It requires mono 16-bit PCM
 * at 16 kHz or 24 kHz — the browser helper in `lib/audio/wav.ts` handles
 * that conversion before upload.
 */
export async function transcribeWithMuse({
  audio,
  mode = "PUSH_TO_TALK",
  languageBias,
  keywords,
}: TranscribeOptions): Promise<MuseTranscription> {
  const apiKey = process.env.META_MODEL_API_KEY?.trim();
  if (!apiKey || apiKey.includes("placeholder")) {
    throw new MuseTranscriptionError(
      "Meta Muse transcription is not configured (META_MODEL_API_KEY missing)",
      503
    );
  }

  if (audio.size === 0) {
    throw new MuseTranscriptionError("The recording is empty", 400);
  }

  const request = {
    mode,
    model: museTranscribeModel(),
    audioEncoding: "WAV",
    ...(languageBias?.length ? { languageBias } : {}),
    ...(keywords?.length ? { keywords } : {}),
  };

  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify(request)], { type: "application/json" })
  );
  form.append("audio", audio, audio.name || "answer.wav");

  let response: Response;
  try {
    response = await fetch(META_ASR_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      cache: "no-store",
    });
  } catch {
    throw new MuseTranscriptionError(
      "Could not reach Meta Muse transcription",
      502
    );
  }

  const raw = await response.text();
  if (!response.ok) {
    let detail = raw.slice(0, 300);
    try {
      const parsed = JSON.parse(raw) as {
        error?: { message?: string } | string;
        message?: string;
      };
      if (typeof parsed.error === "string") detail = parsed.error;
      else if (parsed.error?.message) detail = parsed.error.message;
      else if (parsed.message) detail = parsed.message;
    } catch {
      // keep the raw detail
    }

    const status =
      response.status === 429
        ? 429
        : response.status === 413
          ? 413
          : response.status === 400
            ? 400
            : 502;
    throw new MuseTranscriptionError(
      `Meta Muse transcription failed: ${detail}`,
      status
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new MuseTranscriptionError(
      "Meta Muse returned an unreadable response",
      502
    );
  }

  const payload = data as {
    transcript?: unknown;
    turns?: unknown;
    audioDurationMs?: unknown;
    sessionId?: unknown;
  };

  return {
    transcript:
      typeof payload.transcript === "string" ? payload.transcript.trim() : "",
    turns: Array.isArray(payload.turns) ? (payload.turns as MuseTurn[]) : [],
    audioDurationMs:
      typeof payload.audioDurationMs === "number"
        ? payload.audioDurationMs
        : null,
    sessionId:
      typeof payload.sessionId === "string" ? payload.sessionId : null,
  };
}
