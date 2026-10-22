// Read-only diagnostic: proves whether prod /e/{token} records a click.
// Requires AUTH_SECRET (or EMAIL_TRACKING_SECRET) to match prod. Nothing is printed.
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
const secret = process.env.EMAIL_TRACKING_SECRET ?? process.env.AUTH_SECRET ?? env.EMAIL_TRACKING_SECRET ?? env.AUTH_SECRET ?? "";
if (!secret) { console.error("No AUTH_SECRET/EMAIL_TRACKING_SECRET available locally to sign with."); process.exit(2); }

const dest = "/faq?diagnostic=" + Date.now();
const body = Buffer.from(JSON.stringify({ d: dest, c: "diag" }), "utf8").toString("base64url");
const mac = crypto.createHmac("sha256", secret).update(body).digest().toString("base64url");
const url = `https://flybridgeedu.com/e/${body}.${mac}`;

(async () => {
  const res = await fetch(url, { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  console.log("status:", res.status);
  console.log("location:", loc);
  console.log(loc.includes("/faq") ? "=> signature ACCEPTED by prod (redirect to destination)" : "=> signature REJECTED (fell back to /)");
  console.log("Now check: admin email-clicks, or query the `emailclicks` collection for campaign 'diag'.");
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
