"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  FileJson,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { uploadToStorage } from "@/lib/upload-client";
import {
  PRACTICE_MODULE_LABELS,
  PRACTICE_MODULES,
  allowedPracticeTypes,
  formatTypeLabel,
  validatePracticeContent,
  type PracticeModule,
  type PracticeSetContent,
  type PracticeSetDto,
  type PracticeValidationReport,
} from "@/lib/practice/schema";

type CourseOption = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  modules: { title: string; lessons: { title: string; skill?: string }[] }[];
};

type PreviewData = {
  id: string;
  content: PracticeSetContent;
  report: PracticeValidationReport;
};

const inputClass =
  "w-full rounded-lg border bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function templateFor(skill: string): string {
  const ielts = (PRACTICE_MODULES as readonly string[]).includes(skill);
  const needsPassage = skill === "reading" || skill === "listening";
  const passage = needsPassage
    ? {
        passages: [
          {
            id: "p1",
            title: "Passage title",
            text: "Put the full passage text here.",
          },
        ],
      }
    : {};
  const first = {
    id: "q1",
    type: ielts ? "multiple-choice" : "mcq",
    question: needsPassage
      ? "What does the first paragraph say about the town?"
      : "What is the correct answer to this question?",
    ...(needsPassage ? { passageId: "p1" } : {}),
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option B",
    explanation: "Explain why this answer is correct.",
  };
  const second = {
    id: "q2",
    type: ielts ? "true-false-ng" : "true-false",
    question: "This statement is correct.",
    ...(needsPassage ? { passageId: "p1" } : {}),
    options: ielts ? ["True", "False", "Not Given"] : ["True", "False"],
    correctAnswer: "True",
    explanation: "Explain why this answer is correct.",
  };
  return JSON.stringify(
    {
      version: 1,
      title: `${formatTypeLabel(skill)} Set`,
      instructions: "Choose the correct answer.",
      ...passage,
      questions: [first, second],
    },
    null,
    2
  );
}

function buildGenerationPrompt(sample: string): string {
  return [
    "Generate a NEW IELTS Reading practice set for FlyBridge in the exact JSON format of the sample below.",
    "",
    "Rules:",
    "- Return ONLY valid JSON. Do not use markdown fences or add commentary.",
    "- Keep schemaVersion: 2 and the same tests[].sections[] structure.",
    "- Write original passages and questions. Do not copy the sample topics or sentences.",
    "- Include one section for every question type shown in the sample, with unique ids: s1, s2, s3...",
    "- Each section must have: id, type, title, instructions, passage { title, labeled, paragraphs: [{id, text}] } and questions.",
    "- Every question must have a unique id (q1, q2...), a sequential number, and an explanation tied to the passage.",
    "- For multiple-choice, include question.options as [{id, text}] and answer as the correct option id.",
    "- For true-false-not-given and yes-no-not-given, answer must be one of TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN.",
    "- For matching sections, provide headings/features/endings as [{id, text}] and use their ids in answers.",
    "- For completion and short-answer sections, answer must be an array of acceptable strings, with the best answer first.",
    "- Every answer must be clearly supported by the passage text.",
    "- Use realistic IELTS difficulty and natural academic English.",
    "- No placeholder URLs, no TODOs, no comments, and no duplicate ids.",
    "",
    "Sample JSON (structure and field names to copy exactly):",
    sample,
  ].join("\n");
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, CSSProperties> = {
    published: { background: "rgba(15,169,104,0.12)", color: "#0FA968" },
    draft: { background: "rgba(224,138,23,0.12)", color: "#B26B0C" },
    archived: { background: "rgba(120,120,130,0.12)", color: "#6B7280" },
  };
  return (
    <span
      className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em]"
      style={colors[status] ?? colors.draft}
    >
      {status}
    </span>
  );
}

function ReportPanel({ report, compact = false }: { report: PracticeValidationReport; compact?: boolean }) {
  if (report.errors.length === 0 && report.warnings.length === 0 && compact) return null;
  return (
    <div className="rounded-xl border px-4 py-3 text-[12px]" style={{ borderColor: "var(--line)" }}>
      <p className="font-medium" style={{ color: "var(--ink)" }}>
        {report.questionCount} questions · {report.passageCount} passages
      </p>
      {Object.keys(report.typeCounts).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(report.typeCounts).map(([type, count]) => (
            <span
              key={type}
              className="rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "var(--bg-soft)", color: "var(--body)" }}
            >
              {formatTypeLabel(type)} · {count}
            </span>
          ))}
        </div>
      )}
      {report.errors.length > 0 && (
        <div className="mt-2 space-y-1" style={{ color: "#DC2626" }}>
          {report.errors.slice(0, 8).map((message, i) => (
            <p key={i}>• {message}</p>
          ))}
          {report.errors.length > 8 && <p>…and {report.errors.length - 8} more</p>}
        </div>
      )}
      {report.warnings.length > 0 && (
        <div className="mt-2 space-y-1" style={{ color: "#B26B0C" }}>
          {report.warnings.slice(0, 4).map((message, i) => (
            <p key={i}>• {message}</p>
          ))}
          {report.warnings.length > 4 && <p>…and {report.warnings.length - 4} more</p>}
        </div>
      )}
    </div>
  );
}

export function QuizManager() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [moduleIndex, setModuleIndex] = useState(0);
  const [lessonIndex, setLessonIndex] = useState<number | null>(null);
  const [skill, setSkill] = useState("reading");
  const [sets, setSets] = useState<PracticeSetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [setsLoading, setSetsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [localReport, setLocalReport] = useState<PracticeValidationReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copyingPrompt, setCopyingPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const course = useMemo(
    () => courses.find((c) => c.id === courseId) ?? null,
    [courses, courseId]
  );
  const courseModule = course?.modules?.[moduleIndex] ?? null;
  const lesson = courseModule?.lessons?.[lessonIndex ?? -1] ?? null;
  const isIelts = course?.category === "IELTS";
  const skillOptions = useMemo(
    () => (isIelts ? [...PRACTICE_MODULES] : allowedPracticeTypes(skill)),
    [isIelts, skill]
  );

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses?all=true", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load courses");
      const loaded = Array.isArray(data.courses) ? (data.courses as CourseOption[]) : [];
      setCourses(loaded);
      if (loaded.length > 0 && !loaded.some((c) => c.id === courseId)) {
        setCourseId(loaded[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadSets = useCallback(async () => {
    if (!courseId) {
      setSets([]);
      return;
    }
    setSetsLoading(true);
    try {
      const params = new URLSearchParams({
        course: courseId,
        moduleIndex: String(moduleIndex),
        lessonIndex: lessonIndex === null ? "none" : String(lessonIndex),
        skill,
      });
      const res = await fetch(`/api/practice-sets?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load question sets");
      setSets(Array.isArray(data.sets) ? (data.sets as PracticeSetDto[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load question sets");
      setSets([]);
    } finally {
      setSetsLoading(false);
    }
  }, [courseId, lessonIndex, moduleIndex, skill]);

  useEffect(() => {
    void loadCourses();
  }, []);

  useEffect(() => {
    void loadSets();
  }, [loadSets]);

  const chooseCourse = (id: string) => {
    setCourseId(id);
    setModuleIndex(0);
    setLessonIndex(null);
    const next = courses.find((c) => c.id === id);
    setSkill(next?.category === "IELTS" ? "reading" : "general");
    setNotice("");
  };

  const chooseLesson = (value: string) => {
    if (value === "none") {
      setLessonIndex(null);
      setSkill(course?.category === "IELTS" ? skill : "general");
      return;
    }
    const index = Number(value);
    setLessonIndex(index);
    const nextSkill = courseModule?.lessons?.[index]?.skill;
    if (nextSkill) setSkill(nextSkill);
  };

  const inspectFile = async (selected: File | null) => {
    setFile(selected);
    setLocalReport(null);
    if (!selected) return;
    try {
      const parsed = JSON.parse(await selected.text()) as unknown;
      setLocalReport(validatePracticeContent(parsed, skill).report);
    } catch (e) {
      setLocalReport({
        passageCount: 0,
        questionCount: 0,
        typeCounts: {},
        errors: [e instanceof Error ? e.message : "Invalid JSON file"],
        warnings: [],
      });
    }
  };

  const uploadSet = async () => {
    if (!file || !courseId) {
      setError("Choose a JSON file first");
      return;
    }
    if (!courseModule) {
      setError("Add a module to this course before uploading question sets");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadToStorage(file, "practice", "file");
      const res = await fetch("/api/practice-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          moduleIndex,
          lessonIndex,
          skill,
          s3Key: uploaded.key,
          fileName: file.name,
          title: title.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setNotice(`${data.set.title} saved as Set ${data.set.setNumber}`);
      setUploadOpen(false);
      setFile(null);
      setTitle("");
      setLocalReport(null);
      await loadSets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openPreview = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/practice-sets/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load set");
      setPreview({ id, content: data.content, report: data.report });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load set");
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (set: PracticeSetDto) => {
    const next = set.status === "published" ? "draft" : "published";
    setBusyId(set.id);
    setError("");
    try {
      const res = await fetch(`/api/practice-sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await loadSets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteSet = async (set: PracticeSetDto) => {
    if (!window.confirm(`Delete ${set.title}? The uploaded file stays in storage.`)) return;
    setBusyId(set.id);
    setError("");
    try {
      const res = await fetch(`/api/practice-sets/${set.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      if (preview?.id === set.id) setPreview(null);
      await loadSets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateFor(skill)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "practice-set-template.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyGenerationPrompt = async () => {
    setCopyingPrompt(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/practice-templates/ielt-reading-v2.json", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not load the sample JSON");
      const sample = await response.text();
      await navigator.clipboard.writeText(buildGenerationPrompt(sample));
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not copy the generation prompt");
    } finally {
      setCopyingPrompt(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-[13px]" style={{ color: "var(--body)" }}>
        <Loader2 size={16} className="animate-spin" /> Loading question banks…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="IELTS Quiz Manager"
        subtitle="Upload course-linked question sets with passages, answers and explanations."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${buttonClass} border`}
              style={{ borderColor: "var(--line)", color: promptCopied ? "#0A7A4A" : "var(--ink)" }}
              onClick={() => void copyGenerationPrompt()}
              disabled={copyingPrompt}
            >
              {promptCopied ? <Check size={14} /> : <Copy size={14} />}
              {copyingPrompt ? "Loading…" : promptCopied ? "Prompt copied" : "Copy Claude prompt"}
            </button>
            <button
              type="button"
              className={`${buttonClass} border`}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              onClick={downloadTemplate}
            >
              <FileJson size={14} /> Download JSON template
            </button>
          </div>
        }
      />

      {courses.length === 0 ? (
        <div className="rounded-xl border px-5 py-10 text-center text-[13px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
          No courses found. Create a course first, then upload its question sets here.
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-3" style={{ borderColor: "var(--line)" }}>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                Course
              </span>
              <select
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                value={courseId}
                onChange={(e) => chooseCourse(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                Course module
              </span>
              <select
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                value={moduleIndex}
                onChange={(e) => {
                  setModuleIndex(Number(e.target.value));
                  setLessonIndex(null);
                }}
              >
                {(course?.modules ?? []).map((m, i) => (
                  <option key={i} value={i}>
                    {m.title || `Module ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--body)" }}>
                Linked lesson
              </span>
              <select
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                value={lessonIndex === null ? "none" : String(lessonIndex)}
                onChange={(e) => chooseLesson(e.target.value)}
              >
                <option value="none">Course level (no lesson)</option>
                {(courseModule?.lessons ?? []).map((l, i) => (
                  <option key={i} value={i}>
                    {l.title || `Lesson ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isIelts && lessonIndex === null ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {PRACTICE_MODULES.map((module: PracticeModule) => (
                <button
                  key={module}
                  type="button"
                  onClick={() => setSkill(module)}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors"
                  style={
                    skill === module
                      ? { background: "var(--brand)", color: "#fff" }
                      : { background: "var(--bg-soft)", color: "var(--body)" }
                  }
                >
                  {PRACTICE_MODULE_LABELS[module]}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "var(--body)" }}>
              <span>Skill:</span>
              <select
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)", width: "auto", minWidth: 180 }}
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
              >
                {skillOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatTypeLabel(option)}
                  </option>
                ))}
                {!skillOptions.includes(skill) && <option value={skill}>{formatTypeLabel(skill)}</option>}
              </select>
              {lesson && (
                <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  Linked to {lesson.title}
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-[12.5px]" style={{ borderColor: "#FCA5A5", background: "rgba(220,38,38,0.06)", color: "#B91C1C" }}>
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-[12.5px]" style={{ borderColor: "#86EFAC", background: "rgba(15,169,104,0.06)", color: "#0A7A4A" }}>
              {notice}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                {isIelts ? `${PRACTICE_MODULE_LABELS[skill as PracticeModule] ?? skill} question bank` : "Lesson question bank"}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--body)" }}>
                {courseModule?.title || "Course"} · {sets.length} set{sets.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              className={`${buttonClass} text-white`}
              style={{ background: "var(--brand)" }}
              onClick={() => {
                setError("");
                setNotice("");
                setUploadOpen(true);
              }}
            >
              <Plus size={14} /> Add set
            </button>
          </div>

          {setsLoading ? (
            <div className="flex items-center gap-2 py-10 text-[13px]" style={{ color: "var(--body)" }}>
              <Loader2 size={15} className="animate-spin" /> Loading sets…
            </div>
          ) : sets.length === 0 ? (
            <div className="rounded-2xl border bg-white px-5 py-10 text-center" style={{ borderColor: "var(--line)" }}>
              <FileJson size={22} className="mx-auto mb-3" style={{ color: "var(--brand)" }} />
              <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                No sets yet
              </p>
              <p className="mt-1 text-[12.5px]" style={{ color: "var(--body)" }}>
                Upload a JSON file to create Set 1 automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {sets.map((set) => (
                <div key={set.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold" style={{ color: "var(--brand)" }}>
                          SET {set.setNumber}
                        </span>
                        <StatusPill status={set.status} />
                      </div>
                      <p className="mt-1 truncate text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                        {set.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--body)" }}>
                        {set.questionCount} questions · {set.passageCount} passages · {set.fileName || set.s3Key}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className={`${buttonClass} border`}
                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        disabled={busyId === set.id}
                        onClick={() => void openPreview(set.id)}
                        title="Preview questions"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} border`}
                        style={{ borderColor: "var(--line)", color: set.status === "published" ? "#B26B0C" : "#0FA968" }}
                        disabled={busyId === set.id}
                        onClick={() => void toggleStatus(set)}
                        title={set.status === "published" ? "Unpublish" : "Publish"}
                      >
                        {set.status === "published" ? <X size={14} /> : <Check size={14} />}
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} border`}
                        style={{ borderColor: "#FCA5A5", color: "#DC2626" }}
                        disabled={busyId === set.id}
                        onClick={() => void deleteSet(set)}
                        title="Delete set"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {Object.keys(set.typeCounts).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(set.typeCounts).map(([type, count]) => (
                        <span
                          key={type}
                          className="rounded-full px-2 py-0.5 text-[10.5px]"
                          style={{ background: "var(--bg-soft)", color: "var(--body)" }}
                        >
                          {formatTypeLabel(type)} · {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                  Upload question set
                </h3>
                <p className="text-[12px]" style={{ color: "var(--body)" }}>
                  {course?.title} · {courseModule?.title || "Course"} · {formatTypeLabel(skill)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="rounded-lg p-1.5"
                style={{ color: "var(--body)" }}
              >
                <X size={16} />
              </button>
            </div>

            <label className="mb-3 block">
              <span className="mb-1.5 block text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
                Set title (optional)
              </span>
              <input
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Set ${sets.length + 1}`}
              />
            </label>

            <label
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center"
              style={{ borderColor: "var(--line)" }}
            >
              <Upload size={20} style={{ color: "var(--brand)" }} />
              <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                {file ? file.name : "Choose a JSON file"}
              </span>
              <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                Contains passages, questions, correct answers and explanations
              </span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  void inspectFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>

            {localReport && (
              <div className="mt-3">
                <ReportPanel report={localReport} compact={false} />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={`${buttonClass} border`}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                onClick={() => setUploadOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${buttonClass} text-white`}
                style={{ background: "var(--brand)" }}
                disabled={!file || uploading || (localReport?.errors.length ?? 0) > 0}
                onClick={() => void uploadSet()}
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {uploading ? "Uploading…" : "Add set"}
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-white p-5" style={{ borderColor: "var(--line)" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                Set preview · {skill}
              </h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-1.5"
                style={{ color: "var(--body)" }}
              >
                <X size={16} />
              </button>
            </div>
            <ReportPanel report={preview.report} compact />
            {(preview.content.passages ?? []).map((passage) => (
              <div key={passage.id} className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)" }}>
                <p className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>
                  {passage.title || passage.id}
                </p>
                <p className="mt-1 whitespace-pre-line text-[12.5px] leading-[1.7]" style={{ color: "var(--ink)" }}>
                  {passage.text.length > 700 ? `${passage.text.slice(0, 700)}…` : passage.text}
                </p>
              </div>
            ))}
            <div className="mt-4 space-y-2">
              {preview.content.questions.map((question, i) => (
                <div key={question.id} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--line)" }}>
                  <p className="text-[12.5px]" style={{ color: "var(--ink)" }}>
                    <span className="mr-1.5 font-mono font-bold" style={{ color: "var(--brand)" }}>
                      {i + 1}.
                    </span>
                    {question.question}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ color: "var(--body)" }}>
                    {formatTypeLabel(question.type)} · Answer: {question.correctAnswer || "AI graded"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
