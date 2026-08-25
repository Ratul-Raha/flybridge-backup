# FlyBridge Order Flow & Payment System

## Overview

FlyBridge uses **Stripe Checkout** (hosted, one-time payments) as its sole payment processor. The system supports three purchasable item types: **courses**, **seminars**, and **resources**. Free items bypass Stripe entirely and are fulfilled immediately. A dual-confirmation design ensures reliability: Stripe webhooks are the primary fulfillment path, with a synchronous reconciliation fallback at `/payment/success`.

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

1. **Webhook (primary):** Stripe sends `checkout.session.completed` → `/api/webhooks/stripe` → `fulfillOrder()`
2. **Reconciliation (fallback):** `/payment/success` page + `/api/payments/status` poll Stripe session directly via `reconcileOrder()`

### Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Find order by `metadata.orderId` or `client_reference_id`, call `fulfillOrder()` if pending |
| `checkout.session.expired` | Mark order as `failed` if pending |
| `payment_intent.payment_failed` | Mark order as `failed` if pending |

### Environment Variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe secret key (`sk_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side key (not currently used) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) |

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
| `apps/web/src/lib/models/order.ts` | Order Mongoose schema and model |
| `apps/web/src/lib/orders.ts` | Order creation, free item fulfillment, paid order fulfillment |
| `apps/web/src/lib/payments/stripe.ts` | Stripe client, checkout session creation, reconciliation |
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
| `apps/web/src/app/payment/success/page.tsx` | Post-payment success/pending/failure page |
| `apps/web/src/components/programs/checkout-form.tsx` | Course checkout form (contact info + submit) |
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

1. **Paid seminars** — blocked at the API level with "Payment for this seminar is coming soon"
2. **Refunds/cancellations** — no code implementation, only UI display
3. **Resource fulfillment** — just validates existence, no access model
4. **Invoices/receipts** — no formal generation beyond the confirmation email
