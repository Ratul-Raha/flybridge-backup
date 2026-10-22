# FlyBridge Security Audit — 2026-10-20

Scope: `apps/web` (Next.js 14 App Router, Mongoose/MongoDB, Firebase Auth → custom JWT
session, Stripe + EPS payments, S3/Cloudinary, Groq/Grok AI). Reviewed static source,
route guards, payment flows, dependency tree, and secret hygiene. A prior audit
(`security-audit-2026-09-01-0108.md`) and `payments-orders-audit.md` were used as a
baseline; each open item was re-verified against current code.

Severity key: **CRITICAL / HIGH / MEDIUM / LOW**.

---

## Executive summary

No authentication-bypass of the session oracle was found — Firebase ID tokens are
correctly verified (`email_verified`, issuer/audience) and the session cookie is
httpOnly/HS256/`AUTH_SECRET`-signed. The EPS IPN design is unusually good, and SSRF in
the crawler is properly defended.

The most urgent items are:

1. **CRITICAL — vulnerable dependencies.** `next@14.2.35` carries unauthenticated RCE
   advisories; `jspdf@2.5.2` carries a critical path-traversal/HTML-injection set. See C1/C2.
2. **HIGH — stored/DOM XSS** in the shared markdown renderers: URLs are inserted into a
   double-quoted `href` without escaping `"`, so `[x](https://a"onmouseover=…)` breaks out.
3. **HIGH — Stripe checkout compliance:** the webhook fulfills orders without checking
   `payment_status === "paid"` or that `amount_total` matches the order.
4. **HIGH — BDT zero-price bypass** still lets a paid item be taken free by sending
   `currency: "BDT"` for a product whose BDT price is `0`.
5. **HIGH — refunds/admin status changes do not revoke access** (enrollments persist),
   and the account email/phone/name on file can be overwritten by any authenticated
   checkout request.
6. **MEDIUM — unsigned affiliate cookie** allows commission attribution forgery and
   self-serving manipulation.

---

## Findings

### C1 — CRITICAL: `next@14.2.35` has unauthenticated RCE advisories

`pnpm audit --prod` reports (against `apps/web > next@14.2.35`):

- **GHSA-p293-qw3h-jr36** — Unauthenticated RCE on Windows-hosted servers (`<15.5.24`).
- **GHSA-2xp9-vwfh-vxw4** — Unauthenticated RCE in the Image Optimization API via AVIF
  (`<15.5.24`).
- Multiple HIGH SSRF/DoS/cache-poisoning advisories in App Router + Server Actions and
  `rewrites` (e.g. SSRF via attacker-controlled rewrite hostname, SSRF in Server Actions
  on custom servers, Server Component DoS).

Impact: if Vercel hosts on Linux, the Windows-only RCE may not apply, but the Image
Optimizer RCE, Server Action SSRF/DoS, and rewrite SSRF are reachable on the default
deployment. The project uses `next/image` with `remotePatterns`
(`apps/web/next.config.js:13`).

Fix: upgrade to **`next@>=15.5.24`** (or the latest 14.x patch line if staying on 14,
accepting that the image-optimizer RCE requires 15.5.24). Re-run `pnpm audit` after.

---

### C2 — CRITICAL: `jspdf@2.5.2` local file inclusion / HTML injection

`pnpm audit` reports for `apps/web > jspdf@2.5.2`:

- **GHSA-f8cm-6447-x5h2 (CRITICAL)** — Local File Inclusion / Path Traversal (`>=4.0.0`).
- **GHSA-wfv2-pwc8-crg5 (CRITICAL)** — HTML Injection in "open in new window" paths
  (`>=4.2.1`).
- Several HIGH: arbitrary JS execution via AcroForm/`addJS` PDF injection, DoS.
- `dompurify` (transitive) has a long list of XSS advisories.

jspdf is used for client-side certificate PDF generation (`jspdf` + `html2canvas`). If any
user-controlled string (name, course title) reaches `addJS`/AcroForm text, the PDF-injection
items become exploitable. Fix: bump to **`jspdf@>=4.2.1`** and `dompurify@>=3.4.16`, then
rebuild the lockfile. (`apps/web/package.json`)

---

### H1 — HIGH: Stored/DOM XSS in markdown renderers (unescaped quote in `href`)

All four hand-rolled markdown renderers escape only `& < >` and then substitute the link
URL into a **double-quoted attribute** without escaping `"`:

- `apps/web/src/components/blogs/rich-markdown.tsx:20` (`parseInline`, sink at
  `:195`) — note `escapeAttr` is defined at `:10` but **never used**.
- `apps/web/src/components/chat/chat-widget.tsx:38` (`renderRich`, sink `:290`).
- `apps/web/src/components/readiness/readiness-result.tsx:89` (sink `:487`).
- `apps/web/src/components/dashboard/user/sop-generator.tsx:85` (sink `:447`).
- `apps/web/src/components/ops-bot/chat-body.tsx:54` (sink `:359`).

The link regex `\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)` allows `"` inside the captured URL.
Input such as:

```
[click](https://x/"onmouseover="alert(document.domain))
```

produces `<a href="https://x/" onmouseover="alert(document.domain)" …>` → script execution.

Impact is highest for **blog content**, which is authored by admin/moderator and rendered
to every visitor (stored XSS, can ride an admin session into `/api/admin/*`). The AI
outputs (chat/SOP/readiness) are attacker-influenceable via prompt injection, producing
reflected/self-XSS and link spoofing.

Fix: escape attribute values (use `escapeAttr`, or reject URLs containing `"`/`'`/`<`/`>`),
and prefer a vetted sanitizer (e.g. `isomorphic-dompurify`) for all `dangerouslySetInnerHTML`
sinks. Consider a CSP to backstop (see L1).

---

### H2 — HIGH: Stripe webhook fulfills without verifying paid status or amount

`apps/web/src/app/api/webhooks/stripe/route.ts:46-55` fulfills on
`checkout.session.completed` when the order is `pending`. It never checks:

- `session.payment_status === "paid"` (async methods can fire `completed` while unpaid),
- `session.amount_total` / `currency` against `order.total` / `order.currency`.

`reconcileStripeOrder` additionally checks `payment_status` but not the amount. This was
flagged in the prior audit (F2) and remains open. Result: a paid item can be fulfilled
without matching payment, e.g. a differently-sized session or a discounted/zero session.

Fix: require `payment_status === "paid"` and assert
`session.amount_total === Math.round(order.total * 100)` and matching currency before
`fulfillOrder`, in both the webhook and `reconcileStripeOrder`.

---

### H3 — HIGH: BDT zero-price free-fulfillment bypass

`apps/web/src/lib/products.ts:34` treats `bdt >= 0` as a valid BDT price, so a product
whose `prices.BDT` is `0` yields `amount = 0`. `createOrder` then calls `fulfillFreeItem`
(`apps/web/src/lib/orders.ts:304-311`) and returns `requiresPayment: false`. The same
permissive `>= 0` check exists in `pricing.ts:18-19/27/36` (`sanitizePrices`/`cleanPrices`).

Any checkout request with `currency: "BDT"` for a product that has a `0` BDT price (or a
paid product whose BDT price was misconfigured to 0) gets the item for free. This is the
`payments-orders-audit.md` item #2, still open.

Fix: require `bdt > 0` for a BDT listing to be purchasable, and explicitly reject
zero-amount paid products at the order layer; only allow free items where the product is
intentionally free in the primary currency.

---

### H4 — HIGH: Account email/phone/name overwritten during checkout

`apps/web/src/app/api/orders/route.ts:107-116` writes client-supplied `name`, `phone`, and
`email` directly onto the session user record with no verification. Because the email on
the order links/identifies the buyer (and drives seminar registration by email and the
`isAlreadyFulfilled`/duplicate checks), this enables:

- changing the account email on file to an unverified address,
- manipulating seminar/order ownership and receipt delivery,
- attribution confusion that affects commission self-referral checks.

This is `payments-orders-audit.md` item #3, still open.

Fix: never let checkout mutate the authenticated account's email (and treat name/phone as
order-level fields, not account writes). If a profile edit is intended, make it a separate
authenticated profile endpoint with verification.

---

### H5 — HIGH: Refund / non-completed status does not revoke access

`apps/web/src/app/api/orders/[id]/route.ts:49-52` allows an admin to set any non-completed
status, and `fulfillOrderAccess` only grants on `completed`. Setting an order to
`refunded`/`failed` leaves `CourseEnrollment`, `SeminarRegistration`, and
`MockTestEnrollment` active, so the buyer keeps access. `deleteOrdersWithCascade` also does
not cascade to `MockTestEnrollment` (`apps/web/src/lib/orders.ts:85-121`). This is
`payments-orders-audit.md` item #6, still open.

Fix: on refund/cancel, expire the corresponding enrollments/registrations (as the refund
flow already does for the refund-window fields), and include `MockTestEnrollment` in the
delete cascade.

---

### M1 — MEDIUM: Unsigned, client-controlled affiliate cookie

`apps/web/src/lib/affiliate.ts:52-89` stores `{affiliateId, code, clickId}` as plain
URL-encoded JSON in `flybridge_affiliate`, and `affiliateFromRequest`
(`affiliate-attribution.ts:9`) trusts it verbatim at order time. It is httpOnly but not
signed, so any user can set it via devtools/curl to credit an arbitrary affiliate (or a
colluding one) on their purchase. `resolveCommission` blocks direct self-referral by user
id/email (`affiliate-commission.ts:26-32`), which limits but does not eliminate the fraud
(collusion, click/referrer spoofing).

Fix: sign the cookie with an HMAC (mirror `lib/email-tracking.ts`) and validate
`affiliateId` against an active `Affiliate` at order creation.

---

### M2 — MEDIUM: Public AI endpoints — unbounded cost and abuse

`/api/chat` (`apps/web/src/app/api/chat/route.ts`) is fully unauthenticated, has no input
length limit, and proxies the LLM. `/api/readiness` and the public crawler endpoints are
similarly open. The only control is the in-memory rate limiter (M3), which is per-instance.
This is a cost/DoS (and content-abuse) surface.

Fix: cap `messages` count and per-message bytes; consider requiring a session or a
challenge for chat; move rate limiting to a shared store (Upstash/Vercel KV).

---

### M3 — MEDIUM: In-memory rate limiter is ineffective and IP is spoofable

`apps/web/src/lib/rate-limit.ts` uses a per-process `Map`; on Vercel each lambda instance
has its own buckets and cold starts reset them. `clientIp` trusts `x-forwarded-for[0]`
without a trusted-proxy check, so the key is attacker-controlled. Limiting is also applied
to only 9 routes; `/api/orders` POST, `/api/auth/*`, uploads, and most admin routes are
unlimited.

Fix: use a shared limiter keyed on a trusted client IP (Vercel-provided header) and add
limits to auth and order-creation routes.

---

### M4 — MEDIUM: Device limit trivially bypassable

`apps/web/src/lib/auth/devices.ts:45-67` enforces `MAX_DEVICES=2` using a client cookie
(`flybridge_device`). Clearing the cookie (or using a private window) mints a new
`deviceId`, so the limit does not bind. It also only checks on `auth/google`, not on
session reuse.

Fix: bind device identity to a server-side signal that is harder to reset, or treat this
as a soft control and document it as such.

---

### M5 — MEDIUM: Cron auth uses non-constant-time comparison

`apps/web/src/app/api/cron/payments/route.ts:31` and
`apps/web/src/app/api/cron/automations/route.ts:30` compare the provided secret with `!==`.
`CRON_SECRET` is high-entropy, so exploitation is impractical, but align with the
timing-safe comparison already used in `email-tracking.ts:87`
(`crypto.timingSafeEqual`).

---

### M6 — MEDIUM: Admin coupon/price tampering by moderators

Several admin GET routes are gated to `admin || moderator` and expose customer PII
(`/api/orders` GET returns every order with name/email; `/api/admin/users/[id]` returns
contact details). A moderator can read all customer data, and `/api/admin/discounts` is
reachable to the extent its guards allow. Confirm the intended role boundary: if
moderators should not see full PII or change pricing/discounts, tighten those routes to
`admin` and paginate the orders list (it is currently unbounded — `orders/route.ts:33`).

---

### L1 — LOW: No Content-Security-Policy

`apps/web/next.config.js:30-43` sets HSTS, nosniff, X-Frame-Options, Referrer-Policy and
Permissions-Policy, but no CSP. A CSP would materially reduce the impact of H1 and the
dependency XSS advisories. Consider at least a report-only policy initially.

---

### L2 — LOW: Hardcoded EPS sandbox credentials

`apps/web/src/lib/payments/eps.ts:51-57` ships a public sandbox demo username/password/
hashKey/merchantId/storeId. It is scoped to sandbox only (`credential()` never returns it
for production, `:66-73`), so production is not at risk, but committing a credential-like
value invites scanner noise and credential-reuse concerns. Prefer reading from env with no
in-code fallback, or clearly gate it behind a dev flag.

---

### L3 — LOW: Pending-order reuse keeps stale gateway references

Re-initiating payment on an existing pending order overwrites `gatewayRef` without
cancelling the prior gateway session (`orders.ts:444-511`). The prior audit flagged this as
a double-charge risk (#7); it remains. Cancel the previous Stripe session/EPS transaction
when minting a new one.

---

### L4 — LOW: Session snapshot fallback keeps stale role

`apps/web/src/lib/auth/session.ts:146-148` returns the cookie's claims (including `role`)
when the live user lookup throws. A DB error can therefore briefly honor a stale role.
Since `requireAdmin` reads this value, prefer failing closed (return `null`) on snapshot
errors.

---

## Things that were checked and are sound

- **Firebase token verification** (`lib/auth/token.ts`): JWKS, issuer/audience, and
  `email_verified` enforced (`auth/google/route.ts:110-116`).
- **Session cookie**: httpOnly, Secure in prod, SameSite=Lax, HS256 with `AUTH_SECRET`;
  role/subscription re-enriched from Mongo so demotions propagate (`session.ts:130-149`).
- **EPS IPN** (`webhooks/eps/route.ts`, `eps-ipn-crypto.ts`): decrypted payload is only a
  trigger; status/amount are re-verified against EPS `CheckMerchantTransactionStatus`
  before fulfillment; rate-limited.
- **SSRF defenses** (`lib/url-safety.ts`, `lib/ops/crawler.ts`): private/IP checks, DNS
  re-resolution, `redirect: "error"`, no embedded credentials.
- **Email click tracking** (`lib/email-tracking.ts`): HMAC-SHA256 with
  `timingSafeEqual`; `sameSitePath` prevents open redirects; no `//` or backslash tricks.
- **Resource file access** (`resources/[id]/file/route.ts`): public vs session vs
  completed-order gate; signed S3 redirects.
- **Uploads** (`uploads/presign`, `uploads/delete`): admin/moderator only, extension
  allowlist, per-kind size caps, sanitized content type.
- **NoSQL injection / command execution**: no `$where`, `eval`, or `new Function`; no
  `Object.assign(query, body)` patterns; all `child_process`/`Function(` hits were regex
  exec calls.
- **Secrets hygiene**: only `.env.example` (placeholders) is tracked; `.env`/`.env.local`
  are gitignored and untracked.

---

## Remediation priority

| # | Action | Severity |
|---|--------|----------|
| 1 | Upgrade `next` to >= 15.5.24 and `jspdf` to >= 4.2.1; rebuild lockfile; re-audit | CRITICAL |
| 2 | Fix attribute escaping in all markdown `href` sinks; add a sanitizer | HIGH |
| 3 | Enforce `payment_status`/amount checks in Stripe webhook + reconcile | HIGH |
| 4 | Reject zero-amount purchases for paid products (`bdt > 0`) | HIGH |
| 5 | Stop checkout from mutating account email/phone/name | HIGH |
| 6 | Revoke enrollments on refund/cancel; cascade mock-test enrollments | HIGH |
| 7 | Sign the affiliate cookie; validate affiliate on order create | MEDIUM |
| 8 | Cap AI input size; shared rate limiter; add limits to auth/orders | MEDIUM |
| 9 | Timing-safe cron compare; tighten moderator PII/pricing access | MEDIUM |
| 10 | Add CSP; remove hardcoded EPS sandbox creds; cancel stale gateway sessions | LOW |
