# Presentation Generation Prompt — FlyBridge Platform Deep Dive

Copy everything inside the prompt block into your presentation generator. This is deliberately a **technical product deep-dive**, not a marketing overview: it asks for real flows, state machines, API routes, model names, event names, failure handling, and known gaps.

---

## PROMPT START

You are a senior product + systems architect and presentation designer. Create a **16:9, 26-slide deck** titled **"FlyBridge — Platform & Product Deep Dive."** Audience: technical stakeholders, new engineers, and partners who need to understand exactly how the platform works. Depth matters more than polish: include concrete routes, statuses, models, events, retries, and edge cases. Use the exact names in the Reference Glossary below — do not rename or invent them.

### Global writing rules

- 1 headline + 4–7 substantive bullets per slide. Bullets may be dense; this is a technical deck. Prefer short labeled lines (`Webhook → ...`, `Fallback → ...`) over paragraphs.
- Every process slide must include a diagram spec: flowchart, sequence diagram, state machine, or table. Draw arrows and label them; do not replace a diagram with prose.
- Use monospace styling for code identifiers: routes, env vars, model names, event names, statuses.
- No emojis. No invented metrics, user counts, prices, or customer quotes. Where a number is given in the source, use it exactly.
- Visual style: deep navy `#102A43`, blue `#2563EB`, emerald `#10B981` (success/completion only), warm white `#FAFAF8`, dark text `#0F172A`. Clean sans-serif headings (Inter/Outfit), monospace for identifiers. Rounded cards, thin borders, soft shadows, generous whitespace.
- Speaker notes: add 1–3 sentences per slide explaining *why* the design exists (the trade-off, the failure it prevents). Notes must not introduce new claims.

### Reference Glossary — use these verbatim

- **Item types:** `course`, `seminar`, `resource`, `mock-bundle`.
- **Order model fields:** `user`, `items[]` (`itemType`, `itemId`, `title`, `price`), `subtotal`, `discountAmount`, `discountCode`, `discountLabel`, `total`, `currency` (`USD` | `BDT`), `status`, `gateway` (`stripe` | `eps`), `gatewayRef`, `merchantTransactionId`, `gatewayMode`, `attribution`, `meta`.
- **Order statuses:** `pending`, `completed`, `failed`, `cancelled`, `refunded` (the last two are defined in code but not set automatically).
- **Fulfillment targets:** `CourseEnrollment`, `SeminarRegistration`, `MockTestEnrollment`; resources validate existence only.
- **Routes:** `POST /api/orders`, `POST /api/seminars/[id]/register`, `POST /api/webhooks/stripe`, `POST /api/webhooks/eps`, `GET /api/payments/status`, `/payment/success`, `/payment/failed`, `/api/cron/payments`, `/api/cron/automations`, `/api/refunds/[id]`, `/api/orders/[id]/retry-meta`, `/api/events/emit`, `/api/e/{token}` redirect shape (actually `/e/[token]`), `/verify/[certId]`, `/r/[code]`, `/api/chat`, `/api/sop-generator`, `/api/readiness`, `/api/mock-tests/[id]/attempts`, `/api/transcribe`, `/api/speech-token`, `/dashboard/admin/ops-bot`, `/dashboard/admin/bot-config`.
- **Events:** `order.created`, `order.fulfilled`, `course.enrolled`, `course.progress_updated`, `course.launched`, `seminar.registration_created`, `seminar.created/updated/deleted`, `resource.created`, `user.registered`.
- **Automation nodes:** `trigger`, `condition`, `action`, `delay`, `end`. Operators include `has_enrolled`, `has_resource_download`, `has_readiness_run`, `has_certificate`, `progress_gte`, `progress_lt`. Actions: Resend email, in-app notification, delay. Engine constants: `MAX_STEPS = 100`, `MAX_RESUME_ATTEMPTS = 5`. State: `AutomationRun`, `AutomationPending`.
- **Payments:** Stripe one-time hosted Checkout (`checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`); EPS HMAC-SHA512 `GetToken` → `InitializeEPS` → `CheckMerchantTransactionStatus`, IPN AES-256-CBC, browser return URLs, 5-minute sweep reconciling orders older than 15 minutes.
- **Roles:** `user`, `moderator`, `admin`. Auth: Firebase `signInWithRedirect` → server `verifyIdToken` → signed Jose JWT session cookie.
- **AI:** Groq default provider (`llama-3.3-70b-versatile` for the Ops Bot), Grok/Gemini wired; KB-grounded streaming chat with cited sources.

---

### Slide-by-slide brief — follow exactly

**Slide 1 — Title**
- Headline: "FlyBridge — Platform & Product Deep Dive"
- Subtitle: "Self-serve international education, built as a reliable AI-native platform"
- Footer: "Next.js 14 · MongoDB · Stripe + EPS · Events + Automations · Groq"
- Visual: dark navy full-bleed with a subtle node graph; no student stock photo.

**Slide 2 — What the platform actually is**
- Headline: "One product surface, four commerce primitives"
- Bullets: FlyBridge sells knowledge, not consultancy — students teach themselves with structured courses, resources, seminars and assessments; four purchasable item types (`course`, `seminar`, `resource`, `mock-bundle`) share one `Order` pipeline; free items bypass gateways entirely; paid items are fulfilled by webhooks, browser returns, polling, and a scheduled sweep; every purchase becomes an event that can drive emails, notifications, enrollment and affiliate commission.
- Diagram: four item-type cards converging into a single "Order pipeline" box.

**Slide 3 — Architecture at a glance**
- Headline: "The stack behind the funnel"
- Bullets: Next.js 14 App Router + React 18 + Tailwind on Vercel, with `vercel.json` crons; MongoDB Atlas + Mongoose (~60 collections: orders, enrollments, leads, affiliates, automations, bot config, etc.); Firebase Auth + signed server session, role gates via `readSession()`; AWS S3 primary media (`eu-north-1`), Cloudinary legacy; Resend email; Groq/Grok/Gemini AI; GA4 Data API + Meta Pixel/CAPI; Stripe and EPS.
- Diagram: 4-layer stack (UI → API routes → domain services → MongoDB) with side rail of external services.

**Slide 4 — Domain model map**
- Headline: "How the data hangs together"
- Bullets: `User` → `Order` → `items[]` → fulfillment collections; `Course` → modules → lessons → `CourseProgress` / `QuizAttempt` → `Certificate`; `Seminar` → `SeminarRegistration`; `MockTest` / `MockTestBundle` → `MockTestAttempt` / `MockTestEnrollment`; `Lead`, `Affiliate` → `AffiliateClick` → `AffiliateConversion` → `AffiliatePayout`; `Automation` → `AutomationRun` / `AutomationPending` + `EventLog`; `EmailClick`, `UsageEvent`, `Notification`, `PushSubscription` close the feedback loop.
- Diagram: entity-relationship cluster with `Order` and `User` as hubs.

**Slide 5 — Commerce surface: pricing & product resolution**
- Headline: "From 'Buy' button to a validated product"
- Bullets: Entry points: course enroll button, seminar registration, resource detail, mock-bundle checkout; `resolveProduct()` loads the DB product and requires `published: true` for courses and mock bundles; prices are always computed server-side via `priceInCurrency()` and `resolveCheckoutPricing()` — the client never sets an amount; discount codes (`CouponError`) and wishlist discounts are applied before totals; `attribution` (first touch + latest non-direct) is snapshotted onto the order; affiliate cookie is read from `flybridge_affiliate` and stamped as `order.affiliate`.
- Diagram: request → resolve → price → discount → attribution → amount.

**Slide 6 — Order lifecycle (end-to-end sequence)**
- Headline: "The order lifecycle, start to finish"
- Bullets: 1) click Buy/Enroll → `POST /api/orders` (or seminar register); 2) price > 0 → create `Order` with `status: pending`, emit `order.created`; 3) gateway session created, buyer redirected to hosted checkout; 4) confirmation arrives (webhook, browser return, or sweep); 5) `fulfillOrder()` grants access and sets `completed`; 6) emit `order.fulfilled` → automation sends confirmation + Meta `Purchase` is reported; 7) free items (`amount === 0`) go straight to `fulfillFreeItem()` with no order and no gateway.
- Diagram: numbered sequence diagram with three parallel confirmation paths converging on `fulfillOrder()`.

**Slide 7 — Order state machine & duplicate prevention**
- Headline: "States, transitions, and the guardrails around them"
- Bullets: `(new) → pending` on `createOrder()`; `pending → completed` via `fulfillOrder()`; `pending → failed` via Stripe `checkout.session.expired` / `payment_intent.payment_failed` or `reconcileOrder()`; `cancelled` and `refunded` are defined but only changed manually/admin-driven; `isAlreadyFulfilled()` checks an active `CourseEnrollment`, `SeminarRegistration` (by email) or `MockTestEnrollment` before creating another order; an existing pending/completed order is returned instead of duplicated; pending orders refresh their price if the product price changed.
- Diagram: state machine with labeled transition arrows + a small "duplicate checks" table.

**Slide 8 — Stripe path (USD, hosted Checkout)**
- Headline: "Stripe: webhook-first, one-time payment"
- Bullets: Mode is one-time `payment`, never subscriptions; session created server-side with `metadata.orderId` / `client_reference_id`, then the buyer leaves for Stripe-hosted checkout; `POST /api/webhooks/stripe` verifies signatures with `constructEventAsync` against every configured `STRIPE_WEBHOOK_SECRET*`; `checkout.session.completed` → find order → `fulfillOrder()` if still pending; `checkout.session.expired` and `payment_intent.payment_failed` → mark `failed`; `STRIPE_MODE` / `STRIPE_TEST_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET_TEST` support test vs live, and `Order.gatewayMode` snapshots the mode used.
- Diagram: sequence (server → Stripe → webhook → fulfill) with the three event branches.

**Slide 9 — EPS path (BDT, hosted redirect)**
- Headline: "EPS: signed handoff, verified return, amount-checked"
- Bullets: `GetToken` uses `x-hash: HMACSHA512(username, hashKey)`, JWT cached in memory; `InitializeEPS` uses `x-hash: HMACSHA512(merchantTransactionId, hashKey)` + bearer token; buyer redirects to EPS hosted page; return URLs `successUrl` → `/payment/success`, `failUrl` → `/payment/failed`, `cancelUrl` → product checkout, each carrying `order` + `merchantTransactionId`; every return re-queries `CheckMerchantTransactionStatus` — status `Success` **and** matching `TotalAmount` are both required, a hand-edited URL can never grant access; IPN at `POST /api/webhooks/eps` is AES-256-CBC decrypted with the active mode's `EPS_*_IPN_SECRET` (other mode kept as fallback) and is only a trigger to locate the order; `EPS_ENV` and admin Payment Settings choose sandbox/production, snapshot as `gatewayMode`.
- Diagram: numbered handshake with a prominent "verify status + amount" gate before fulfillment.

**Slide 10 — Reconciliation & reliability**
- Headline: "Four ways an order gets resolved — one source of truth"
- Bullets: Primary Stripe: webhook; fallback for both gateways: `/payment/success` + `/api/payments/status` → `reconcileOrder()` → gateway-aware dispatcher (`lib/payments/reconcile.ts`); browser `PaymentStatusClient` polls every 3s, `outcome.ts` maps callback params → order → verified status; `POST /api/cron/payments` runs every 5 min (Vercel cron) and sweeps pending orders older than 15 min, covering closed tabs and lost connections; `fulfillOrder()` is idempotent — guarded by `status === "pending"` plus upserts and unique indexes; sweep and webhook can safely race.
- Diagram: four incoming arrows (webhook, success page, polling, cron) → `reconcileOrder()` → `fulfillOrder()`; include a small failure matrix (expired, failed, unknown/processing, timeout).

**Slide 11 — Fulfillment, side effects & refunds**
- Headline: "What 'completed' actually grants"
- Bullets: `course` → upsert `CourseEnrollment` (`status: active`), emit `course.enrolled`; `seminar` → upsert `SeminarRegistration` by email, emit `seminar.registration_created`; `mock-bundle` → upsert `MockTestEnrollment`; `resource` → validates existence; emit `order.fulfilled` with order + user payload; automation template renders itemized confirmation (order ID suffix, date, badges, total, CTA); server-side Meta `Purchase` uses hashed `em`/`ph`, `fbc`/`fbp`, IP/UA captured at order time, `event_id` = order id, delivery outcome stored on `order.meta`, retry via `/api/orders/[id]/retry-meta`; refunds are tracked through `RefundRequest` and `refundForfeitedAt` on enrollments; admin order delete cascades enrollments/registrations.
- Diagram: `fulfillOrder()` fan-out into four side-effect lanes.

**Slide 12 — Course learning pipeline**
- Headline: "Enroll → learn → prove"
- Bullets: `Course` holds modules → lessons with video/PDF/notes plus course books and `guidelinePdfUrl`, rendered inline in the lesson player; progress tracked in `CourseProgress` (lessons opened/played, mock tests played); AI-generated quizzes via `/api/courses/[id]/quiz/generate` and `/api/.../quiz/submit`, judged by `quiz-judge`; quiz submission emits `course.progress_updated`; reviews, wishlist, watermarked protected content; at 50% progress an automation nudges the learner toward the certificate.
- Diagram: horizontal pipeline with event emissions tagged at enrollment and progress steps.

**Slide 13 — Certificates & verification**
- Headline: "A credential that can be checked"
- Bullets: `Certificate` records eligibility from enrollment/progress; `/dashboard/courses/[slug]/certificate` renders the design; PDF is captured from a hidden fixed-1000px DOM copy so mobile and desktop are pixel-identical; download happens in place on a single tap; QR encodes `/verify/[certId]`, served by `GET /api/verify/[certId]`; planned Python renderer (Playwright + Pillow + reportlab) produces 300–600 DPI print output at 297×191.6 mm.
- Diagram: certificate → QR → public verify page → DB lookup.

**Slide 14 — Mock tests & IELTS practice**
- Headline: "An exam engine, not a quiz widget"
- Bullets: `MockTest` / `MockTestBundle` → timed `MockTestAttempt` → `grade` with AI judging; listening media served through `/api/mock-tests/[id]/media`; speaking answers recorded as mono 16/24 kHz WAV, ≤ 2 minutes, transcribed through `/api/transcribe` (Meta Muse); writing tasks with chart rendering; IELTS band scoring via `lib/ai/ielts-judge.ts`; progress views and attempt history; **known gap:** the take-a-test funnel is staff-gated while bundles are sold to regular buyers — a fix (public read + ownership-guarded attempts) is on the roadmap.
- Diagram: test → attempt → (media/recording) → AI judge → band score + feedback, with a red gap marker.

**Slide 15 — Readiness & SOP generation**
- Headline: "Two AI products that turn intent into a document"
- Bullets: Readiness: `lib/readiness/questions.ts` drives a wizard, `/api/readiness` scores answers, result page shows the breakdown and a PDF generated by `lib/readiness/pdf.ts`, runs persisted in `ReadinessRun` and exposed in admin stats; SOP Generator: signed-in users fill level, program, country, background and goals plus tone/length options → `/api/sop-generator` → full Statement of Purpose via Groq; both feed the 12-day nurture conditions (`has_readiness_run`, etc.).
- Diagram: two parallel funnels converging on automation conditions.

**Slide 16 — Event system & automation engine**
- Headline: "Everything is an event; automations are graphs"
- Bullets: `emitEvent()` writes `EventLog` and dispatches to automations; catalog includes user, seminar, course, resource, order events; graph nodes: `trigger` → `condition` → `action` / `delay` → `end`, with true/false edges; conditions include DB-aware operators (`has_enrolled`, `has_resource_download`, `has_readiness_run`, `has_certificate`, `progress_gte`, `progress_lt`) evaluated against `payload.user.id`; actions: Resend email, in-app notification, delay; engine walks nodes with a `visited` Set and `MAX_STEPS = 100` to avoid loops; a delay > 1 min throws `FlowPaused`, persists `AutomationRun` (`scheduled`) + `AutomationPending`, and resumes later with `MAX_RESUME_ATTEMPTS = 5`.
- Diagram: node graph with a true/false branch and a "pause → Mongo → cron resume" loop.

**Slide 17 — Seeded nurture journeys**
- Headline: "Onboarding that adapts to what the user already did"
- Bullets: 12-day `user.registered` flow: instant welcome → day-3 free-course nudge → day-6 free resources → day-9 readiness nudge → day-12 certificate push; each step skips users who already enrolled, downloaded, assessed or earned progress; separate `course.progress_updated` automation fires the certificate message at 50% when no certificate exists; day-level delays up to 365 days; legacy standalone "Welcome email" is deactivated on seed and can be re-enabled; seeding never overwrites admin edits (name-based); `/api/cron/automations` runs daily at `0 0 * * *`, guarded by `CRON_SECRET`.
- Diagram: timeline with five day markers and skip conditions annotated.

**Slide 18 — Email, clicks & notifications**
- Headline: "Delivery and measurement on every outbound message"
- Bullets: Resend sends transactional + automation email; same-site links are wrapped in HMAC-signed `/e/[token]` redirects that append `utm_source=email`, `utm_medium=email`, `utm_campaign=…`, log `EmailClick`, then forward — external, `mailto:`, `tel:` and anchors are untouched and the signed token prevents open redirects; enabled with `EMAIL_TRACKING_SECRET` (falls back to `AUTH_SECRET`); `/dashboard/admin/email-clicks` shows clicks, unique recipients, campaign/template/destination breakdowns, daily trend and CSV export; in-app notifications come from automation actions; web push via VAPID keys and Telegram bot are additional channels.
- Diagram: email → signed redirect → click log → analytics dashboard.

**Slide 19 — Seminars, resources & community surfaces**
- Headline: "Engagement loops around the core product"
- Bullets: Seminar registration modal captures phone → signed-in users register instantly, others go through Google sign-in → idempotent registration by email → confirmation email → dashboard tracking page with session link; resource detail gates members-only downloads behind sign-in, proxies files through `/api/resources/[id]/file` with correct MIME/content-disposition, tracks `ResourceDownload`, comments and love; public leaderboard, success stories with video embeds, testimonials, scholarships board and blog; mobile dashboard becomes a bottom-tab app shell, and a service worker makes it installable.
- Diagram: two funnels (seminar registration, resource download) sharing the auth gate.

**Slide 20 — CRM & lead capture**
- Headline: "Interest becomes a lead, not a spam list"
- Bullets: `Lead` + `LeadList` + `LeadField` in the admin CRM; statuses `new → contacted → interested → follow-up → converted`, plus `not-interested` / `unqualified`; priorities `low · medium · high · urgent`; automatic lead creation from course waitlists and seminar registrations; Google Forms integration via webhook key + Apps Script snippet + question-to-field mapping; CSV import/export, inline edits and bulk actions; lead status is operationally separate from order status — revenue always comes from the order/refund ledger.
- Diagram: waitlist / seminar / form → one contact per person → CRM table → follow-up.

**Slide 21 — Affiliate program**
- Headline: "Attribution and payouts without a payout processor"
- Bullets: admin-created affiliates only, each with `/r/CODE` short link and per-affiliate commission %; `GET /r/[code]` logs `AffiliateClick`, sets a 90-day first-party cookie, 302s to the destination; `order.affiliate` is read from the cookie at checkout; `order.fulfilled` → `recordAffiliateConversion()` creates a `pending` ledger entry after the hold window; admin marks `approved`, creates `AffiliatePayout`, then `paid`; a refund flips the conversion to `reversed`; balances are derived from the ledger by aggregation, never stored, so they cannot drift.
- Diagram: link → click → cookie → order → conversion → payout, with refund reversal branch.

**Slide 22 — Analytics & attribution**
- Headline: "Measuring growth without lying with numbers"
- Bullets: first-party attribution captures UTMs, landing path, referrer, `fbclid`/`gclid`, preserves first touch and latest non-direct touch in a 180-day cookie, and reads `_fbc` / `_fbp`; snapshot onto orders across general checkout, seminar registration and waitlist leads; Meta Pixel fires `PageView`, `ViewContent`, `InitiateCheckout`, `Lead`; `Purchase` is server-side only via CAPI with per-order delivery status and retry; GA4 Data API powers live traffic (active users, views, sources, devices, countries); Growth & Sales dashboard shows paid orders, gross/net cash after refunds, AOV, trends and breakdowns by source/campaign/product/coupon, with currencies kept separate and ROAS/CAC withheld until ad-spend data exists.
- Diagram: capture → cookie → order → two reporting lanes (internal ledger vs Meta optimization), labeled "not the same attribution window."

**Slide 23 — Admin, Ops Bot & governance**
- Headline: "Operating the business from one console"
- Bullets: role gates: user → moderator → admin; admin tools for users, orders, refunds, roles, discounts, leads, email campaigns/templates, automations, event log, CRMs, payment and AI settings; Ops Bot at `/dashboard/admin/ops-bot` uses Groq `llama-3.3-70b-versatile` with function calling and SSE streaming; read-only tools (dashboard summary, user/order/revenue/seminar/course/scholarship/automation/event/readiness queries) run instantly; write tools (create/update seminar, update user, send notification, toggle automation, emit event, update course, create scholarship, delete user) return a preview + confirmation card before execution; conversations persist in Mongo; every ask, tool call, confirmation and outcome lands in `BotAuditLog`; Bot Control Panel at `/dashboard/admin/bot-config` configures persona, tools, access levels, rules, channels, capabilities and conversations.
- Diagram: chat → tool router → read lane / confirm lane → audit log.

**Slide 24 — Security & reliability posture**
- Headline: "Where trust is enforced"
- Bullets: signed Jose JWT session carries role + userId; every gated route goes through `readSession()`; server-side prices only; Stripe webhook signature verification; EPS requires verified status **and** amount match, with AES-256-CBC IPN; email redirect tokens HMAC-signed; idempotent fulfillment via unique indexes and status guards; admin CRUD emits events; cron endpoints guarded by `CRON_SECRET`; rate limiting and URL safety helpers; payment mode snapshotted per order so later refunds use the right environment.
- Diagram: shield-shaped checklist with one control per bullet.

**Slide 25 — Cost & performance engineering**
- Headline: "Serving a free-tier-friendly product at scale"
- Bullets: paid services: Vercel Pro + metered usage, AWS S3 (`eu-north-1`) storage/egress, Stripe/EPS per transaction, MongoDB Atlas, Resend, Groq, x.ai, Meta Muse speech, Azure Speech, Cloudinary (legacy); free: Firebase Auth, GA4, Meta Pixel/CAPI, Telegram, Web Push, GitHub; hot spots: Vercel invocations/transfer, S3 egress, Resend fan-out, Groq calls on chat/quiz paths; mitigations shipped: S3 direct serving, session/query caching, 300s ISR on the landing page, 120s notification poll; CloudFront signed URLs and deeper caching planned.
- Diagram: cost hot-spot heatmap with mitigation tags.

**Slide 26 — Roadmap & open gaps**
- Headline: "Known gaps are part of the plan"
- Bullets: expose the mock-test attempt funnel to buyers with ownership guards; certificate print-ready renderer (300+ DPI) and real-device QA; first-party funnel events for visit → view → signup → checkout → paid; ad-spend import before ROAS/CAC; harden order edge cases (zero BDT price falling through to free, identity mutation via order endpoint, stale gateway sessions on re-submit, admin status changes not revoking access, admin order pagination); continue AI breadth across learning, assessment and operations; north star: a complete international education ecosystem — courses, workshops, community, mentorship, certification.
- Visual: two columns — "Fix now" (concrete gaps) and "Build next" (ecosystem), joined by an arrow to the closing line: "Your future is built through learning."

### Final instructions

- Keep the exact 26-slide order. Use the diagram specs — a slide without its diagram is incomplete.
- Maintain a consistent visual system across slides; use the same flowchart and state-machine symbol vocabulary throughout.
- Speaker notes should explain trade-offs, not repeat bullets.
- Do not add emojis, invented statistics, or slides beyond 26.

## PROMPT END
