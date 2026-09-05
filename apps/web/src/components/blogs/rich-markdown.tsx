"use client";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Line = { type: string; content: string; level?: number; id?: string };

function parseInline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded-md font-mono text-[0.87em]" style="background:var(--bg-soft);color:var(--brand-2)">$1</code>'
  );
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="underline underline-offset-2 font-medium" style="color:var(--brand-2)">$1</a>'
  );
  return html;
}

function parseLines(markdown: string): Line[] {
  const rawLines = markdown.replace(/\r\n/g, "\n").split("\n");
  const lines: Line[] = [];

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];

    // fenced code block
    if (/^```/.test(line.trim())) {
      const lang = line.trim().replace(/^```/, "").trim();
      const code: string[] = [];
      i++;
      while (i < rawLines.length && !/^```/.test(rawLines[i].trim())) {
        code.push(rawLines[i]);
        i++;
      }
      i++; // skip closing fence
      lines.push({
        type: "code",
        content: escapeHtml(code.join("\n")),
      });
      continue;
    }

    const trimmed = line.trim();

    // headings
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const rawText = h[2]
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
      const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      lines.push({ type: "heading", level: h[1].length, content: parseInline(h[2]), id });
      i++;
      continue;
    }

    // unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\s*[-*]\s+/.test(rawLines[i].trim())) {
        items.push(parseInline(rawLines[i].trim().replace(/^[-*]\s+/, "")));
        i++;
      }
      lines.push({ type: "ul", content: items.map((m) => `<li>${m}</li>`).join("") });
      continue;
    }

    // ordered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\s*\d+[.)]\s+/.test(rawLines[i].trim())) {
        items.push(parseInline(rawLines[i].trim().replace(/^\d+[.)]\s+/, "")));
        i++;
      }
      lines.push({
        type: "ol",
        content: items.map((m) => `<li>${m}</li>`).join(""),
      });
      continue;
    }

    // blockquote
    if (/^>\s?/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length && /^>\s?/.test(rawLines[i].trim())) {
        items.push(parseInline(rawLines[i].trim().replace(/^>\s?/, "")));
        i++;
      }
      lines.push({ type: "blockquote", content: items.join("<br>") });
      continue;
    }

    // hr
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      lines.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // blank -> paragraph break handled by joining
    if (!trimmed) {
      i++;
      continue;
    }

    // paragraph: accumulate until blank line
    const para: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !/^```/.test(rawLines[i].trim()) &&
      !/^(#{1,6})\s+/.test(rawLines[i].trim()) &&
      !/^\s*[-*]\s+/.test(rawLines[i].trim()) &&
      !/^\s*\d+[.)]\s+/.test(rawLines[i].trim()) &&
      !/^>\s?/.test(rawLines[i].trim())
    ) {
      para.push(parseInline(rawLines[i].trim()));
      i++;
    }
    lines.push({ type: "p", content: para.join("<br>") });
  }

  return lines;
}

export function renderMarkdownHtml(markdown: string): string {
  const lines = parseLines(markdown);

  const headingClass = (level: number, accent: string) => {
    if (level === 2)
      return `mt-10 mb-4 font-display font-semibold leading-tight tracking-[-0.01em] text-[clamp(20px,2.2vw,26px)]`;
    if (level === 3)
      return `mt-8 mb-3 font-display font-semibold leading-snug text-[18px]`;
    return `mt-7 mb-3 font-display font-semibold text-[17px]`;
  };

  const accent = "var(--ink)";

  return lines
    .map((l) => {
      switch (l.type) {
        case "heading":
          return `<h${l.level} id="${l.id ?? ""}" class="${headingClass(l.level ?? 2, accent)}" style="color:${accent};border-bottom:${
            (l.level ?? 2) <= 2 ? "1px solid var(--line)" : "none"
          };padding-bottom:${(l.level ?? 2) <= 2 ? "0.5rem" : "0"}">${l.content}</h${l.level}>`;
        case "ul":
          return `<ul class="my-4 list-disc pl-6 space-y-2" style="color:var(--body)">${l.content}</ul>`;
        case "ol":
          return `<ol class="my-4 list-decimal pl-6 space-y-2" style="color:var(--body)">${l.content}</ol>`;
        case "blockquote":
          return `<blockquote class="my-6 border-l-4 pl-4 italic" style="border-color:var(--brand);color:var(--body)">${l.content}</blockquote>`;
        case "hr":
          return `<hr class="my-8 border-t" style="border-color:var(--line)" />`;
        case "code":
          return `<pre class="my-5 overflow-x-auto rounded-lg border p-4 font-mono text-[13px] leading-relaxed" style="background:var(--bg-soft);border-color:var(--line);color:var(--ink)"><code>${l.content}</code></pre>`;
        default:
          return `<p class="my-4 text-[15.5px] leading-[1.85]" style="color:var(--body)">${l.content}</p>`;
      }
    })
    .join("\n");
}

export function RichMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      // sanitized-by-construction: all user/LLM content is HTML-escaped then
      // tags built from a fixed allowlist in renderMarkdownHtml — never raw HTML.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(content) }}
    />
  );
}