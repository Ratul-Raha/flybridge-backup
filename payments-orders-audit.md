# Payments & Orders — Bug / Security Audit

Scope: order creation, fulfillment, Stripe + EPS payment flows, webhooks, reconciliation, admin order management, and the mock-test purchase funnel.
Files reviewed: `src/lib/orders.ts`, `src/lib/payments/*`, `src/app/api/orders/**`, `src/app/api/payments/**`, `src/app/api/webhooks/stripe/**`, `src/components/payment/**`, `src/app/payment/**`, `src/app/api/mock-tests/**`, `src/app/dashboard/mock-tests/**`.

---

## HIGH

### 1. Mock tests are staff-only end-to-end, but mock bundles are sold to regular users
Paid mock-bundle purchases (`orders` supports `itemType: "mock-bundle"`) can never be used by a regular buyer — the entire take-a-test funnel is gated to admin/moderator:

- `/mock-tests/[id]` (public buy page) redirects non-managers to `/` — `src/app/mock-tests/[id]/page.tsx:43`
- `GET /api/mock-tests/bundles/[id]` is manager-only — `src/app/api/mock-tests/bundles/[id]/route.ts:78-80` (the same API the purchase page calls)
- `POST /api/mock-tests/[id]/attempts` is manager-only — `src/app/api/mock-tests/[id]/attempts/route.ts:13`
- `/dashboard/mock-tests` redirects non-staff — `src/app/dashboard/mock-tests/page.tsx:14-16`
- `/dashboard/mock-tests/[testId]/take` redirects non-staff — `src/app/dashboard/mock-tests/[testId]/take/page.tsx:23-26`

Meanwhile `PaymentStatusClient` sends buyers to `/dashboard/mock-tests` after a purchase (`src/components/payment/payment-status-client.tsx:108`).

**Fix:** either expose public read-only bundle/test endpoints + an ownership-guarded attempt endpoints for normal users, or remove the mock-bundle purchase flow until it is implemented. Right now a paying customer is locked out of the product they bought.

### 2. Free-fulfillment price bypass when a BDT price is 0
`createOrder` picks the BDT amount if `prices.BDT >= 0` (`src/lib/orders.ts:197-205`):

```ts
if (typeof bdt === "number" && Number.isFinite(bdt) && bdt >= 0) {
  amount = bdt;
```

If a paid product accidentally has `prices.BDT = 0` (allowed by `sanitizePrices`/`cleanPrices`, both use `>= 0`), or a paid product has a 0 base price but a BDT price set, the amount collapses to `0` and the item is fulfilled for free via `amount === 0` → `fulfillFreeItem` (`src/lib/orders.ts:207-214`). The UI picker hides the BDT option when `BDT > 0` is false, but the API still honors a client-sent `currency: "BDT"` — so a crafted request bypasses payment.

**Fix:** treat a missing/zero BDT price as "not available" (`bdt > 0`) and require `amount > 0` for paid items, never silently falling through to free fulfillment for items whose primary price is > 0.

---

## MEDIUM

### 3. Users can change their account email to any address via the order endpoint — no verification
`POST /api/orders` (`src/app/api/orders/route.ts:98-100`) mutates `user.email` from any request body value (only a DB uniqueness constraint applies):

```ts
if (typeof body.email === "string" && body.email.trim() && body.email.trim() !== user.email) {
  user.email = body.email.trim().toLowerCase();
}
```

Email is the key used for seminar fulfillment/registration (`isAlreadyFulfilled`, `fulfillFreeItem`, `fulfillOrder` all match `SeminarRegistration` on `email`, `src/lib/orders.ts:63-68,120-132,322-334`, with a unique `{seminar, email}` index). An attacker can set their own email to a victim's address, then register for a free seminar, squatting the unique `email` slot so the victim can never register — impersonation/DoS. It also rewrites the account email for all future communication.

**Fix:** do not mutate account identity from the order endpoint; remove the email update (and ideally the name/phone sync too) or require proof of ownership of the new email.

### 4. EPS has no server-side webhook / IPN — paid orders can stay "pending" forever
Stripe has `POST /api/webhooks/stripe` to fulfill orders server-side. EPS has no equivalent (only `reconcileEPSOrder` invoked on demand). Fulfillment for EPS only happens when the buyer returns to `/payment/success` and `reconcileOrder` is called (`src/app/payment/success/page.tsx:23`, `src/app/api/payments/status/route.ts:17`), or while `PaymentStatusClient` polls every 3s (`src/components/payment/payment-status-client.tsx:92-94`). If the buyer closes the tab after EPS redirects back, the order stays `pending` and access is never granted despite the money being charged. There is no scheduled sweep of stale pending EPS orders.

**Fix:** add an IPN/webhook handler for EPS (or a cron that reconciles pending EPS orders against the EPS status API).

### 5. Failed EPS payments are redirected to the success page
`createEPSPayment` sets `failUrl: ${origin}/payment/success?order=${orderId}` (`src/lib/payments/eps.ts:189`). A failed/cancelled EPS payment lands the user on the "success" URL. The success page then shows whatever reconcile returns, so a user who cancelled sees "Payment processing / could not confirm" on a URL literally named `success`. Misleading and error-prone.

**Fix:** point EPS `failUrl`/`cancelUrl` at a distinct failure/retry page showing `failed`.

### 6. Admin status changes don't revoke or restore access
`PATCH /api/orders/[id]` (`src/app/api/orders/[id]/route.ts:36-41`): `completed` → `fulfillOrder` (grants enrollment), but `cancelled`/`refunded`/`failed` only change the order status. A refunded/cancelled course order leaves the user with an active `CourseEnrollment` (enrollment access is not checked against order status for courses), so refunded users keep their course access. Resource downloads do check `status: "completed"` (`src/app/api/resources/[id]/file/route.ts:56-64`), so behavior is inconsistent.
Also `DELETE /api/orders/[id]` only cascades `CourseEnrollment` and `SeminarRegistration` (`src/app/api/orders/[id]/route.ts:76-91`) — it never cleans up `MockTestEnrollment`.

**Fix:** on non-completed status transitions, revoke the corresponding enrollments/registrations; include mock-test enrollments in the delete cascade (and make course/mock access check the owning order's status).

### 7. Re-submitted pending order reuses a stale gateway while price/currency get mutated
`createOrder` mutates an existing pending order's `total`, `currency`, item price (/title) (`src/lib/orders.ts:227-233`) but leaves the old `gateway`/`gatewayRef`/`merchantTransactionId` in place; the POST handler then creates a fresh checkout session and overwrites `gatewayRef`. The previously issued Stripe/EPS session is never cancelled. If the user opens the old session link again (e.g., from an abandoned email/redirect) and pays, they are charged twice for the same item — the second order isn't issued, and nothing reconciles/refunds the orphaned session.

**Fix:** cancel/expire the prior gateway session before issuing a new one, or key duplicate detection per gateway reference so a paid orphaned session is reconciled.

### 8. Client polls forever when payment status stays unresolved
`PaymentStatusClient` starts an interval when `initialKind === "pending"` and only stops on `completed`/`failed` (`src/components/payment/payment-status-client.tsx:89-100`). If EPS verification returns an unknown/processing status indefinitely (or Stripe retrieve fails), the page spins "Payment processing" and keeps polling with no timeout or error surface. Combined with #4 this can run forever.

**Fix:** cap retries and drop to the `unknown` state with a manual "check again" + support link.

---

## LOW

### 9. Invalid `itemId` returns 500 instead of 400
`POST /api/orders` accepts any `itemId` string; `resolveProduct` → `Course.findOne({_id: itemId})` throws a Mongoose `CastError` for non-ObjectId values, which the catch block (`src/app/api/orders/route.ts:192-199`) doesn't normalize → 500 "Something went wrong" with the raw E11000/CastError surfaced in logs.

**Fix:** validate ObjectId shape (24-hex) up front and return 400.

### 10. Managing products already have a price consistency gap for seminars/resources
`resolveProduct` gates courses and mock bundles on `published: true` but not seminars/resources (`src/lib/products.ts:43-71`); a draft/hidden seminar or resource is still purchasable if its ID is known. Check whether the models/staff UI intend these to be buyable pre-publication.

### 11. Hardcoded EPS sandbox credentials shipped in source, and real creds can hit sandbox endpoints
`SANDBOX_CREDENTIALS` are committed (`src/lib/payments/eps.ts:51-57`). Worse, env vars take precedence over sandbox creds but `environment` is derived only from `EPS_ENV`; if `EPS_ENV` is unset in production, real `EPS_USERNAME/PASSWORD/...` will be sent to the sandbox endpoints (`src/lib/payments/eps.ts:59-71`). Misconfigured deployments leak real credentials to EPS sandbox infrastructure and silently fail.

**Fix:** derive environment from the presence of production credentials or an explicit flag; never merge prod credentials with sandbox endpoints; keep sandbox creds out of the repo.

### 12. No pagination on the admin orders listing
`GET /api/orders` returns every order sorted by `createdAt` with no pagination (`src/app/api/orders/route.ts:38-64`); the client then does client-side pagination. At scale this is a memory/perf problem and exposes all customer PII (`userEmail`, `gatewayRef`, `merchantTransactionId`) to moderators as well as admins.

**Fix:** paginate server-side and consider whether moderators need gateway references.

---

## Not flagged (checked, OK)
- Stripe webhook signature verification is correctly implemented (`constructEventAsync`, `src/app/api/webhooks/stripe/route.ts:23`).
- Prices always come from the server; the client cannot set an order amount.
- `fulfillOrder` is idempotent (guarded by `status === "pending"` + upserts + unique indexes).
- Free courses/seminars cannot bypass enrollment via `createOrder` because duplicate checks use `findOne`/unique indexes (seminar edge cases covered in #3).