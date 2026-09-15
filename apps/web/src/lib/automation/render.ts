const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

type Ctx = { data: unknown; root: unknown };

type TNode =
  | { type: "text"; value: string }
  | { type: "expr"; path: string; filters: string[] }
  | { type: "if"; cond: string; then: TNode[]; else: TNode[] }
  | { type: "each"; path: string; children: TNode[] };

type Tok =
  | { kind: "text"; v: string }
  | { kind: "openEach"; path: string }
  | { kind: "openIf"; cond: string }
  | { kind: "else" }
  | { kind: "close"; name: "each" | "if" }
  | { kind: "expr"; path: string; filters: string[] };

type Filter = "escape" | "raw" | "date" | "number" | "upper" | "lower" | "first" | "shortid" | "url" | "year";

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absUrl(u?: unknown): string {
  if (u === undefined || u === null) return "";
  const s = String(u);
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `${SITE_URL}${s.startsWith("/") ? s : `/${s}`}`;
}

function fmtDate(v: unknown): string {
  if (v === undefined || v === null) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtYear(v: unknown): string {
  if (v === undefined || v === null) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return String(d.getFullYear());
}

function firstName(v: unknown): string {
  const first = String(v ?? "")
    .trim()
    .split(/\s+/)[0];
  return first || "there";
}

export function resolveValue(data: unknown, path: string, root: unknown): unknown {
  path = path.trim();
  if (path === "now") return new Date();
  if (path === "siteUrl") return SITE_URL;

  const rawParts = path.split(".").filter(Boolean);
  const fromRoot = rawParts[0] === "$root";
  const parts = fromRoot ? rawParts.slice(1) : rawParts;
  if (parts.length === 0) return undefined;

  const scopes: unknown[] = fromRoot ? [root] : [data, root];
  for (const scope of scopes) {
    let cur: unknown = scope;
    let ok = true;
    for (const part of parts) {
      if (cur == null) {
        ok = false;
        break;
      }
      if (Array.isArray(cur)) {
        if (/^\d+$/.test(part)) cur = cur[Number(part)];
        else {
          ok = false;
          break;
        }
      } else if (typeof cur === "object") {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        ok = false;
        break;
      }
    }
    if (ok) return cur;
  }
  return undefined;
}

function applyFilters(value: unknown, filters: string[]): string {
  if (value === undefined || value === null) {
    // `first` still resolves to the "there" fallback like the legacy builder.
    return filters.includes("first") ? firstName("") : "";
  }
  let v: unknown = value;
  let raw = false;
  for (const f of filters) {
    switch (f as Filter) {
      case "raw":
        raw = true;
        break;
      case "escape":
        break;
      case "upper":
        v = String(v).toUpperCase();
        break;
      case "lower":
        v = String(v).toLowerCase();
        break;
      case "date":
        v = fmtDate(v);
        break;
      case "year":
        v = fmtYear(v);
        break;
      case "number":
        v = Number(v).toLocaleString("en-US");
        break;
      case "first":
        v = firstName(v);
        break;
      case "shortid":
        v = String(v ?? "").slice(-8).toUpperCase();
        break;
      case "url":
        v = absUrl(v);
        break;
    }
  }
  const s = typeof v === "string" ? v : String(v);
  if (raw) return s;
  if (!filters.includes("escape")) return escapeHtml(s);
  return s;
}

const OPS = ["===", "!==", "==", "!=", ">=", "<=", ">", "<"] as const;

function truthy(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v !== "";
  if (typeof v === "number") return v !== 0 && !Number.isNaN(v);
  return Boolean(v);
}

function evalCondition(cond: string, data: unknown, root: unknown): boolean {
  const trimmed = cond.trim();
  let op: string | null = null;
  let lhs = trimmed;
  let rhsRaw: string | null = null;

  for (const candidate of OPS) {
    const idx = trimmed.indexOf(candidate);
    if (idx > 0) {
      op = candidate;
      lhs = trimmed.slice(0, idx).trim();
      rhsRaw = trimmed.slice(idx + candidate.length).trim();
      break;
    }
  }

  const a = resolveValue(data, lhs, root);
  if (rhsRaw === null) return truthy(a);

  let b: unknown;
  if (/^-?\d+(\.\d+)?$/.test(rhsRaw)) b = Number(rhsRaw);
  else if (rhsRaw.startsWith('"') && rhsRaw.endsWith('"')) b = rhsRaw.slice(1, -1);
  else if (rhsRaw.startsWith("'") && rhsRaw.endsWith("'")) b = rhsRaw.slice(1, -1);
  else b = resolveValue(data, rhsRaw, root);

  switch (op) {
    case "===":
      return a === b;
    case "!==":
      return a !== b;
    case "==":
      return a == b;
    case "!=":
      return a != b;
    case ">":
      return Number(a) > Number(b);
    case ">=":
      return Number(a) >= Number(b);
    case "<":
      return Number(a) < Number(b);
    case "<=":
      return Number(a) <= Number(b);
    default:
      return truthy(a);
  }
}

function renderNodes(nodes: TNode[], ctx: Ctx): string {
  let out = "";
  for (const n of nodes) {
    if (n.type === "text") {
      out += n.value;
    } else if (n.type === "expr") {
      out += applyFilters(resolveValue(ctx.data, n.path, ctx.root), n.filters);
    } else if (n.type === "if") {
      const ok = evalCondition(n.cond, ctx.data, ctx.root);
      out += renderNodes(ok ? n.then : n.else, ctx);
    } else {
      const val = resolveValue(ctx.data, n.path, ctx.root);
      if (Array.isArray(val)) {
        out += val
          .map((item) => renderNodes(n.children, { data: item, root: ctx.root }))
          .join("");
      } else if (val && typeof val === "object") {
        out += renderNodes(n.children, { data: val, root: ctx.root });
      }
    }
  }
  return out;
}

function tokenize(tpl: string): Tok[] {
  const toks: Tok[] = [];
  const re = /\{\{[\s\S]*?\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tpl)) !== null) {
    if (m.index > last) toks.push({ kind: "text", v: tpl.slice(last, m.index) });
    const raw = m[0].slice(2, -2).trim();
    last = re.lastIndex;
    if (raw.startsWith("#each")) toks.push({ kind: "openEach", path: raw.slice(5).trim() });
    else if (raw.startsWith("#if")) toks.push({ kind: "openIf", cond: raw.slice(3).trim() });
    else if (raw === "/each") toks.push({ kind: "close", name: "each" });
    else if (raw === "/if") toks.push({ kind: "close", name: "if" });
    else if (raw === "else") toks.push({ kind: "else" });
    else {
      const [path, ...filters] = raw.split("|").map((s) => s.trim());
      toks.push({ kind: "expr", path, filters });
    }
  }
  if (last < tpl.length) toks.push({ kind: "text", v: tpl.slice(last) });
  return toks;
}

function build(toks: Tok[], i: number): { nodes: TNode[]; next: number } {
  const nodes: TNode[] = [];
  while (i < toks.length) {
    const t = toks[i];
    if (t.kind === "text") {
      nodes.push({ type: "text", value: t.v });
      i++;
    } else if (t.kind === "expr") {
      nodes.push({ type: "expr", path: t.path, filters: t.filters });
      i++;
    } else if (t.kind === "openIf") {
      const a = build(toks, i + 1);
      let elseNodes: TNode[] = [];
      i = a.next;
      if (i < toks.length && toks[i].kind === "else") {
        const b = build(toks, i + 1);
        elseNodes = b.nodes;
        i = b.next;
      }
      const closeIf = toks[i];
      if (closeIf && closeIf.kind === "close" && closeIf.name === "if") i++;
      nodes.push({ type: "if", cond: t.cond, then: a.nodes, else: elseNodes });
    } else if (t.kind === "openEach") {
      const a = build(toks, i + 1);
      i = a.next;
      const closeEach = toks[i];
      if (closeEach && closeEach.kind === "close" && closeEach.name === "each") i++;
      nodes.push({ type: "each", path: t.path, children: a.nodes });
    } else {
      break;
    }
  }
  return { nodes, next: i };
}

export function renderEmailTemplate(template: string, payload: Record<string, unknown>): string {
  const toks = tokenize(template);
  const { nodes } = build(toks, 0);
  return renderNodes(nodes, { data: payload, root: payload });
}

/** Renders a plain-text subject line. Unlike the HTML body, expression values
 *  are kept raw so titles with "&"/quotes never leak HTML entities into the
 *  subject header (matches the legacy non-escaping behavior). */
export function renderEmailSubject(template: string, payload: Record<string, unknown>): string {
  if (!template.includes("{{")) return template;
  const rawified = template.replace(/\{\{([^{}]+)\}\}/g, (m, inner: unknown) => {
    const t = String(inner ?? "").trim();
    if (t.startsWith("#") || t.startsWith("/") || t === "else") return m;
    const hasRaw = /(^|\|)\s*raw\s*$/.test(t);
    return `{{${t}${hasRaw ? "" : "|raw"}}}`;
  });
  return renderEmailTemplate(rawified, payload);
}