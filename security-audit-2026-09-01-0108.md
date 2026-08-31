# Security Audit — Order Flow & Payment

**Date:** 2026-09-01 01:08 (UTC, generated)
**Scope:** Commerce / order / payment flow in `apps/web`
**Primary focus:** Order creation, Stripe Checkout, webhook handling, fulfillment (access grant), admin order management.

---

## 1. Executive Summary

The payment architecture is fundamentally sound:

- **Auth is consistently enforced** on all user/admin order & payment endpoints (HTTP‑only JWT session cookie via `readSession`).
- **No client-supplied pricing** — the amount, currency and total are always resolved server‑side from the database (`resolveProduct` → `createOrder` → Stripe `unit_amount`). The client cannot tamper with the price.
- **Stripe webhook verifies signatures correctly** using the raw request body and `STRIPE_WEBHOOK_SECRET`, and the reconcile path checks `payment_status` before granting access.
- Access is granted **only** through `fulfillOrder()` / `fulfillFreeItem()` — the single execution path to create course enrollments and seminar registrations.

However, the audit found a **high‑severity access‑control gap (resource/file downloads)** and several **medium/low** hardening issues described below.

---

## 2. Attack Surface Map

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/orders` | POST | Session (user) | Create order + Stripe checkout session |
| `/api/orders` | GET | Session (admin/moderator) | List all orders |
| `/api/orders/[id]` | PATCH | Session (admin) | Force order status |
| `/api/orders/[id]` | DELETE | Session (admin) | Delete order + revoke access |
| `/api/payments/status` | GET | Session (user) | Reconcile order status from Stripe |
| `/api/webhooks/stripe` | POST | None (Stripe signature) | Payment/webhook fulfillment |
| `/api/seminars/[id]/register` | POST | None (idToken or open) | Register (free) seminar |
| `/api/resources/[id]/file` | GET | **None** | **Serve resource files** |
| `/api/courses/[id]/quiz/submit`, `/progress`, `/me/courses` | … | Session + enrollment | Learn/access gating |

---

## 3. Findings

### 🔴 HIGH — F1: Resource files are served without access control

**Files:** `apps/web/src/app/api/resources/[id]/file/route.ts`, `apps/web/src/components/resources/resource-detail.tsx`

The UI correctly gates members‑only and paid resources behind login/purchase, but the **file‑serving endpoint performs no access check at all**:

```ts
// apps/web/src/app/api/resources/[id]/file/route.ts:50-55
const session = await readSession();
if (session) {
  ResourceDownload.create({ user: session.userId, resource: resource._id }) // tracking only
}
const upstream = await fetch(resource.fileUrl, { cache: "no-store" });
return new Response(upstream.body, { status: 200, headers });
```

- Any unauthenticated caller can request `/api/resources/<id>/file` and download the underlying file, even for `access: "members"` or paid (`price > 0`) resources.
- `fulfillOrder`’s `resource` branch (`lib/orders.ts:262-265`) only looks up the resource — it **stores no entitlement record** for paid resources, so there is nothing to check against at download time.
- Additionally, for `image` / `video` / `link` file types, `downloadHref` returns the **raw `fileUrl`** directly (`resource-detail.tsx:16-21`), bypassing even the file route — any user who knows/guesses the direct Cloudinary URL gets the file.

**Impact:** Paywalled / members‑only content is downloadable by anyone (guest). Broken monetization + data exposure.

**Recommendation:**
1. Enforce access in the file route: require a session for `access !== "public"`, and for paid resources require an owned, `completed` order (or an explicit entitlement) before streaming.
2. Prefer serving through the authenticated route for all types (or add signed/time‑limited URLs) so the gate can’t be bypassed via the raw `fileUrl`.
3. Do not expose `fileUrl` to the public API when the resource is not public.

---

### 🟠 MEDIUM — F2: Webhook fulfills without verifying the charged amount

**File:** `apps/web/src/app/api/webhooks/stripe/route.ts:35-45`

The `checkout.session.completed` handler correlates the order via `session.metadata?.orderId ?? client_reference_id`, then calls `fulfillOrder` if `status === "pending"`. It **never verifies** that `session.amount_total` equals the order’s expected `total`, and does not re‑check `payment_status`.

Signature verification (performed correctly) means the event genuinely originates from Stripe, and the amount is set server‑side, so today this is defense‑in‑depth rather than an exploitable bug. But it is the single most sensitive spot — if an order `total` ever drifts (e.g., stale order, currency rounding, a future client‑controlled amount), access would be granted for the wrong amount.

**Recommendation:** In the `checkout.session.completed` handler, after loading `fresh`, verify:
```ts
const expected = Math.round((fresh.total ?? 0) * 100);
const paid = session.amount_total ?? 0;
if (paid !== expected || session.payment_status !== "paid") {
  // log + mark `failed`/flag; do NOT fulfill
}
```
Apply the same amount check in `reconcileOrder` (`lib/payments/stripe.ts:113-131`).

---

### 🟠 MEDIUM — F3: `/api/seminars/[id]/register` is open & can create users / mutate profile

**File:** `apps/web/src/app/api/seminars/[id]/register/route.ts`

- No session is required. When no `idToken` is supplied, it accepts an arbitrary `email`/`name`/`phone` (lines 82-104) and **creates or updates a `User` record keyed by that email** (`user.phone = phone`, `user.name = name`).
- When an `idToken` is supplied, a user is created from verified Firebase claims (correct), but otherwise the endpoint effectively lets anyone mint accounts and overwrite the name/phone of an existing user without any verification.

**Impact:** Account‑takeover‑adjacent: an attacker could overwrite a target’s `phone`/`name` on their user document, and could mass‑create users/registrations (spam). Seminar registrations are keyed by email, so this also lets an attacker register on behalf of others.

**Recommendation:** Require authentication (session or verified `idToken`) for paid/members flows; stop mutating user profile fields from unauthenticated registrations; and rate‑limit this endpoint. Consider whether guest free‑seminar registration is intentionally open, and scope the user mutations accordingly.

---

### 🟡 LOW — F4: Admin status PATCH does not create enrollments (inconsistency)

**File:** `apps/web/src/app/api/orders/[id]/route.ts:29-39`

An admin can set any order to `completed`, but this **does not** call `fulfillOrder`, so no course enrollment / seminar registration is created. Conversely, admin `DELETE` (lines 46-96) **revokes** access for all items (including legitimately paid, fulfilled orders).

**Impact:** Operational integrity — an admin "completing" an order won’t grant access; an admin deleting an order silently revokes paid access. Not directly exploitable by non‑admins, but easy to misuse and confusing vs. the `fulfillOrder`‑based path.

**Recommendation:** Route admin state changes through the same fulfillment/revocation logic (call `fulfillOrder` when moving to `completed`; tie revocation to a refund/confirmed state). Add an audit log entry for manual status changes.

---

### 🟡 LOW — F5: Duplicate/pending order handling and default fulfillment guard

**Files:** `lib/orders.ts:166-212`, `lib/payments/stripe.ts:128-139`

- `createOrder` returns an existing `pending` order as a "duplicate" and reuses it; pending orders are updated in place if the price changes (`orders.ts:172-182`). This is reasonable, but combined with F2 there is no amount reconciliation before fulfillment.
- Both fulfillment paths guard double‑granting only via `status === "pending"`. If a `pending` order is ever moved to `completed` by the admin PATCH (F4) *before* the webhook fires, the webhook/reconcile will skip fulfillment and the user never gets an enrollment (compounding F4).

---

### 🟡 LOW — F6: No security headers / rate limiting configured

**File:** `apps/web/next.config.js`

There is no `headers()` config (CSP, HSTS, X‑Content‑Type‑Options, Referrer‑Policy, etc.), and no rate limiting on order/payment/registration endpoints.

**Impact:** Payment/order endpoints (and the open seminar register) are exposed to brute‑force / abuse / spam; missing security headers weaken browser‑side defenses (XSS mitigation, clickjacking).

**Recommendation:** Add security headers via `next.config.js` and rate‑limit `/api/orders` and `/api/seminars/*/register`.

---

### 🟢 LOW — F7: Email/phone fields in order POST are not ownership-verified

**File:** `apps/web/src/app/api/orders/route.ts:78-87`

The order POST accepts client‑supplied `name`, `email`, and `phone` and writes them to the user’s own document (no verification that the email is the caller’s, besides it being their own account). This is limited to the caller’s own session/user and only updates their own profile — so impact is low — but note that changing the stored `email` affects seminar entitlement lookups (keyed by email) and Stripe `customer_email`.

---

## 4. What Is Done Well

- **Server‑sourced pricing** — client cannot influence `total`/`unit_amount` (`lib/products.ts`, `lib/orders.ts:197-202`, `lib/payments/stripe.ts:51`). ✅
- **Webhook signature verification** — raw body + `STRIPE_WEBHOOK_SECRET` + `constructEventAsync` (`api/webhooks/stripe/route.ts:15-31`). ✅
- **Ownership check on reconcile** — `/api/payments/status` rejects orders the user doesn’t own (`lib/payments/stripe.ts:88-90`). ✅
- **Reconcile checks `payment_status`** before fulfilling (`lib/payments/stripe.ts:113-131`). ✅
- **Centralized fulfillment** — access is granted only via `fulfillOrder`/`fulfillFreeItem`. ✅
- **Input whitelisting** — `itemType`/`status` are validated against enums. ✅
- **Credential hygiene** — `.env.local` (incl. real Stripe keys) is gitignored; only `.env.example` is tracked. ✅

---

## 5. Priority Remediation Checklist

| Sev | Ref | Action |
|---|---|---|
| 🔴 High | F1 | Enforce access control on `/api/resources/[id]/file`; gate paid/members resources server‑side; stop exposing raw `fileUrl`. |
| 🟠 Med | F2 | Verify `session.amount_total` === `order.total*100` and `payment_status === "paid"` before fulfilling (webhook + reconcile). |
| 🟠 Med | F3 | Require auth/verified token for seminar register; stop mutating profiles from guest input; add rate limiting. |
| 🟡 Low | F4 | Route admin status changes through fulfillment/revocation; audit‑log manual changes. |
| 🟡 Low | F5 | Reconcile duplicate/pending orders against Stripe before fulfill; keep fulfillment guard consistent. |
| 🟡 Low | F6 | Add security headers + rate limiting to order/payment/register endpoints. |
| 🟢 Low | F7 | Scope profile edits on order POST to verified data; consider removing email/phone from the order body. |

---

---

## 6. Resolution Log

Fixed (2026‑09‑01):

- **F1 (partial)** — Added server‑side access enforcement to `/api/resources/[id]/file/route.ts`: non‑`public` resources now require a session, and paid (`price > 0`) resources require a `completed` order owned by the user (else 403). *Note:* the raw `fileUrl` exposure for `image`/`video`/`link` types (client bypasses the route) and stopping `fileUrl` from leaking in the API are larger refactors and are **not** changed here.
- **F4** — Admin `PATCH → completed` now calls `fulfillOrder(...)` so a manually‑completed order actually grants the enrollment/registration (previously it only flipped status and never granted access).
- **F6** — Added safe non‑CSP security headers in `next.config.js`: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. A full CSP was deliberately omitted (inline styles/scripts + GA/Cloudinary would break; requires careful audit).

Not changed (deliberately, as larger/riskier edits):

- **F2** (webhook amount cross‑check) — medium; requires careful changes to the sensitive fulfillment path.
- **F3** (open seminar register endpoint) — medium; behavioral change to guest registration.
- **F5** — advisory, overlaps with F2.
- **F7** — user edits only their own profile (low impact); leaving as designed to avoid breaking checkout.

*Audit reflects code as of 2026‑09‑01. Re‑validate webhook amount check (F2) and the raw resource `fileUrl` exposure (F1‑remainder) in a future pass.*
