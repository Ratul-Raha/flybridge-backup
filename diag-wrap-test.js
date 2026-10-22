// Reproduces the bulk-email wrapping path locally (no sending) to see what hrefs
// the admin route would produce. Uses only AUTH_SECRET from local env; prints HTML.
const fs = require("fs");
const crypto = require("node:crypto");

function loadEnv(p) {
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = { ...loadEnv("apps/web/.env"), ...loadEnv("apps/web/.env.local") };
const secret = env.EMAIL_TRACKING_SECRET ?? env.AUTH_SECRET ?? "";
const SITE_URL = (env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com").replace(/\/+$/, "");
console.log("SITE_URL used:", SITE_URL, "| tracking enabled:", secret.length > 0);

function sameSitePath(rawUrl) {
  const url = rawUrl.trim(); if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try { const p = new URL(url);
    if (p.protocol !== "http:" && p.protocol !== "https:") return null;
    if (p.origin !== SITE_URL) return null;
    return `${p.pathname}${p.search}${p.hash}`;
  } catch { return null; }
}
function signEmailLink(raw, meta = {}) {
  if (!secret) return null;
  const d = sameSitePath(raw); if (!d) return null;
  const payload = { d }; if (meta.campaign) payload.c = meta.campaign;
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = crypto.createHmac("sha256", secret).update(body).digest().toString("base64url");
  return `${body}.${mac}`;
}
const HREF_RE = /(\bhref\s*=\s*)(["'])([^"']*)\2/gi;
function rewrite(html, meta = {}) {
  if (!secret || !html.includes("href")) return html;
  return html.replace(HREF_RE, (m, a, q, href) => {
    const t = href.trim();
    if (!t || t.startsWith("#") || /^(mailto:|tel:|data:)/i.test(t)) return m;
    const tok = signEmailLink(t, meta); if (!tok) return m;
    return `${a}${q}${SITE_URL}/e/${tok}${q}`;
  });
}

const samples = [
  '<a href="/courses">relative</a>',
  `<a href="${SITE_URL}/courses">absolute apex</a>`,
  '<a href="https://www.flybridgeedu.com/courses">absolute www</a>',
  '<a href="courses">no leading slash</a>',
  '<a href="https://flybridgeedu.com">bare apex</a>',
  '<a href="https://www.flybridgeedu.com">bare www</a>',
];
for (const s of samples) {
  const out = rewrite(s, { campaign: "admin-bulk" });
  console.log(out.includes("/e/") ? "WRAPPED " : "MISSED  ", s);
}
