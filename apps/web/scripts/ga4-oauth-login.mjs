// Mints a GA4 Data API OAuth refresh token for the admin traffic dashboard.
//
// This is the keyless alternative to a service account JSON: it authenticates as
// a Google account that already has Viewer on the GA4 property, so nothing has
// to be created in IAM or key management.
//
//   1. Google Cloud console → APIs & Services → Credentials → Create credentials
//      → OAuth client ID → Application type: Desktop app.
//   2. Run: pnpm ga4-oauth <client_id> <client_secret>
//      (or set GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET first)
//   3. Approve in the browser, or paste the redirected URL back at the prompt if
//      the browser fails to reach this machine.
//   4. Paste the printed lines into apps/web/.env.local and production env.
//
// Uses plain fetch so it does not depend on google-auth-library being hoisted out
// of @google-analytics/data's dependency tree.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createInterface } from "node:readline";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
// Desktop clients are permitted http://localhost on any port; the path is ignored.
const REDIRECT = "http://localhost:4567";
const PORT = 4567;

const [clientIdArg, clientSecretArg] = process.argv.slice(2);
const clientId = (clientIdArg || process.env.GOOGLE_OAUTH_CLIENT_ID || "").trim();
const clientSecret = (clientSecretArg || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "").trim();

if (!clientId || !clientSecret) {
  console.error("Missing OAuth client credentials.\n");
  console.error("Pass them as arguments:\n  pnpm ga4-oauth <client_id> <client_secret>\n");
  console.error("Or create a Desktop app OAuth client in the Google Cloud console under");
  console.error("APIs & Services → Credentials, then set GOOGLE_OAUTH_CLIENT_ID and");
  console.error("GOOGLE_OAUTH_CLIENT_SECRET in your shell before running this again.");
  process.exit(1);
}

if (!/apps\.googleusercontent\.com$/.test(clientId)) {
  console.warn("Note: this client id does not end in .apps.googleusercontent.com, which is");
  console.warn("what Google issues for Desktop and Web app clients. If the consent screen");
  console.warn("rejects the redirect, check the Application type on the credentials page.\n");
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth" +
  `?client_id=${encodeURIComponent(clientId)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  // offline + consent are what make Google hand back a refresh_token; without
  // them an already-authorised account silently returns none.
  `&access_type=offline` +
  `&prompt=consent`;

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref();
  } catch {
    // Non-fatal — the URL is printed either way.
  }
}

let settled = false;

async function exchangeCode(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${body?.error ?? "unknown"} — ${body?.error_description ?? ""}`.trim());
  }
  return body;
}

function envLines(token) {
  if (!token.refresh_token) {
    return [
      "No refresh_token was returned. Revoke the app's access at",
      "myaccount.google.com/permissions, then re-run and choose",
      '"Continue" on the consent screen.',
    ].join("\n");
  }
  return [
    "GOOGLE_OAUTH_CLIENT_ID=" + clientId,
    "GOOGLE_OAUTH_CLIENT_SECRET=" + clientSecret,
    "GOOGLE_OAUTH_REFRESH_TOKEN=" + token.refresh_token,
    "",
    "Add these to apps/web/.env.local and to production env, then restart dev.",
  ].join("\n");
}

/** Single exit point, so the HTTP callback and a pasted URL cannot both finish. */
async function settle(body, ok) {
  if (settled) return;
  settled = true;
  try {
    console.log("\n" + body);
  } finally {
    rl.close();
    server.close();
    if (!ok) process.exitCode = 1;
    setTimeout(() => process.exit(process.exitCode ?? 0), 150);
  }
}

const succeed = (body) => settle(body, true);
const fail = (body) => settle(body, false);

async function handleCode(code) {
  try {
    const token = await exchangeCode(code);
    succeed(envLines(token));
  } catch (err) {
    fail("Token exchange failed: " + String(err?.message ?? err));
  }
}

/** Accepts a bare code, a full redirected URL, or an error redirect. */
async function consume(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return false;

  let url = null;
  try {
    url = raw.startsWith("http") ? new URL(raw) : null;
  } catch {
    return false;
  }

  if (url && url.searchParams.has("error")) {
    fail(
      "Google returned an error: " +
        url.searchParams.get("error") +
        (url.searchParams.get("error_description")
          ? " — " + url.searchParams.get("error_description")
          : "")
    );
    return true;
  }

  const code = url ? url.searchParams.get("code") : raw;
  if (!code) return false;

  await handleCode(code);
  return true;
}

const server = createServer((req, res) => {
  void consume(new URL(req.url ?? "/", REDIRECT).href).then((handled) => {
    if (settled || handled) return;
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<body style='font:14px system-ui;padding:40px'><h2>No authorization code</h2>" +
        "<p>Copy the full address-bar URL and paste it at the terminal prompt.</p></body>"
    );
  });
});

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function prompt() {
  if (settled) return;
  rl.question("Paste the redirected URL (or the code) here, then Enter: ", async (answer) => {
    if (settled) return;
    const ok = await consume(answer);
    if (!ok) {
      console.log("No code found in that input — try again.");
      void prompt();
    }
  });
}

server.listen(PORT, () => {
  console.log("Allow access to FlyBridge Analytics on the next screen.\n");
  console.log(authUrl + "\n");
  console.log("Waiting for the browser callback on " + REDIRECT + " …");
  console.log("(If the browser shows an error or cannot reach this page, paste the");
  console.log(" full address-bar URL below.)\n");
  openBrowser(authUrl);
  void prompt();
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close whatever is using it and re-run.`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
