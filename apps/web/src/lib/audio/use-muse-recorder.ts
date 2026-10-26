"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startAudioRecording, type ActiveRecording } from "./recorder";
import { toMuseWav } from "./wav";

type TranscriptResponse = { transcript?: string; error?: string };

async function transcribe(blob: Blob, mode = "PUSH_TO_TALK"): Promise<string> {
  const wav = await toMuseWav(blob);
  const form = new FormData();
  form.append("audio", wav, "answer.wav");
  form.append("mode", mode);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
  });
  const data = (await response.json().catch(() => ({}))) as TranscriptResponse;
  if (!response.ok) {
    throw new Error(data.error || "Could not transcribe that recording");
  }
  return (data.transcript ?? "").trim();
}

/**
 * Small client hook around the browser recorder + `/api/transcribe`.
 *
 * `stop()` resolves with the transcript (or null when nothing was recorded /
 * transcription failed) and manages the recording/transcribing flags. It is
 * safe to call from timers and event handlers.
 */
export function useMuseRecorder() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<ActiveRecording | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recorderRef.current?.cancel();
      recorderRef.current = null;
    };
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    setError("");
    if (recorderRef.current) return true;
    try {
      recorderRef.current = await startAudioRecording();
      setRecording(true);
      return true;
    } catch (cause) {
      setRecording(false);
      setError(
        cause instanceof Error ? cause.message : "Could not use the microphone"
      );
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    const active = recorderRef.current;
    recorderRef.current = null;
    if (!active) return null;

    setRecording(false);
    setTranscribing(true);
    try {
      const blob = await active.stop();
      if (blob.size < 1_000) {
        throw new Error(
          "That recording was too short — please speak a little longer."
        );
      }
      const text = await transcribe(blob);
      return text || null;
    } catch (cause) {
      if (mountedRef.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not transcribe that recording"
        );
      }
      return null;
    } finally {
      if (mountedRef.current) setTranscribing(false);
    }
  }, []);

  const cancel = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setRecording(false);
    setTranscribing(false);
  }, []);

  return {
    recording,
    transcribing,
    error,
    setError,
    start,
    stop,
    cancel,
  };
}
