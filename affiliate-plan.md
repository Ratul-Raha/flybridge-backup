# FlyBridge Affiliate Program — Plan

Affiliate links for hand-picked partners. Each affiliate gets a short link
(`flybridge.com/r/CODE`). Clicks are tracked in a first-party cookie; when a
referred visitor buys, a commission is recorded against the order and later paid
out manually.

---

## Decisions (locked)

| Question | Decision |
| --- | --- |
| Who becomes an affiliate | **Admin-created only** — staff creates the account + code |
| Commission | **Percentage of the net order total** (after discounts), configurable per affiliate |
| Payout | **Manual** — admin sends money (bKash/bank/other) and marks the ledger paid. No automated transfer |
| Attribution | **Last-click, 90-day** cookie window |
| Link style | **Short redirect `/r/CODE`** (cloaked, tracked server-side) |
| Affiliate visibility | **Own dashboard** showing sales, clicks, earnings, payouts |

---

## End-to-end flow

```
Admin creates affiliate
        │
        ▼
Affiliate shares flybridge.com/r/CODE
        │
        ▼
┌───────────────────────────┐
│ GET /r/[code]             │  log AffiliateClick
│ - set cookie (90d)        │  flybridge_affiliate={affiliateId,code,clickId,ts}
│ - 302 to destination      │
└─────────────┬─────────────┘
              │
              ▼
Visitor browses → adds to cart → checkout
              │
              ▼
┌───────────────────────────┐
│ POST /api/orders          │  affiliateFromRequest() reads cookie
│ stamp Order.affiliate     │  { affiliateId, code, clickId }
└─────────────┬─────────────┘
              │  (order paid)
              ▼
┌───────────────────────────┐
│ order.fulfilled event     │
│ → recordAffiliateConversion│
│ creates AffiliateConversion│
│ status = pending          │
└─────────────┬─────────────┘
              │  (after hold window, no refund)
              ▼
        status = approved  ──► admin creates AffiliatePayout ──► status = paid
              │
        (refund processed)
              ▼
        status = reversed
```

---

## Data models (`apps/web/src/lib/models/`)

New collections, written in the existing `coupon.ts` / `order.ts` style
(`InferSchemaType`, `mongoose.models.X ?? mongoose.model(...)`).

### `affiliate.ts`
| Field | Notes |
| --- | --- |
| `user` | ObjectId ref User (sparse — an affiliate may be external, no account) |
| `name`, `email`, `phone` | Contact / payout identity |
| `code` | Unique, uppercase, e.g. `RAHIM10` — the link slug |
| `status` | `active` \| `suspended` |
| `commissionPercent` | Number, per-affiliate override |
| `currency` | `BDT` \| `USD` (payout currency) |
| `payoutMethod` | `bKash` \| `bank` \| `other` |
| `payoutDetails` | Account number / bank fields (encoder-friendly, no secrets) |
| `notes` | Admin notes |
| `createdBy`, `suspendedAt` | Audit |
| timestamps | |

Balances are **not** stored here — they are derived from the conversion ledger by
aggregation, so they can never drift from the source of truth.

### `affiliate-click.ts`
| Field | Notes |
| --- | --- |
| `affiliate` | ObjectId ref Affiliate, indexed |
| `clickId` | Unique (also the cookie value) |
| `code` | Link code as clicked |
| `ip`, `userAgent`, `referrer` | Request context |
| `landingPage`, `destination` | Where they landed / where we sent them |
| `utm` | source/medium/campaign snapshot |
| `createdAt` | Indexed, TTL-optional for cleanup |

### `affiliate-conversion.ts` — the ledger
| Field | Notes |
| --- | --- |
| `affiliate` | ObjectId ref Affiliate, indexed |
| `order` | ObjectId ref Order, **unique index** (idempotency) |
| `user` | ObjectId ref User |
| `itemType`, `itemId`, `itemTitle` | Denormalised for reporting |
| `orderTotal` | Net paid amount |
| `currency` | From the order |
| `commissionPercent` | Snapshot at time of sale (rate changes don't rewrite history) |
| `commissionAmount` | `round(orderTotal * percent / 100)` |
| `status` | `pending` \| `approved` \| `paid` \| `reversed` |
| `availableAt` | When a pending conversion becomes payable |
| `clickId` | Attribution trail |
| `payout` | ObjectId ref AffiliatePayout, null until paid |
| `reversedAt`, `reversedReason` | Refund audit |
| timestamps | |

Indexes: `{ affiliate: 1, status: 1, createdAt: -1 }`,
`{ currency: 1, status: 1, availableAt: 1 }`, unique `{ order: 1 }`.

### `affiliate-payout.ts`
| Field | Notes |
| --- | --- |
| `affiliate` | ObjectId ref Affiliate, indexed |
| `amount`, `currency` | Sum of the included conversions |
| `method`, `reference` | Manual transfer reference (bKash trx id / bank ref) |
| `conversions` | ObjectId[] included in this payout |
| `status` | `pending` \| `paid` \| `failed` |
| `processedBy`, `paidAt`, `notes` | Audit |
| timestamps | |

### Change to `order.ts`
Add a subdoc (parallel to `attribution`):

```ts
affiliate: {
  affiliateId: { type: Schema.Types.ObjectId, ref: "Affiliate", index: true },
  code: { type: String, trim: true, uppercase: true },
  clickId: { type: String, trim: true },
  /** Snapshot of the percent applied when the order was created. */
  commissionPercent: { type: Number, min: 0, default: null },
}
```

`Order` already gets one `order.fulfilled` emit per completed order (guarded by
the `status === "completed"` early return in `fulfillOrder`), and the unique
index on `AffiliateConversion.order` makes the handler idempotent regardless.

---

## Library (`apps/web/src/lib/`)

### `affiliate.ts`
- `generateAffiliateCode(name, email)` — slug + uniqueness check.
- `affiliateLink(origin, code)` — `{origin}/r/{code}`.
- `AFFILIATE_COOKIE`, `AFFILIATE_COOKIE_MAX_AGE_SECONDS = 90 days` and
  `parseAffiliateCookie()` / serialise helpers, mirroring `marketing-attribution.ts`.

### `affiliate-attribution.ts`
Mirrors `order-attribution.ts`. `affiliateFromRequest(request)` reads the
`flybridge_affiliate` cookie (last-click: refresh on every `/r/` hit) and returns
`{ affiliateId, code, clickId } | null`. Used by `POST /api/orders`.

### `affiliate-commission.ts`
- `resolveCommission(order, affiliate)` → amount + percent, or `null` when:
  - total is `0` (free item),
  - the buyer is the affiliate (self-referral),
  - the affiliate is not `active`.
- `recordAffiliateConversion(order)` — loads `order.affiliate`, resolves, upserts
  the conversion (`$setOnInsert`, unique on `order`), sets `availableAt`
  (`completedAt` + hold window).
- `reverseAffiliateConversion(orderId, reason)` — flips a live conversion to
  `reversed` (skips already-`paid` ones, which need a manual claw-back).
- `approveDueConversions()` — cron sweep that promotes `pending` → `approved`
  once `availableAt` passes. (Can start as a lazy check on read.)

### Hold window
Aligns with the refund policy: a conversion becomes `approved` only after the
3-day refund window (`order.completedAt + 3 days`) — and is reversed outright if
a refund is granted. Make the window a constant so it can be lengthened.

---

## Attribution capture

Two entry points, both writing the same cookie:

1. **`GET /r/[code]`** (`apps/web/src/app/r/[code]/route.ts`)
   - Look up an `active` affiliate by code → 404 if missing.
   - Record an `AffiliateClick` (ip, UA, referrer, landing, utm from `?utm_*`).
   - Set `flybridge_affiliate` cookie with `{ affiliateId, code, clickId, ts }`
     (90-day, `SameSite=Lax`, `Secure` on https) — **last-click overwrite**.
   - 302 to `?to=` (validated same-origin path) or `/`.
2. **`?ref=CODE` fallback** — optional extension of
   `components/marketing-attribution-capture.tsx` so an affiliate link appended
   to an internal URL is still honoured.

On order creation, `createOrder()` receives `affiliate` (via the route) and
persists it on the order alongside `attribution`.

---

## Commission hook

Register in `events/index.ts`, implement in `events/handlers.ts`:

```ts
on("order.fulfilled", recordAffiliateConversion);
```

`recordAffiliateConversion` receives the `order.fulfilled` payload, loads the
`Order` by id, and calls `affiliate-commission.recordAffiliateConversion`. It is
synchronous like the other handlers, so failures are captured in the event log.

**Refund reversal:** in the refund completion path
(`apps/web/src/app/api/refunds/[id]/route.ts` when a claim reaches `refunded`,
and any admin action that sets `Order.status = "refunded"`), call
`reverseAffiliateConversion(orderId, reason)`.

---

## API routes (`apps/web/src/app/api/`)

### Public
| Route | Purpose |
| --- | --- |
| `GET /r/[code]` | Click tracking + redirect (route handler, not under `/api`) |

### Affiliate-facing (signed-in)
| Route | Purpose |
| --- | --- |
| `GET /api/affiliate/me` | Profile, code, link, balances, click/conversion counts |
| `GET /api/affiliate/me/conversions` | Paginated ledger (sales, status, amount) |
| `GET /api/affiliate/me/payouts` | Payout history |
| `PATCH /api/affiliate/me/payout-method` | Update bKash/bank details |

### Admin
| Route | Purpose |
| --- | --- |
| `GET /api/admin/affiliates` | List + stats (clicks, sales, earned, paid) |
| `POST /api/admin/affiliates` | Create affiliate (generates code) |
| `GET/PATCH/DELETE /api/admin/affiliates/[id]` | Manage status, percent, payout details |
| `GET /api/admin/affiliates/[id]/conversions` | Ledger for one affiliate |
| `POST /api/admin/affiliates/[id]/payouts` | Create a payout from eligible conversions → mark them `paid` |
| `GET /api/admin/affiliates/stats` | Overview for the admin dashboard |

All admin routes use `requireAdmin()` (see `lib/auth/admin.ts`), matching
`/api/admin/discounts`.

---

## UI

### Affiliate dashboard — `/dashboard/affiliate`
- Link with copy button (`/r/CODE`), QR optional.
- Metric cards: clicks, conversions, conversion rate, earnings
  (pending / approved / paid).
- Conversions table (date, item, order total, commission, status).
- Payout history + payout-method form.
- Guarded to the signed-in affiliate; hidden from non-affiliates.

### Admin dashboard — `/dashboard/admin/affiliates`
- List: name, code, status, percent, clicks, sales, earned, paid, actions.
- Detail `/[id]`: edit percent/status/payout details, conversions table,
  **Create payout** (selects approved conversions, records reference, marks paid),
  manual adjust/void.
- Overview stat card (active affiliates, this month's commissions, unpaid balance).

### Public
- `/affiliate` — short program explainer (how it works, commission, payouts) with
  a "request access" link to contact/partnership. No self-serve signup
  (admin-created only).
- Footer + nav links to `/affiliate`.

---

## Events (`events/types.ts` + `events/catalog.ts`)

Add names so the existing automation engine can react:

| Event | When | Example use |
| --- | --- | --- |
| `affiliate.created` | Admin creates an affiliate | Welcome email with their link |
| `affiliate.conversion` | Commission recorded | "You earned X" email / Telegram ping |
| `affiliate.payout` | Payout marked paid | Payout receipt email |

Follow the catalog entry shape (`name`, `label`, `description`, `fields`,
`samplePayload`) so they appear in the automations builder.

---

## Business rules

- **Percent of net total**: `commissionAmount = round(order.total * percent / 100)`,
  where `order.total` is already net of coupons/wishlist discounts.
- **No commission** on free items (`total === 0`).
- **No self-referral**: skip when the buyer's email/user matches the affiliate.
- **Inactive affiliates** earn nothing.
- **Refunds reverse** live commissions; already-paid ones require a manual claw-back
  (flagged, not silently adjusted).
- **Currency**: commission and payout in the order's currency; report per-currency
  balances (no implicit FX).
- **Rate snapshotted** on the conversion so changing an affiliate's percent never
  rewrites past earnings.

---

## Phasing

### Phase 1 — MVP
1. Models: `affiliate`, `affiliate-click`, `affiliate-conversion`, `affiliate-payout`; add `affiliate` to `Order`.
2. `affiliate.ts`, `affiliate-attribution.ts`, `affiliate-commission.ts`.
3. `/r/[code]` redirect + cookie; stamp the order in `POST /api/orders`.
4. `order.fulfilled` handler records the conversion.
5. Admin: list/create/detail + conversions + create payout.
6. Affiliate dashboard (read-only stats + link).
7. Footer/nav links.

### Phase 2 — Payouts & automation
1. Hold window approval (+ optional cron in `/api/cron`).
2. Refund reversal wiring in the refund flow.
3. `affiliate.*` events + automation emails (welcome, earned, paid).
4. Per-item-type percent overrides if wanted.
5. Admin overview stat card.

### Phase 3 — Later
- Tiered / performance-based rates.
- Multi-touch or multi-affiliate splits.
- Click fraud checks (IP/velocity), cookie-stuffing guards.
- Affiliate leaderboard and material library.

---

## Key files touched

| Area | Files |
| --- | --- |
| Models | `lib/models/affiliate*.ts`, `lib/models/order.ts` |
| Logic | `lib/affiliate.ts`, `lib/affiliate-attribution.ts`, `lib/affiliate-commission.ts` |
| Redirect | `app/r/[code]/route.ts` |
| Orders | `app/api/orders/route.ts` (stamp), `lib/orders.ts` (unchanged hook point) |
| Events | `lib/events/types.ts`, `lib/events/catalog.ts`, `lib/events/handlers.ts`, `lib/events/index.ts` |
| Refunds | `app/api/refunds/[id]/route.ts` |
| Admin API | `app/api/admin/affiliates/**` |
| Affiliate API | `app/api/affiliate/**` |
| Dashboards | `app/dashboard/affiliate/**`, `app/dashboard/admin/affiliates/**` |
| Public | `app/affiliate/page.tsx`, `components/nav`, `components/footer` |

---

## Open questions (for later)

- Exact default commission percent (per affiliate override available).
- Hold window length (default: 3 days, matching the refund window).
- Whether an affiliate must have a FlyBridge account, or can remain external.
- Whether suspended affiliates' live pending conversions are frozen or reversed.
