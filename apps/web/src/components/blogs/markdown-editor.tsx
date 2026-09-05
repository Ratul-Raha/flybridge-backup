"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo2,
} from "lucide-react";
import { RichMarkdown } from "./rich-markdown";

type EditSnippet = {
  before: string;
  after: string;
  selection: [number, number];
};

const ACTIONS: { label: string; icon: typeof Bold; build: (sel: string) => EditSnippet }[] = [
  {
    label: "Bold",
    icon: Bold,
    build: (sel) => ({
      before: `**${sel}**`,
      after: "",
      selection: [2, 2 + sel.length],
    }),
  },
  {
    label: "Italic",
    icon: Italic,
    build: (sel) => ({
      before: `*${sel}*`,
      after: "",
      selection: [1, 1 + sel.length],
    }),
  },
  {
    label: "Heading 2",
    icon: Heading2,
    build: (sel) => ({
      before: `\n## ${sel}\n`,
      after: "",
      selection: [4, 4 + sel.length],
    }),
  },
  {
    label: "Heading 3",
    icon: Heading3,
    build: (sel) => ({
      before: `\n### ${sel}\n`,
      after: "",
      selection: [5, 5 + sel.length],
    }),
  },
  {
    label: "Link",
    icon: LinkIcon,
    build: (sel) => ({
      before: `[${sel || "link text"}](https://)`,
      after: "",
      selection: [1, 1 + (sel || "link text").length],
    }),
  },
  {
    label: "Unordered list",
    icon: List,
    build: (sel) => ({
      before: `\n- ${sel}\n`,
      after: "",
      selection: [3, 3 + sel.length],
    }),
  },
  {
    label: "Ordered list",
    icon: ListOrdered,
    build: (sel) => ({
      before: `\n1. ${sel}\n`,
      after: "",
      selection: [4, 4 + sel.length],
    }),
  },
  {
    label: "Quote",
    icon: Quote,
    build: (sel) => ({
      before: `\n> ${sel}\n`,
      after: "",
      selection: [3, 3 + sel.length],
    }),
  },
  {
    label: "Inline code",
    icon: Code,
    build: (sel) => ({
      before: `\`${sel}\``,
      after: "",
      selection: [1, 1 + sel.length],
    }),
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 18,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([value]);
  const historyIdxRef = useRef(0);

  const pushHistory = (next: string) => {
    const hist = historyRef.current.slice(0, historyIdxRef.current + 1);
    hist.push(next);
    if (hist.length > 100) hist.shift();
    historyRef.current = hist;
    historyIdxRef.current = hist.length - 1;
  };

  const handleChange = (v: string) => {
    onChange(v);
    pushHistory(v);
  };

  const applySnippet = (action: { build: (sel: string) => EditSnippet }) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const part = action.build(selected);
    const next = value.slice(0, start) + part.before + part.after + value.slice(end);
    handleChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + part.selection[0], start + part.selection[1]);
    });
  };

  const undo = () => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current -= 1;
      onChange(historyRef.current[historyIdxRef.current]);
    }
  };
  const redo = () => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current += 1;
      onChange(historyRef.current[historyIdxRef.current]);
    }
  };

  const toolbarBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--bg-soft)] disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "var(--line)" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b px-2 py-1.5" style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}>
        <div className="flex items-center gap-0.5">
          {[
            { label: "Write", key: "write" as const },
            { label: "Preview", key: "preview" as const },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-[6px] text-[12.5px] font-semibold transition-colors duration-150"
              style={
                tab === t.key
                  ? { background: "#fff", color: "var(--ink)", boxShadow: "0 1px 4px rgba(18,32,67,0.10)" }
                  : { color: "var(--body)" }
              }
            >
              {t.key === "preview" && <Eye size={13} />}
              {t.label}
            </button>
          ))}
        </div>

        {tab === "write" && (
          <>
            <span className="mx-2 h-5 w-px" style={{ background: "var(--line)" }} />
            <div className="flex items-center gap-0.5">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    title={a.label}
                    aria-label={a.label}
                    onClick={() => applySnippet(a)}
                    disabled={tab !== "write"}
                    className={toolbarBtn}
                    style={{ color: "var(--body)" }}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          <button type="button" title="Undo" aria-label="Undo" onClick={undo} className={toolbarBtn} style={{ color: "var(--body)" }}>
            <Undo2 size={14} />
          </button>
          <button type="button" title="Redo" aria-label="Redo" onClick={redo} className={toolbarBtn} style={{ color: "var(--body)" }}>
            <Redo size={14} />
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          spellCheck={false}
          className="w-full resize-y rounded-none px-4 py-3.5 font-mono text-[13px] leading-[1.7] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-2/20"
          style={{ color: "var(--ink)", border: "none" }}
        />
      ) : (
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {value.trim() ? (
            <RichMarkdown content={value} />
          ) : (
            <p className="py-8 text-center text-[13px]" style={{ color: "var(--body)" }}>
              Nothing to preview yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}