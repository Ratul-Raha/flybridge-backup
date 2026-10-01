# FlyBridge Order Flow & Payment System

## Overview

FlyBridge uses **Stripe Checkout** (hosted, one-time payments) for USD orders and the **EPS (Easy Payment System)** gateway for BDT orders. The system supports three purchasable item types: **courses**, **seminars**, and **resources**. Free items bypass both gateways entirely and are fulfilled immediately. A reconciliation design ensures reliability: Stripe webhooks are the primary fulfillment path for Stripe orders, with a synchronous reconciliation fallback at `/payment/success` (used by both gateways).

---

## Order Flow (End-to-End)

```
User clicks Buy/Enroll
        │
        ▼
┌─────────────────────────────┐
│  POST /api/orders           │  (or /api/seminars/:id/register)
│  Validates item + user      │
│  Calls createOrder()        │
└─────────────┬───────────────┘
              │
     ┌────────┴────────┐
     │  Price === 0?   │
     └────────┬────────┘
        Yes   │   No
        │     │
        ▼     ▼
 ┌──────────┐  ┌──────────────────────┐
 │ Free     │  │ Create Order doc     │
 │ fulfill  │  │ status = "pending"   │
 │ instantly│  │ Emit "order.created" │
 │ (noOrder)│  └──────────┬───────────┘
 └──────────┘             │
                          ▼
              ┌───────────────────────┐
              │ Stripe Checkout       │
              │ Session created       │
              │ gateway = "stripe"    │
              │ gatewayRef = sessionId│
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ User redirected to    │
              │ Stripe-hosted payment │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │  Payment confirmed?   │
              └───────────┬───────────┘
             Yes          │         No/Expired
              │           │            │
              ▼           │            ▼
    ┌──────────────┐      │    ┌──────────────┐
    │ Webhook:     │      │    │ status =     │
    │ session.     │      │    │ "failed"     │
    │ completed    │      │    └──────────────┘
    └──────┬───────┘      │
           │              │
           ▼              │
    ┌──────────────┐      │
    │fulfillOrder()│      │
    │──────────────│      │
    │Course →      │      │
    │  Enrollment  │      │
    │Seminar →     │      │
    │  Registration│      │
    │Resource →    │      │
    │  validated   │      │
    │──────────────│      │
    │status =      │      │
    │ "completed"  │      │
    │──────────────│      │
    │Emit          │      │
    │"order.       │      │
    │ fulfilled"   │      │
    └──────┬───────┘      │
           │              │
           ▼              │
    ┌──────────────┐      │
    │ Automation   │      │
    │ engine sends │      │
    │ confirmation │      │
    │ email        │      │
    └──────────────┘      │
```

---

## Order Statuses

| Status | Meaning |
|---|---|
| `pending` | Order created, awaiting payment |
| `completed` | Paid and fulfilled (enrollment/registration granted) |
| `failed` | Payment expired or failed |
| `cancelled` | Defined but no code path sets this |
| `refunded` | Defined but no code path sets this (manual only) |

### Status Transitions

| From | To | Trigger |
|---|---|---|
| *(new)* | `pending` | `createOrder()` creates a new Order |
| `pending` | `completed` | `fulfillOrder()` — after payment confirmed or free item |
| `pending` | `failed` | Stripe webhook (`checkout.session.expired` or `payment_intent.payment_failed`) or `reconcileOrder()` |

---

## Payment System

### Stripe Integration

- **Mode:** One-time `payment` (not subscriptions)
- **SDK:** `stripe@^22.5.0`
- **Currency:** Defaults to `"USD"` in code (BDT noted in docs)
- **Checkout Session:** Created server-side, user redirected to Stripe-hosted page

### Payment Confirmation (Dual Mechanism)

1. **Webhook (primary, Stripe only):** Stripe sends `checkout.session.completed` → `/api/webhooks/stripe` → `fulfillOrder()`
2. **Reconciliation (fallback):** `/payment/success` (and `/payment/failed`) + `/api/payments/status` poll the order's gateway directly via `reconcileOrder()` (Stripe session for `stripe`, EPS transaction status for `eps`)

### Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Find order by `metadata.orderId` or `client_reference_id`, call `fulfillOrder()` if pending |
| `checkout.session.expired` | Mark order as `failed` if pending |
| `payment_intent.payment_failed` | Mark order as `failed` if pending |

### EPS Integration (BDT)

- **Mode:** One-time payment, hosted redirect (`RedirectURL`)
- **SDK:** plain `fetch` + Node `crypto` (HMAC-SHA512 signing), see `apps/web/src/lib/payments/eps.ts`
- **Auth:** `POST /v1/Auth/GetToken` with `x-hash: HMACSHA512(username, hashKey)`; JWT cached in memory
- **Initialize:** `POST /v1/EPSEngine/InitializeEPS` with `x-hash: HMACSHA512(merchantTransactionId, hashKey)` + `Authorization: Bearer <token>`
- **Verify:** `GET /v1/EPSEngine/CheckMerchantTransactionStatus` (by `merchantTransactionId` or `EPSTransactionId`)
- **Callbacks:** the buyer's browser returns to `successUrl`/`failUrl`/`cancelUrl` carrying `order` + `merchantTransactionId`; the pages re-verify with `CheckMerchantTransactionStatus` before anything is fulfilled, and the query string is never trusted on its own. An EPS **IPN** is also supported at `POST /api/webhooks/eps` (AES-256-CBC, key from the merchant panel) and is treated the same way — a trigger that only identifies the order, never evidence. If webhooks are not configured the browser return and the sweep still cover every order.
- **Callback routes:** success → `/payment/success`, fail → `/payment/failed` (its own page, so a decline doesn't render the "confirming your payment" copy), cancel → the product's checkout page.
- **Amount check:** a `Success` status is not enough to fulfil — the collected `TotalAmount` must match the order total, otherwise the order stays `pending` for a human to refund or re-verify.
- **Sweep:** `/api/cron/payments` (every 5 min, `vercel.json`) reconciles pending orders older than 15 min, which is what covers a buyer who closes the tab or loses connection on the way back.

### Environment Variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | **Live** Stripe secret key (`sk_live_…`), used when Stripe mode is `live` |
| `STRIPE_TEST_SECRET_KEY` | Optional test key (`sk_test_…`), used when Stripe mode is `test`; falls back to `STRIPE_SECRET_KEY` |
| `STRIPE_MODE` | `test` (default) or `live` — seed value for Stripe mode |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side key (not currently used) |
| `STRIPE_WEBHOOK_SECRET` | **Live** webhook signing secret (`whsec_…`) |
| `STRIPE_WEBHOOK_SECRET_TEST` | Optional test webhook secret; the webhook route tries every configured one |
| `EPS_PRODUCTION_USERNAME` / `_PASSWORD` / `_HASH_KEY` / `_MERCHANT_ID` / `_STORE_ID` | Live EPS merchant credentials. Generic `EPS_USERNAME` etc. are accepted as aliases for these |
| `EPS_SANDBOX_USERNAME` / `_PASSWORD` / `_HASH_KEY` / `_MERCHANT_ID` / `_STORE_ID` | Optional sandbox overrides; when unset the public EPS sandbox demo account is used. Sandbox never reads the production credentials |
| `EPS_ENV` | `sandbox` (default) or `production` — seed value for EPS mode |
| `EPS_PRODUCTION_IPN_SECRET` / `EPS_SANDBOX_IPN_SECRET` | Per-environment IPN decryption key. The one for the active mode is tried first; the other is kept as a fallback because the mode is not carried on the wire |
| `EPS_IPN_SECRET` | Single-environment IPN key fallback |

Both modes above are only **seed values**. The `gateways` document in Mongo
(`PaymentSettings`) overrides them once an admin saves on the Payment Settings
page, and `Order.gatewayMode` snapshots the mode onto each order so later
reconciliation and refunds use the environment the order was started in.

---

## Fulfillment Details

| Item Type | What `fulfillOrder()` Does |
|---|---|
| **Course** | Upserts `CourseEnrollment` (linked to order), emits `course.enrolled` |
| **Seminar** | Upserts `SeminarRegistration`, emits `seminar.registration_created` |
| **Resource** | Validates resource exists (no enrollment model yet) |

Free items (`price === 0`) are fulfilled immediately via `fulfillFreeItem()` — no Order document is created, no Stripe interaction occurs.

---

## Duplicate Prevention

- `isAlreadyFulfilled()` checks for existing enrollment/registration before creating duplicate orders
- If a pending/completed order already exists for the same user+item, it's returned instead of creating a new one
- Pending orders get their price updated if the product price changed

---

## Events & Automation

### Events Emitted

| Event | When | Payload |
|---|---|---|
| `order.created` | New paid order created | `{ order: { id, total, currency, status, items }, user }` |
| `order.fulfilled` | Order paid and access granted | `{ order: { id, total, currency, status, items }, user, course? }` |

- Both events have **no synchronous handlers** — they are consumed only by the **automation engine**
- The automation engine can trigger actions like sending the "order-fulfilled" confirmation email

### Confirmation Email

Generated by `apps/web/src/lib/automation/email-templates.ts` (lines 286-379). Contains:
- Order ID (last 8 chars)
- Date
- Itemized list with title, type badge, and price
- Total paid (or "Free" for zero-cost items)
- CTA button ("Start learning" or "Go to dashboard")

---

## Key Files

### Core Payment Files

| File | Purpose |
|---|---|
| `apps/web/src/lib/models/order.ts` | Order Mongoose schema and model (gateway, gatewayRef, merchantTransactionId) |
| `apps/web/src/lib/orders.ts` | Order creation (currency-aware: USD/BDT), free item fulfillment, paid order fulfillment |
| `apps/web/src/lib/payments/stripe.ts` | Stripe client, checkout session creation, Stripe reconciliation |
| `apps/web/src/lib/payments/eps.ts` | EPS client, payment initialization, transaction verification, EPS reconciliation |
| `apps/web/src/lib/payments/reconcile.ts` | Gateway-aware `reconcileOrder()` dispatcher (stripe vs eps) |
| `apps/web/src/lib/payments/types.ts` | Shared gateway types (ReconcileResult) |
| `apps/web/src/lib/pricing.ts` | Multi-currency (USD/BDT) price helpers |
| `apps/web/src/lib/products.ts` | Product resolution from DB for any item type |
| `apps/web/src/lib/models/enrollment.ts` | Course enrollment schema (fulfillment target) |

### API Routes

| File | Purpose |
|---|---|
| `apps/web/src/app/api/orders/route.ts` | GET (admin list), POST (create order + checkout) |
| `apps/web/src/app/api/payments/status/route.ts` | GET (reconcile order status) |
| `apps/web/src/app/api/webhooks/stripe/route.ts` | POST (Stripe webhook handler) |
| `apps/web/src/app/api/seminars/[id]/register/route.ts` | POST (seminar registration, calls createOrder) |
| `apps/web/src/app/api/admin/orders-stats/route.ts` | GET (admin order statistics) |

### Frontend / UI

| File | Purpose |
|---|---|
| `apps/web/src/app/payment/success/page.tsx` | Post-payment success/pending/failure page (EPS `successUrl`) |
| `apps/web/src/app/payment/failed/page.tsx` | EPS `failUrl` landing page — falls back to "failed" when the gateway can't be reached |
| `apps/web/src/lib/payments/outcome.ts` | Resolves a callback's query params to an order id, then to a verified status |
| `apps/web/src/lib/payments/sweep.ts` | Cron sweep reconciling stale pending orders with their gateway |
| `apps/web/src/components/payment/payment-status-client.tsx` | Post-payment status UI (polls `/api/payments/status`) |
| `apps/web/src/components/payment/payment-method-picker.tsx` | USD (Stripe) / BDT (EPS) payment method selector |
| `apps/web/src/components/programs/checkout-form.tsx` | Course checkout form (contact info + payment method + submit) |
| `apps/web/src/components/programs/course-enroll-button.tsx` | Enroll/buy button for courses |
| `apps/web/src/components/resources/resource-detail.tsx` | Resource detail with buy/download logic |
| `apps/web/src/components/dashboard/order-manage.tsx` | Admin order management dashboard |
| `apps/web/src/components/dashboard/reports/order-overview.tsx` | Admin order overview dashboard widget |

### Data Models

| File | Purpose |
|---|---|
| `apps/web/src/lib/models/course.ts` | Course schema (price, currency fields) |
| `apps/web/src/lib/models/seminar.ts` | Seminar schema (type free/paid, price) |
| `apps/web/src/lib/models/resource.ts` | Resource schema (access, price) |
| `apps/web/src/lib/models/user.ts` | User schema (subscription field) |

### Events System

| File | Purpose |
|---|---|
| `apps/web/src/lib/events/types.ts` | Event names and payload types |
| `apps/web/src/lib/events/catalog.ts` | Event catalog with labels, descriptions |
| `apps/web/src/lib/automation/email-templates.ts` | Order confirmation email template |

---

## Notable Gaps

1. **EPS webhook/IPN** — not applicable, not a gap. EPS has no signed server callback; its documented integration is the three return URLs, which are implemented and verified server-side, with a 5-minute sweep as the backstop for abandoned checkouts.
2. **Refunds/cancellations** — no code implementation, only UI display
3. **Resource fulfillment** — just validates existence, no access model
4. **Invoices/receipts** — no formal generation beyond the confirmation email
