"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Globe,
  Headphones,
  ImagePlus,
  Loader2,
  Mic,
  Package,
  Pencil,
  PenLine,
  Plus,
  Search,
  Save,
  Trash2,
  Upload,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
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
  maxSelections?: number;
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

type ManagedFigure = { image?: string; alt?: string; questionIds?: string[] };

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
  figures?: ManagedFigure[];
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

const SKILL_ICON: Record<MockTestSkill, LucideIcon> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
};

const TEST_FILTERS: { value: "all" | MockTestSkill; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "writing", label: "Writing" },
  { value: "speaking", label: "Speaking" },
];

const iconActionClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors";

type TestStatusFilter = "all" | "draft" | "published" | "archived";

const TEST_STATUS_FILTERS: { value: TestStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

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
 * Question-bound images (`figures`) keep pointing at the same questions.
 */
function renumberQids(content: ManagedWritingContent): void {
  const remap = new Map<string, string>();
  let n = 1;
  for (const s of content.sections ?? []) {
    for (const q of s.questions ?? []) {
      remap.set(q.qid ?? `q${n}`, `q${n}`);
      n++;
    }
  }
  let m = 1;
  for (const s of content.sections ?? []) {
    for (const q of s.questions ?? []) {
      q.qid = `q${m}`;
      m++;
    }
  }
  for (const s of content.sections ?? []) {
    for (const f of s.figures ?? []) {
      if (!Array.isArray(f.questionIds)) continue;
      const seen = new Set<string>();
      f.questionIds = f.questionIds
        .map((id) => remap.get(id) ?? id)
        .filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
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
  const [bundlesLoaded, setBundlesLoaded] = useState(false);
  const [bundleSearch, setBundleSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [bundleFormOpen, setBundleFormOpen] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [bundleForm, setBundleForm] = useState(emptyBundleForm);
  const [savingBundle, setSavingBundle] = useState(false);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);

  const [activeBundleId, setActiveBundleId] = useState<string | null>(null);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [testsLoaded, setTestsLoaded] = useState(false);
  const [testFilter, setTestFilter] = useState<"all" | MockTestSkill>("all");
  const [testStatusFilter, setTestStatusFilter] = useState<TestStatusFilter>("all");
  const [testSearch, setTestSearch] = useState("");
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [testFormOpen, setTestFormOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testForm, setTestForm] = useState(emptyTestForm);
  const [savingTest, setSavingTest] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const [uploadingFigureSection, setUploadingFigureSection] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<number | null>(null);
  const [uploadingTask, setUploadingTask] = useState<ManagedWritingTask | null>(null);
  const [copiedTask, setCopiedTask] = useState<ManagedWritingTask | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const loadBundles = useCallback(async (): Promise<BundleDto[]> => {
    try {
      const res = await fetch("/api/mock-tests/bundles?all=true", { cache: "no-store" });
      const data = await res.json();
      const loaded = Array.isArray(data.bundles) ? (data.bundles as BundleDto[]) : [];
      setBundles(loaded);
      return loaded;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bundles");
      return [];
    } finally {
      setBundlesLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadBundles().then((loaded) => {
      if (createInBundle) {
        setActiveBundleId(createInBundle);
      } else if (focusBundleId) {
        setActiveBundleId(focusBundleId);
      } else if (queryBundleId) {
        setActiveBundleId(queryBundleId);
      } else if (loaded.length > 0) {
        setActiveBundleId((current) => current ?? loaded[0].id);
      }
    });
    fetch("/api/courses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCourses((d.courses ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))))
      .catch(() => setCourses([]));
  }, [loadBundles, focusBundleId, queryBundleId, createInBundle]);

  const loadTests = useCallback(async (bundleId: string) => {
    setTestsLoaded(false);
    setTests([]);
    try {
      const res = await fetch(`/api/mock-tests/bundles/${bundleId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tests");
      const loaded = Array.isArray(data.tests) ? (data.tests as TestListItem[]) : [];
      setTests(loaded);
      return loaded;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tests");
      setTests([]);
      return [];
    } finally {
      setTestsLoaded(true);
    }
  }, []);

  const selectBundle = (bundleId: string) => {
    if (bundleId === activeBundleId) return;
    if (testFormOpen && !confirm("Discard your unsaved test changes and switch packs?")) return;
    setTestFormOpen(false);
    setEditingTestId(null);
    setTestSearch("");
    setTestFilter("all");
    setTestStatusFilter("all");
    setActiveBundleId(bundleId);
  };

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
      const wasCreating = !editingBundleId;
      setBundleFormOpen(false);
      setEditingBundleId(null);
      const updatedBundles = await loadBundles();
      if (wasCreating && typeof data.bundle?.id === "string") {
        setActiveBundleId(data.bundle.id);
      } else if (!activeBundleId && updatedBundles.length > 0) {
        setActiveBundleId(updatedBundles[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingBundle(false);
    }
  };

  const deleteBundle = async (b: BundleDto) => {
    if (!confirm(`Delete pack "${b.title}"? All tests inside it will also be removed.`)) return;
    const deletingActiveBundle = activeBundleId === b.id;
    setDeletingBundleId(b.id);
    try {
      const res = await fetch(`/api/mock-tests/bundles/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      const remaining = await loadBundles();
      if (deletingActiveBundle) setActiveBundleId(remaining[0]?.id ?? null);
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

  const filteredTests = useMemo(
    () => {
      const query = testSearch.trim().toLowerCase();
      return tests.filter((test) => {
        const matchesSkill = testFilter === "all" || test.skill === testFilter;
        const matchesStatus = testStatusFilter === "all" || test.status === testStatusFilter;
        const matchesSearch = !query || test.title.toLowerCase().includes(query);
        return matchesSkill && matchesStatus && matchesSearch;
      });
    },
    [tests, testFilter, testSearch, testStatusFilter]
  );

  const filteredBundles = useMemo(() => {
    const query = bundleSearch.trim().toLowerCase();
    return bundles.filter(
      (bundle) => !query || bundle.title.toLowerCase().includes(query)
    );
  }, [bundles, bundleSearch]);

  const libraryStats = useMemo(
    () => ({
      packs: bundles.length,
      tests: bundles.reduce((count, bundle) => count + (bundle.testCount ?? 0), 0),
      published: bundles.filter((bundle) => bundle.published).length,
    }),
    [bundles]
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

  const questionNumberAt = (c: ManagedWritingContent, si: number, qi: number): number => {
    let n = 1;
    for (let i = 0; i < si; i++) n += c.sections?.[i]?.questions?.length ?? 0;
    return n + qi;
  };

  const uploadListeningFigure = async (si: number, file: File) => {
    if (!file || uploadingFigureSection !== null) return;
    setUploadingFigureSection(si);
    setUploadProgress(0);
    try {
      const uploaded = await uploadToStorage(file, "mock-tests", "file", (pct) =>
        setUploadProgress(pct)
      );
      updateContent((c) => {
        const s = c.sections?.[si];
        if (!s) return;
        s.figures = s.figures ?? [];
        s.figures.push({ image: uploaded.ref, questionIds: [] });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploadingFigureSection(null);
      setUploadProgress(null);
    }
  };

  const removeListeningFigure = (si: number, fi: number) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      if (!s) return;
      s.figures = s.figures ?? [];
      s.figures.splice(fi, 1);
      if (s.figures.length === 0) delete s.figures;
    });

  const toggleFigureQuestion = (si: number, fi: number, qi: number) =>
    updateContent((c) => {
      const s = c.sections?.[si];
      const f = s?.figures?.[fi];
      const q = s?.questions?.[qi];
      if (!f || !q) return;
      const qid = q.qid ?? `q${questionNumberAt(c, si, qi)}`;
      const ids = new Set(f.questionIds ?? []);
      if (ids.has(qid)) ids.delete(qid);
      else ids.add(qid);
      f.questionIds = Array.from(ids);
    });

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
      const arr = c.sections?.[si]?.questions;
      if (!arr) return;
      const [removed] = arr.splice(qi, 1);
      if (removed?.qid) {
        for (const f of c.sections?.[si]?.figures ?? []) {
          f.questionIds = (f.questionIds ?? []).filter((id) => id !== removed.qid);
        }
      }
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
        q.maxSelections = q.maxSelections ?? 0;
        syncMultiAnswer(q);
      } else {
        q.multiple = false;
        q.correctOptions = [];
        q.correctOption = -1;
        q.maxSelections = 0;
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

  const CurrentSkillIcon = SKILL_ICON[testForm.skill];

  const renderTestForm = () => (
    <div>
      <div
        className="sticky top-16 z-20 flex flex-wrap items-center gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur sm:px-6"
        style={{ borderColor: "var(--line)", boxShadow: "0 8px 18px -16px rgba(18,32,67,0.42)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: SKILL_META[testForm.skill].soft, color: SKILL_META[testForm.skill].accent }}>
            <CurrentSkillIcon size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                {editingTestId ? "Edit test" : "New test"}
              </h4>
              <span className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em]" style={{ background: SKILL_META[testForm.skill].soft, color: SKILL_META[testForm.skill].accent }}>
                {SKILL_META[testForm.skill].label}
              </span>
            </div>
            <p className="max-w-[360px] truncate text-[11px]" style={{ color: "var(--body)" }}>
              {testForm.title.trim() || activeBundle?.title || "Untitled mock test"}
            </p>
          </div>
        </div>
        <span className="flex-1" />
        {editingTestId && (
          <Link
            href={`/dashboard/mock-tests/${editingTestId}/take`}
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            <Eye size={13} /> Preview as student
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
          className="rounded-lg border px-3.5 py-2 text-[11.5px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
          style={{ borderColor: "var(--line)", color: "var(--body)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveTest}
          disabled={savingTest}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--brand)" }}
        >
          {savingTest ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {savingTest ? "Saving…" : editingTestId ? "Save changes" : "Create test"}
        </button>
      </div>
      <div className="bg-[#FBFBFD] px-4 py-5 sm:px-6">
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
                              Flow-chart parts use an uploaded image with numbered questions. Upload figures in
                              “Attach images to questions” and tick which questions each image belongs to — they
                              render side by side for students. Audio is added in the “Listening media” panel
                              above and plays once through for students.
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
                                        Upload the plan / map / diagram / flow-chart image in “Attach images to
                                        questions” below, then tick the questions that belong to it — students
                                        see the image side by side with those questions. Each question is one
                                        numbered item: add Options (A–H) for letter answers, or leave options
                                        empty for a typed word answer.
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
                                          {q.multiple && (
                                            <div className="flex items-center gap-2">
                                              <label className="text-[11.5px] font-medium" style={{ color: "var(--body)" }}>
                                                Max selections (students can pick at most this many)
                                              </label>
                                              <input
                                                type="number"
                                                min={1}
                                                max={(q.options ?? []).length || undefined}
                                                value={q.maxSelections ?? ((q.correctOptions ?? []).length || 0)}
                                                onChange={(e) =>
                                                  setQuestionField(si, qi, "maxSelections", Math.max(0, Number(e.target.value) || 0))
                                                }
                                                className="h-7 w-16 rounded-lg border px-2 text-center font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-2/30"
                                                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                                              />
                                            </div>
                                          )}
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
                              {testForm.skill === "listening" ? "Attach images to questions" : "Attach images to sections"}
                            </p>
                            <p className="text-[11.5px]" style={{ color: "var(--body)" }}>
                              {testForm.skill === "listening"
                                ? "Upload a figure, then tick the question numbers it belongs to (e.g. 7–10). Students see the image side by side with those questions."
                                : "Figures are placed above/below the passage (choose below) or inline — paste "}
                              {testForm.skill !== "listening" && (
                                <code className="font-mono" style={{ color: "var(--brand-2)" }}>![alt](url)</code>
                              )}
                              {testForm.skill !== "listening" &&
                                " anywhere in the passage, instructions or a question prompt to pin it exactly."}
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
                                      {testForm.skill === "listening" ? `Part ${i + 1}` : `Section ${i + 1}`}
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

                                  {testForm.skill === "listening" && (
                                    <div className="flex flex-col gap-2.5 rounded-lg border border-dashed p-3" style={{ borderColor: "var(--line)", background: "#FBFBFD" }}>
                                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                                        <p className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                                          Images bound to questions
                                        </p>
                                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--brand-2)" }}>
                                          {uploadingFigureSection === i ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                                          {uploadingFigureSection === i ? `Uploading ${uploadProgress ?? 0}%` : "Upload image"}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingFigureSection !== null}
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (f) void uploadListeningFigure(i, f);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <p className="text-[11.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
                                        Tick the questions that go with each image. In the test, the image is
                                        shown side by side with those questions.
                                      </p>
                                      {(s.figures ?? []).map((f, fi) => (
                                        <div key={fi} className="flex flex-col gap-2 rounded-lg border bg-white p-2.5" style={{ borderColor: "var(--line)" }}>
                                          <div className="flex items-center gap-2.5">
                                            {f.image && (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={f.image} alt="" className="h-14 w-20 shrink-0 rounded-md border object-cover" style={{ borderColor: "var(--line)" }} />
                                            )}
                                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                              {(s.questions ?? []).map((q, qi) => {
                                                const qnum = (sectionStartNums[i] ?? 1) + qi;
                                                const qid = q.qid ?? `q${qnum}`;
                                                const bound = (f.questionIds ?? []).includes(qid);
                                                return (
                                                  <button
                                                    key={q.qid ?? qi}
                                                    type="button"
                                                    onClick={() => toggleFigureQuestion(i, fi, qi)}
                                                    title={bound ? `Remove question ${qnum} from this image` : `Bind question ${qnum} to this image`}
                                                    className="flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 font-mono text-[11.5px] font-bold transition-colors"
                                                    style={
                                                      bound
                                                        ? { borderColor: "var(--brand-2)", background: "var(--brand-2)", color: "#fff" }
                                                        : { borderColor: "var(--line)", background: "white", color: "var(--ink)" }
                                                    }
                                                  >
                                                    {qnum}
                                                  </button>
                                                );
                                              })}
                                              {(s.questions ?? []).length === 0 && (
                                                <span className="text-[11.5px]" style={{ color: "var(--body)" }}>
                                                  No questions in this part yet.
                                                </span>
                                              )}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => removeListeningFigure(i, fi)}
                                              title="Remove this image"
                                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[#C0392B] hover:text-[#C0392B]"
                                              style={{ borderColor: "var(--line)", color: "#C0392B" }}
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                          {f.image && (
                                            <input
                                              type="text"
                                              readOnly
                                              value={f.image}
                                              onFocus={(e) => e.currentTarget.select()}
                                              className="w-full min-w-0 rounded-lg border bg-white px-3 py-2 font-mono text-[10.5px] focus:outline-none"
                                              style={{ borderColor: "var(--line)", color: "var(--body)" }}
                                            />
                                          )}
                                        </div>
                                      ))}
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

                  </div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }
  if (isFocused) {
    return (
      <div className="flex flex-col gap-5">
        <Link
          href={focusedBackHref}
          className="inline-flex w-fit items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-[12.5px] font-medium transition-colors hover:border-brand-2 hover:text-brand-2"
          style={{ color: "var(--body)", borderColor: "var(--line)" }}
        >
          <ArrowLeft size={14} />
          <span>Pack library</span>
          {activeBundle && (
            <>
              <ChevronRight size={13} className="opacity-50" />
              <span className="max-w-[180px] truncate" style={{ color: "var(--ink)" }}>
                {activeBundle.title}
              </span>
            </>
          )}
        </Link>
        {error && (
          <p className="rounded-xl border px-4 py-3 text-[13px]" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.2)", background: "rgba(192,57,43,0.04)" }}>
            {error}
          </p>
        )}
        {!testFormOpen ? (
          <div className="flex justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
          </div>
        ) : (
          <div className="rounded-[20px] border bg-white" style={{ borderColor: "var(--line)" }}>
            {renderTestForm()}
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand-2)" }}>
            IELTS · Content studio
          </p>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]" style={{ color: "var(--ink)" }}>
            Mock test library
          </h1>
          <p className="mt-1.5 max-w-[560px] text-[13.5px] leading-[1.6]" style={{ color: "var(--body)" }}>
            Organize practice packs and manage every test from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden items-center gap-5 rounded-xl border bg-white px-4 py-2.5 sm:flex" style={{ borderColor: "var(--line)" }}>
            <div>
              <p className="font-mono text-[16px] font-bold leading-none" style={{ color: "var(--ink)" }}>{libraryStats.packs}</p>
              <p className="mt-1 text-[10.5px]" style={{ color: "var(--body)" }}>Packs</p>
            </div>
            <span className="h-7 w-px" style={{ background: "var(--line)" }} />
            <div>
              <p className="font-mono text-[16px] font-bold leading-none" style={{ color: "var(--ink)" }}>{libraryStats.tests}</p>
              <p className="mt-1 text-[10.5px]" style={{ color: "var(--body)" }}>Tests</p>
            </div>
            <span className="h-7 w-px" style={{ background: "var(--line)" }} />
            <div>
              <p className="font-mono text-[16px] font-bold leading-none" style={{ color: "#0FA968" }}>{libraryStats.published}</p>
              <p className="mt-1 text-[10.5px]" style={{ color: "var(--body)" }}>Live packs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openBundleCreate}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(107,76,224,0.7)] transition-all hover:-translate-y-0.5 hover:opacity-95"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={16} /> New pack
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border px-4 py-3" style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.2)", background: "rgba(192,57,43,0.04)" }}>
          <p className="text-[13px]">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="shrink-0 opacity-70 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Bundle form */}
      {bundleFormOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#17152B]/45 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={() => {
            setBundleFormOpen(false);
            setEditingBundleId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bundle-form-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[22px] border bg-white shadow-[0_28px_80px_-28px_rgba(18,32,67,0.45)]"
            style={{ borderColor: "var(--line)" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white/95 px-6 py-5 backdrop-blur" style={{ borderColor: "var(--line)" }}>
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ color: "var(--brand)", background: "var(--brand-soft)" }}>
                  <Package size={20} />
                </span>
                <div className="min-w-0">
                  <h2 id="bundle-form-title" className="font-display text-[18px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                    {editingBundleId ? "Edit practice pack" : "Create a practice pack"}
                  </h2>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--body)" }}>
                    Set up the pack details students will see.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBundleFormOpen(false);
                  setEditingBundleId(null);
                }}
                aria-label="Close pack editor"
                className={iconActionClass + " h-9 w-9 hover:border-brand-2 hover:text-brand-2"}
                style={{ borderColor: "var(--line)", color: "var(--body)" }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
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

          <div className="mt-6 flex items-center justify-end gap-2.5 border-t pt-5" style={{ borderColor: "var(--line)" }}>
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
              className="rounded-full px-4 py-[11px] text-[13px] font-medium transition-colors hover:bg-[var(--bg-soft)]"
              style={{ color: "var(--body)" }}
            >
              Cancel
            </button>
          </div>
            </div>
          </div>
        </div>
      )}

      {/* Pack library workspace */}
      {!bundlesLoaded ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
          <Loader2 size={25} className="animate-spin" style={{ color: "var(--brand)" }} />
          <p className="text-[13px]" style={{ color: "var(--body)" }}>Loading your mock test library…</p>
        </div>
      ) : bundles.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-14 text-center" style={{ borderColor: "var(--line)" }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            <Package size={25} />
          </span>
          <h2 className="mt-5 font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>Start with a practice pack</h2>
          <p className="mt-1.5 max-w-[390px] text-[13px] leading-[1.65]" style={{ color: "var(--body)" }}>
            Packs keep related IELTS mock tests together. Create one, then add tests by skill.
          </p>
          <button type="button" onClick={openBundleCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white" style={{ background: "var(--brand)" }}>
            <Plus size={15} /> Create first pack
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border bg-white xl:sticky xl:top-[84px]" style={{ borderColor: "var(--line)" }}>
            <div className="border-b px-4 pb-3.5 pt-4" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>Practice packs</h2>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--body)" }}>{bundles.length} {bundles.length === 1 ? "pack" : "packs"} in your library</p>
                </div>
                <button type="button" onClick={openBundleCreate} title="Create pack" aria-label="Create pack" className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--brand-soft)]" style={{ color: "var(--brand)" }}>
                  <Plus size={17} />
                </button>
              </div>
              <label className="relative mt-3 block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
                <input
                  type="search"
                  value={bundleSearch}
                  onChange={(event) => setBundleSearch(event.target.value)}
                  placeholder="Find a pack"
                  aria-label="Find a practice pack"
                  className="w-full rounded-lg border bg-[#FBFBFD] py-2 pl-9 pr-3 text-[12px] outline-none transition-colors focus:border-brand-2 focus:bg-white"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              </label>
            </div>
            <nav aria-label="Practice packs" className="max-h-[260px] space-y-1 overflow-y-auto p-2 xl:max-h-[min(60vh,620px)]">
              {filteredBundles.map((bundle) => {
                const selected = bundle.id === activeBundleId;
                return (
                  <button
                    key={bundle.id}
                    type="button"
                    onClick={() => selectBundle(bundle.id)}
                    aria-current={selected ? "page" : undefined}
                    className="group flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors"
                    style={selected
                      ? { borderColor: "rgba(107,76,224,0.18)", background: "var(--brand-soft)" }
                      : { borderColor: "transparent", background: "transparent" }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: selected ? "#fff" : "var(--bg-soft)", color: "var(--brand)" }}>
                      {bundle.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bundle.image} alt="" className="h-full w-full object-cover" />
                      ) : <Package size={17} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold" style={{ color: selected ? "var(--brand)" : "var(--ink)" }}>{bundle.title}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--body)" }}>
                        <span>{bundle.testCount} {bundle.testCount === 1 ? "test" : "tests"}</span>
                        <span className="opacity-50">·</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: bundle.published ? "#0FA968" : "#A0A4B1" }} />
                          {bundle.published ? "Live" : "Draft"}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: selected ? "var(--brand)" : "#A6A8B2" }} />
                  </button>
                );
              })}
              {filteredBundles.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <p className="text-[12px]" style={{ color: "var(--body)" }}>No packs match “{bundleSearch}”.</p>
                  <button type="button" onClick={() => setBundleSearch("")} className="mt-2 text-[11.5px] font-semibold" style={{ color: "var(--brand)" }}>Clear search</button>
                </div>
              )}
            </nav>
            <div className="border-t p-2" style={{ borderColor: "var(--line)" }}>
              <button type="button" onClick={openBundleCreate} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-[12px] font-semibold transition-colors hover:border-brand-2 hover:bg-[var(--brand-soft)] hover:text-brand-2" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                <Plus size={14} /> New practice pack
              </button>
            </div>
          </aside>

          {activeBundle ? (
            <section className="min-w-0 rounded-2xl border bg-white" style={{ borderColor: "var(--line)" }}>
              <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ background: "linear-gradient(145deg, rgba(107,76,224,0.14), rgba(47,95,224,0.12))", color: "var(--brand)" }}>
                      {activeBundle.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeBundle.image} alt="" className="h-full w-full object-cover" />
                      ) : <Package size={22} />}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--brand-2)" }}>Practice pack</span>
                        <span className="h-1 w-1 rounded-full" style={{ background: "var(--line)" }} />
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold" style={{ color: activeBundle.published ? "#0FA968" : "var(--body)" }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: activeBundle.published ? "#0FA968" : "#A0A4B1" }} />
                          {activeBundle.published ? "Published" : "Draft"}
                        </span>
                        {activeBundle.badge && <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>{activeBundle.badge}</span>}
                      </div>
                      <h2 className="truncate font-display text-[21px] font-semibold tracking-[-0.025em] sm:text-[23px]" style={{ color: "var(--ink)" }}>{activeBundle.title}</h2>
                      {activeBundle.description && <p className="mt-1 max-w-[650px] text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>{activeBundle.description}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={() => togglePublish(activeBundle, !activeBundle.published)} title={activeBundle.published ? "Unpublish pack" : "Publish pack"} aria-label={activeBundle.published ? "Unpublish pack" : "Publish pack"} className={iconActionClass + " h-9 w-9 hover:border-[#0FA968] hover:text-[#0FA968]"} style={{ borderColor: activeBundle.published ? "rgba(15,169,104,0.35)" : "var(--line)", color: activeBundle.published ? "#0FA968" : "var(--body)" }}>
                      <Globe size={15} />
                    </button>
                    <button type="button" onClick={() => openBundleEdit(activeBundle)} title="Edit pack details" aria-label="Edit pack details" className={iconActionClass + " h-9 w-9 hover:border-brand-2 hover:text-brand-2"} style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => deleteBundle(activeBundle)} disabled={deletingBundleId === activeBundle.id} title="Delete pack" aria-label="Delete pack" className={iconActionClass + " h-9 w-9 hover:border-[#C0392B] hover:text-[#C0392B] disabled:opacity-50"} style={{ borderColor: "var(--line)", color: "#C0392B" }}>
                      {deletingBundleId === activeBundle.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3.5" style={{ borderColor: "var(--line)" }}>
                  <span className="text-[11.5px]" style={{ color: "var(--body)" }}><strong className="font-mono text-[12px]" style={{ color: "var(--ink)" }}>{activeBundle.testCount}</strong> tests in pack</span>
                  <span className="hidden h-4 w-px sm:block" style={{ background: "var(--line)" }} />
                  <span className="text-[11.5px]" style={{ color: "var(--body)" }}>Price <strong className="ml-1 font-medium" style={{ color: "var(--ink)" }}>{formatPriceText({ price: activeBundle.price, currency: activeBundle.currency, prices: activeBundle.prices })}</strong></span>
                  {(["reading", "listening", "writing", "speaking"] as const).map((skill) => (activeBundle.skills?.[skill] ?? 0) > 0 && (
                    <span key={skill} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: SKILL_META[skill].accent }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SKILL_META[skill].accent }} />
                      {SKILL_META[skill].label} {activeBundle.skills[skill]}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>{testFormOpen ? (editingTestId ? "Edit test" : "New test") : "Tests"}</h3>
                    <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--body)" }}>{testFormOpen ? "Update the test content and save when ready." : `${tests.length} ${tests.length === 1 ? "test" : "tests"} · Filter by IELTS skill or status`}</p>
                  </div>
                  {!testFormOpen && (
                    <button type="button" onClick={() => openTestCreate(tests.length)} className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--brand)" }}>
                      <Plus size={15} /> New test
                    </button>
                  )}
                </div>

                {testFormOpen ? renderTestForm() : (
                  <>
                    <div className="flex gap-5 overflow-x-auto border-b px-5 sm:px-6" role="tablist" aria-label="Filter tests by skill" style={{ borderColor: "var(--line)" }}>
                      {TEST_FILTERS.map((filter) => {
                        const count = filter.value === "all" ? tests.length : tests.filter((test) => test.skill === filter.value).length;
                        const selected = testFilter === filter.value;
                        return (
                          <button key={filter.value} type="button" role="tab" aria-selected={selected} onClick={() => setTestFilter(filter.value)} className="relative flex shrink-0 items-center gap-2 py-3 text-[12px] font-medium transition-colors" style={{ color: selected ? "var(--brand)" : "var(--body)" }}>
                            {filter.label}
                            <span className="rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-bold" style={{ background: selected ? "var(--brand-soft)" : "var(--bg-soft)", color: selected ? "var(--brand)" : "var(--body)" }}>{count}</span>
                            {selected && <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full" style={{ background: "var(--brand)" }} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2.5 border-b px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6" style={{ borderColor: "var(--line)" }}>
                      <label className="relative block w-full sm:max-w-[320px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--body)" }} />
                        <input type="search" value={testSearch} onChange={(event) => setTestSearch(event.target.value)} placeholder="Search tests by name" aria-label="Search tests" className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-[12px] outline-none transition-colors focus:border-brand-2" style={{ borderColor: "var(--line)", color: "var(--ink)" }} />
                      </label>
                      <label className="flex w-full items-center gap-2 sm:w-auto">
                        <span className="hidden text-[11px] font-medium sm:inline" style={{ color: "var(--body)" }}>Status</span>
                        <select value={testStatusFilter} onChange={(event) => setTestStatusFilter(event.target.value as TestStatusFilter)} aria-label="Filter tests by status" className="w-full rounded-lg border bg-white px-3 py-2 text-[12px] outline-none focus:border-brand-2 sm:w-[150px]" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                          {TEST_STATUS_FILTERS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                        </select>
                      </label>
                    </div>

                    {!testsLoaded ? (
                      <div className="flex min-h-[240px] flex-col items-center justify-center gap-2.5">
                        <Loader2 size={21} className="animate-spin" style={{ color: "var(--brand)" }} />
                        <p className="text-[12px]" style={{ color: "var(--body)" }}>Loading tests…</p>
                      </div>
                    ) : filteredTests.length === 0 ? (
                      <div className="flex min-h-[250px] flex-col items-center justify-center px-5 py-10 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--bg-soft)", color: "var(--body)" }}>
                          {tests.length === 0 ? <Package size={19} /> : <Search size={18} />}
                        </span>
                        <p className="mt-3 text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{tests.length === 0 ? "No tests in this pack yet" : "No tests match these filters"}</p>
                        <p className="mt-1 max-w-[360px] text-[11.5px] leading-[1.6]" style={{ color: "var(--body)" }}>{tests.length === 0 ? "Add your first test, then organize the pack by IELTS skill." : "Try a different search or clear the current filters."}</p>
                        {tests.length === 0 ? (
                          <button type="button" onClick={() => openTestCreate(0)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white" style={{ background: "var(--brand)" }}><Plus size={14} /> Create a test</button>
                        ) : (
                          <button type="button" onClick={() => { setTestSearch(""); setTestFilter("all"); setTestStatusFilter("all"); }} className="mt-4 text-[12px] font-semibold" style={{ color: "var(--brand)" }}>Clear filters</button>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="hidden grid-cols-[minmax(0,1fr)_126px_84px_84px_100px_112px] items-center gap-3 bg-[#FBFBFD] px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] md:grid sm:px-6" style={{ color: "var(--body)" }}>
                          <span>Test</span><span>Skill</span><span>Questions</span><span>Duration</span><span>Status</span><span className="text-right">Actions</span>
                        </div>
                        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                          {filteredTests.map((test) => {
                            const meta = SKILL_META[test.skill] ?? SKILL_META.reading;
                            const SkillIcon = SKILL_ICON[test.skill] ?? BookOpen;
                            const statusStyle = test.status === "published"
                              ? { background: "rgba(15,169,104,0.09)", color: "#0B8F58" }
                              : test.status === "archived"
                                ? { background: "rgba(192,57,43,0.08)", color: "#B13329" }
                                : { background: "var(--bg-soft)", color: "var(--body)" };
                            return (
                              <div key={test.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-[#FCFBFE] md:grid-cols-[minmax(0,1fr)_126px_84px_84px_100px_112px] md:gap-3 sm:px-6">
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.soft, color: meta.accent }}><SkillIcon size={16} /></span>
                                  <div className="min-w-0">
                                    <p className="truncate text-[12.5px] font-semibold" style={{ color: "var(--ink)" }}>{test.title}</p>
                                    <p className="mt-0.5 text-[10.5px] md:hidden" style={{ color: "var(--body)" }}>
                                      {meta.label} · {test.questionCount} questions · {test.durationMinutes} min ·{" "}
                                      <span className="capitalize" style={{ color: test.status === "published" ? "#0FA968" : test.status === "archived" ? "#C0392B" : "var(--body)" }}>{test.status}</span>
                                    </p>
                                  </div>
                                </div>
                                <span className="hidden items-center gap-2 text-[11.5px] font-medium md:flex" style={{ color: meta.accent }}>
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.accent }} />{meta.label}
                                </span>
                                <span className="hidden font-mono text-[11.5px] md:block" style={{ color: "var(--body)" }}>{test.questionCount}</span>
                                <span className="hidden font-mono text-[11.5px] md:block" style={{ color: "var(--body)" }}>{test.durationMinutes} min</span>
                                <span className="hidden w-fit rounded-md px-2 py-1 text-[10px] font-semibold capitalize md:inline-flex" style={statusStyle}>{test.status}</span>
                                <div className="flex items-center justify-end gap-1">
                                  <Link href={`/dashboard/mock-tests/${test.id}/take`} target="_blank" title="Preview as student" aria-label={`Preview ${test.title}`} className={iconActionClass + " hover:border-brand-2 hover:text-brand-2"} style={{ borderColor: "var(--line)", color: "var(--body)" }}><Eye size={14} /></Link>
                                  <button type="button" onClick={() => void openTestEdit(test)} title="Edit test" aria-label={`Edit ${test.title}`} className={iconActionClass + " hover:border-brand-2 hover:text-brand-2"} style={{ borderColor: "var(--line)", color: "var(--body)" }}><Pencil size={14} /></button>
                                  <button type="button" onClick={() => deleteTest(test)} disabled={deletingTestId === test.id} title="Delete test" aria-label={`Delete ${test.title}`} className={iconActionClass + " hover:border-[#C0392B] hover:text-[#C0392B] disabled:opacity-50"} style={{ borderColor: "var(--line)", color: "#C0392B" }}>{deletingTestId === test.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          ) : (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 text-center" style={{ borderColor: "var(--line)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Package size={21} /></span>
              <h2 className="mt-4 font-display text-[17px] font-semibold" style={{ color: "var(--ink)" }}>Choose a practice pack</h2>
              <p className="mt-1.5 max-w-[360px] text-[12.5px] leading-[1.6]" style={{ color: "var(--body)" }}>Select a pack from the library to view, filter and manage its tests.</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
