"use client";

import { useCallback, useRef, useState } from "react";
import { Sparkles, Copy, Download, Loader2, FileText } from "lucide-react";

type Tone = "professional" | "academic" | "personal";
type Length = "short" | "medium" | "long";

type SopFormState = {
  fullName: string;
  targetCountry: string;
  level: string;
  program: string;
  university: string;
  academicBackground: string;
  workExperience: string;
  achievements: string;
  careerGoals: string;
  whyThisProgram: string;
  personalStory: string;
  additionalNotes: string;
  tone: Tone;
  length: Length;
};

const INITIAL: SopFormState = {
  fullName: "",
  targetCountry: "",
  level: "master's",
  program: "",
  university: "",
  academicBackground: "",
  workExperience: "",
  achievements: "",
  careerGoals: "",
  whyThisProgram: "",
  personalStory: "",
  additionalNotes: "",
  tone: "professional",
  length: "medium",
};

const LEVELS = [
  { value: "undergraduate", label: "Undergraduate (Bachelor's)" },
  { value: "master's", label: "Master's" },
  { value: "phd", label: "PhD / Doctoral" },
  { value: "certificate / diploma", label: "Certificate / Diploma" },
  { value: "exchange / short course", label: "Exchange / Short course" },
  { value: "other", label: "Other" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "academic", label: "Academic" },
  { value: "personal", label: "Personal" },
];

const LENGTHS: { value: Length; label: string }[] = [
  { value: "short", label: "Short (~300-400 words)" },
  { value: "medium", label: "Medium (~500-700 words)" },
  { value: "long", label: "Long (~900-1200 words)" },
];

const FIELDS: { key: keyof SopFormState; label: string; placeholder: string; hint?: string }[] = [
  { key: "fullName", label: "Full name", placeholder: "e.g. Ayesha Rahman" },
  { key: "targetCountry", label: "Target country *", placeholder: "e.g. Canada, UK, USA, Australia" },
  { key: "program", label: "Intended program / field of study *", placeholder: "e.g. MSc Computer Science" },
  { key: "university", label: "University (if known)", placeholder: "e.g. University of Toronto" },
  { key: "academicBackground", label: "Academic background", placeholder: "Degrees, CGPA, relevant coursework…", hint: "e.g. BSc in CSE, CGPA 3.5/4.0" },
  { key: "workExperience", label: "Work experience", placeholder: "Roles, companies, responsibilities…", hint: "e.g. 2 years as a software engineer" },
  { key: "achievements", label: "Achievements", placeholder: "Awards, publications, projects…" },
  { key: "careerGoals", label: "Career goals", placeholder: "Short and long-term goals after graduation…", hint: "e.g. become a senior data scientist" },
  { key: "whyThisProgram", label: "Why this program / university?", placeholder: "What attracts you to this specific program…" },
  { key: "personalStory", label: "Personal story / motivation", placeholder: "Experiences that shaped your ambition…" },
  { key: "additionalNotes", label: "Additional notes", placeholder: "Anything else the admission team should know…" },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderRich(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline font-medium" style="color:var(--brand-2)">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="px-[5px] py-[1px] rounded-[6px] font-mono text-[12px]" style="background:var(--bg-soft);color:var(--ink)">$1</code>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h3 class="font-display font-semibold text-[15px] mt-4 mb-1" style="color:var(--ink)">$1</h3>')
    .replace(/^[-*]\s+(.+)$/gm, '<div class="pl-3 flex gap-2"><span style="color:var(--brand)">•</span><span>$1</span></div>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SopGenerator({ mobile }: { mobile?: boolean }) {
  const [form, setForm] = useState<SopFormState>(INITIAL);
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const set = <K extends keyof SopFormState>(key: K, value: SopFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canGenerate =
    form.targetCountry.trim().length > 0 &&
    form.program.trim().length > 0 &&
    !generating;

  const generate = useCallback(async () => {
    if (!canGenerate) return;

    setOutput("");
    setError(null);
    setGenerating(true);
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/sop-generator", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: {
            fullName: form.fullName,
            targetCountry: form.targetCountry,
            level: form.level,
            program: form.program,
            university: form.university,
            academicBackground: form.academicBackground,
            workExperience: form.workExperience,
            achievements: form.achievements,
            careerGoals: form.careerGoals,
            whyThisProgram: form.whyThisProgram,
            personalStory: form.personalStory,
            additionalNotes: form.additionalNotes,
          },
          options: { tone: form.tone, length: form.length },
        }),
      });

      if (!res.ok) {
        let detail = "Something went wrong";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) detail = data.error;
        } catch {
          // keep default
        }
        throw new Error(detail);
      }

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const parsed = JSON.parse(line.slice(6)) as { text?: string };
            if (parsed.text) {
              setOutput((prev) => prev + parsed.text);
            }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [form, canGenerate]);

  const stop = () => abortRef.current?.abort();

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const download = () => {
    if (!output) return;
    const slug =
      (form.fullName || "sop").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
      "sop";
    downloadText(output, `${slug}-statement-of-purpose.txt`);
  };

  const inputClass =
    "w-full text-[14px] rounded-xl border bg-white px-3.5 py-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30 hover:border-brand-2/60";

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Form */}
      <section
        className="rounded-[20px] border bg-white p-5 md:p-6 flex flex-col gap-5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <FileText size={18} strokeWidth={2} />
          </span>
          <div>
            <h2 className="font-display text-[16.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Your details
            </h2>
            <p className="text-[12px]" style={{ color: "var(--body)" }}>
              Fill in what you can — the more you share, the better the SOP.
            </p>
          </div>
        </div>

        {FIELDS.map((field) =>
          field.key === "targetCountry" || field.key === "program" ? (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                {field.label}
              </label>
              <input
                type="text"
                value={form[field.key] as string}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={inputClass}
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              />
            </div>
          ) : (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                {field.label}
              </label>
              {field.key === "fullName" || field.key === "university" ? (
                <input
                  type="text"
                  value={form[field.key] as string}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              ) : (
                <textarea
                  value={form[field.key] as string}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={`${inputClass} resize-y min-h-[74px]`}
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                />
              )}
              {field.hint && (
                <p className="text-[11.5px]" style={{ color: "#A6ADC0" }}>
                  {field.hint}
                </p>
              )}
            </div>
          )
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
              Degree level
            </label>
            <select
              value={form.level}
              onChange={(e) => set("level", e.target.value)}
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
              Tone
            </label>
            <select
              value={form.tone}
              onChange={(e) => set("tone", e.target.value as Tone)}
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
              Length
            </label>
            <select
              value={form.length}
              onChange={(e) => set("length", e.target.value as Length)}
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              {LENGTHS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-[13px]"
            style={{ background: "rgba(192,57,43,0.08)", color: "#C0392B" }}
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="flex items-center gap-2 rounded-full text-white text-[14px] font-semibold px-6 py-[12px] transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ background: "var(--brand)" }}
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "Writing…" : "Generate SOP"}
          </button>
          {generating && (
            <button
              type="button"
              onClick={stop}
              className="text-[13px] font-medium px-4 py-[10px] rounded-full border transition-colors duration-200 hover:opacity-80"
              style={{ borderColor: "var(--line)", color: "var(--body)" }}
            >
              Stop
            </button>
          )}
          {!form.targetCountry.trim() || !form.program.trim() ? (
            <span className="text-[12px]" style={{ color: "#A6ADC0" }}>
              Target country and program are required.
            </span>
          ) : null}
        </div>
      </section>

      {/* Output */}
      <section
        className="rounded-[20px] border bg-white flex flex-col min-h-[320px]"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--brand)" }} />
            <h2 className="text-[14.5px] font-semibold" style={{ color: "var(--ink)" }}>
              Your SOP
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={!output}
              className="flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3.5 py-[7px] transition-colors duration-200 disabled:opacity-40"
              style={{ background: "var(--bg-soft)", color: "var(--ink)" }}
            >
              <Copy size={13} /> {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={!output}
              className="flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3.5 py-[7px] text-white transition-colors duration-200 disabled:opacity-40"
              style={{ background: "var(--brand)" }}
            >
              <Download size={13} /> .txt
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-4">
          {!output && !generating ? (
            <div className="flex flex-col items-center justify-center gap-2 h-full py-16 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "var(--bg-soft)", color: "#A6ADC0" }}
              >
                <FileText size={22} />
              </span>
              <p className="text-[13.5px] font-medium" style={{ color: "var(--body)" }}>
                Your Statement of Purpose will appear here
              </p>
              <p className="text-[12px] max-w-[280px]" style={{ color: "#A6ADC0" }}>
                Fill in the form and hit “Generate SOP”. You can copy or download the result.
              </p>
            </div>
          ) : (
            <div
              className="text-[13.5px] leading-[1.75] break-words whitespace-pre-wrap"
              style={{ color: "var(--ink)" }}
              dangerouslySetInnerHTML={{ __html: renderRich(output) }}
            />
          )}
          {generating && !output && (
            <p className="text-[12.5px] flex items-center gap-2 py-4" style={{ color: "var(--body)" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--brand)" }} />
              Writing your SOP…
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
