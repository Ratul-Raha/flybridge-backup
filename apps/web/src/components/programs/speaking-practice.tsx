"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mic,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { useMuseRecorder } from "@/lib/audio/use-muse-recorder";

type Prompt = { label: string; text: string };

type Feedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  phrases: string[];
};

const PROMPTS: Prompt[] = [
  {
    label: "Introduce yourself",
    text: "Tell me about yourself — your name, where you're from, and what you do.",
  },
  {
    label: "Daily routine",
    text: "Describe your typical day from morning to night.",
  },
  {
    label: "Your hometown",
    text: "What do you like most about your hometown? Would you like to live there in the future?",
  },
  {
    label: "Free time",
    text: "What do you enjoy doing in your free time, and why?",
  },
  {
    label: "Food",
    text: "Describe a dish you love. What is it, how is it made, and when do you eat it?",
  },
  {
    label: "Travel",
    text: "Talk about a trip you would like to take. Where would you go and what would you do?",
  },
  {
    label: "Job interview",
    text: "Tell me about a time you solved a difficult problem. What happened and what did you learn?",
  },
  {
    label: "Giving an opinion",
    text: "Do you think social media brings people closer together or further apart? Why?",
  },
  {
    label: "Making plans",
    text: "A friend is visiting your city for the first time. What would you plan for their day?",
  },
  {
    label: "Free talk",
    text: "Talk for one minute about anything interesting you did this week.",
  },
];

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function SpeakingPractice({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle?: string;
}) {
  const [prompt, setPrompt] = useState<Prompt>(() => PROMPTS[0]);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [ttsBusy, setTtsBusy] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  const {
    recording,
    transcribing,
    error: recorderError,
    start,
    stop,
  } = useMuseRecorder();

  const words = wordCount(transcript);
  const busy = recording || transcribing || feedbackBusy;

  const pickPrompt = () => {
    const next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setPrompt(next);
    setTranscript("");
    setFeedback(null);
    setError("");
  };

  const readAloud = async () => {
    setError("");
    setTtsBusy(true);
    try {
      const res = await fetch("/api/speech-token", { cache: "no-store" });
      const config = await res.json();
      if (!res.ok) throw new Error(config.error || "Voice playback is unavailable");
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(
        config.token,
        config.region
      );
      speechConfig.speechSynthesisVoiceName = config.voice;
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
      await new Promise<void>((resolve, reject) => {
        synthesizer.speakTextAsync(prompt.text, () => resolve(), reject);
      });
      synthesizer.close();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read the prompt aloud"
      );
    } finally {
      setTtsBusy(false);
    }
  };

  const toggleRecording = async () => {
    setError("");
    if (recording) {
      const text = await stop();
      if (text) {
        setTranscript((prev) =>
          prev.trim() ? `${prev.trim()} ${text}` : text
        );
        setFeedback(null);
      }
      return;
    }
    setFeedback(null);
    await start();
  };

  const getFeedback = async () => {
    setError("");
    setFeedbackBusy(true);
    try {
      const res = await fetch("/api/speaking/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, prompt: prompt.text, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not get feedback");
      setFeedback(data as Feedback);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not get feedback"
      );
    } finally {
      setFeedbackBusy(false);
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: "var(--line)", background: "white" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--brand-2)" }}
            >
              Practice Speaking
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
              {courseTitle ? `${courseTitle} · ` : ""}
              Speak naturally, then check your transcript and get coaching.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={pickPrompt}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
              style={{ color: "var(--body)", borderColor: "var(--line)" }}
            >
              <RefreshCw size={13} />
              New prompt
            </button>
            <button
              type="button"
              onClick={readAloud}
              disabled={ttsBusy || busy}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
              style={{ color: "var(--body)", borderColor: "var(--line)" }}
            >
              {ttsBusy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Volume2 size={13} />
              )}
              Read aloud
            </button>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border px-4 py-4"
          style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
            {prompt.label}
          </p>
          <p className="mt-1.5 text-[15px] font-medium leading-[1.65]" style={{ color: "var(--ink)" }}>
            {prompt.text}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: "var(--line)", background: "white" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Your answer
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--body)" }}>
              Record with the microphone or type your answer below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
              {words} {words === 1 ? "word" : "words"}
            </span>
            {transcript && (
              <button
                type="button"
                onClick={() => {
                  setTranscript("");
                  setFeedback(null);
                }}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
                style={{ color: "var(--body)", borderColor: "var(--line)" }}
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            disabled={transcribing || feedbackBusy}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={
              recording
                ? { background: "#C0392B", color: "#fff" }
                : { background: "var(--brand)", color: "#fff" }
            }
          >
            {recording ? (
              <><Square size={14} /> Stop & transcribe</>
            ) : transcribing ? (
              <><Loader2 size={14} className="animate-spin" /> Transcribing…</>
            ) : (
              <><Mic size={14} /> Record answer</>
            )}
          </button>
          {recording && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: "#C0392B" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#C0392B" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#C0392B" }} />
              </span>
              Listening… keep each answer under two minutes
            </span>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            setFeedback(null);
          }}
          disabled={recording || transcribing}
          placeholder="Press “Record answer” and speak — Meta Muse will transcribe it here, or type your answer."
          rows={6}
          className="mt-4 w-full select-text resize-y rounded-xl border bg-[#FBFBFD] px-4 py-3 text-[13px] leading-[1.7] focus:outline-none focus:ring-2 focus:ring-brand-2/30 disabled:opacity-80"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        />

        {(error || recorderError) && (
          <p className="mt-3 rounded-xl border px-4 py-3 text-[12.5px]" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}>
            {error || recorderError}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={getFeedback}
            disabled={busy || words < 3}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)" }}
          >
            {feedbackBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {feedbackBusy ? "Getting feedback…" : "Get feedback"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{ borderColor: "rgba(15,169,104,0.3)", background: "white" }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(15,169,104,0.12)" }}>
              <CheckCircle2 size={17} style={{ color: "#0FA968" }} />
            </span>
            <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Coach feedback
            </p>
          </div>
          <p className="mt-3 text-[13.5px] leading-[1.7]" style={{ color: "var(--ink)" }}>
            {feedback.summary}
          </p>

          {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {feedback.strengths.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "#0FA968" }}>
                    What you did well
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {feedback.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#0FA968" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improvements.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "#B45309" }}>
                    Next time, try
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {feedback.improvements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#F59E0B" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {feedback.phrases.length > 0 && (
            <div className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--body)" }}>
                Useful phrases
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {feedback.phrases.map((phrase, i) => (
                  <li key={i} className="text-[12.5px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                    “{phrase}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
