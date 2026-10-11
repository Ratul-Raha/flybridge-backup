"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Wand2, Copy, Check, ImagePlus, X, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { uploadToStorage } from "@/lib/upload-client";
import {
  SKILL_META,
  type BundleDto,
  type MockTestSkill,
  type TestListItem,
} from "@/lib/mock-test-ui";
import { formatPriceText } from "@/lib/pricing";
import { ListeningMediaPlayer } from "@/components/mock-tests/listening-media-player";

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30";

const rowInputClass =
  "w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand-2/30";

const emptyBundleForm = {
  title: "",
  slug: "",
  description: "",
  badge: "",
  image: "",
  price: "",
  bdtPrice: "",
  currency: "USD",
  featured: false,
  published: false,
};

const emptyTestForm = {
  title: "",
  skill: "reading" as MockTestSkill,
  status: "draft",
  durationMinutes: "60",
  order: "0",
  course: "",
  questionText: "",
  answerText: "",
  contentJson: "",
  answerKey: "",
};

type ManagedQuestion = {
  qid?: string;
  type?: string;
  prompt?: string;
  options?: string[];
  correctOption?: number;
  multiple?: boolean;
  correctOptions?: number[];
  answer?: string;
  gapAnswers?: string[];
  passageRef?: string;
  wordHint?: string;
};

const GAP_TOKEN_RE = /\[\[gap:(\d+)\]\]/g;

function gapCount(prompt?: string): number {
  if (!prompt) return 0;
  return Array.from(prompt.matchAll(GAP_TOKEN_RE)).reduce(
    (max, match) => Math.max(max, Number(match[1]) || 0),
    0
  );
}

type ManagedPassage = { id?: string; title?: string; text?: string };

type ManagedSection = {
  id?: string;
  passageId?: string;
  type?: string;
  partTitle?: string;
  matchBox?: string[];
  instructions?: string;
  passage?: string;
  image?: string;
  imagePlacement?: string;
  bulletPoints?: string[];
  prepMinutes?: number;
  talkMinutes?: number;
  questions?: ManagedQuestion[];
};

type ManagedWritingContent = {
  passages?: ManagedPassage[];
  passage?: string;
  sections?: ManagedSection[];
  audioUrl?: string;
  audioPublicId?: string;
  videoUrl?: string;
  writingTask1?: string;
  writingTask1Chart?: {
    chartType: "line" | "bar" | "pie" | "table";
    title?: string;
    xAxis?: string[];
    yAxisLabel?: string;
    categories?: string[];
    series: { name: string; data: number[] }[];
    unit?: string;
    source?: string;
  } | null;
  writingTask2?: string;
  writingTask1Image?: string;
  writingTask1ImagePlacement?: string;
  writingTask2Image?: string;
  writingTask2ImagePlacement?: string;
};

const SECTION_PLACEMENTS = [
  { value: "above", label: "Above passage & instructions" },
  { value: "below-passage", label: "Below passage, above questions" },
  { value: "below", label: "After questions" },
] as const;

const WRITING_PLACEMENTS = [
  { value: "above", label: "Above the task" },
  { value: "below", label: "Below the task, above answer box" },
] as const;

/** Question types whose answer is one of the listed options (choice-style). */
const CHOICE_TYPES: string[] = [
  "multiple-choice",
  "true-false-ng",
  "heading-matching",
  "matching-features",
];

const QUESTION_TYPE_OPTIONS = [
  { value: "multiple-choice", label: "Multiple choice" },
  { value: "true-false-ng", label: "True / False / Not Given" },
  { value: "heading-matching", label: "Match headings" },
  { value: "matching-features", label: "Match features" },
  { value: "sentence-completion", label: "Sentence completion" },
  { value: "summary-completion", label: "Summary completion" },
  { value: "notes-completion", label: "Notes completion" },
  { value: "form-completion", label: "Form completion" },
  { value: "table-completion", label: "Table completion" },
  { value: "diagram-completion", label: "Diagram completion" },
  { value: "short-answer", label: "Short answer" },
] as const;

/** Section (part) types for IELTS Listening, mirroring the official exam. */
const LISTENING_SECTION_TYPES = [
  { value: "", label: "Choose type…" },
  { value: "multiple-choice", label: "Multiple choice" },
  { value: "matching", label: "Matching" },
  { value: "plan-map-labelling", label: "Plan / Map labelling" },
  { value: "diagram-labelling", label: "Diagram labelling" },
  { value: "flow-chart-completion", label: "Flow-chart completion" },
  { value: "form-completion", label: "Form completion" },
  { value: "notes-completion", label: "Notes completion" },
  { value: "table-completion", label: "Table completion" },
  { value: "sentence-completion", label: "Sentence completion" },
  { value: "summary-completion", label: "Summary completion" },
  { value: "short-answer", label: "Short answer" },
] as const;

function detectHasOptions(q: { type?: string; options?: string[] }): boolean {
  const opts = Array.isArray(q.options) ? q.options : [];
  return CHOICE_TYPES.includes(q.type ?? "") || opts.filter((o) => o?.trim()).length > 1;
}

function normalizeAnswerText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,"'´`]/g, "")
    .replace(/\s+/g, " ");
}

/** Mirrors the correct-option indices into the answer text (e.g. "A, C") so the
 *  answer key and the AI grader both see the same human-readable answer. */
function syncMultiAnswer(q: ManagedQuestion): void {
  const idxs = Array.isArray(q.correctOptions)
    ? q.correctOptions.slice().sort((a, b) => a - b)
    : [];
  q.answer = idxs.map((i) => String.fromCharCode(65 + i)).join(", ");
}

/** Returns the answer-key tokenizer map — mirrors server applyAnswerKey. */
function parseAnswerKeyNumbers(text: string): Map<number, string> {
  const map = new Map<number, string>();
  if (!text) return map;
  const tokenRe = /(\d{1,3})(?:[.:)\]\-]+|\s)\s*/g;
  const tokens: { n: number; start: number; numStart: number }[] = [];
  let mt: RegExpExecArray | null;
  while ((mt = tokenRe.exec(text)) !== null) {
    tokens.push({ n: parseInt(mt[1], 10), start: mt.index + mt[0].length, numStart: mt.index });
  }
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const end = i + 1 < tokens.length ? tokens[i + 1].numStart : text.length;
    const ans = text
      .slice(t.start, end)
      .replace(/[\s;,\/]+$/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (ans && !/^\d{1,4}$/.test(ans)) map.set(t.n, ans);
  }
  return map;
}

/** Question numbers (1-based, in display order) that have no correct answer yet. */
function collectMissing(content: unknown): number[] {
  if (!content || typeof content !== "object") return [];
  const sections = (content as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return [];
  const missing: number[] = [];
  let n = 1;
  for (const s of sections) {
    const sec = (s as { questions?: unknown }) ?? {};
    if (!Array.isArray(sec.questions)) continue;
    for (const q of sec.questions) {
      const qu = (q as {
        type?: string;
        options?: string[];
        correctOption?: number;
        correctOptions?: number[];
        multiple?: boolean;
        answer?: string;
        prompt?: string;
        gapAnswers?: string[];
      }) ?? {};
      const gaps = gapCount(qu.prompt);
      const answered = detectHasOptions(qu)
        ? qu.multiple
          ? Array.isArray(qu.correctOptions) && qu.correctOptions.length > 0
          : typeof qu.correctOption === "number" && qu.correctOption >= 0
        : gaps > 0
          ? Array.isArray(qu.gapAnswers) &&
            qu.gapAnswers.length >= gaps &&
            qu.gapAnswers.slice(0, gaps).every((answer) => typeof answer === "string" && answer.trim().length > 0)
        : typeof qu.answer === "string" && qu.answer.trim().length > 0;
      if (!answered) missing.push(n);
      n++;
    }
  }
  return missing;
}

/**
 * Reassigns sequential qid values (q1, q2, …) across the whole test so the
 * number in each qid keeps matching its position and the answer key. Ids are
 * what the player and the AI grader key answers by, so duplicates are fatal.
 */
function renumberQids(content: ManagedWritingContent): void {
  let n = 1;
  for (const s of content.sections ?? []) {
    for (const q of s.questions ?? []) {
      q.qid = `q${n}`;
      n++;
    }
  }
}

/** Next free `<prefix><n>` id, so adding after a delete never reuses one. */
function nextId(prefix: string, existing: (string | undefined)[]): string {
  const used = new Set(existing.filter((id): id is string => !!id));
  let n = 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/** Applies a question-type change: options + correct answer are kept in sync. */
function applyQuestionType(q: ManagedQuestion, type: string): void {
  q.type = type;
  q.multiple = false;
  q.correctOptions = [];
  if (type === "true-false-ng") {
    q.options = ["True", "False", "Not Given"];
    if (typeof q.correctOption !== "number") q.correctOption = -1;
    if (q.correctOption < 0) q.answer = "";
    else q.answer = q.options[q.correctOption] ?? "";
  } else if (CHOICE_TYPES.includes(type)) {
    const filled = (q.options ?? []).filter((o) => o?.trim());
    if (filled.length >= 2) {
      q.options = filled;
      if (typeof q.correctOption !== "number" || q.correctOption >= q.options.length) {
        q.correctOption = -1;
        q.answer = "";
      }
    } else {
      q.options = ["", ""];
      q.correctOption = -1;
      q.answer = "";
    }
  } else {
    q.options = [];
    q.correctOption = -1;
  }
}

type ManagedWritingTask = "t1" | "t2";

const SPEAKING_PARTS_META = [
  { type: "speaking-part-1", label: "Part 1", desc: "Introduction and interview — short everyday questions." },
  { type: "speaking-part-2", label: "Part 2", desc: "Cue card long turn — prep time then a 1-2 minute talk." },
  { type: "speaking-part-3", label: "Part 3", desc: "Two-way discussion — follow-up questions on Part 2." },
] as const;

function speakingPartOrder(type: string | undefined): number {
  const idx = SPEAKING_PARTS_META.findIndex((m) => m.type === type);
  return idx === -1 ? 99 : idx;
}

function newSpeakingQuestion(): ManagedQuestion {
  return {
    type: "short-answer",
    prompt: "",
    options: [],
    correctOption: -1,
    multiple: false,
    correctOptions: [],
    answer: "",
    gapAnswers: [],
  };
}

function sectionPreview(s: ManagedSection): string {
  const fromInstructions = s.instructions?.trim() ?? "";
  if (fromInstructions) return fromInstructions.slice(0, 70);
  const firstPrompt = s.questions?.find((q) => (q.prompt ?? "").trim())?.prompt?.trim() ?? "";
  if (firstPrompt) return firstPrompt.slice(0, 70);
  return "No instructions or questions yet";
}

export function MockTestManage({
  focusBundleId,
  focusTestId,
  createInBundle,
}: {
  focusBundleId?: string;
  focusTestId?: string;
  createInBundle?: string;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const queryBundleId = searchParams.get("bundle");
  const queryTestId = searchParams.get("test");
  const isFocusedEdit = Boolean(focusBundleId && focusTestId);
  const isFocusedNew = Boolean(createInBundle);
  const isFocused = isFocusedEdit || isFocusedNew;

  const focusedBackHref = `/dashboard/mock-tests?bundle=${isFocusedEdit ? focusBundleId : createInBundle}`;

  const autoEditRef = useRef<string | null>(focusTestId ?? queryTestId);
  const autoCreateRef = useRef<string | null>(createInBundle ?? null);

  useEffect(() => {
    if (!isFocusedEdit && queryBundleId && queryTestId) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("bundle");
      params.delete("test");
      router.replace(`/dashboard/mock-tests${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    }
  }, [isFocusedEdit, queryBundleId, queryTestId, router, searchParams]);

  const [bundles, setBundles] = useState<BundleDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [bundleForm, setBundleForm] = useState(emptyBundleForm);
  const [savingBundle, setSavingBundle] = useState(false);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);

  const [activeBundleId, setActiveBundleId] = useState<string | null>(null);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [testsLoaded, setTestsLoaded] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [testFormOpen, setTestFormOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [savingTest, setSavingTest] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<number | null>(null);
  const [uploadingTask, setUploadingTask] = useState<ManagedWritingTask | null>(null);
  const [copiedTask, setCopiedTask] = useState<ManagedWritingTask | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const loadBundles = useCallback(async () => {
    try {
      const res = await fetch("/api/mock-tests/bundles?all=true", { cache: "no-store" });
      const data = await res.json();
      setBundles(Array.isArray(data.bundles) ? data.bundles : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bundles");
    }
  }, []);

  useEffect(() => {
    loadBundles().then(() => {
      if (createInBundle) {
        setActiveBundleId(createInBundle);
      } else if (focusBundleId) {
        setActiveBundleId(focusBundleId);
      } else if (queryBundleId) {
        setActiveBundleId(queryBundleId);
      }
    });
    fetch("/api/courses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCourses((d.courses ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))))
      .catch(() => setCourses([]));
  }, [loadBundles, focusBundleId, queryBundleId, createInBundle]);

  const loadTests = useCallback(async (bundleId: string) => {
    setActiveBundleId(bundleId);
    setTestsLoaded(false);
    try {
      const res = await fetch(`/api/mock-tests/bundles/${bundleId}`, { cache: "no-store" });
      const data = await res.json();
      const loaded = Array.isArray(data.tests) ? (data.tests as TestListItem[]) : [];
      setTests(loaded);
      return loaded;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tests");
      return [];
    } finally {
      setTestsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (activeBundleId) {
      loadTests(activeBundleId).then((loaded) => {
        const targetId = autoEditRef.current;
        if (targetId) {
          autoEditRef.current = null;
          const target = loaded.find((t) => t.id === targetId);
          if (target) openTestEdit(target);
        }
        if (autoCreateRef.current) {
          autoCreateRef.current = null;
          openTestCreate(loaded.length);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBundleId, loadTests]);

  const openBundleCreate = () => {
    setEditingBundleId(null);
    setBundleForm(emptyBundleForm);
    setBundleFormOpen(true);
  };

  const openBundleEdit = (b: BundleDto) => {
    setEditingBundleId(b.id);
    setBundleForm({
      title: b.title,
      slug: b.slug,
      description: b.description ?? "",
      badge: b.badge ?? "",
      image: b.image ?? "",
      price: b.price ? String(b.price) : "",
      bdtPrice: b.prices?.BDT ? String(b.prices.BDT) : "",
      currency: b.currency ?? "USD",
      featured: b.featured ?? false,
      published: b.published ?? false,
    });
    setBundleFormOpen(true);
  };

  const saveBundle = async () => {
    setError(null);
    if (!bundleForm.title.trim()) {
      setError("Bundle title is required");
      return;
    }
    const url = editingBundleId ? `/api/mock-tests/bundles/${editingBundleId}` : "/api/mock-tests/bundles";
    setSavingBundle(true);
    try {
      const res = await fetch(url, {
        method: editingBundleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bundleForm,
          price: Math.max(0, Number(bundleForm.price) || 0),
          prices: {
            USD: Math.max(0, Number(bundleForm.price) || 0),
            BDT: Math.max(0, Number(bundleForm.bdtPrice) || 0),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setBundleFormOpen(false);
      setEditingBundleId(null);
      await loadBundles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingBundle(false);
    }
  };

  const deleteBundle = async (b: BundleDto) => {
    if (!confirm(`Delete pack "${b.title}"? All tests inside it will also be removed.`)) return;
    setDeletingBundleId(b.id);
    try {
      const res = await fetch(`/api/mock-tests/bundles/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (activeBundleId === b.id) setActiveBundleId(null);
      await loadBundles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingBundleId(null);
    }
  };

  const togglePublish = async (b: BundleDto, published: boolean) => {
    try {
      const res = await fetch(`/api/mock-tests/bundles/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      await loadBundles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const openTestCreate = (order?: number) => {
    setEditingTestId(null);
    setTestForm({
      ...emptyTestForm,
      title: "",
      skill: "reading",
      status: "draft",
      durationMinutes: "60",
      order: order != null ? String(order) : String(tests.length),
      course: "",
    });
    setTestFormOpen(true);
  };

  const openTestEdit = async (t: TestListItem) => {
    setEditingTestId(t.id);
    setTestFormOpen(true);
    setTestForm((prev) => ({
      ...prev,
      title: t.title,
      skill: t.skill,
      status: t.status,
      durationMinutes: String(t.durationMinutes ?? 0),
      order: String(t.order ?? 0),
      course: t.course?.id ?? "",
      questionText: "",
      answerText: "",
      contentJson: "",
      answerKey: "",
    }));
    try {
      const res = await fetch(`/api/mock-tests/${t.id}`, { cache: "no-store" });
      const data = await res.json();
      if (data.test?.content) {
        setTestForm((prev) => ({
          ...prev,
          contentJson: JSON.stringify(data.test.content, null, 2),
        }));
      }
      if (typeof data.test?.answerKey === "string") {
        setTestForm((prev) => ({ ...prev, answerKey: data.test.answerKey }));
      }
    } catch {
      /* content left empty, user can re-generate */
    }
  };

  const generate = async () => {
    setError(null);
    if (!testForm.questionText.trim()) {
      setError("Paste the question text first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/mock-tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: testForm.skill,
          questionBlob: testForm.questionText,
          answerBlob: testForm.answerText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setTestForm((prev) => ({
        ...prev,
        contentJson: JSON.stringify(data.content, null, 2),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const saveTest = async () => {
    setError(null);
    if (!testForm.title.trim()) {
      setError("Test title is required");
      return;
    }
    let content: unknown = {};
    if (testForm.contentJson.trim()) {
      try {
        content = JSON.parse(testForm.contentJson);
      } catch {
        setError("Content JSON is not valid");
        return;
      }
    }
    if (!editingTestId && Object.keys(content as object).length === 0) {
      setError(
        "Questions not added yet — paste the question text, then click \"Generate structure with AI\" (or paste Content JSON)."
      );
      return;
    }
    if (!editingTestId && (testForm.skill === "reading" || testForm.skill === "listening")) {
      const anySections = (content as { sections?: unknown; passages?: unknown[] }).sections;
      let count = Array.isArray(anySections)
        ? (anySections as { questions?: unknown[] }[]).reduce(
            (n, s) => n + (Array.isArray(s?.questions) ? s.questions.length : 0),
            0
          )
        : 0;
      const passages = (content as { passages?: unknown }).passages;
      if (Array.isArray(passages)) {
        for (const p of passages) {
          const pSections = (p as { sections?: unknown }).sections;
          if (!Array.isArray(pSections)) continue;
          count += (pSections as { questions?: unknown[] }[]).reduce(
            (n, s) => n + (Array.isArray(s?.questions) ? s.questions.length : 0),
            0
          );
        }
      }
      if (count === 0) {
        setError(
          "No questions found in this test yet. Click \"Generate structure with AI\" after pasting the question text, then create the test."
        );
        return;
      }
    }
    if (!editingTestId && testForm.skill === "speaking") {
      const sections = (content as { sections?: unknown }).sections;
      const count = Array.isArray(sections)
        ? (sections as { questions?: unknown[] }[]).reduce(
            (n, s) => n + (Array.isArray(s?.questions) ? s.questions.length : 0),
            0
          )
        : 0;
      if (count === 0) {
        setError(
          "No speaking questions yet — build the speaking parts below (Part 1, 2 and 3), then create the test."
        );
        return;
      }
    }
    if (testForm.status === "published" && testForm.skill !== "speaking") {
      const missing = collectMissing(content);
      if (missing.length > 0) {
        const shown = missing.slice(0, 10).map((n) => `Q${n}`).join(", ");
        setError(
          `${missing.length} question${missing.length === 1 ? "" : "s"} still ${missing.length === 1 ? "has" : "have"} no correct answer (${shown}${missing.length > 10 ? ", …" : ""}). Mark the correct option/answer, or keep the test as a draft.`
        );
        return;
      }
    }
    const url = editingTestId ? `/api/mock-tests/${editingTestId}` : "/api/mock-tests";
    setSavingTest(true);
    try {
      const res = await fetch(url, {
        method: editingTestId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: activeBundleId,
          title: testForm.title,
          skill: testForm.skill,
          status: testForm.status,
          durationMinutes: Number(testForm.durationMinutes) || 0,
          order: Number(testForm.order) || 0,
          course: testForm.course || null,
          content,
          answerKey: testForm.answerKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (isFocused) {
        router.push(focusedBackHref);
        return;
      }
      setTestFormOpen(false);
      setEditingTestId(null);
      if (activeBundleId) await loadTests(activeBundleId);
      await loadBundles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingTest(false);
    }
  };

  const deleteTest = async (t: TestListItem) => {
    if (!confirm(`Delete test "${t.title}"?`)) return;
    setDeletingTestId(t.id);
    try {
      const res = await fetch(`/api/mock-tests/${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (activeBundleId) await loadTests(activeBundleId);
      await loadBundles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingTestId(null);
    }
  };

  const activeBundle = useMemo(
    () => bundles.find((b) => b.id === activeBundleId) ?? null,
    [bundles, activeBundleId]
  );

  const parsedContent = useMemo(() => {
    if (!testForm.contentJson.trim()) return null;
    try {
      const v = JSON.parse(testForm.contentJson);
      return v && typeof v === "object" ? (v as ManagedWritingContent) : null;
    } catch {
      return null;
    }
  }, [testForm.contentJson]);

  const contentSections = parsedContent?.sections ?? [];

  const contentJsonInvalid = testForm.contentJson.trim().length > 0 && parsedContent === null;

  const sectionStartNums = useMemo(() => {
    const starts: number[] = [];
    let n = 1;
    for (const s of contentSections) {
      starts.push(n);
      n += s.questions?.length ?? 0;
    }
    return starts;
  }, [contentSections]);

  const taskFields = (task: ManagedWritingTask) =>
    task === "t1"
      ? { text: "writingTask1", image: "writingTask1Image", placement: "writingTask1ImagePlacement" }
      : { text: "writingTask2", image: "writingTask2Image", placement: "writingTask2ImagePlacement" };

  const updateWritingTask = (task: ManagedWritingTask, patch: { image?: string; placement?: string }) => {
    const f = taskFields(task);
    setTestForm((form) => {
      let current: Record<string, unknown> = {};
      if (form.contentJson.trim()) {
        try {
          current = JSON.parse(form.contentJson) as Record<string, unknown>;
        } catch {
          return form;
        }
      }
      const next = { ...current };
      if (patch.image) next[f.image] = patch.image;
      if (patch.placement !== undefined) next[f.placement] = patch.placement;
      if (next[f.image] && !next[f.placement]) next[f.placement] = "below";
      if (!next[f.image]) {
        delete next[f.image];
        delete next[f.placement];
      }
      return { ...form, contentJson: JSON.stringify(next, null, 2) };
    });
  };

  const updateContentField = (key: string, value: string) => {
    setTestForm((form) => {
      let current: Record<string, unknown> = {};
      if (form.contentJson.trim()) {
        try {
          current = JSON.parse(form.contentJson) as Record<string, unknown>;
        } catch {
          return form;
        }
      }
      const next = { ...current };
      if (value.trim()) next[key] = value.trim();
      else delete next[key];
      return { ...form, contentJson: JSON.stringify(next, null, 2) };
    });
  };

  const uploadWritingImage = async (task: ManagedWritingTask, file: File) => {
    if (!file || uploadingTask !== null) return;
    setUploadingTask(task);
    setUploadProgress(0);
    try {
      const uploaded = await uploadToStorage(file, "mock-tests", "file", (pct) =>
        setUploadProgress(pct)
      );
      updateWritingTask(task, { image: uploaded.ref });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploadingTask(null);
      setUploadProgress(null);
    }
  };

  const removeWritingImage = (task: ManagedWritingTask) =>
    updateWritingTask(task, { image: "" });

  const setWritingPlacement = (task: ManagedWritingTask, placement: string) =>
    updateWritingTask(task, { placement });

  const copyWritingToken = async (task: ManagedWritingTask) => {
    const f = taskFields(task);
    const url = parsedContent?.[f.image as keyof ManagedWritingContent] as string | undefined;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(`![Section image](${url})`);
      setCopiedTask(task);
      window.setTimeout(() => setCopiedTask((c) => (c === task ? null : c)), 1500);
    } catch {
      setError("Clipboard unavailable — copy the image URL from the field instead.");
    }
  };

  const writingTaskRows = [
    { task: "t1" as const, label: "Writing Task 1", text: parsedContent?.writingTask1, image: parsedContent?.writingTask1Image, placement: parsedContent?.writingTask1ImagePlacement },
    { task: "t2" as const, label: "Writing Task 2", text: parsedContent?.writingTask2, image: parsedContent?.writingTask2Image, placement: parsedContent?.writingTask2ImagePlacement },
  ].filter((r) => !!r.text);

  const updateSections = (fn: (secs: ManagedSection[]) => void) => {
    const current = parsedContent ?? {};
    const next = JSON.parse(JSON.stringify(contentSections)) as ManagedSection[];
    fn(next);
    setTestForm((f) => ({
      ...f,
      contentJson: JSON.stringify({ ...current, sections: next }, null, 2),
    }));
  };

  const uploadSectionImage = async (i: number, file: File) => {
    if (!file || uploadingSection !== null) return;
    setUploadingSection(i);
    setUploadProgress(0);
    try {
      const uploaded = await uploadToStorage(file, "mock-tests", "file", (pct) =>
        setUploadProgress(pct)
      );
      updateSections((secs) => {
        const s = secs[i];
        if (!s) return;
        s.image = uploaded.ref;
        if (!s.imagePlacement) s.imagePlacement = "below-passage";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploadingSection(null);
      setUploadProgress(null);
    }
  };

  const removeSectionImage = (i: number) => {
    updateSections((secs) => {
      const s = secs[i];
      if (s) {
        delete s.image;
        delete s.imagePlacement;
      }
    });
  };

  const setSectionPlacement = (i: number, placement: string) => {
    updateSections((secs) => {
      if (secs[i]) secs[i].imagePlacement = placement;
    });
  };

  const copySectionToken = async (i: number) => {
    const url = contentSections[i]?.image;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(`![Section image](${url})`);
      setCopiedToken(i);
      window.setTimeout(() => setCopiedToken((c) => (c === i ? null : c)), 1500);
    } catch {
      setError("Clipboard unavailable — copy the image URL from the field instead.");
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Manual authoring helpers (form editors drive the Content JSON)   */
  /* ---------------------------------------------------------------- */

  const updateContent = useCallback((fn: (c: ManagedWritingContent) => void) => {
    setTestForm((f) => {
      let current: ManagedWritingContent = {};
      if (f.contentJson.trim()) {
        try {
          const v = JSON.parse(f.contentJson) as unknown;
          if (v && typeof v === "object") current = v as ManagedWritingContent;
        } catch {
          return f;
        }
      }
      const next = JSON.parse(JSON.stringify(current)) as ManagedWritingContent;
      fn(next);
      return { ...f, contentJson: JSON.stringify(next, null, 2) };
    });
  }, []);

  const uploadListeningAudio = async (file: File) => {
    if (!file || uploadingAudio) return;
    setUploadingAudio(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadToStorage(file, "mock-tests", "file", (pct) =>
        setUploadProgress(pct)
      );
      updateContent((c) => {
        c.audioUrl = uploaded.ref;
        c.audioPublicId = uploaded.key;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio upload failed");
    } finally {
      setUploadingAudio(false);
      setUploadProgress(null);
    }
  };

  const removeListeningAudio = () =>
    updateContent((c) => {
      delete c.audioUrl;
      delete c.audioPublicId;
    });

  const passagesList = useMemo<ManagedPassage[]>(() => {
    const c = parsedContent;
    if (Array.isArray(c?.passages)) return c.passages as ManagedPassage[];
    if (typeof c?.passage === "string" && c.passage.trim()) {
      return [{ id: "p1", title: "Reading Passage 1", text: c.passage }];
    }
    return [];
  }, [parsedContent]);

  const updatePassages = useCallback(
    (fn: (ps: ManagedPassage[]) => void) =>
      updateContent((c) => {
        const ps = JSON.parse(
          JSON.stringify(
            Array.isArray(c.passages)
              ? c.passages
              : typeof c.passage === "string" && c.passage.trim()
                ? [{ id: "p1", title: "Reading Passage 1", text: c.passage }]
                : []
          )
        ) as ManagedPassage[];
        fn(ps);
        c.passages = ps;
        if (c.passage) delete c.passage;
      }),
    [updateContent]
  );

  const addPassage = () =>
    updatePassages((ps) => {
      const n = ps.length + 1;
      ps.push({
        id: nextId("p", ps.map((p) => p.id)),
        title: `Reading Passage ${n}`,
        text: "",
      });
    });

  const setPassageField = (pi: number, key: keyof ManagedPassage, val: string) =>
    updatePassages((ps) => {
      const p = ps[pi];
      if (p) p[key] = val;
    });

  const removePassage = (pi: number) => {
    const pid = passagesList[pi]?.id;
    updateContent((c) => {
      const ps = (Array.isArray(c.passages) ? c.passages : []) as ManagedPassage[];
      ps.splice(pi, 1);
      c.passages = ps;
      if (pid) {
        for (const s of c.sections ?? []) {
          if (s.passageId === pid) s.passageId = ps[0]?.id ?? "";
        }
      }
      if (c.passage) delete c.passage;
    });
  };

  const addSection = () =>
    updateContent((c) => {
      c.sections = c.sections ?? [];
      c.sections.push({
        id: nextId("s", c.sections.map((s) => s.id)),
        type: "",
        instructions: "",
        passageId: passagesList[0]?.id ?? "",
        passage: "",
        questions: [],
      });
    });

  const removeSection = (si: number) =>
    updateContent((c) => {
      c.sections = c.sections ?? [];
      c.sections.splice(si, 1);
      renumberQids(c);
    });

  const setSectionField = (si: number, key: keyof ManagedSection, val: unknown) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (s) (s as unknown as Record<string, unknown>)[key] = val;
    });

  const addQuestion = (si: number) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      s.questions = s.questions ?? [];
      s.questions.push({
        type: "short-answer",
        prompt: "",
        options: [],
        correctOption: -1,
        multiple: false,
        correctOptions: [],
        answer: "",
        gapAnswers: [],
      });
      renumberQids(c);
    });

  const removeQuestion = (si: number, qi: number) =>
    updateContent((c) => {
      c.sections?.[si]?.questions?.splice(qi, 1);
      renumberQids(c);
    });

  const setQuestionField = (si: number, qi: number, key: keyof ManagedQuestion, val: unknown) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (q) (q as unknown as Record<string, unknown>)[key] = val;
    });

  const changeQuestionType = (si: number, qi: number, type: string) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (q) applyQuestionType(q, type);
    });

  const moveQuestion = (si: number, qi: number, dir: -1 | 1) =>
    updateContent((c) => {
      const arr = c.sections?.[si]?.questions;
      if (!arr) return;
      const j = qi + dir;
      if (j < 0 || j >= arr.length) return;
      const t = arr[qi];
      arr[qi] = arr[j];
      arr[j] = t;
      renumberQids(c);
    });

  const addOption = (si: number, qi: number) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (q) q.options = [...(q.options ?? []), ""];
    });

  const setOptionValue = (si: number, qi: number, oi: number, val: string) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (q?.options) q.options[oi] = val;
    });

  const removeOption = (si: number, qi: number, oi: number) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (!q?.options) return;
      q.options.splice(oi, 1);
      if (typeof q.correctOption === "number" && q.correctOption >= 0) {
        if (q.correctOption === oi) {
          q.correctOption = -1;
          q.answer = "";
        } else if (q.correctOption > oi) q.correctOption--;
      }
      if (Array.isArray(q.correctOptions)) {
        q.correctOptions = q.correctOptions
          .filter((i) => i !== oi)
          .map((i) => (i > oi ? i - 1 : i));
        syncMultiAnswer(q);
      }
    });

  const moveOption = (si: number, qi: number, oi: number, dir: -1 | 1) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      const arr = q?.options;
      if (!arr) return;
      const j = oi + dir;
      if (j < 0 || j >= arr.length) return;
      const t = arr[oi];
      arr[oi] = arr[j];
      arr[j] = t;
      if (typeof q.correctOption === "number") {
        if (q.correctOption === oi) q.correctOption = j;
        else if (q.correctOption === j) q.correctOption = oi;
      }
      if (Array.isArray(q.correctOptions)) {
        q.correctOptions = q.correctOptions
          .map((i) => (i === oi ? j : i === j ? oi : i))
          .sort((a, b) => a - b);
        syncMultiAnswer(q);
      }
    });

  const setCorrectOption = (si: number, qi: number, oi: number) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (!q) return;
      q.multiple = false;
      q.correctOptions = [];
      q.correctOption = oi;
      q.answer = q.options?.[oi] ?? "";
    });

  const toggleMultiple = (si: number, qi: number) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (!q) return;
      if (!q.multiple) {
        // Entering multi-select keeps the single answer as the first selected one.
        q.multiple = true;
        q.correctOptions =
          typeof q.correctOption === "number" && q.correctOption >= 0
            ? [q.correctOption]
            : [];
        q.correctOption = -1;
        syncMultiAnswer(q);
      } else {
        q.multiple = false;
        q.correctOptions = [];
        q.correctOption = -1;
        q.answer = "";
      }
    });

  const toggleCorrectOption = (si: number, qi: number, oi: number) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (!q) return;
      q.multiple = true;
      const set = new Set(Array.isArray(q.correctOptions) ? q.correctOptions : []);
      if (set.has(oi)) set.delete(oi);
      else set.add(oi);
      q.correctOptions = Array.from(set).sort((a, b) => a - b);
      q.correctOption = -1;
      syncMultiAnswer(q);
    });

  /* -------------------- listening matching builder -------------------- */

  const setSectionType = (si: number, type: string) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      s.type = type;
      if (type === "matching" && !(s.matchBox ?? []).length) s.matchBox = ["", "", ""];
    });

  const addMatchBoxOption = (si: number) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      s.matchBox = [...(s.matchBox ?? []), ""];
      for (const q of s.questions ?? []) q.options = [...(q.options ?? []), ""];
    });

  const setMatchBoxOption = (si: number, oi: number, val: string) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      const box = s.matchBox ?? [];
      box[oi] = val;
      s.matchBox = box;
      for (const q of s.questions ?? []) {
        const opts = q.options ?? [];
        opts[oi] = val;
        q.options = opts;
      }
    });

  const removeMatchBoxOption = (si: number, oi: number) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      s.matchBox = (s.matchBox ?? []).filter((_, i) => i !== oi);
      for (const q of s.questions ?? []) {
        const opts = (q.options ?? []).filter((_, i) => i !== oi);
        q.options = opts;
        if (typeof q.correctOption === "number") {
          if (q.correctOption === oi) {
            q.correctOption = -1;
            q.answer = "";
          } else if (q.correctOption > oi) q.correctOption--;
        }
      }
    });

  const addMatchingItem = (si: number) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      s.questions = s.questions ?? [];
      s.questions.push({
        type: "matching",
        prompt: "",
        options: [...(s.matchBox ?? [])],
        correctOption: -1,
        multiple: false,
        correctOptions: [],
        answer: "",
        gapAnswers: [],
      });
      renumberQids(c);
    });

  const setMatchingCorrect = (si: number, qi: number, oi: number) =>
    updateContent((c) => {
      const q = c.sections?.[si]?.questions?.[qi];
      if (!q) return;
      q.multiple = false;
      q.correctOptions = [];
      q.correctOption = oi;
      q.answer = String.fromCharCode(65 + oi);
    });

  const matchingBox = (s: ManagedSection): string[] => {
    if ((s.matchBox ?? []).filter((t) => t.trim()).length > 0) return s.matchBox ?? [];
    const first = (s.questions ?? []).find((q) => (q.options ?? []).some((o) => o.trim()));
    return first?.options ?? [];
  };

  const renderMatchingBuilder = (s: ManagedSection, si: number) => {
    const box = matchingBox(s);
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
          Options box (A, B, C …) — shown to students above the items
        </p>
        {box.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <span
              className="w-5 shrink-0 text-center font-mono text-[11.5px] font-bold"
              style={{ color: "var(--brand-2)" }}
            >
              {String.fromCharCode(65 + oi)}
            </span>
            <input
              type="text"
              value={opt ?? ""}
              onChange={(e) => setMatchBoxOption(si, oi, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
              className={rowInputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
            <button
              type="button"
              onClick={() => removeMatchBoxOption(si, oi)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
              style={{ borderColor: "var(--line)", color: "#C0392B" }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addMatchBoxOption(si)}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          <Plus size={11} /> Add option
        </button>

        <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
          Items — each item is one numbered question. Mark its correct letter.
        </p>
        {(s.questions ?? []).map((q, qi) => {
          const qnum = (sectionStartNums[si] ?? 1) + qi;
          return (
            <div key={q.qid ?? qi} className="flex flex-col gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  {qnum}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => moveQuestion(si, qi, -1)}
                  disabled={qi === 0}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(si, qi, 1)}
                  disabled={qi === (s.questions?.length ?? 0) - 1}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(si, qi)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                  style={{ borderColor: "var(--line)", color: "#C0392B" }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                value={q.prompt ?? ""}
                onChange={(e) => setQuestionField(si, qi, "prompt", e.target.value)}
                rows={2}
                placeholder={`Item ${qnum} — the statement students match…`}
                className={inputClass + " resize-y font-mono text-[12px]"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {box.map((_, oi) => {
                  const active = q.correctOption === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setMatchingCorrect(si, qi, oi)}
                      title="Mark as the correct letter"
                      className="flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[11.5px] font-bold transition-colors"
                      style={
                        active
                          ? { borderColor: "var(--brand)", background: "var(--brand)", color: "#fff" }
                          : { borderColor: "var(--line)", background: "white", color: "var(--ink)" }
                      }
                    >
                      {String.fromCharCode(65 + oi)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => addMatchingItem(si)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed px-4 py-2 text-[12px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          <Plus size={12} /> Add item
        </button>
      </div>
    );
  };

  const setWritingTaskText = (task: ManagedWritingTask, text: string) => {
    const f = taskFields(task);
    updateContent((c) => {
      const rec = c as unknown as Record<string, unknown>;
      if (text.trim()) rec[f.text] = text;
      else delete rec[f.text];
    });
  };

  /* ------------------------- speaking parts ------------------------- */

  const speakingParts = useMemo<ManagedSection[]>(
    () =>
      (parsedContent?.sections ?? [])
        .filter((s) => s.type && s.type.startsWith("speaking-part-"))
        .sort((a, b) => speakingPartOrder(a.type) - speakingPartOrder(b.type)),
    [parsedContent]
  );

  const addSpeakingPart = (type: string) =>
    updateContent((c) => {
      c.sections = c.sections ?? [];
      c.sections.push({
        id: nextId("s", c.sections.map((s) => s.id)),
        type,
        instructions: "",
        bulletPoints: type === "speaking-part-2" ? ["", ""] : [],
        prepMinutes: type === "speaking-part-2" ? 1 : 0,
        talkMinutes: type === "speaking-part-2" ? 2 : 0,
        passage: "",
        questions: type === "speaking-part-2" ? [newSpeakingQuestion()] : [],
      });
      c.sections.sort(
        (a, b) => speakingPartOrder(a.type) - speakingPartOrder(b.type)
      );
      renumberQids(c);
    });

  const createSpeakingParts = () =>
    updateContent((c) => {
      c.sections = c.sections ?? [];
      for (const meta of SPEAKING_PARTS_META) {
        if (c.sections.some((s) => s.type === meta.type)) continue;
        c.sections.push({
          id: nextId("s", c.sections.map((s) => s.id)),
          type: meta.type,
          instructions: "",
          bulletPoints: meta.type === "speaking-part-2" ? ["", ""] : [],
          prepMinutes: meta.type === "speaking-part-2" ? 1 : 0,
          talkMinutes: meta.type === "speaking-part-2" ? 2 : 0,
          passage: "",
          questions: meta.type === "speaking-part-2" ? [newSpeakingQuestion()] : [],
        });
      }
      c.sections.sort(
        (a, b) => speakingPartOrder(a.type) - speakingPartOrder(b.type)
      );
      renumberQids(c);
    });

  const removeSpeakingPart = (type: string) =>
    updateContent((c) => {
      c.sections = (c.sections ?? []).filter((s) => s.type !== type);
      renumberQids(c);
    });

  const addSpeakingQuestion = (type: string) =>
    updateContent((c) => {
      const s = (c.sections ?? []).find((x) => x.type === type);
      if (!s) return;
      s.questions = s.questions ?? [];
      s.questions.push(newSpeakingQuestion());
      renumberQids(c);
    });

  const setBulletPoint = (type: string, bi: number, val: string) =>
    updateContent((c) => {
      const s = (c.sections ?? []).find((x) => x.type === type);
      if (!s) return;
      s.bulletPoints = s.bulletPoints ?? [];
      s.bulletPoints[bi] = val;
    });

  const addBulletPoint = (type: string) =>
    updateContent((c) => {
      const s = (c.sections ?? []).find((x) => x.type === type);
      if (!s) return;
      s.bulletPoints = [...(s.bulletPoints ?? []), ""];
    });

  const removeBulletPoint = (type: string, bi: number) =>
    updateContent((c) => {
      const s = (c.sections ?? []).find((x) => x.type === type);
      if (!s) return;
      s.bulletPoints = (s.bulletPoints ?? []).filter((_, i) => i !== bi);
    });

  /* Answer completeness + answer-key coverage flags for review */
  const answerStats = useMemo(() => {
    const questions = (parsedContent?.sections ?? []).flatMap((s) => s.questions ?? []);
    const missing = collectMissing(parsedContent);
    return { total: questions.length, answered: questions.length - missing.length, missing };
  }, [parsedContent]);

  const keyedNumbers = useMemo(
    () => parseAnswerKeyNumbers(testForm.answerText.trim() || testForm.answerKey),
    [testForm.answerText, testForm.answerKey]
  );

  const questionStatus = useCallback(
    (q: ManagedQuestion): "key" | "ai" | "missing" => {
      const opts = Array.isArray(q.options) ? q.options : [];
      if (detectHasOptions(q)) {
        const qnum = q.qid ? parseInt(String(q.qid).match(/\d+$/)?.[0] ?? "-1", 10) : -1;
        const keyVal = keyedNumbers.get(qnum);
        if (q.multiple) {
          const idxs = Array.isArray(q.correctOptions) ? q.correctOptions : [];
          if (idxs.length === 0) return "missing";
          const expected = idxs
            .slice()
            .sort((a, b) => a - b)
            .map((i) => String.fromCharCode(65 + i))
            .join(", ");
          if (keyVal) return normalizeAnswerText(expected) === normalizeAnswerText(keyVal) ? "key" : "ai";
          return "ai";
        }
        const ci = typeof q.correctOption === "number" ? q.correctOption : -1;
        const expected = ci >= 0 ? opts[ci] : "";
        if (keyVal) return normalizeAnswerText(expected) === normalizeAnswerText(keyVal) ? "key" : "ai";
        return ci >= 0 ? "ai" : "missing";
      }
      const gaps = gapCount(q.prompt);
      if (gaps > 0) {
        const answers = Array.isArray(q.gapAnswers) ? q.gapAnswers : [];
        return answers.length >= gaps && answers.slice(0, gaps).every((answer) => answer.trim()) ? "ai" : "missing";
      }
      const expected = q.answer ?? "";
      const qnum = q.qid ? parseInt(String(q.qid).match(/\d+$/)?.[0] ?? "-1", 10) : -1;
      const keyVal = keyedNumbers.get(qnum);
      if (expected.trim()) {
        if (keyVal) return normalizeAnswerText(expected) === normalizeAnswerText(keyVal) ? "key" : "ai";
        return "ai";
      }
      return "missing";
    },
    [keyedNumbers]
  );

  const renderTestForm = () => (
                  <div className="border-t px-5 py-5" style={{ borderColor: "var(--line)" }}>
                    <h4 className="font-display text-[15px] font-semibold mb-4" style={{ color: "var(--ink)" }}>
                      {editingTestId ? "Edit test" : "New test"}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Title *
                        </label>
                        <input
                          type="text"
                          value={testForm.title}
                          onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                          placeholder="e.g. Academic Reading Mock 01"
                          className={inputClass}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Skill
                        </label>
                        <select
                          value={testForm.skill}
                          onChange={(e) => {
                            const next = e.target.value as MockTestSkill;
                            setTestForm({
                              ...testForm,
                              skill: next,
                              ...(next === "writing" ? { answerText: "", answerKey: "" } : {}),
                            });
                          }}
                          className={inputClass}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        >
                          <option value="reading">Reading</option>
                          <option value="listening">Listening</option>
                          <option value="writing">Writing</option>
                          <option value="speaking">Speaking</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Status
                        </label>
                        <select
                          value={testForm.status}
                          onChange={(e) => setTestForm({ ...testForm, status: e.target.value })}
                          className={inputClass}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={testForm.durationMinutes}
                          onChange={(e) => setTestForm({ ...testForm, durationMinutes: e.target.value })}
                          className={inputClass}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Order
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={testForm.order}
                          onChange={(e) => setTestForm({ ...testForm, order: e.target.value })}
                          className={inputClass}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        />
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Linked course (students get free access)
                        </label>
                        <select
                          value={testForm.course}
                          onChange={(e) => setTestForm({ ...testForm, course: e.target.value })}
                          className={inputClass}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        >
                          <option value="">None</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Question text (paste from your source)
                        </label>
                        <textarea
                          value={testForm.questionText}
                          onChange={(e) => setTestForm({ ...testForm, questionText: e.target.value })}
                          rows={6}
                          placeholder={"Paste the Reading passage + questions, or Listening sections / Writing tasks…"}
                          className={inputClass + " resize-y font-mono text-[12px]"}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        />
                      </div>

                      {testForm.skill !== "writing" && testForm.skill !== "speaking" && (
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                            Answer key / answers text (optional)
                          </label>
                          <textarea
                            value={testForm.answerText}
                            onChange={(e) => setTestForm({ ...testForm, answerText: e.target.value })}
                            rows={3}
                            placeholder={"Paste the answers key so AI can mark correct options…"}
                            className={inputClass + " resize-y font-mono text-[12px]"}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          />
                        </div>
                      )}

                      {testForm.skill !== "speaking" && (
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={generate}
                            disabled={generating}
                            className="inline-flex items-center gap-2 rounded-full px-5 py-[10px] text-[13px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                            style={{ background: "var(--brand-2)" }}
                          >
                            {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            {generating ? "Generating structure…" : "Generate structure with AI"}
                          </button>
                        </div>
                      )}
                      {testForm.skill === "speaking" && (
                        <p className="md:col-span-2 rounded-xl border px-4 py-3 text-[12px]" style={{ borderColor: "var(--line)", color: "var(--body)", background: "#FBFBFD" }}>
                          Speaking tests are built by hand in the editor below — add the three parts,
                          questions and the Part 2 cue card, then the AI grades each attempt.
                        </p>
                      )}

                      {testForm.skill === "listening" && (
                        <div className="flex flex-col gap-3 md:col-span-2 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                              Listening media (audio / video / YouTube URL)
                            </p>
                            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                              Upload an audio file or paste a URL / YouTube link. Video takes priority when both are set.
                            </p>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            <input
                              type="text"
                              value={parsedContent?.audioUrl ?? ""}
                              onChange={(e) => updateContentField("audioUrl", e.target.value)}
                              placeholder="Audio URL — YouTube link or file, e.g. https://youtu.be/abc123 or https://…/listening-part-1.mp3"
                              className={inputClass + " font-mono text-[12px]"}
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            />
                            <input
                              type="text"
                              value={parsedContent?.videoUrl ?? ""}
                              onChange={(e) => updateContentField("videoUrl", e.target.value)}
                              placeholder="Video URL — YouTube link or file, e.g. https://www.youtube.com/watch?v=abc123 or https://…/listening-part-1.mp4"
                              className={inputClass + " font-mono text-[12px]"}
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <label
                              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors hover:border-brand-2 hover:text-brand-2 cursor-pointer"
                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                            >
                              {uploadingAudio ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                              {uploadingAudio ? (uploadProgress ? `Uploading ${uploadProgress}%` : "Uploading…") : "Upload audio file"}
                              <input
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a,.aac"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void uploadListeningAudio(f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            {parsedContent?.audioUrl && (
                              <button
                                type="button"
                                onClick={removeListeningAudio}
                                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                style={{ borderColor: "var(--line)", color: "#C0392B" }}
                              >
                                <X size={13} /> Remove audio
                              </button>
                            )}
                          </div>
                          {parsedContent?.audioUrl?.startsWith("s3://") && !parsedContent?.videoUrl && (
                            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                              Audio uploaded — it will play for students when the test starts (and cannot be paused).
                            </p>
                          )}
                          {(parsedContent?.audioUrl || parsedContent?.videoUrl) &&
                            !(parsedContent?.audioUrl ?? "").startsWith("s3://") &&
                            !(parsedContent?.videoUrl ?? "").startsWith("s3://") && (
                              <div className="flex flex-col gap-2">
                                <p className="text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
                                  Playback preview
                                </p>
                                <div className="max-w-[520px]">
                                  <ListeningMediaPlayer
                                    audioUrl={parsedContent?.audioUrl}
                                    videoUrl={parsedContent?.videoUrl}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                          Content JSON
                        </label>
                        <textarea
                          value={testForm.contentJson}
                          onChange={(e) => setTestForm({ ...testForm, contentJson: e.target.value })}
                          rows={10}
                          placeholder={"Content appears here after AI generation (or paste your own)."}
                          className={inputClass + " resize-y font-mono text-[11.5px]"}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        />
                      </div>

                      {/* Manual authoring editor */}
                      <div className="flex flex-col gap-3 md:col-span-2 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                        <div className="flex flex-col gap-1">
                          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                            Build questions manually
                          </p>
                          <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                            Add passages, sections and questions by hand — no AI needed. Use the{" "}
                            <code className="font-mono" style={{ color: "var(--brand-2)" }}>![alt](url)</code>{" "}
                            token to embed images anywhere text appears. For listening gap-fill questions,
                            put <code className="font-mono" style={{ color: "var(--brand-2)" }}>[[gap:1]]</code>{" "}
                            and <code className="font-mono" style={{ color: "var(--brand-2)" }}>[[gap:2]]</code> in the prompt, then enter one correct answer per gap.
                          </p>
                          {testForm.skill === "listening" && (
                            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                              Listening layout: each part is one section. Pick the part&apos;s question type above —
                              Matching parts get a shared options box + letter-marked items; Plan/Map/Diagram and
                              Flow-chart parts use an uploaded image with numbered questions. Audio is added in the
                              “Listening media” panel above and plays once through for students.
                            </p>
                          )}
                        </div>

                        {/* Answer coverage */}
                        {answerStats.total > 0 && testForm.skill !== "speaking" && (
                          <div className="flex flex-col gap-2 rounded-xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                                Answer coverage
                              </p>
                              <span
                                className="font-mono text-[12px] font-bold"
                                style={{ color: answerStats.answered === answerStats.total ? "#0FA968" : "var(--brand)" }}
                              >
                                {answerStats.answered}/{answerStats.total}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--bg-soft)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${answerStats.total ? Math.round((answerStats.answered / answerStats.total) * 100) : 0}%`,
                                  background: answerStats.answered === answerStats.total ? "#0FA968" : "var(--brand)",
                                }}
                              />
                            </div>
                            <p className="text-[11px] leading-[1.6]" style={{ color: "var(--body)" }}>
                              <span className="font-semibold" style={{ color: "#0FA968" }}>Key</span> matches the{" "}
                              {testForm.answerText.trim() ? "pasted answer text" : "saved answer key"} ·{" "}
                              <span className="font-semibold" style={{ color: "#E08A17" }}>AI</span> has an
                              answer but isn&apos;t verified · <span className="font-semibold" style={{ color: "#C0392B" }}>missing</span>{" "}
                              still needs a correct answer before publishing.
                            </p>
                            {answerStats.missing.length > 0 && (
                              <p className="font-mono text-[11px] leading-[1.6]" style={{ color: "#C0392B" }}>
                                No answer yet: Q{answerStats.missing.slice(0, 12).join(", Q")}
                                {answerStats.missing.length > 12 ? ` +${answerStats.missing.length - 12} more` : ""}
                              </p>
                            )}
                          </div>
                        )}

                        {contentJsonInvalid && (
                          <p className="rounded-xl border px-4 py-3 text-[12px]" style={{ borderColor: "rgba(192,57,43,0.3)", color: "#C0392B" }}>
                            The Content JSON below is not valid JSON — fix it first, otherwise edits here are ignored.
                          </p>
                        )}

                        {/* Writing tasks */}
                        {testForm.skill === "writing" && (
                          <div className="flex flex-col gap-2.5">
                            <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                              Writing tasks
                            </p>
                            {(["t1", "t2"] as const).map((task) => {
                              const f = taskFields(task);
                              const label = task === "t1" ? "Writing Task 1" : "Writing Task 2";
                              const val =
                                (parsedContent?.[f.text as keyof ManagedWritingContent] as string | undefined) ?? "";
                              return (
                                <div key={task} className="flex flex-col gap-1.5 rounded-xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
                                  <div className="flex items-center justify-between gap-3">
                                    <span
                                      className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]"
                                      style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                                    >
                                      {label}
                                    </span>
                                    <button type="button" onClick={() => setWritingTaskText(task, "")} className="text-[11.5px] font-medium" style={{ color: "#C0392B" }}>
                                      Remove
                                    </button>
                                  </div>
                                  <textarea
                                    value={val}
                                    onChange={(e) => setWritingTaskText(task, e.target.value)}
                                    rows={6}
                                    placeholder={`Write the ${label} prompt here (or paste it). Image URLs can be embedded with ![alt](url).`}
                                    className={inputClass + " resize-y font-mono text-[12px]"}
                                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Speaking parts */}
                        {testForm.skill === "speaking" && (
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                                Speaking test parts
                              </p>
                              {speakingParts.length < 3 && (
                                <button
                                  type="button"
                                  onClick={createSpeakingParts}
                                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                                  style={{ background: "var(--brand)" }}
                                >
                                  <Plus size={12} /> Add all three parts
                                </button>
                              )}
                            </div>
                            {speakingParts.length === 0 && (
                              <p className="rounded-xl border border-dashed bg-white px-4 py-5 text-center text-[12.5px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                                No parts yet — add Part 1, Part 2 and Part 3 to build the speaking test.
                              </p>
                            )}
                            {SPEAKING_PARTS_META.map((meta) => {
                              const idx = contentSections.findIndex((s) => s.type === meta.type);
                              const s = idx === -1 ? null : contentSections[idx];
                              const isPart2 = meta.type === "speaking-part-2";
                              if (!s) {
                                return (
                                  <div key={meta.type} className="flex items-center justify-between gap-3 rounded-xl border border-dashed bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
                                    <div className="flex items-center gap-3">
                                      <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]" style={{ background: "var(--bg-soft)", color: "var(--body)" }}>
                                        {meta.label}
                                      </span>
                                      <p className="text-[12px]" style={{ color: "var(--body)" }}>{meta.desc}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addSpeakingPart(meta.type)}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-white transition-opacity hover:opacity-90"
                                      style={{ background: "var(--brand)" }}
                                    >
                                      <Plus size={11} /> Add {meta.label}
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <div key={meta.type} className="flex flex-col gap-2 rounded-xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
                                  <div className="flex items-center gap-2">
                                    <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                                      {meta.label}
                                    </span>
                                    <span className="text-[11.5px]" style={{ color: "var(--body)" }}>{meta.desc}</span>
                                    <span className="flex-1" />
                                    <button
                                      type="button"
                                      onClick={() => removeSpeakingPart(meta.type)}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                      style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                    >
                                      <Trash2 size={12} /> Remove
                                    </button>
                                  </div>

                                  {isPart2 ? (
                                    <>
                                      <textarea
                                        value={s.instructions ?? ""}
                                        onChange={(e) => setSectionField(idx, "instructions", e.target.value)}
                                        rows={2}
                                        placeholder="Cue card topic — e.g. Describe a memorable journey you took…"
                                        className={inputClass + " resize-y font-mono text-[12px]"}
                                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                      />
                                      <div className="flex flex-col gap-1.5">
                                        <p className="text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
                                          Cue card bullet points
                                        </p>
                                        {(s.bulletPoints ?? []).map((b, bi) => (
                                          <div key={bi} className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              value={b ?? ""}
                                              onChange={(e) => setBulletPoint(meta.type, bi, e.target.value)}
                                              placeholder={`Bullet ${bi + 1}`}
                                              className={rowInputClass}
                                              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeBulletPoint(meta.type, bi)}
                                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                              style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => addBulletPoint(meta.type)}
                                          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                                          style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                        >
                                          <Plus size={11} /> Add bullet
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-4">
                                        <label className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "var(--ink)" }}>
                                          Prep (min)
                                          <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={s.prepMinutes ?? 1}
                                            onChange={(e) => setSectionField(idx, "prepMinutes", Math.max(0, Number(e.target.value) || 0))}
                                            className="w-20 rounded-lg border bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                          />
                                        </label>
                                        <label className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "var(--ink)" }}>
                                          Talk (min)
                                          <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            value={s.talkMinutes ?? 2}
                                            onChange={(e) => setSectionField(idx, "talkMinutes", Math.max(0, Number(e.target.value) || 0))}
                                            className="w-20 rounded-lg border bg-white px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                          />
                                        </label>
                                      </div>
                                      {s.questions?.[0] && (
                                        <textarea
                                          value={s.questions[0].prompt ?? ""}
                                          onChange={(e) => setQuestionField(idx, 0, "prompt", e.target.value)}
                                          rows={2}
                                          placeholder="Talk instruction — e.g. You should say: where you went, who you were with, and why it was memorable."
                                          className={inputClass + " resize-y font-mono text-[12px]"}
                                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      {(s.questions ?? []).map((q, qi) => (
                                        <div key={q.qid ?? qi} className="flex flex-col gap-1.5 rounded-lg border p-2.5" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                                          <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                                              {qi + 1}
                                            </span>
                                            <span className="flex-1" />
                                            <button
                                              type="button"
                                              onClick={() => moveQuestion(idx, qi, -1)}
                                              disabled={qi === 0}
                                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                                              style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                            >
                                              <ChevronUp size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => moveQuestion(idx, qi, 1)}
                                              disabled={qi === (s.questions?.length ?? 0) - 1}
                                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                                              style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                            >
                                              <ChevronDown size={13} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => removeQuestion(idx, qi)}
                                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                              style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                          <textarea
                                            value={q.prompt ?? ""}
                                            onChange={(e) => setQuestionField(idx, qi, "prompt", e.target.value)}
                                            rows={2}
                                            placeholder={`${meta.label} question ${qi + 1} — what the examiner asks…`}
                                            className={inputClass + " resize-y font-mono text-[12px]"}
                                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                          />
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => addSpeakingQuestion(meta.type)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed px-4 py-2 text-[12px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                                        style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                      >
                                        <Plus size={12} /> Add question
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reading passages */}
                        {testForm.skill === "reading" && (
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                                Reading passages
                              </p>
                              <button
                                type="button"
                                onClick={addPassage}
                                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                                style={{ background: "var(--brand)" }}
                              >
                                <Plus size={12} /> Add passage
                              </button>
                            </div>
                            {passagesList.length === 0 && (
                              <p className="rounded-xl border border-dashed bg-white px-4 py-5 text-center text-[12.5px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                                No passages yet — add one, then link sections to it below.
                              </p>
                            )}
                            {passagesList.map((p, pi) => (
                              <div key={p.id ?? pi} className="flex flex-col gap-2 rounded-xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]"
                                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                                  >
                                    Passage {pi + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={p.title ?? ""}
                                    onChange={(e) => setPassageField(pi, "title", e.target.value)}
                                    placeholder="Passage title (optional)"
                                    className={rowInputClass}
                                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePassage(pi)}
                                    className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                    style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <textarea
                                  value={p.text ?? ""}
                                  onChange={(e) => setPassageField(pi, "text", e.target.value)}
                                  rows={5}
                                  placeholder="Paste the reading passage text here…"
                                  className={inputClass + " resize-y font-mono text-[12px]"}
                                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sections + questions */}
                        {testForm.skill !== "speaking" && (
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>
                                {testForm.skill === "listening" ? "Parts & questions" : "Sections & questions"}
                              </p>
                            <button
                              type="button"
                              onClick={addSection}
                              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                              style={{ background: "var(--brand)" }}
                            >
                              <Plus size={12} /> {testForm.skill === "listening" ? "Add part" : "Add section"}
                            </button>
                          </div>

                          {contentSections.length === 0 && (
                            <p className="rounded-xl border border-dashed bg-white px-4 py-5 text-center text-[12.5px]" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                              {testForm.skill === "listening"
                                ? "No parts yet — add Part 1 (Questions 1–10) to start authoring."
                                : "No sections yet — add a section to start authoring questions."}
                            </p>
                          )}

                          {contentSections.map((s, si) => (
                            <div key={s.id ?? si} className="flex flex-col gap-2.5 rounded-xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
                              {/* Section header */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]"
                                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                                >
                                  {testForm.skill === "listening" ? `Part ${si + 1}` : `Section ${si + 1}`}
                                </span>
                                {testForm.skill === "listening" && (
                                  <select
                                    value={s.type ?? ""}
                                    onChange={(e) => setSectionType(si, e.target.value)}
                                    className="rounded-full border bg-white px-2.5 py-1.5 text-[11.5px] font-medium focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                  >
                                    {LISTENING_SECTION_TYPES.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                {testForm.skill === "reading" && passagesList.length > 0 && (
                                  <select
                                    value={s.passageId ?? passagesList[0]?.id ?? ""}
                                    onChange={(e) => setSectionField(si, "passageId", e.target.value)}
                                    className="rounded-full border bg-white px-3 py-2 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                    style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                  >
                                    {passagesList.map((p, pi) => (
                                      <option key={p.id ?? pi} value={p.id ?? pi}>
                                        {p.title?.trim() ? p.title : `Passage ${pi + 1}`}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <span className="flex-1" />
                                <button
                                  type="button"
                                  onClick={() => removeSection(si)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                  style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              </div>

                              <textarea
                                value={s.instructions ?? ""}
                                onChange={(e) => setSectionField(si, "instructions", e.target.value)}
                                rows={2}
                                placeholder={
                                  testForm.skill === "listening"
                                    ? "Instructions — e.g. You will hear a conversation between … Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER."
                                    : "Instructions shown above the questions (optional)"
                                }
                                className={inputClass + " resize-y font-mono text-[12px]"}
                                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                              />

                              {testForm.skill === "listening" && (
                                <input
                                  type="text"
                                  value={s.partTitle ?? ""}
                                  onChange={(e) => setSectionField(si, "partTitle", e.target.value)}
                                  placeholder="Part title (optional) — e.g. A conversation about booking a hotel"
                                  className={rowInputClass}
                                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                />
                              )}

                              <textarea
                                value={s.passage ?? ""}
                                onChange={(e) => setSectionField(si, "passage", e.target.value)}
                                rows={3}
                                placeholder={
                                  testForm.skill === "reading"
                                    ? "Extra text for this section (optional — the passage text lives in Reading passages above)"
                                    : "Section text — e.g. the map, form or notes shown with the questions (optional)"
                                }
                                className={inputClass + " resize-y font-mono text-[12px]"}
                                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                              />

                              {/* Questions */}
                              {testForm.skill === "listening" && s.type === "matching" ? (
                                renderMatchingBuilder(s, si)
                              ) : (
                              <div className="flex flex-col gap-2">
                                {testForm.skill === "listening" &&
                                  ["plan-map-labelling", "diagram-labelling", "flow-chart-completion"].includes(s.type ?? "") && (
                                    <p className="rounded-lg px-3 py-2 text-[11.5px] leading-[1.6]" style={{ background: "var(--brand-soft)", color: "var(--body)" }}>
                                      Upload the plan / map / diagram / flow-chart image below in “Attach images to
                                      sections”. Each question is one numbered item: add Options (A–H) for letter
                                      answers, or leave options empty for a typed word answer.
                                    </p>
                                  )}
                                {s.questions?.map((q, qi) => {
                                  const hasOpts = detectHasOptions(q);
                                  const gaps = gapCount(q.prompt);
                                  const qnum = (sectionStartNums[si] ?? 1) + qi;
                                  const st = questionStatus(q);
                                  const stMeta =
                                    st === "key"
                                      ? { label: "Key", color: "#0FA968", bg: "rgba(15,169,104,0.12)" }
                                      : st === "ai"
                                        ? { label: "AI", color: "#E08A17", bg: "rgba(224,138,23,0.12)" }
                                        : { label: "Missing", color: "#C0392B", bg: "rgba(192,57,43,0.10)" };
                                  return (
                                    <div key={q.qid ?? qi} className="flex flex-col gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                                      {/* Question top row */}
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold"
                                          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                                        >
                                          {qnum}
                                        </span>
                                        <select
                                          value={q.type ?? "short-answer"}
                                          onChange={(e) => changeQuestionType(si, qi, e.target.value)}
                                          className="rounded-full border bg-white px-2.5 py-1.5 text-[11.5px] font-medium focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                        >
                                          {QUESTION_TYPE_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                              {o.label}
                                            </option>
                                          ))}
                                        </select>
                                        <span className="rounded-full px-2 py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.06em]" style={{ background: stMeta.bg, color: stMeta.color }}>
                                          {stMeta.label}
                                        </span>
                                        {q.qid && (
                                          <span className="font-mono text-[10.5px]" style={{ color: "var(--body)" }}>
                                            {q.qid}
                                          </span>
                                        )}
                                        <span className="flex-1" />
                                        <button
                                          type="button"
                                          onClick={() => moveQuestion(si, qi, -1)}
                                          disabled={qi === 0}
                                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                                          style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                        >
                                          <ChevronUp size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveQuestion(si, qi, 1)}
                                          disabled={qi === (s.questions?.length ?? 0) - 1}
                                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                                          style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                        >
                                          <ChevronDown size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeQuestion(si, qi)}
                                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                          style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>

                                      <textarea
                                        value={q.prompt ?? ""}
                                        onChange={(e) => setQuestionField(si, qi, "prompt", e.target.value)}
                                        rows={2}
                                        placeholder={`Question ${qnum} — type the question here…`}
                                        className={inputClass + " resize-y font-mono text-[12px]"}
                                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                      />

                                      {hasOpts ? (
                                        <div className="flex flex-col gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => toggleMultiple(si, qi)}
                                            className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:bg-[var(--brand-soft)]"
                                            style={{ color: "var(--body)" }}
                                          >
                                            <span
                                              className="flex h-4 w-4 items-center justify-center rounded-[4px] border"
                                              style={{
                                                borderColor: q.multiple ? "var(--brand)" : "var(--line)",
                                                background: q.multiple ? "var(--brand)" : "white",
                                              }}
                                            >
                                              {q.multiple && <Check size={10} className="text-white" />}
                                            </span>
                                            Multiple correct answers
                                          </button>
                                          {(q.options ?? []).map((opt, oi) => {
                                            const isCorrect = q.multiple
                                              ? (q.correctOptions ?? []).includes(oi)
                                              : q.correctOption === oi;
                                            return (
                                              <div key={oi} className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    q.multiple
                                                      ? toggleCorrectOption(si, qi, oi)
                                                      : setCorrectOption(si, qi, oi)
                                                  }
                                                  title={q.multiple ? "Toggle as a correct answer" : "Mark as the correct answer"}
                                                  className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${q.multiple ? "rounded-[4px]" : "rounded-full"}`}
                                                  style={{
                                                    borderColor: isCorrect ? "var(--brand)" : "var(--line)",
                                                    background: isCorrect ? "var(--brand)" : "white",
                                                  }}
                                                >
                                                  {isCorrect && <Check size={11} className="text-white" />}
                                                </button>
                                                <input
                                                  type="text"
                                                  value={opt ?? ""}
                                                  onChange={(e) => setOptionValue(si, qi, oi, e.target.value)}
                                                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                                  className={rowInputClass}
                                                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => moveOption(si, qi, oi, -1)}
                                                  disabled={oi === 0}
                                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                                                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                                >
                                                  <ChevronUp size={13} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => moveOption(si, qi, oi, 1)}
                                                  disabled={oi === (q.options?.length ?? 0) - 1}
                                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 hover:border-brand-2 hover:text-brand-2"
                                                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                                >
                                                  <ChevronDown size={13} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => removeOption(si, qi, oi)}
                                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                                  style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                                >
                                                  <X size={12} />
                                                </button>
                                              </div>
                                            );
                                          })}
                                          <button
                                            type="button"
                                            onClick={() => addOption(si, qi)}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                                            style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                          >
                                            <Plus size={11} /> Add option
                                          </button>
                                        </div>
                                      ) : gaps > 0 ? (
                                        <div className="flex flex-col gap-1.5">
                                          <p className="text-[11.5px] leading-[1.5]" style={{ color: "var(--body)" }}>
                                            Use <code>[[gap:1]]</code>, <code>[[gap:2]]</code> in the prompt. Enter one correct answer per gap.
                                          </p>
                                          {Array.from({ length: gaps }, (_, gi) => (
                                            <input
                                              key={gi}
                                              type="text"
                                              value={q.gapAnswers?.[gi] ?? ""}
                                              onChange={(e) => {
                                                const next = [...(q.gapAnswers ?? [])];
                                                next[gi] = e.target.value;
                                                setQuestionField(si, qi, "gapAnswers", next);
                                              }}
                                              placeholder={`Correct answer for gap ${gi + 1}`}
                                              className={rowInputClass}
                                              style={{ borderColor: q.gapAnswers?.[gi]?.trim() ? "#0FA968" : "var(--line)", color: "var(--ink)" }}
                                            />
                                          ))}
                                          <input
                                            type="text"
                                            value={q.wordHint ?? ""}
                                            onChange={(e) => setQuestionField(si, qi, "wordHint", e.target.value)}
                                            placeholder="Word hint shown to students (optional)"
                                            className={rowInputClass}
                                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-1.5">
                                          <input
                                            type="text"
                                            value={q.answer ?? ""}
                                            onChange={(e) => setQuestionField(si, qi, "answer", e.target.value)}
                                            placeholder="Correct answer"
                                            className={rowInputClass}
                                            style={{ borderColor: q.answer?.trim() ? "#0FA968" : "var(--line)", color: "var(--ink)" }}
                                          />
                                          <input
                                            type="text"
                                            value={q.wordHint ?? ""}
                                            onChange={(e) => setQuestionField(si, qi, "wordHint", e.target.value)}
                                            placeholder="Word hint shown to students (optional)"
                                            className={rowInputClass}
                                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                <button
                                  type="button"
                                  onClick={() => addQuestion(si)}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed px-4 py-2 text-[12px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                                  style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                >
                                  <Plus size={12} /> Add question
                                </button>
                              </div>
                              )}
                            </div>
                          ))}
                          </div>
                        )}
                      </div>

                      {contentSections.length > 0 && testForm.skill !== "speaking" && (
                        <div className="flex flex-col gap-3 md:col-span-2 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                              Attach images to sections
                            </p>
                            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                              Figures are placed above/below the passage (choose below) or inline — paste{" "}
                              <code className="font-mono" style={{ color: "var(--brand-2)" }}>![alt](url)</code>{" "}
                              anywhere in the passage, instructions or a question prompt to pin it exactly.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {contentSections.map((s, i) => {
                              const uploading = uploadingSection === i;
                              return (
                                <div
                                  key={s.id ?? i}
                                  className="flex flex-col gap-3 rounded-xl border bg-white p-3"
                                  style={{ borderColor: "var(--line)" }}
                                >
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                                      Section {i + 1}
                                    </span>
                                    {s.type && (
                                      <span className="shrink-0 text-[11.5px] font-medium capitalize" style={{ color: "var(--body)" }}>
                                        {s.type}
                                      </span>
                                    )}
                                    <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: "var(--body)" }}>
                                      {sectionPreview(s)}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--brand)" }}>
                                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                                      {uploading ? `Uploading ${uploadProgress ?? 0}%` : s.image ? "Replace image" : "Upload image"}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploading}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) void uploadSectionImage(i, f);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>

                                    <select
                                      value={s.imagePlacement ?? "below-passage"}
                                      onChange={(e) => setSectionPlacement(i, e.target.value)}
                                      className="rounded-full border bg-white px-3 py-2 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                    >
                                      {SECTION_PLACEMENTS.map((p) => (
                                        <option key={p.value} value={p.value}>
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>

                                    {s.image && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => void copySectionToken(i)}
                                          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                        >
                                          {copiedToken === i ? <Check size={12} style={{ color: "#0FA968" }} /> : <Copy size={12} />}
                                          {copiedToken === i ? "Copied" : "Copy inline link"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeSectionImage(i)}
                                          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                          style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                        >
                                          <X size={12} /> Remove
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {s.image && (
                                    <div className="flex items-center gap-3 rounded-lg border p-2" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={s.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                                      <input
                                        type="text"
                                        readOnly
                                        value={s.image}
                                        onFocus={(e) => e.currentTarget.select()}
                                        className="w-full min-w-0 rounded-lg border bg-white px-3 py-2 font-mono text-[11px] focus:outline-none"
                                        style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {testForm.skill === "writing" && writingTaskRows.length > 0 && (
                        <div className="flex flex-col gap-3 md:col-span-2 rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                              Attach images to writing tasks
                            </p>
                            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                              IELTS Task 1 often needs a chart/diagram. Figures are placed above or below the
                              task — or paste{" "}
                              <code className="font-mono" style={{ color: "var(--brand-2)" }}>![alt](url)</code>{" "}
                              inside the task text to pin it exactly.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {writingTaskRows.map((r) => {
                              const uploading = uploadingTask === r.task;
                              return (
                                <div
                                  key={r.task}
                                  className="flex flex-col gap-3 rounded-xl border bg-white p-3"
                                  style={{ borderColor: "var(--line)" }}
                                >
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.06em] rounded-full px-2.5 py-[4px]" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                                      {r.label}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: "var(--body)" }}>
                                      {r.text?.slice(0, 70)}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--brand)" }}>
                                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                                      {uploading ? `Uploading ${uploadProgress ?? 0}%` : r.image ? "Replace image" : "Upload image"}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploading}
                                        onChange={(e) => {
                                          const fl = e.target.files?.[0];
                                          if (fl) void uploadWritingImage(r.task, fl);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>

                                    <select
                                      value={r.placement ?? "below"}
                                      onChange={(e) => setWritingPlacement(r.task, e.target.value)}
                                      className="rounded-full border bg-white px-3 py-2 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                      style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                    >
                                      {WRITING_PLACEMENTS.map((p) => (
                                        <option key={p.value} value={p.value}>
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>

                                    {r.image && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => void copyWritingToken(r.task)}
                                          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                        >
                                          {copiedTask === r.task ? <Check size={12} style={{ color: "#0FA968" }} /> : <Copy size={12} />}
                                          {copiedTask === r.task ? "Copied" : "Copy inline link"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeWritingImage(r.task)}
                                          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                          style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                        >
                                          <X size={12} /> Remove
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {r.image && (
                                    <div className="flex items-center gap-3 rounded-lg border p-2" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={r.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                                      <input
                                        type="text"
                                        readOnly
                                        value={r.image}
                                        onFocus={(e) => e.currentTarget.select()}
                                        className="w-full min-w-0 rounded-lg border bg-white px-3 py-2 font-mono text-[11px] focus:outline-none"
                                        style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {testForm.skill !== "writing" && testForm.skill !== "speaking" && (
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                            Answer key (raw text, used by the AI grader)
                          </label>
                          <textarea
                            value={testForm.answerKey}
                            onChange={(e) => setTestForm({ ...testForm, answerKey: e.target.value })}
                            rows={3}
                            placeholder={"e.g. 1: A  2: True  3: NO MORE THAN TWO WORDS…"}
                            className={inputClass + " resize-y font-mono text-[12px]"}
                            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        type="button"
                        onClick={saveTest}
                        disabled={savingTest}
                        className="inline-flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60"
                        style={{ background: "var(--brand)" }}
                      >
                        {savingTest && <Loader2 size={15} className="animate-spin" />}
                        {savingTest ? "Saving…" : editingTestId ? "Save changes" : "Create test"}
                      </button>
                      {editingTestId && (
                        <Link
                          href={`/dashboard/mock-tests/${editingTestId}/take`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 rounded-full border px-6 py-[11px] text-[13.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        >
                          Preview as student
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isFocused) {
                            router.push(focusedBackHref);
                            return;
                          }
                          setTestFormOpen(false);
                          setEditingTestId(null);
                        }}
                        className="text-[13.5px] font-medium px-4 py-[11px]"
                        style={{ color: "var(--body)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
  );

  if (!user) return <p style={{ color: "var(--body)" }}>Loading…</p>;
  if (isFocused) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href={focusedBackHref}
          className="inline-flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--brand)" }}
        >
          ← Back to tests
        </Link>
        {error && (
          <p className="text-[13px]" style={{ color: "#C0392B" }}>{error}</p>
        )}
        {!testFormOpen ? (
          <div className="flex justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "var(--line)" }}>
            {renderTestForm()}
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mock Tests"
        subtitle="Create practice packs, build tests with AI, and publish them for students."
        action={
          <button
            type="button"
            onClick={openBundleCreate}
            className="rounded-full text-white text-[13.5px] font-medium px-6 py-[10px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
            style={{ background: "var(--brand)" }}
          >
            + New pack
          </button>
        }
      />

      {error && (
        <p className="text-[13px]" style={{ color: "#C0392B" }}>
          {error}
        </p>
      )}

      {/* Bundle form */}
      {bundleFormOpen && (
        <div className="rounded-[24px] border bg-white p-[clamp(20px,3vw,28px)]" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-display text-[16px] font-semibold mb-5" style={{ color: "var(--ink)" }}>
            {editingBundleId ? "Edit pack" : "New practice pack"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Title *
              </label>
              <input
                type="text"
                value={bundleForm.title}
                onChange={(e) => setBundleForm({ ...bundleForm, title: e.target.value })}
                placeholder="e.g. IELTS Academic Pack"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Slug
              </label>
              <input
                type="text"
                value={bundleForm.slug}
                onChange={(e) => setBundleForm({ ...bundleForm, slug: e.target.value })}
                placeholder="auto-generated from title"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Badge
              </label>
              <input
                type="text"
                value={bundleForm.badge}
                onChange={(e) => setBundleForm({ ...bundleForm, badge: e.target.value })}
                placeholder="e.g. Academic"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Description
              </label>
              <textarea
                value={bundleForm.description}
                onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                placeholder="What students get with this pack"
                rows={3}
                className={inputClass + " resize-none"}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Price (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bundleForm.price}
                onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                placeholder="0 = free"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Price (BDT)
              </label>
              <input
                type="number"
                min="0"
                value={bundleForm.bdtPrice}
                onChange={(e) => setBundleForm({ ...bundleForm, bdtPrice: e.target.value })}
                placeholder="optional, e.g. 3480"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Image URL
              </label>
              <input
                type="text"
                value={bundleForm.image}
                onChange={(e) => setBundleForm({ ...bundleForm, image: e.target.value })}
                placeholder="https://…"
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>

            <div className="flex items-center gap-6 md:col-span-2">
              <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer" style={{ color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  checked={bundleForm.featured}
                  onChange={(e) => setBundleForm({ ...bundleForm, featured: e.target.checked })}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Feature on the public page
              </label>
              <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer" style={{ color: "var(--ink)" }}>
                <input
                  type="checkbox"
                  checked={bundleForm.published}
                  onChange={(e) => setBundleForm({ ...bundleForm, published: e.target.checked })}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Published (students can buy/see it)
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={saveBundle}
              disabled={savingBundle}
              className="flex items-center gap-2 rounded-full text-white text-[14px] font-medium px-7 py-[11px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              {savingBundle && <Loader2 size={15} className="animate-spin" />}
              {savingBundle ? "Saving…" : editingBundleId ? "Save changes" : "Create pack"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBundleFormOpen(false);
                setEditingBundleId(null);
              }}
              className="text-[13.5px] font-medium px-4 py-[11px]"
              style={{ color: "var(--body)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bundles list */}
      <div className="flex flex-col gap-5">
        {bundles.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "var(--line)" }}>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                  style={
                    b.published
                      ? { background: "var(--brand-soft)", color: "var(--brand)" }
                      : { background: "var(--bg-soft)", color: "var(--body)" }
                  }
                >
                  {b.published ? "Published" : "Draft"}
                </span>
                {b.badge && (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]" style={{ background: "rgba(111,76,224,0.12)", color: "#6B4CE0" }}>
                    {b.badge}
                  </span>
                )}
                <span
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]"
                  style={{ background: "var(--bg-soft)", color: "var(--ink)" }}
                >
                  {b.testCount} {b.testCount === 1 ? "test" : "tests"}
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]" style={{ background: "rgba(224,138,23,0.12)", color: "#E08A17" }}>
                  {formatPriceText({ price: b.price, currency: b.currency, prices: b.prices })}
                </span>
                {b.featured && (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--brand-2)" }}>
                    ★ Featured
                  </span>
                )}
              </div>

              <h3 className="font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>
                {b.title}
              </h3>
              {b.description && (
                <p className="text-[13px] mt-1 line-clamp-2" style={{ color: "var(--body)" }}>
                  {b.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {(["reading", "listening", "writing", "speaking"] as const).map((k) =>
                  (b.skills?.[k] ?? 0) > 0 ? (
                    <span
                      key={k}
                      className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-2.5 py-[4px]"
                      style={{ background: SKILL_META[k].soft, color: SKILL_META[k].accent }}
                    >
                      {SKILL_META[k].label} {b.skills[k]}
                    </span>
                  ) : null
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => (activeBundleId === b.id ? setActiveBundleId(null) : loadTests(b.id))}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-full px-5 py-[8px] text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: "var(--brand)" }}
                >
                  {activeBundleId === b.id ? "Close tests" : "Manage tests"}
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(b, !b.published)}
                  className="text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  {b.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => openBundleEdit(b)}
                  className="text-[13px] font-medium rounded-full border px-4 py-[8px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                  style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteBundle(b)}
                  disabled={deletingBundleId === b.id}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-4 py-[8px] transition-all duration-200 disabled:opacity-50"
                  style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.3)" }}
                >
                  {deletingBundleId === b.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {deletingBundleId === b.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>

            {/* Tests for the active bundle */}
            {activeBundleId === b.id && (
              <div className="border-t" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                    Tests in {b.title}
                  </p>
                  <Link
                    href={`/dashboard/mock-tests/new?bundle=${b.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand)" }}
                  >
                    <Plus size={13} /> New test
                  </Link>
                </div>

                {!testsLoaded ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={18} className="animate-spin" style={{ color: "var(--brand)" }} />
                  </div>
                ) : tests.length === 0 && !testFormOpen ? (
                  <p className="px-5 pb-6 text-[13px]" style={{ color: "var(--body)" }}>
                    No tests yet — click "New test" to create the first one.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y" style={{ borderColor: "var(--line)" }}>
                    {tests.map((t) => {
                      const meta = SKILL_META[t.skill] ?? SKILL_META.reading;
                      return (
                        <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                          <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] rounded-full px-3 py-[5px]" style={{ background: meta.soft, color: meta.accent }}>
                            {meta.label}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>
                              {t.title}
                            </p>
                            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--body)" }}>
                              {t.questionCount} questions · {t.durationMinutes} min ·{" "}
                              <span style={{ color: t.status === "published" ? "#0FA968" : "var(--body)" }}>
                                {t.status}
                              </span>
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/mock-tests/${t.id}/take`}
                            className="shrink-0 text-[12.5px] font-medium border rounded-full px-4 py-[7px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                            style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/dashboard/mock-tests/${t.id}/edit`}
                            className="shrink-0 text-[12.5px] font-medium border rounded-full px-4 py-[7px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                            style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteTest(t)}
                            disabled={deletingTestId === t.id}
                            className="shrink-0 text-[12.5px] font-medium disabled:opacity-50"
                            style={{ color: "#C0392B" }}
                          >
                            {deletingTestId === t.id ? "…" : "Delete"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Test form */}
                {testFormOpen && renderTestForm()}
              </div>
            )}
          </div>
        ))}

        {bundles.length === 0 && !bundleFormOpen && (
          <p className="text-[13.5px] text-center py-10" style={{ color: "var(--body)" }}>
            No practice packs yet — click "New pack" to create your first one.
          </p>
        )}
      </div>
    </div>
  );
}
