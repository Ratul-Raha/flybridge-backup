"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Wand2, Copy, Check, ImagePlus, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { uploadToStorage } from "@/lib/upload-client";
import {
  SKILL_META,
  formatPrice,
  type BundleDto,
  type MockTestSkill,
  type TestListItem,
} from "@/lib/mock-test-ui";

const inputClass =
  "w-full text-[14px] rounded-xl border bg-white px-4 py-[11px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30";

const emptyBundleForm = {
  title: "",
  slug: "",
  description: "",
  badge: "",
  image: "",
  price: "",
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

type ManagedSection = {
  id?: string;
  type?: string;
  instructions?: string;
  passage?: string;
  image?: string;
  imagePlacement?: string;
  questions?: { qid?: string; prompt?: string; type?: string }[];
};

const SECTION_PLACEMENTS = [
  { value: "above", label: "Above passage & instructions" },
  { value: "below-passage", label: "Below passage, above questions" },
  { value: "below", label: "After questions" },
] as const;

function sectionPreview(s: ManagedSection): string {
  const fromInstructions = s.instructions?.trim() ?? "";
  if (fromInstructions) return fromInstructions.slice(0, 70);
  const firstPrompt = s.questions?.find((q) => (q.prompt ?? "").trim())?.prompt?.trim() ?? "";
  if (firstPrompt) return firstPrompt.slice(0, 70);
  return "No instructions or questions yet";
}

export function MockTestManage() {
  const { user } = useAuth();

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
    loadBundles();
    fetch("/api/courses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCourses((d.courses ?? []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))))
      .catch(() => setCourses([]));
  }, [loadBundles]);

  const loadTests = useCallback(async (bundleId: string) => {
    setActiveBundleId(bundleId);
    setTestsLoaded(false);
    try {
      const res = await fetch(`/api/mock-tests/bundles/${bundleId}`, { cache: "no-store" });
      const data = await res.json();
      setTests(Array.isArray(data.tests) ? data.tests : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tests");
    } finally {
      setTestsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (activeBundleId) loadTests(activeBundleId);
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

  const openTestCreate = () => {
    setEditingTestId(null);
    setTestForm({
      ...emptyTestForm,
      title: "",
      skill: "reading",
      status: "draft",
      durationMinutes: "60",
      order: String(tests.length),
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
      return v && typeof v === "object" ? (v as { sections?: ManagedSection[] }) : null;
    } catch {
      return null;
    }
  }, [testForm.contentJson]);

  const contentSections = parsedContent?.sections ?? [];

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

  if (!user) return <p style={{ color: "var(--body)" }}>Loading…</p>;

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
                  {formatPrice(b.price, b.currency)}
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
                  <button
                    type="button"
                    onClick={openTestCreate}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand)" }}
                  >
                    <Plus size={13} /> New test
                  </button>
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
                          <button
                            type="button"
                            onClick={() => openTestEdit(t)}
                            className="shrink-0 text-[12.5px] font-medium border rounded-full px-4 py-[7px] hover:border-brand-2 hover:text-brand-2 transition-all duration-200"
                            style={{ color: "var(--ink)", borderColor: "var(--line)" }}
                          >
                            Edit
                          </button>
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
                {testFormOpen && (
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

                      {testForm.skill !== "writing" && (
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

                      {contentSections.length > 0 && (
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

                      {testForm.skill !== "writing" && (
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
                      <button
                        type="button"
                        onClick={() => {
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
                )}
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