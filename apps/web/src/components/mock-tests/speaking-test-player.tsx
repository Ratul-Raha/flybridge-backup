"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Loader2,
  Mic,
  Send,
  SkipForward,
  Square,
  Volume2,
} from "lucide-react";
import type { AnswerValue, TestDetail } from "@/lib/mock-test-ui";
import { useMuseRecorder } from "@/lib/audio/use-muse-recorder";

type SpeakingSection = TestDetail["content"]["sections"][number];
type SpeakingQuestion = SpeakingSection["questions"][number];

type Part2Phase = "idle" | "prep" | "talk" | "done";

type SpeechConfigData = { token: string; region: string; locale: string; voice: string };

export type PronunciationAssessmentData = {
  accuracyScore?: number;
  fluencyScore?: number;
  completenessScore?: number;
  pronunciationScore?: number;
  prosodyScore?: number;
  words?: Array<{
    word?: string;
    accuracyScore?: number;
    errorType?: string;
  }>;
};

function fmtClock(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isPart2Section(section: SpeakingSection | undefined): boolean {
  if (!section) return false;
  return (
    (section.type ?? "").toLowerCase().includes("part-2") ||
    (section.bulletPoints?.length ?? 0) > 0 ||
    (section.prepMinutes ?? 0) > 0
  );
}

function partLabel(section: SpeakingSection | undefined, index: number): string {
  const type = (section?.type ?? "").toLowerCase();
  if (type.includes("part-1")) return "Part 1";
  if (isPart2Section(section)) return "Part 2";
  if (type.includes("part-3")) return "Part 3";
  return `Part ${index + 1}`;
}

function questionQid(q: SpeakingQuestion, si: number, qi: number): string {
  return q.qid && q.qid.trim() ? q.qid : `sp${si + 1}-q${qi + 1}`;
}

export function SpeakingTestPlayer({
  sections,
  answers,
  onTextChange,
  onFinish,
  submitting,
}: {
  sections: SpeakingSection[];
  answers: Record<string, AnswerValue>;
  onTextChange: (
    qid: string,
    text: string,
    pronunciation?: import("@/lib/mock-test-ui").PronunciationAssessmentData
  ) => void;
  onFinish: () => void;
  submitting: boolean;
}) {
  const parts = useMemo(
    () =>
      sections.filter(
        (s) =>
          (s.questions?.length ?? 0) > 0 ||
          (s.instructions ?? "").trim().length > 0 ||
          (s.bulletPoints?.length ?? 0) > 0
      ),
    [sections]
  );

  const [activePart, setActivePart] = useState(0);
  const part = parts[activePart];
  const isPart2 = isPart2Section(part);

  const prepMinutes = Math.max(0, part?.prepMinutes ?? (isPart2 ? 1 : 0));
  const talkMinutes = Math.max(0, part?.talkMinutes ?? (isPart2 ? 2 : 0));

  /* ----------------------------- speech ----------------------------- */

  const activeQidRef = useRef<string | null>(null);
  const answersRef = useRef(answers);
  const [recordingQid, setRecordingQid] = useState<string | null>(null);
  const [transcribingQid, setTranscribingQid] = useState<string | null>(null);
  const [speechBusy, setSpeechBusy] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState("");
  const {
    transcribing,
    error: recorderError,
    start: startMic,
    stop: stopMic,
  } = useMuseRecorder();

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const getSpeechConfig = async (): Promise<SpeechConfigData> => {
    const res = await fetch("/api/speech-token", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Voice practice is unavailable");
    return data as SpeechConfigData;
  };

  const stopRecording = useCallback(async () => {
    const qid = activeQidRef.current;
    activeQidRef.current = null;
    setRecordingQid(null);
    if (!qid) {
      await stopMic();
      return;
    }

    setTranscribingQid(qid);
    const transcript = await stopMic();
    setTranscribingQid(null);
    if (!transcript) return;

    const existing =
      typeof answersRef.current[qid]?.text === "string"
        ? answersRef.current[qid].text
        : "";
    onTextChange(
      qid,
      existing.trim() ? `${existing.trim()} ${transcript}` : transcript
    );
  }, [onTextChange, stopMic]);

  const startRecording = useCallback(
    async (qid: string) => {
      setSpeechError("");
      if (recordingQid) await stopRecording();
      activeQidRef.current = qid;
      const started = await startMic();
      if (!started) {
        activeQidRef.current = null;
        return;
      }
      setRecordingQid(qid);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recordingQid, startMic, stopRecording]
  );

  const readAloud = async (text: string, busyKey: string) => {
    setSpeechError("");
    setSpeechBusy(busyKey);
    try {
      const config = await getSpeechConfig();
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(config.token, config.region);
      speechConfig.speechSynthesisVoiceName = config.voice;
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
      await new Promise<void>((resolve, reject) => {
        synthesizer.speakTextAsync(text, () => resolve(), reject);
      });
      synthesizer.close();
    } catch (e) {
      setSpeechError(e instanceof Error ? e.message : "Could not read the prompt aloud");
    } finally {
      setSpeechBusy(null);
    }
  };

  /* ----------------------------- timers ----------------------------- */

  const [part2Phase, setPart2Phase] = useState<Part2Phase>("idle");
  const [prepSeconds, setPrepSeconds] = useState(0);
  const [talkSeconds, setTalkSeconds] = useState(0);
  const [partSeconds, setPartSeconds] = useState(0);

  const part2Qid = useMemo(() => {
    if (!isPart2 || !part) return null;
    const first = part.questions?.[0];
    if (first) return questionQid(first, activePart, 0);
    return `sp${activePart + 1}-answer`;
  }, [isPart2, part, activePart]);

  // Reset per-part state on navigation
  const goToPart = (i: number) => {
    void stopRecording();
    setActivePart(i);
    setPart2Phase("idle");
    setSpeechError("");
  };

  useEffect(() => {
    setPart2Phase("idle");
    setSpeechError("");
    if (!isPart2) setPartSeconds(talkMinutes * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePart, isPart2]);

  // Part 2 prep countdown
  useEffect(() => {
    if (!isPart2 || part2Phase !== "prep") return;
    if (prepSeconds <= 0) {
      setPart2Phase("talk");
      setTalkSeconds(talkMinutes * 60);
      if (part2Qid) void startRecording(part2Qid);
      return;
    }
    const t = setTimeout(() => setPrepSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPart2, part2Phase, prepSeconds, talkMinutes, part2Qid]);

  // Part 2 talk countdown
  useEffect(() => {
    if (!isPart2 || part2Phase !== "talk") return;
    if (talkSeconds <= 0) {
      void stopRecording();
      setPart2Phase("done");
      return;
    }
    const t = setTimeout(() => setTalkSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPart2, part2Phase, talkSeconds]);

  // Part 1/3 countdown (stops recording when the part time runs out)
  useEffect(() => {
    if (isPart2 || talkMinutes <= 0) return;
    if (partSeconds <= 0) {
      if (recordingQid) void stopRecording();
      return;
    }
    const t = setTimeout(() => setPartSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPart2, talkMinutes, partSeconds, recordingQid]);

  // Auto-advance after Part 2 finishes
  useEffect(() => {
    if (part2Phase !== "done" || !isPart2) return;
    if (activePart >= parts.length - 1) return;
    const t = setTimeout(() => {
      setActivePart(activePart + 1);
      setPart2Phase("idle");
    }, 2500);
    return () => clearTimeout(t);
  }, [part2Phase, isPart2, activePart, parts.length]);

  const beginPart2 = () => {
    setSpeechError("");
    setPrepSeconds(prepMinutes * 60);
    setPart2Phase("prep");
    void warmupMicrophone();
  };

  /** Grants mic permission from this user gesture so the auto-start after
   *  the prep countdown can open the microphone without one. */
  const warmupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      /* the recognizer surfaces the error when recording starts */
    }
  };

  const toggleQuestionRecording = (qid: string) => {
    if (recordingQid === qid) {
      void stopRecording();
    } else {
      void startRecording(qid);
    }
  };

  const finishTest = async () => {
    await stopRecording();
    onFinish();
  };

  const liveText = (qid: string): string =>
    typeof answers[qid]?.text === "string" ? answers[qid].text : "";

  /* ------------------------------- UI ------------------------------- */

  if (parts.length === 0) {
    return (
      <div className="rounded-xl border bg-white px-5 py-10 text-center" style={{ borderColor: "var(--line)" }}>
        <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
          Speaking questions for this test haven&apos;t been added yet.
        </p>
      </div>
    );
  }

  const cueCardText = [
    part?.instructions,
    ...(part?.bulletPoints ?? []),
    part?.questions?.[0]?.prompt,
  ]
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .join(" ");
  const readKey = `part-${activePart}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="mb-1 flex items-center gap-3 rounded-xl border bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
        <Mic size={18} style={{ color: "var(--brand-2)" }} />
        <p className="text-[13px] leading-[1.6]" style={{ color: "var(--body)" }}>
          Speak your answers using the microphone. AI grades each part on the four
          official IELTS Speaking criteria and gives you an overall band.
        </p>
      </div>

      {/* Part navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {parts.map((p, i) => {
          const active = i === activePart;
          const hasAnswer = (p.questions ?? []).some((q) => {
            const text = answers[questionQid(q, i, 0)]?.text;
            return typeof text === "string" && text.trim().length > 0;
          });
          return (
            <button
              key={p.id ?? `part-${i}`}
              type="button"
              onClick={() => goToPart(i)}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors"
              style={{
                background: active ? "var(--brand)" : hasAnswer ? "rgba(15,169,104,0.08)" : "white",
                borderColor: active ? "var(--brand)" : hasAnswer ? "rgba(15,169,104,0.35)" : "var(--line)",
                color: active ? "#fff" : hasAnswer ? "#0FA968" : "var(--body)",
              }}
            >
              {hasAnswer && !active && <Check size={13} />}
              {partLabel(p, i)}
            </button>
          );
        })}
      </div>

      {/* Part 2: cue card */}
      {isPart2 && part && (
        <div className="flex flex-col gap-4">
          {part2Phase === "idle" && (
            <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: "var(--line)" }}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-2)" }}>
                  Cue card
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--body)" }}>
                    {fmtClock(prepMinutes * 60)} prep · {fmtClock(talkMinutes * 60)} talk
                  </span>
                  <button
                    type="button"
                    onClick={() => readAloud(cueCardText, readKey)}
                    disabled={speechBusy !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium disabled:opacity-50"
                    style={{ color: "var(--body)", borderColor: "var(--line)" }}
                  >
                    {speechBusy === readKey ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                    Read aloud
                  </button>
                </div>
              </div>
              <div className="px-5 py-5">
                {part.instructions && (
                  <p className="text-[15px] font-semibold leading-[1.6]" style={{ color: "var(--ink)" }}>
                    {part.instructions}
                  </p>
                )}
                {(part.bulletPoints ?? []).length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5 pl-1">
                    {part.bulletPoints!.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-[13.5px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--brand-2)" }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {part.questions?.[0]?.prompt && (
                  <p className="mt-3 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
                    {part.questions[0].prompt}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={beginPart2}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand)" }}
                  >
                    <Mic size={15} /> Begin Part 2
                  </button>
                  {activePart < parts.length - 1 && (
                    <button
                      type="button"
                      onClick={() => goToPart(activePart + 1)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-3 text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
                      style={{ color: "var(--body)", borderColor: "var(--line)" }}
                    >
                      <SkipForward size={14} /> Skip part
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {part2Phase === "prep" && (
            <div className="rounded-2xl border bg-white px-6 py-10 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--brand-2)" }}>
                Preparation time
              </p>
              <p className="font-display mt-3 text-[64px] font-black leading-none" style={{ color: "var(--brand)" }}>
                {fmtClock(prepSeconds)}
              </p>
              <p className="mt-3 text-[13px]" style={{ color: "var(--body)" }}>
                Make notes mentally — recording starts automatically when the timer ends.
              </p>
              <button
                type="button"
                onClick={() => { setPart2Phase("idle"); setPrepSeconds(0); void stopRecording(); }}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
                style={{ color: "var(--body)", borderColor: "var(--line)" }}
              >
                Cancel
              </button>
            </div>
          )}

          {part2Phase === "talk" && (
            <div className="rounded-2xl border bg-white px-6 py-8 text-center" style={{ borderColor: "rgba(15,169,104,0.35)" }}>
              <div className="flex items-center justify-center gap-2.5">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#C0392B" }} />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full" style={{ background: "#C0392B" }} />
                </span>
                <span className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "#C0392B" }}>
                  Recording
                </span>
              </div>
              <p className="font-display mt-3 text-[64px] font-black leading-none" style={{ color: "var(--brand)" }}>
                {fmtClock(talkSeconds)}
              </p>
              <p className="mt-3 text-[13px]" style={{ color: "var(--body)" }}>
                Keep speaking — pauses are fine. Recording stops when the timer ends.
              </p>
              {recordingQid !== part2Qid && (
                <button
                  type="button"
                  onClick={() => part2Qid && void startRecording(part2Qid)}
                  className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#C0392B" }}
                >
                  <Mic size={14} /> Restart microphone
                </button>
              )}
              <div className="mx-auto mt-5 max-w-[560px] rounded-xl border px-4 py-3 text-left" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
                <p className="min-h-[44px] whitespace-pre-wrap text-[13px] leading-[1.7] select-text" style={{ color: "var(--ink)" }}>
                  {part2Qid ? liveText(part2Qid) || <span style={{ color: "var(--body)" }}>Listening…</span> : ""}
                </p>
              </div>
            </div>
          )}

          {part2Phase === "done" && (
            <div className="rounded-2xl border bg-white px-6 py-8 text-center" style={{ borderColor: "rgba(15,169,104,0.35)" }}>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(15,169,104,0.12)" }}>
                <Check size={22} style={{ color: "#0FA968" }} />
              </div>
              <p className="mt-3 text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                Part 2 complete
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
                {activePart < parts.length - 1 ? "Moving to Part 3…" : "You can now submit the test."}
              </p>
              {part2Qid && (
                <textarea
                  value={liveText(part2Qid)}
                  onChange={(e) => onTextChange(part2Qid, e.target.value)}
                  disabled={transcribingQid === part2Qid}
                  placeholder={
                    transcribingQid === part2Qid
                      ? "Transcribing your answer…"
                      : "Your spoken answer appears here. You can fix any words the microphone misheard before submitting."
                  }
                  rows={4}
                  className="mx-auto mt-4 w-full max-w-[560px] select-text resize-y rounded-xl border bg-[#FBFBFD] px-4 py-3 text-[13px] leading-[1.7] focus:outline-none focus:ring-2 focus:ring-brand-2/30 disabled:opacity-70"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              )}
              {part2Qid && transcribingQid === part2Qid && (
                <p className="mt-3 inline-flex items-center gap-2 text-[12.5px]" style={{ color: "var(--body)" }}>
                  <Loader2 size={13} className="animate-spin" />
                  Transcribing with Meta Muse…
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Part 1 / Part 3: question list */}
      {!isPart2 && part && (
        <div className="flex flex-col gap-3">
          {talkMinutes > 0 && (
            <div className="flex items-center justify-end">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] font-mono text-[12px] font-semibold"
                style={{
                  background: partSeconds <= 60 && partSeconds > 0 ? "rgba(192,57,43,0.10)" : "var(--brand-soft)",
                  color: partSeconds <= 60 && partSeconds > 0 ? "#C0392B" : "var(--brand)",
                }}
              >
                <Clock size={12} /> {fmtClock(partSeconds)}
              </span>
            </div>
          )}
          {(part.questions ?? []).map((q, qi) => {
            const qid = questionQid(q, activePart, qi);
            const recording = recordingQid === qid;
            const transcribingThis = transcribingQid === qid;
            return (
              <div
                key={qid}
                className="rounded-2xl border bg-white p-4 sm:p-5"
                style={{ borderColor: recording ? "rgba(15,169,104,0.45)" : "var(--line)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand-2)" }}>
                      {qi + 1}
                    </span>
                    <p className="text-[14px] font-medium leading-[1.65]" style={{ color: "var(--ink)" }}>
                      {q.prompt}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-10">
                  <button
                    type="button"
                    onClick={() => readAloud(q.prompt ?? "", `read-${qid}`)}
                    disabled={speechBusy !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium disabled:opacity-50"
                    style={{ color: "var(--body)", borderColor: "var(--line)" }}
                  >
                    {speechBusy === `read-${qid}` ? <Loader2 size={13} className="animate-spin" /> : <Volume2 size={13} />}
                    Read aloud
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleQuestionRecording(qid)}
                    disabled={speechBusy !== null || transcribingThis || (recordingQid !== null && recordingQid !== qid)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold disabled:opacity-50"
                    style={
                      recording
                        ? { background: "#C0392B", color: "#fff" }
                        : { background: "var(--brand-soft, rgba(107,76,224,0.08))", color: "var(--brand)" }
                    }
                  >
                    {recording ? (
                      <><Square size={12} /> Stop recording</>
                    ) : transcribingThis ? (
                      <><Loader2 size={13} className="animate-spin" /> Transcribing…</>
                    ) : (
                      <><Mic size={13} /> Record answer</>
                    )}
                  </button>
                  {recording && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: "#C0392B" }}>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#C0392B" }} />
                        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#C0392B" }} />
                      </span>
                      Listening…
                    </span>
                  )}
                </div>
                <div className="mt-3 pl-10">
                  <textarea
                    value={liveText(qid)}
                    onChange={(e) => onTextChange(qid, e.target.value)}
                    disabled={recording || transcribingThis}
                    placeholder={
                      recording
                        ? "Listening… stop recording when you're done."
                        : transcribingThis
                          ? "Transcribing your answer…"
                          : "Press \"Record answer\" and speak — your transcript appears here automatically."
                    }
                    rows={3}
                    className="w-full select-text resize-y rounded-xl border bg-[#FBFBFD] px-4 py-3 text-[13px] leading-[1.7] focus:outline-none focus:ring-2 focus:ring-brand-2/30 disabled:opacity-80"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(speechError || recorderError) && (
        <p className="rounded-xl border px-4 py-3 text-[12.5px]" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}>
          {speechError || recorderError}
        </p>
      )}

      {/* Navigation / submit */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPart(Math.max(0, activePart - 1))}
            disabled={activePart === 0}
            className="rounded-full border px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--bg-soft)] disabled:opacity-40"
            style={{ color: "var(--ink)", borderColor: "var(--line)" }}
          >
            Previous part
          </button>
          {activePart < parts.length - 1 ? (
            <button
              type="button"
              onClick={() => goToPart(activePart + 1)}
              className="rounded-full border px-4 py-2.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
              style={{ color: "var(--ink)", borderColor: "var(--line)" }}
            >
              Next part
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void finishTest()}
          disabled={submitting || recordingQid !== null || transcribing || part2Phase === "prep" || part2Phase === "talk"}
          className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)",
            boxShadow: "0 10px 24px -10px var(--brand-2)",
          }}
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {submitting ? "Submitting…" : "Finish & submit for AI grading"}
        </button>
      </div>

      {recordingQid !== null && (
        <p className="flex items-center justify-center gap-2 text-[12px]" style={{ color: "var(--body)" }}>
          <AlertTriangle size={13} style={{ color: "#F59E0B" }} />
          Stop recording before finishing the test.
        </p>
      )}
      {transcribing && (
        <p className="flex items-center justify-center gap-2 text-[12px]" style={{ color: "var(--body)" }}>
          <Loader2 size={13} className="animate-spin" />
          Transcribing your last answer with Meta Muse…
        </p>
      )}
    </div>
  );
}
