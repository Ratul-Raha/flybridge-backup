"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  EyeOff,
  FileText,
  Headphones,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import {
  SKILL_META,
  type AnswerValue,
  type TestDetail,
} from "@/lib/mock-test-ui";
import { ListeningTestPlayer } from "@/components/mock-tests/listening-test-player";

type Phase = "loading" | "intro" | "ready" | "submitting" | "result" | "disqualified" | "error";

type JudgeResult = {
  overallBand: number;
  sections: { key: string; title: string; band: number; comments: string }[];
  feedback: string;
};

function fmtTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isAnswered(a?: AnswerValue): boolean {
  return (
    (typeof a?.choice === "number" && a.choice >= 0) ||
    (Array.isArray(a?.choices) && a.choices.length > 0) ||
    (typeof a?.text === "string" && a.text.trim().length > 0)
  );
}

const IMG_TOKEN_RE = /(\!\[([^\]]*)\]\(([^)\s]+)\)|\{\{img:([^}]+)\}\})/g;

/** Renders `![alt](url)` and `{{img:url}}` markers as inline images so figures
 *  can be placed at any exact point inside passages, instructions or prompts. */
function inlineRich(text?: string): ReactNode {
  if (!text) return text ?? "";
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  IMG_TOKEN_RE.lastIndex = 0;
  while ((m = IMG_TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const url = (m[3] ?? m[4] ?? "").trim();
    if (url) {
      const alt = m[2]?.trim() || "Figure";
      parts.push(
        <img
          key={key++}
          src={url}
          alt={alt}
          className="my-2 block max-w-full rounded-lg border bg-white object-contain"
          style={{ borderColor: "var(--line)" }}
        />
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

const TYPE_LABELS: Record<string, string> = {
  "multiple-choice": "Multiple choice",
  "true-false-ng": "True / False / Not Given",
  "heading-matching": "Match headings",
  "matching-features": "Match features",
  "sentence-completion": "Sentence completion",
  "summary-completion": "Summary completion",
  "notes-completion": "Notes completion",
  "form-completion": "Form completion",
  "table-completion": "Table completion",
  "diagram-completion": "Diagram completion",
  "short-answer": "Short answer",
};

export function MockTestPlayer({
  testId,
  attemptId,
}: {
  testId: string;
  attemptId?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<TestDetail | null>(null);
  const [attempt, setAttempt] = useState<string | null>(attemptId ?? null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [media, setMedia] = useState<{ audioUrl?: string; videoUrl?: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [introStep, setIntroStep] = useState<number | null>(null);
  const [violations, setViolations] = useState(0);
  const [leaveWarning, setLeaveWarning] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);
  const timedOutRef = useRef(false);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const violationsRef = useRef(0);
  violationsRef.current = violations;
  const startedAtRef = useRef(0);

  const [page, setPage] = useState(0);
  const [activePart, setActivePart] = useState(0);

  const totalQuestions = useMemo(
    () =>
      (test?.content?.sections ?? []).reduce(
        (n, s) => n + (s.questions?.length ?? 0),
        0
      ),
    [test]
  );

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((a) => isAnswered(a)).length,
    [answers]
  );

  const isWriting = test?.skill === "writing";
  const hasTimer = (test?.durationMinutes ?? 0) > 0;
  const lowTime = hasTimer && secondsLeft > 0 && secondsLeft <= 60;
  const flattened = useMemo(
    () =>
      (test?.content?.sections ?? []).flatMap((s) => s.questions ?? []),
    [test]
  );

  const questionIndex = useMemo(() => {
    const m: Record<string, number> = {};
    flattened.forEach((q, idx) => {
      if (!m[q.qid]) m[q.qid] = idx + 1;
    });
    return m;
  }, [flattened]);

  const clearAll = () => {
    setAnswers({});
    setClearConfirmOpen(false);
  };

  const readingPages = useMemo(() => {
    const sections = test?.content?.sections ?? [];
    if (test?.skill !== "reading") return null;

    let passages: { id: string; title: string; text: string }[] = [];
    if (Array.isArray(test.content?.passages) && test.content.passages.length > 0) {
      passages = test.content.passages.map((p, i) => ({
        id: p.id ?? `p${i + 1}`,
        title: p.title ?? `Reading Passage ${i + 1}`,
        text: p.text ?? "",
      }));
    } else if (test.content?.passage) {
      passages = [{ id: "p1", title: "Reading Passage 1", text: test.content.passage }];
    } else {
      const groupedIds = [
        ...new Set(sections.map((s) => s.passageId).filter((id): id is string => Boolean(id))),
      ];
      if (groupedIds.length > 0) {
        passages = groupedIds.map((id, i) => ({
          id,
          title: `Reading Passage ${i + 1}`,
          text: "",
        }));
      } else if (sections.length > 0) {
        passages = [{ id: "p1", title: "Reading Passage 1", text: "" }];
      }
    }
    if (passages.length === 0) return null;

    const known = new Set(passages.map((p) => p.id));
    const pages = passages.map((p) => ({
      ...p,
      sections: sections.filter((s) => s.passageId === p.id),
    }));
    const orphans = sections.filter((s) => !s.passageId || !known.has(s.passageId));
    if (orphans.length > 0 && pages.length > 0) {
      pages[0] = { ...pages[0], sections: [...orphans, ...pages[0].sections] };
    }
    return pages;
  }, [test]);

  const questionGroups = useMemo(() => {
    if (test?.skill === "reading" && readingPages) {
      return readingPages.map((p, i) => ({
        key: `passage-${i}`,
        label: p.title || `Passage ${i + 1}`,
        pageIndex: i,
        questions: p.sections.flatMap((s) => s.questions ?? []),
      }));
    }
    return (test?.content?.sections ?? []).map((s, i) => ({
      key: `section-${i}`,
      label: s.type ? (TYPE_LABELS[s.type] ?? `Section ${i + 1}`) : `Section ${i + 1}`,
      pageIndex: null,
      questions: s.questions ?? [],
    }));
  }, [test, readingPages]);

  const loadTestData = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/mock-tests/${testId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load the test");
      const data = await res.json();
      if (!data.test) throw new Error("Test not found");
      const t = data.test as TestDetail;
      setTest(t);
      if (t.content?.hasAudio) {
        try {
          const mRes = await fetch(`/api/mock-tests/${testId}/media`, { cache: "no-store" });
          const mData = await mRes.json().catch(() => ({}));
          if (mRes.ok && mData && typeof mData === "object") {
            setMedia({
              audioUrl: typeof mData.audioUrl === "string" ? mData.audioUrl : undefined,
              videoUrl: typeof mData.videoUrl === "string" ? mData.videoUrl : undefined,
            });
          }
        } catch {
          /* media stays null — the player falls back to a plain URL if any */
        }
      }
      if (t.durationMinutes > 0) {
        setSecondsLeft(t.durationMinutes * 60);
        setTimerActive(true);
      }
      setIntroStep(null);
      setPhase("intro");
      return id;
    },
    [testId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (attemptId) {
          const aRes = await fetch(`/api/mock-tests/attempts/${attemptId}`, { cache: "no-store" });
          const aData = await aRes.json().catch(() => ({}));
          if (aData.attempt?.status === "graded" && aData.attempt.result) {
            setResult(aData.attempt.result);
            setPhase("result");
            return;
          }
          if (aData.attempt?.answers && typeof aData.attempt.answers === "object") {
            setAnswers(aData.attempt.answers as Record<string, AnswerValue>);
          }
          await loadTestData(attemptId);
        } else {
          const res = await fetch(`/api/mock-tests/${testId}/attempts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Failed to start attempt");
          const createdId = data.attempt?.id;
          if (!createdId) throw new Error("Failed to start attempt");
          setAttempt(createdId);
          if (data.attempt?.answers && typeof data.attempt.answers === "object") {
            setAnswers(data.attempt.answers as Record<string, AnswerValue>);
          }
          await loadTestData(createdId);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testId, attemptId, loadTestData]);

  // Countdown ticker
  useEffect(() => {
    if (phase !== "ready" || !timerActive) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timerActive]);

  // Auto-submit on timeout
  useEffect(() => {
    if (phase !== "ready" || !timerActive) return;
    if (secondsLeft === 0) {
      timedOutRef.current = true;
      void submitTest(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, timerActive]);

  const submitTest = async (timedOut = false) => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setConfirmOpen(false);
    setPhase("submitting");
    try {
      const res = await fetch(`/api/mock-tests/${testId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt,
          answers: answersRef.current,
          timedOut,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Grading failed. Please try again.");
      setResult(data.result);
      setPhase("result");
    } catch (e) {
      submittedRef.current = false;
      setError(e instanceof Error ? e.message : "Grading failed. Please try again.");
      setPhase("ready");
    }
  };

  const setChoice = (qid: string, choice: number) =>
    setAnswers((prev) => ({ ...prev, [qid]: { choice, text: undefined } }));

  const toggleChoice = (qid: string, oi: number) =>
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qid]?.choices) ? prev[qid]!.choices! : [];
      const next = cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi].sort((a, b) => a - b);
      return { ...prev, [qid]: { choices: next, text: undefined } };
    });

  const setText = (key: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: { text: value, choice: undefined } }));

  const renderQuestion = (q: TestDetail["content"]["sections"][number]["questions"][number], qi: number = 0) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const hasOptions = opts.some((o) => typeof o === "string" && o.trim().length > 0);
    const current = answers[q.qid];
    const answered = isAnswered(current);
    const num = questionIndex[q.qid] ?? qi + 1;
    const isMulti = q.multiple === true;
    const selectedChoices = isMulti && Array.isArray(current?.choices) ? current.choices : [];

    const body = hasOptions ? (
      <div className="mt-4 flex flex-col gap-2">
        {isMulti && (
          <p className="text-[12px] font-medium" style={{ color: "var(--body)" }}>
            Select all that apply.
          </p>
        )}
        {opts.map((opt, oi) => {
          const selected = isMulti ? selectedChoices.includes(oi) : current?.choice === oi;
          return (
            <button
              key={oi}
              type="button"
              onClick={() => (isMulti ? toggleChoice(q.qid, oi) : setChoice(q.qid, oi))}
              aria-pressed={selected}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 hover:border-brand-2/50 focus:outline-none focus:ring-2 focus:ring-brand-2/30"
              style={
                selected
                  ? { borderColor: "var(--brand)", background: "var(--brand-soft)" }
                  : { borderColor: "var(--line)", background: "white" }
              }
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11.5px] font-bold transition-colors"
                style={
                  selected
                    ? { borderColor: "var(--brand)", background: "var(--brand)", color: "#fff" }
                    : { borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--body)" }
                }
              >
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="flex-1 text-[13.5px] leading-snug" style={{ color: "var(--ink)" }}>
                {opt}
              </span>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center border ${isMulti ? "rounded-[4px]" : "rounded-full"}`}
                style={{ borderColor: selected ? "var(--brand)" : "var(--line)" }}
              >
                {selected && (isMulti ? <Check size={11} style={{ color: "var(--brand)" }} /> : <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} />)}
              </span>
            </button>
          );
        })}
      </div>
    ) : (
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11.5px] font-bold" style={{ borderColor: "var(--line)", background: "var(--bg-soft)", color: "var(--body)" }}>
            {String.fromCharCode(64 + Math.min(num, 26))}
          </span>
          <input
            type="text"
            value={typeof current?.text === "string" ? current.text : ""}
            onChange={(e) => setText(q.qid, e.target.value)}
            placeholder="Type your answer here…"
            className="w-full select-text rounded-lg border-b-2 bg-transparent px-1 py-1.5 text-[14px] transition-colors focus:outline-none focus:ring-0"
            style={{ borderColor: answered ? "var(--brand)" : "var(--line)", color: "var(--ink)" }}
          />
        </div>
      </div>
    );

    return (
      <div
        key={q.qid}
        id={`q-${q.qid}`}
        className="scroll-mt-28 rounded-2xl border bg-white p-4 transition-shadow duration-150 hover:shadow-[0_8px_24px_-16px_rgba(18,32,67,0.25)] sm:p-5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold transition-colors"
              style={answered ? { background: "var(--brand)", color: "#fff" } : { background: "var(--bg-soft)", color: "var(--brand-2)" }}
            >
              {num}
            </span>
            <p className="text-[14px] font-medium leading-[1.65]" style={{ color: "var(--ink)" }}>
              {inlineRich(q.prompt)}
            </p>
          </div>
          {answered && <CheckCircle2 size={17} className="mt-1 shrink-0" style={{ color: "#0FA968" }} />}
        </div>
        {q.wordHint && (
          <p className="mt-1 pl-10 text-[11.5px] font-medium" style={{ color: "var(--brand-2)" }}>
            {q.wordHint}
          </p>
        )}
        {body}
      </div>
    );
  };

  const renderSection = (
    section: TestDetail["content"]["sections"][number],
    si: number
  ) => {
    const qNums = (section.questions ?? [])
      .map((q) => questionIndex[q.qid])
      .filter((n): n is number => Boolean(n));
    const range = qNums.length ? `${Math.min(...qNums)}–${Math.max(...qNums)}` : "";
    const placement: "above" | "below-passage" | "below" =
      section.imagePlacement && ["above", "below-passage", "below"].includes(section.imagePlacement)
        ? section.imagePlacement
        : "below-passage";
    const sectionImage = section.image ? (
      <div className="mb-4 overflow-hidden rounded-xl border bg-[#FBFBFD]" style={{ borderColor: "var(--line)" }}>
        <img
          src={section.image}
          alt={section.type ? `Section figure: ${section.type}` : "Section figure"}
          className="block w-full object-contain"
        />
      </div>
    ) : null;
    return (
      <div key={section.id ?? `s${si}`} id={`part-${si}`} className="mb-7 scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          {range && (
            <span
              className="rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em]"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              Questions {range}
            </span>
          )}
          <span className="text-[12px] font-medium capitalize" style={{ color: "var(--body)" }}>
            {section.type ? (TYPE_LABELS[section.type] ?? section.type) : "Questions"}
          </span>
        </div>
        {placement === "above" && sectionImage}
        {section.instructions && (
          <div className="mb-4 rounded-xl border bg-[#FBFBFD] px-5 py-4" style={{ borderColor: "var(--line)" }}>
            <p className="text-[12.5px] leading-[1.7]" style={{ color: "var(--ink)" }}>
              {inlineRich(section.instructions)}
            </p>
          </div>
        )}
        {section.passage && (
          <div className="mb-4 overflow-hidden rounded-xl border bg-[#FBFBFD]" style={{ borderColor: "var(--line)" }}>
            <div className="max-h-[320px] overflow-y-auto whitespace-pre-line px-5 py-4 text-[13px] leading-[1.8]" style={{ color: "var(--ink)" }}>
              {inlineRich(section.passage)}
            </div>
          </div>
        )}
        {placement === "below-passage" && sectionImage}
        <div className="flex flex-col gap-3">
          {(section.questions ?? []).map((q, qi) => renderQuestion(q, qi))}
        </div>
        {placement === "below" && sectionImage}
      </div>
    );
  };

  const pageIdx = readingPages ? Math.min(page, readingPages.length - 1) : 0;
  const currentPage = readingPages ? readingPages[pageIdx] : null;
  const activePartIndex = readingPages ? pageIdx : activePart;
  const activeGroup = questionGroups[activePartIndex] ?? null;
  const goToPage = (i: number) => {
    setPage(Math.max(0, Math.min(i, (readingPages?.length ?? 1) - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToQuestion = (qid: string, partIndex: number, partPageIndex: number | null) => {
    setActivePart(partIndex);
    const scroll = () =>
      document
        .getElementById(`q-${qid}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (partPageIndex !== null && partPageIndex !== pageIdx) {
      setPage(partPageIndex);
      window.setTimeout(scroll, 200);
    } else {
      scroll();
    }
  };

  const jumpToPart = (partIndex: number, partPageIndex: number | null) => {
    setActivePart(partIndex);
    if (partPageIndex !== null) {
      goToPage(partPageIndex);
    } else {
      document
        .getElementById(`part-${partIndex}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const beginTest = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // fullscreen unavailable (e.g. embedded iframe) - continue anyway
    }
    startedAtRef.current = Date.now();
    setIntroStep(3);
  };

  const registerViolation = () => {
    if (phaseRef.current !== "ready") return;
    if (Date.now() - startedAtRef.current < 2000) return;
    const next = violationsRef.current + 1;
    violationsRef.current = next;
    setViolations(next);
    if (next >= 2) {
      setPhase("disqualified");
      setTimerActive(false);
      setSecondsLeft(0);
    } else {
      setLeaveWarning(true);
      window.setTimeout(() => setLeaveWarning(false), 4000);
    }
  };

  // 3..2..1..GO countdown after the user begins
  useEffect(() => {
    if (phase !== "intro" || introStep === null) return;
    if (introStep <= 0) {
      const t = setTimeout(() => {
        setPhase("ready");
        setIntroStep(null);
      }, 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIntroStep((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, introStep]);

  // Fullscreen + leave/minimize detection
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") registerViolation();
    };
    const onBlur = () => registerViolation();
    const onFullscreenChange = () => {
      if (phaseRef.current !== "ready") return;
      if (document.fullscreenElement) return;
      registerViolation();
      try {
        if (document.documentElement.requestFullscreen) {
          void document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [registerViolation]);

  // Block copy/paste/print/devtools while the test is running
  useEffect(() => {
    if (phase !== "ready") return;
    const prevent = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (["c", "x", "u", "s", "p"].includes(k)) e.preventDefault();
        if (e.shiftKey && ["i", "j", "c"].includes(k)) e.preventDefault();
      }
      if (e.key === "F12") e.preventDefault();
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [phase]);

  // Leave fullscreen on result/disqualify/error screens
  useEffect(() => {
    if (phase === "result" || phase === "disqualified" || phase === "error") {
      try {
        if (document.fullscreenElement) void document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }, [phase]);

  if (phase === "disqualified") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--bg)" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(192,57,43,0.12)" }}>
          <Ban size={26} style={{ color: "#C0392B" }} />
        </div>
        <p className="font-display text-[22px] font-semibold" style={{ color: "var(--ink)" }}>
          Attempt disqualified
        </p>
        <p className="max-w-[440px] text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
          The test window was minimized or left multiple times. Your attempt has been flagged as
          disqualified and will not be graded.
        </p>
        <Link
          href="/dashboard/mock-tests"
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          <ArrowLeft size={15} /> Back to mock tests
        </Link>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6"
        style={{ background: "linear-gradient(165deg, #171040 0%, #2A1C5E 55%, #1B2A5E 100%)" }}
      >
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "#8FA3FF" }}>
          IELTS mock test · {SKILL_META[test?.skill ?? "reading"].label}
        </p>
        <h1 className="font-display mt-3 text-center text-[26px] font-bold text-white sm:text-[32px]">
          {test?.title}
        </h1>

        {introStep === null ? (
          <>
            <div
              className="mt-9 w-full max-w-[520px] space-y-4 rounded-2xl border p-6"
              style={{ borderColor: "rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "#8FA3FF" }} />
                <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.9)" }}>
                  The test runs in <span className="font-semibold text-white">full screen</span> for the
                  entire duration.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <EyeOff size={18} className="mt-0.5 shrink-0" style={{ color: "#8FA3FF" }} />
                <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <span className="font-semibold text-white">Copying is disabled.</span> You cannot select,
                  copy or print the passage or questions.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Ban size={18} className="mt-0.5 shrink-0" style={{ color: "#FF9E9E" }} />
                <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <span className="font-semibold text-white">Do not minimize or leave this window.</span>{` `}
                  Leaving the test window is a violation — two violations will disqualify your attempt.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void beginTest()}
              className="mt-9 inline-flex items-center gap-2 rounded-full px-10 py-4 text-[15px] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-[0_12px_36px_-8px_rgba(111,76,224,0.7)]"
              style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)" }}
            >
              Start mock test →
            </button>
            <p className="mt-5 max-w-[420px] text-center text-[12.5px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.55)" }}>
              Pressing Esc, tabbing away, switching windows or minimizing counts as leaving the test.
              Your timer starts after the countdown.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-display text-[120px] font-black leading-none text-white drop-shadow-[0_10px_40px_rgba(111,76,224,0.55)] sm:text-[150px]">
              {introStep === 0 ? "GO!" : introStep}
            </span>
            <p className="mt-4 font-mono text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#C7D0FF" }}>
              {introStep === 0 ? "Good luck!" : "Get ready…"}
            </p>
          </div>
        )}

        <p className="absolute bottom-6 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Full screen · Copying disabled · Minimizing disqualifies
        </p>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-[760px] px-5 pt-14 pb-20">
          <Link
            href="/dashboard/mock-tests"
            className="inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--brand)" }}
          >
            <ArrowLeft size={15} /> Back to mock tests
          </Link>

          <div className="mt-8 overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "var(--line)" }}>
            <div
              className="px-7 py-8 text-center sm:px-10"
              style={{ background: "linear-gradient(165deg, rgba(111,76,224,0.10), rgba(47,95,224,0.04) 70%)" }}
            >
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--brand-2)" }}>
                Overall band
              </p>
              <div
                className="font-display font-bold leading-none mt-3"
                style={{ fontSize: "clamp(56px,9vw,84px)", color: "var(--brand)" }}
              >
                {typeof result?.overallBand === "number" ? result.overallBand.toFixed(1) : "—"}
              </div>
              <p className="mt-3 text-[13.5px]" style={{ color: "var(--body)" }}>
                {test?.title} · {SKILL_META[test?.skill ?? "reading"]?.label}
              </p>
            </div>

            <div className="px-6 py-7 flex flex-col gap-6 sm:px-10">
              {result?.sections?.length ? (
                <div className="flex flex-col gap-3">
                  {result.sections.map((s) => (
                    <div key={s.key || s.title} className="rounded-xl border px-4 py-3.5" style={{ borderColor: "var(--line)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                            {s.title || s.key}
                          </p>
                          {s.comments && (
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--body)" }}>
                              {s.comments}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-display text-[22px] font-semibold" style={{ color: "var(--brand)" }}>
                          {typeof s.band === "number" ? s.band.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {result?.feedback && (
                <div className="rounded-xl px-4 py-3.5" style={{ background: "var(--brand-soft)" }}>
                  <p className="text-[13px] leading-[1.7]" style={{ color: "var(--ink)" }}>
                    {result.feedback}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/mock-tests"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: "var(--brand)" }}
                >
                  View all my tests
                </Link>
                {test && (
                  <Link
                    href={`/dashboard/mock-tests/${test.id}/take`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-[14px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)]"
                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                  >
                    <TimerReset size={15} /> Retake test
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6" style={{ background: "var(--bg)" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
        <span className="text-[13.5px]" style={{ color: "var(--body)" }}>
          Preparing your test…
        </span>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--bg)" }}>
        <p className="font-display text-[20px] font-semibold" style={{ color: "var(--ink)" }}>
          Couldn&apos;t open the test
        </p>
        <p className="text-[14px] max-w-[420px]" style={{ color: "var(--body)" }}>
          {error ?? "Something went wrong while loading the test."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/mock-tests")}
          className="rounded-full text-white text-[14px] font-medium px-6 py-[11px] transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          Back to mock tests
        </button>
      </div>
    );
  }

  if (phase === "submitting" || (submitting && phase === "ready")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6" style={{ background: "var(--bg)" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
        <span className="text-[13.5px]" style={{ color: "var(--body)" }}>
          Grading your answers with AI — this takes a moment…
        </span>
      </div>
    );
  }

  const submitDisabled = submitting || (hasTimer && secondsLeft <= 0);

  return (
    <div className="min-h-screen select-none" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur" style={{ borderColor: "var(--line)" }}>
        <div className="flex h-16 items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/mock-tests"
              className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--body)" }}
            >
              <ArrowLeft size={15} /> Test Center
            </Link>
            <span className="hidden h-4 w-px sm:block" style={{ background: "var(--line)" }} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                {test?.title}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: SKILL_META[test?.skill ?? "reading"].accent }}>
                {SKILL_META[test?.skill ?? "reading"].label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasTimer && (
              <span
                className="flex items-center gap-1.5 rounded-full px-3.5 py-[7px] font-mono text-[12.5px] font-semibold"
                style={{
                  background: lowTime ? "rgba(192,57,43,0.10)" : "var(--brand-soft)",
                  color: lowTime ? "#C0392B" : "var(--brand)",
                }}
              >
                <Clock size={13} /> {fmtTime(secondsLeft)}
              </span>
            )}
            <span className="hidden rounded-full px-3.5 py-[7px] font-mono text-[11.5px] font-semibold sm:inline-flex items-center gap-1.5" style={{ background: "var(--bg-soft)", color: "var(--body)" }}>
              {Math.min(answeredCount, flattened.length || totalQuestions)}/{flattened.length || totalQuestions}
            </span>
          </div>
        </div>
      </header>

      <div className={`w-full px-5 pt-8 ${isWriting ? "pb-24" : "pb-48"}`}>
        {error && (
          <p className="mb-6 rounded-xl border px-4 py-3 text-[12.5px]" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}>
            {error}
          </p>
        )}

        {isWriting && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border bg-white px-5 py-5" style={{ borderColor: "var(--line)" }}>
            <FileText size={18} style={{ color: "var(--brand-2)" }} />
            <p className="text-[13px]" style={{ color: "var(--body)" }}>
              Write both tasks below. AI grades each on the official IELTS Writing
              descriptors and gives you an overall band.
            </p>
          </div>
        )}
        {!isWriting && test?.content?.hasAudio && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white px-5 py-5" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-3">
              <Headphones size={18} style={{ color: "var(--brand-2)" }} />
              <p className="text-[13px]" style={{ color: "var(--body)" }}>
                Listening audio for this test plays once through. You can&apos;t pause or replay it.
              </p>
            </div>
            {media ? (
              <ListeningTestPlayer audioUrl={media.audioUrl} videoUrl={media.videoUrl} />
            ) : (
              <div className="flex items-center gap-2 py-1 text-[12.5px]" style={{ color: "var(--body)" }}>
                <Loader2 size={14} className="animate-spin" /> Preparing audio…
              </div>
            )}
          </div>
        )}

        {/* Writing tasks */}
        {isWriting &&
          (test?.content?.writingTask1 || test?.content?.writingTask2 ? (
            <div className="flex flex-col gap-6">
              {test.content.writingTask1 && (
                <TaskWriter
                  label="Writing Task 1"
                  prompt={test.content.writingTask1}
                  image={test.content.writingTask1Image}
                  imagePlacement={test.content.writingTask1ImagePlacement}
                  value={typeof answers["writingTask1"]?.text === "string" ? answers["writingTask1"].text ?? "" : ""}
                  onChange={(v) => setText("writingTask1", v)}
                />
              )}
              {test.content.writingTask2 && (
                <TaskWriter
                  label="Writing Task 2"
                  prompt={test.content.writingTask2}
                  image={test.content.writingTask2Image}
                  imagePlacement={test.content.writingTask2ImagePlacement}
                  value={typeof answers["writingTask2"]?.text === "string" ? answers["writingTask2"].text ?? "" : ""}
                  onChange={(v) => setText("writingTask2", v)}
                />
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-white px-5 py-10 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                Writing tasks for this test haven&apos;t been added yet.
              </p>
            </div>
          ))}

        {/* Reading passages: side-by-side passage | questions */}
        {!isWriting &&
          (readingPages ? (
            <>
              <div className="mb-5 flex items-center gap-2.5">
                <span
                  className="rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                >
                  Part {pageIdx + 1} of {readingPages.length}
                </span>
                <span className="text-[12.5px] font-medium" style={{ color: "var(--body)" }}>
                  {currentPage?.title || `Reading Passage ${pageIdx + 1}`}
                </span>
              </div>

              {currentPage && (
                <div className={currentPage.text && currentPage.sections.length > 0 ? "mb-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start" : ""}>
                  {currentPage.text && (
                    <div className={currentPage.sections.length > 0 ? "xl:sticky xl:top-[84px]" : ""}>
                      <div className="mb-6 overflow-hidden rounded-xl border bg-[#FBFBFD]" style={{ borderColor: "var(--line)" }}>
                        <div className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: "var(--line)" }}>
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-2)" }}>
                            {currentPage.title || "Reading passage"}
                          </span>
                        </div>
                        <div className="max-h-[72vh] overflow-y-auto whitespace-pre-line px-5 py-5 text-[13.5px] leading-[1.85]" style={{ color: "var(--ink)" }}>
                          {inlineRich(currentPage.text)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex min-w-0 flex-col gap-5">
                    {currentPage.sections.length > 0 ? (
                      currentPage.sections.map((section, si) => renderSection(section, si))
                    ) : (
                      <div className="rounded-xl border bg-white px-5 py-10 text-center" style={{ borderColor: "var(--line)" }}>
                        <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                          No questions were linked to this passage.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : test?.content?.sections?.length ? (
            test.content.sections.map((section, si) => renderSection(section, si))
          ) : (
            <div className="rounded-xl border bg-white px-5 py-10 text-center" style={{ borderColor: "var(--line)" }}>
              <p className="text-[13.5px]" style={{ color: "var(--body)" }}>
                Questions for this test haven&apos;t been added yet.
              </p>
            </div>
          ))}

        {/* Bottom navigation bar */}
        {!isWriting && flattened.length > 0 && (
          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 shadow-[0_-12px_40px_-24px_rgba(18,32,67,0.35)] backdrop-blur"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex items-stretch overflow-x-auto">
              {questionGroups.map((group, gi) => {
                if (group.questions.length === 0) return null;
                const answeredInPart = group.questions.filter((q) => isAnswered(answers[q.qid])).length;
                const isActive = gi === activePartIndex;
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => jumpToPart(gi, group.pageIndex)}
                    className="flex shrink-0 flex-col items-center justify-center gap-0.5 border-r px-5 py-2 text-center transition-colors hover:bg-[var(--brand-soft)]"
                    style={{ borderColor: "var(--line)", background: isActive ? "var(--brand-soft)" : "transparent" }}
                  >
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: isActive ? "var(--brand)" : "var(--body)" }}>
                      Part {gi + 1}
                    </span>
                    <span className="text-[11px]" style={{ color: isActive ? "var(--brand)" : "var(--body)" }}>
                      {answeredInPart} of {group.questions.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeGroup && activeGroup.questions.length > 0 && (
              <div className="border-t px-4 py-2.5" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-wrap items-end gap-2">
                  {activeGroup.questions.map((q) => {
                    const index = questionIndex[q.qid] ?? 0;
                    const a = isAnswered(answers[q.qid]);
                    return (
                      <button
                        key={q.qid}
                        type="button"
                        onClick={() => scrollToQuestion(q.qid, activePartIndex, activeGroup.pageIndex)}
                        className="flex flex-col items-center gap-1"
                      >
                        <span
                          className="block h-[3px] w-5 rounded-full transition-colors"
                          style={{ background: a ? "#0FA968" : "var(--line)" }}
                        />
                        <span
                          className="font-mono text-[12.5px] font-semibold leading-none transition-colors"
                          style={{ color: a ? "#0FA968" : "var(--body)" }}
                        >
                          {index}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-4 text-[11px] font-medium" style={{ color: "var(--body)" }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[3px] w-5 rounded-full" style={{ background: "#0FA968" }} /> Answered
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-[3px] w-5 rounded-full" style={{ background: "var(--line)" }} /> Not answered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  {Math.min(answeredCount, flattened.length)}/{flattened.length}
                </span>
                <button
                  type="button"
                  onClick={() => setClearConfirmOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[var(--bg-soft)]"
                  style={{ color: "var(--body)", borderColor: "var(--line)" }}
                >
                  <RotateCcw size={14} /> Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)" }}
                >
                  <Send size={14} /> Submit ({answeredCount}/{flattened.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {isWriting && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)",
                boxShadow: "0 10px 24px -10px var(--brand-2)",
              }}
            >
              <Send size={15} /> Submit for AI grading
            </button>
          </div>
        )}
      </div>

      {/* Leave warning toast */}
      {leaveWarning && phase === "ready" && (
        <div className="fixed inset-x-0 top-4 z-[55] flex justify-center px-4">
          <div
            className="flex items-center gap-2.5 rounded-2xl border bg-white px-5 py-3.5 shadow-[0_18px_40px_-18px_rgba(192,57,43,0.5)]"
            style={{ borderColor: "rgba(192,57,43,0.4)", color: "var(--ink)" }}
          >
            <AlertTriangle size={17} className="shrink-0" style={{ color: "#C0392B" }} />
            <p className="text-[12.5px] font-medium leading-[1.5]">
              You minimized or left the test window — this is a violation. Doing it again
              disqualifies your attempt.
            </p>
          </div>
        </div>
      )}

      {/* Clear answers confirm modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={() => setClearConfirmOpen(false)}>
          <div
            className="w-full max-w-[380px] rounded-2xl border bg-white p-6"
            style={{ borderColor: "var(--line)", boxShadow: "0 24px 64px -20px rgba(18,32,67,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
              Clear all answers?
            </h3>
            <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: "var(--body)" }}>
              This removes every answer you&apos;ve entered on this test so far. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#C0392B" }}
              >
                <RotateCcw size={14} /> Clear answers
              </button>
              <button
                type="button"
                onClick={() => setClearConfirmOpen(false)}
                className="px-4 py-3 text-[13.5px] font-medium"
                style={{ color: "var(--body)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={() => setConfirmOpen(false)}>
          <div
            className="w-full max-w-[400px] rounded-2xl border bg-white p-6"
            style={{ borderColor: "var(--line)", boxShadow: "0 24px 64px -20px rgba(18,32,67,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
              Submit the test?
            </h3>
            <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: "var(--body)" }}>
              You answered {answeredCount} of {flattened.length || "—"}. Once submitted,
              your answers are graded by AI and you&apos;ll get your band score immediately.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void submitTest(false)}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--brand)" }}
              >
                <Send size={14} /> Submit &amp; grade
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-3 text-[13.5px] font-medium"
                style={{ color: "var(--body)" }}
              >
                Keep practicing
              </button>
            </div>
          </div>
        </div>
      )}

      {lowTime && (
        <div className="fixed bottom-32 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#C0392B] px-5 py-2.5 text-[12.5px] font-semibold text-white shadow-lg">
          Submitting automatically when time runs out
        </div>
      )}
    </div>
  );
}

function TaskWriter({
  label,
  prompt,
  image,
  imagePlacement,
  value,
  onChange,
}: {
  label: string;
  prompt: string;
  image?: string;
  imagePlacement?: "above" | "below";
  value: string;
  onChange: (v: string) => void;
}) {
  const placement = imagePlacement === "above" ? "above" : "below";
  const taskImage = image ? (
    <div className="mb-4 overflow-hidden rounded-xl border bg-[#FBFBFD]" style={{ borderColor: "var(--line)" }}>
      <img
        src={image}
        alt={`${label} figure`}
        className="block w-full object-contain"
      />
    </div>
  ) : null;
  return (
    <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "var(--line)" }}>
      <div className="border-b px-5 py-3" style={{ borderColor: "var(--line)" }}>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-2)" }}>
          {label}
        </span>
      </div>
      <div className="px-5 py-5">
        {placement === "above" && taskImage}
        <p className="whitespace-pre-line text-[13.5px] leading-[1.8]" style={{ color: "var(--ink)" }}>
          {inlineRich(prompt)}
        </p>
        {placement === "below" && taskImage}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer here…"
          rows={9}
          className="mt-4 w-full select-text resize-y rounded-xl border bg-[#FBFBFD] px-4 py-3 text-[13.5px] leading-[1.8] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[11px]" style={{ color: "var(--body)" }}>
            {value.trim().length} words typed
          </span>
          {value.trim().length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "#0FA968" }}>
              <CheckCircle2 size={12} /> Ready for grading
            </span>
          )}
        </div>
      </div>
    </div>
  );
}