# Presentation Generation Prompt — FlyBridge Feature Tour

Copy everything inside the prompt block into your presentation generator. This deck is a **feature catalog / feature tour**: for every feature it explains what the user or admin can do, how the feature actually works internally, which surfaces it lives on, and which data it writes. It is more detailed than a marketing overview but lighter than the platform deep dive.

---

## PROMPT START

You are a senior product designer and technical writer. Create a **16:9, 26-slide deck** titled **"FlyBridge — Feature Tour."** Audience: stakeholders, new team members, and partners who need to see the full feature set and understand how each feature behaves. For every feature slide use the same three-part rhythm: **What it does** (1 line), **How it works** (4–6 concrete bullets), **Surfaces** (exact routes/models). Use the exact identifiers from the glossary below.

### Global writing rules

- Headline + 1-line "What it does" + 4–6 bullets + a "Surfaces" line per feature slide. Dense is fine; no filler and no emojis.
- Use monospace for identifiers (routes, model names, field names, event names, statuses).
- Include the specified visual/diagram on every slide — a flow, state machine, or UI wireframe, not decorative art.
- Style: deep navy `#102A43`, blue `#2563EB`, emerald `#10B981` for success states, warm white `#FAFAF8`, dark text `#0F172A`. Inter/Outfit headings, monospace identifiers. Rounded cards, thin borders, soft shadows.
- No invented metrics, prices, or testimonials. Where a rule is a number (60% pass mark, 3-day refund window, 180-day cookie), use the exact value from the source.
- Speaker notes: one sentence on the design intent or a notable caveat per slide.

### Feature glossary — use these names verbatim

- Roles: `user`, `moderator`, `admin`; staff = admin or moderator; session cookie `flybridge_session` (30 days, HS256, `AUTH_SECRET`).
- Courses: `Course`, `CourseEnrollment`, `CourseProgress`, `QuizPending` (TTL 3600s), `QuizAttempt`, `Certificate`, `CourseReview`, `Wishlist`.
- Quizzes: types `mcq | true-false | fill-blank | short-answer | written`; score `0–100`; pass threshold `60`.
- Orders: `Order` (`pending | completed | failed | cancelled | refunded`), gateways `stripe` / `eps`, `gatewayMode`, `attribution`, `affiliate`.
- Mock tests: `MockTest`, `MockTestBundle`, `MockTestAttempt` (`in_progress | submitted | graded`), `MockTestEnrollment`, `result.overallBand`.
- Leads: `Lead`, `LeadList`, `LeadField`, `GoogleFormIntegration`; statuses `new | contacted | interested | follow-up | converted | not-interested | unqualified`; priorities `low | medium | high | urgent`.
- Bot: `BotConfig`, `BotTool`, `BotRule`, `BotKnowledge`, `BotConversation`, `BotMessage`, `BotAuditLog`; SSE chunks `text | tool_call | confirmation | tool_result | done`.
- Analytics: `AdminOverviewAnalytics`, `UsageEvent`, `LinkClick`, `EmailClick`, `AffiliateClick`, `AffiliateConversion`, `MarketingTouch`.

---

### Slide-by-slide brief — follow this order

**Slide 1 — Title**
- Headline: "FlyBridge — Feature Tour"
- Subtitle: "Learn, practice, get assessed, get certified — and run it all from one platform"
- Footer: "Courses · Mock Tests · SOP Generator · Resources · Leads · Ops Bot · Payments · Analytics"
- Visual: dark navy grid of feature cards with the learner journey flowing through them.

**Slide 2 — Feature map**
- Headline: "What's in the platform"
- Bullets: Learner side — courses with AI quizzes and certificates, mock tests with band scoring, SOP generator, resources, seminars, reading list/wishlist, leaderboard, notifications; Growth side — leads/CRM, affiliate links, discounts, email automations, tracking; Operations side — roles, orders/payments/refunds, stats, usage analytics, Ops Bot and bot control panel; Public side — programs, scholarships, blog, success stories, readiness check.
- Visual: one-page feature map with four color-coded clusters and small icons.

**Slide 3 — Courses: content & learning experience**
- What it does: "A DB-backed course is a structured path of modules, lessons, books and a guideline PDF."
- How it works: `Course` holds `slug`, `category` (IELTS / Spoken English / Study Abroad), `prices.USD` / `prices.BDT`, `discount` (active/name/price/startsAt/endsAt), `published`, `upcoming`, `certificateEnabled`, `guidelinePdfUrl`; `modules[] → lessons[]` carry `title`, `duration`, `videoUrl`, `pdfUrl`, `content`, `skill`, `quiz`, `freePreview`, `topics`; `books[]` are PDF course books; lesson player offers lesson / quiz / guideline tabs, with the guideline embedded in an iframe and an "open in new tab" fallback; S3 videos are served through signed URLs, YouTube embeds pass through; static program catalog (`programs.ts`) can be DB-backed via `hasDb: true`, and the DB course becomes canonical.
- Surfaces: `/programs/[slug]`, `/programs/[slug]/checkout`, `/dashboard/courses/[slug]/learn`, `/api/courses`, `/api/courses/[id]`, `GET /api/courses/[id]/lessons/[index]/video`.
- Visual: course detail → module accordion → lesson player wireframe with three tabs.

**Slide 4 — Courses: AI quizzes**
- What it does: "Every lesson can generate a fresh AI quiz; IELTS answers get band-style feedback."
- How it works: `POST /api/courses/{id}/quiz/generate` requires login, visible course, active enrollment or `freePreview`, and `lesson.quiz !== false`; `lib/ai/quiz.ts` emits exactly 5 questions for IELTS reading/listening (3 `mcq` + 2 `fill-blank`) or spoken/generic (2 `mcq` + 2 `true-false` + 1 `short-answer`), and exactly 1 subjective question for IELTS speaking/writing; generated questions are stored in `QuizPending` with a 1-hour TTL; `POST /api/courses/{id}/quiz/submit` grades MCQ/true-false by normalized equality and short answers by exact/containment or keyword overlap ≥ 0.5; IELTS reading/listening answers get AI-written `explanation`, `band7Answer` and `comparison` (failure is non-blocking); IELTS speaking/writing goes to `judgeWrittenAnswers()` for `overallBand` + per-question feedback and is **not** persisted.
- Surfaces: `/api/courses/[id]/quiz/generate`, `/api/courses/[id]/quiz/submit`, `lib/ai/quiz.ts`, `lib/ai/quiz-judge.ts`, `QuizPending`, `QuizAttempt`.
- Visual: generate → pending → submit → objective/subjective branch, with the IELTS band card highlighted.

**Slide 5 — Courses: progress & grading**
- What it does: "Progress is derived from quiz scores and drives certificates and nudges."
- How it works: `CourseProgress` fields: `quizScores[]` (`moduleIndex`, `lessonIndex`, `score`, `totalQuestions`, `correctCount`, `attempts`), `watchedLessons[]`, `overallPercentage`, `totalQuizzes`, `completedQuizzes`, `passed`, `certificateIssued`, `certificateDownloadCount`; only enrolled, non-IELTS, objective quiz submissions persist progress — retakes replace the score and increment `attempts`; `lib/grading.ts`: `overallPercentage` = average quiz score, `passed` = average ≥ 60 **and** all lesson quizzes submitted; grades `A+≥90 / A≥80 / B≥70 / C≥60 / F`, English levels `C2≥93 … A1`; emitting `course.progress_updated` triggers the automation "Certificate push at 50% progress" (`progress_gte 50`, `has_certificate`); `watchedLessons` exists but is not written by the app — lesson plays only update refund counters.
- Surfaces: `GET/PUT /api/courses/[id]/progress`, `GET /api/courses/[id]/members/[userId]/progress`, `lib/grading.ts`, `course.progress_updated`.
- Visual: quiz submit → progress recalculation card → two outputs (grade + event).

**Slide 6 — Courses: certificates & verification**
- What it does: "A passing learner gets a shareable, publicly verifiable credential."
- How it works: eligibility gate requires login, active enrollment, `grade.passed === true` and `completedQuizzes === totalQuizzes`; `findOrCreateCertificate()` issues one `Certificate` per user+course with ID format `FB-{year}-{6 digits}` and retries 5 times on collision; the snapshot stores `userName`, `userEmail`, `courseTitle`, `courseSlug`, `percentage`, `grade`, `englishLevel`, `issuedAt`, `status: issued | revoked`; QR encodes `/verify/{certId}`; PDF is generated client-side with `html2canvas` + `jspdf`, and a successful generation posts to `POST /api/courses/{id}/certificate` to record `certificateDownloadedAt` and increment download counters; `GET /api/verify/{certId}` is public, rate-limited to 30/min per IP, and returns valid / `not_found` / `revoked` / `invalid`.
- Surfaces: `/dashboard/courses/[slug]/certificate`, `/verify/[certId]`, `/api/courses/[id]/certificate`, `/api/verify/[certId]`.
- Visual: progress passed → certificate card with QR → public verify page states.

**Slide 7 — Courses: access control & refund rules**
- What it does: "Enrollment and free previews decide who can watch, quiz and download — usage decides refund eligibility."
- How it works: active `CourseEnrollment` (`status: active`) or `lesson.freePreview === true` required for video, quiz generate/submit and progress; admin/moderator bypass enrollment on video/quiz/certificate routes (but not on progress GET); lesson video API signs S3 URLs for 2 hours and redirects 302 with `Cache-Control: no-store`; player wraps video/text in `ProtectedContent` (blocks copy/cut/context menu/devtools shortcuts) and an identity watermark with email/name; `CourseEnrollment` tracks `lessonsPlayed`, `lessonsOpened`, `mockTestsPlayed` plus `refundForfeitedAt` / `refundForfeitedReason`; refund policy: 3-day window, 5 lessons, 1 course mock, 0 bundle mocks; crossing a limit stamps forfeiture — counters never block playback; approved refund sets enrollment `status: expired`, and `grant-access` can reactivate it.
- Surfaces: `lib/models/enrollment.ts`, `lib/refund-policy.ts`, `lib/refunds.ts`, `/api/orders/[id]/grant-access`, `/api/refunds/[id]`.
- Visual: access-gate flowchart plus a refund-limit meter.

**Slide 8 — Mock tests: authoring & bundles**
- What it does: "Staff build IELTS-style tests with rich question types and sell them as bundles."
- How it works: `MockTest` skills `reading | listening | writing | speaking`, state `draft | published | archived`, with `durationMinutes`, `questionCount`, `content`, `answerKey`; content supports passages, sections, matching boxes, figures, `[[gap:N]]` inline blanks, images, audio/video URLs, and Task 1 chart JSON (`line | bar | pie | table`); `POST /api/mock-tests/generate` creates reading/listening/writing structure with AI (12 requests/min per user) — speaking sections are authored manually; `MockTestBundle` carries slug, price in USD/BDT, `published`, `featured`; manager UI creates/edits/reorders tests, publishes them, uploads media and writes answer keys; deleting a bundle deletes its tests.
- Surfaces: `/dashboard/mock-tests`, `/api/mock-tests`, `/api/mock-tests/[id]`, `/api/mock-tests/generate`, `/api/mock-tests/bundles`, `lib/ai/ielts-structure.ts`.
- Visual: bundle → tests → question/section editor wireframe.

**Slide 9 — Mock tests: taking a test**
- What it does: "A timed, resumable attempt with media, strict answer formats and integrity checks."
- How it works: starting an attempt reuses an existing `in_progress` one and records a course-backed mock play; `MockTestAttempt` statuses `in_progress → submitted → graded` with `startedAt`, `submittedAt`, `timedOut`, `answers`, `result`; player phases `loading → intro → ready → review → submitting → result` with a 3-2-1-GO countdown and `durationMinutes` timer that opens review at zero but does not auto-submit; resume via `?attempt={id}` restores answers or shows the graded result; integrity checks ignore the first 2 seconds, warn on the first violation and disqualify client-side on the second (tab blur, visibility change, fullscreen exit), and block copy/print/devtools keys; listening media is served as signed S3 URLs with one-shot playback.
- Surfaces: `/dashboard/mock-tests/[testId]/take`, `/api/mock-tests/[id]/attempts`, `/api/mock-tests/[id]/media`, `components/mock-tests/mock-test-player.tsx`.
- Visual: attempt timeline with timer, violation warnings and answer formats (`choice / choices / text / gaps / pronunciation`).

**Slide 10 — Mock tests: assessment & results**
- What it does: "Objective answers are marked against a key; speaking and writing are judged by AI with IELTS band descriptors."
- How it works: `POST /api/mock-tests/{id}/grade` verifies attempt ownership, saves answers, sets `status: graded`, stamps refund forfeiture for bundle submissions and emits `mock-test.submitted`; speaking answers are recorded via MediaRecorder, decoded/resampled to mono 16 kHz 16-bit WAV and sent to `/api/transcribe` (Meta Muse, 1 KB–4.5 MB ≈ 2 minutes) with editable transcripts; Azure Speech issues tokens for read-aloud TTS only; `lib/ai/ielts-judge.ts` returns `overallBand`, `sections[{key,title,band,comments}]` and `feedback`, uses official descriptors, includes Task 1 chart data as authoritative JSON, clamps bands to 0–9 in 0.5 steps, retries 3 times; results appear in the player and attempt history at `/api/mock-tests/my-attempts`.
- Surfaces: `/api/mock-tests/[id]/grade`, `/api/transcribe`, `/api/speech-token`, `lib/ai/ielts-judge.ts`, `lib/audio/*`.
- Visual: four skill lanes (reading, listening, writing, speaking) converging on AI judge → band card.

**Slide 11 — Payment flow: choosing a gateway**
- What it does: "One checkout surface for courses, seminars, resources and mock bundles, with USD via Stripe and BDT via EPS."
- How it works: `POST /api/orders` validates `itemType` from `ORDER_ITEM_TYPES` and a non-empty `itemId`; `resolveProduct()` requires published courses/bundles; prices are computed server-side from `prices.USD` / `prices.BDT` with coupon codes and wishlist discounts; `amount === 0` skips gateway creation and calls `fulfillFreeItem()` immediately — no Order document; paid items create `Order` with `status: pending`, stamp `gatewayMode`, marketing `attribution` and `affiliate`, emit `order.created`, then return a `paymentUrl`; Stripe mode is hosted Checkout (one-time `payment`), EPS mode is a signed redirect through `GetToken` → `InitializeEPS`; the UI shows `PaymentMethodPicker` plus an optional `CouponCodeEntry`.
- Surfaces: `/api/orders`, `lib/orders.ts`, `lib/products.ts`, `lib/payments/stripe.ts`, `lib/payments/eps.ts`, `/programs/[slug]/checkout`.
- Visual: checkout form → price resolution → free/paid split → two gateway lanes.

**Slide 12 — Payment flow: confirmation & recovery**
- What it does: "Four independent signals can confirm an order, and all of them must be idempotent."
- How it works: Stripe webhook `POST /api/webhooks/stripe` verifies signatures and handles `checkout.session.completed` (fulfill), `checkout.session.expired` and `payment_intent.payment_failed` (mark `failed`); EPS returns through `/payment/success`, `/payment/failed` and the checkout page, all carrying `order` + `merchantTransactionId`, and each re-queries `CheckMerchantTransactionStatus` — both `Success` status and a matching amount are required; EPS IPN at `/api/webhooks/eps` is AES-256-CBC decrypted and only locates the order; `/payment/success` and `/api/payments/status` call `reconcileOrder()` as a synchronous fallback while `PaymentStatusClient` polls every 3 seconds; `POST /api/cron/payments` runs every 5 minutes and sweeps pending orders older than 15 minutes; `fulfillOrder()` is guarded by `status === "pending"` plus upserts and unique indexes.
- Surfaces: `lib/payments/reconcile.ts`, `lib/payments/outcome.ts`, `lib/payments/sweep.ts`, `vercel.json`.
- Visual: four arrows (webhook, return URL, polling, cron) into a single `reconcileOrder() → fulfillOrder()` gate.

**Slide 13 — Order fulfillment & side effects**
- What it does: "A paid order becomes access, an email, analytics events and (sometimes) affiliate commission."
- How it works: `course` → upsert active `CourseEnrollment` and emit `course.enrolled`; `seminar` → upsert `SeminarRegistration` by email and emit `seminar.registration_created`; `mock-bundle` → upsert active `MockTestEnrollment`; `resource` → validates existence; `order.fulfilled` drives the itemized confirmation email template with order-ID suffix, date, badges, total and CTA; server-side Meta `Purchase` uses hashed `em`/`ph`, `_fbc`/`_fbp`, IP/UA, `event_id` = order id and stores delivery status on `order.meta`, with `POST /api/orders/[id]/retry-meta` for failed sends; `recordAffiliateCommission()` creates a pending `AffiliateConversion` with `availableAt = completedAt + 3 days`; refunds can expire enrollment and reverse the conversion.
- Surfaces: `lib/orders.ts`, `lib/events/handlers.ts`, `lib/meta-capi.ts`, `lib/affiliate-commission.ts`, `/api/refunds/[id]`.
- Visual: `fulfillOrder()` fan-out with five labeled lanes.

**Slide 14 — Roles & permissions**
- What it does: "Three account types gate dashboards, management screens and operations."
- How it works: `accountType: user | moderator | admin` lives on `User` (default `user`); sign-in via Firebase `signInWithRedirect` → server ID-token check → signed `flybridge_session` JWT carrying role/subscription/userId/sessionId/phone; `user` gets dashboard, courses, seminars, resources, orders, settings, SOP generator, notifications; `moderator` adds seminar/resource/course management and registrations; `admin` adds users, roles, orders, refunds, discounts, CRM, automations, events, email, payment/AI settings, analytics, Ops Bot and bot config; role changes via `PATCH /api/admin/users/[id]`, `POST /api/admin/users/bulk` (max 1000) or `pnpm promote`; `lib/permissions.ts` defines view/create/edit/delete intent by module but its toggles are descriptive — authorization is still inline checks in routes; `middleware.ts` enforces phone completion (staff exempt), not roles.
- Surfaces: `lib/roles.ts`, `lib/permissions.ts`, `lib/auth/session.ts`, `/dashboard/admin/roles`, `/api/admin/users/[id]`.
- Visual: three nested permission rings + a guard checklist.

**Slide 15 — Leads / CRM**
- What it does: "Interest from waitlists, seminars and forms becomes one trackable contact."
- How it works: `Lead` stores identity, `source`, `status`, `priority`, `owner`, custom field values, `followUpAt` and interest references; automatic creation from `POST /api/wishlist` (`source: waitlist`), seminar registration (`source: seminar`), public `/forms/[slug]` submissions with honeypot (`source: form`) and Google Forms webhook (`source: form`); `LeadList` (default "General") and admin-defined `LeadField` types (`text | textarea | number | date | select | checkbox | email | phone`); statuses `new → contacted → interested → follow-up → converted` plus `not-interested` / `unqualified`, priorities `low → urgent`; lead detail shows related orders, wishlists, registrations and a timeline; CSV import accepts up to 5000 rows with name/email/phone aliases, bulk actions cover 1000 leads; lead status stays separate from order status.
- Surfaces: `/dashboard/admin/crm/leads`, `/api/admin/leads`, `/api/admin/leads/import`, `/api/admin/lead-fields`, `/api/admin/integrations/google-forms`.
- Visual: four source arrows → one lead record → status pipeline + timeline.

**Slide 16 — Ops Bot: chat & tools**
- What it does: "An admin-only AI assistant that answers business questions and performs actions with confirmation."
- How it works: `POST /api/admin/ops-bot` is admin-only, Node runtime, max 120s, streams SSE chunks `text | tool_call | confirmation | tool_result | done`; engine uses Groq with model `openai/gpt-oss-120b`, builds a system prompt from `BotConfig` persona, tone, detail level, rules and active `BotKnowledge`, and keeps the last 40 messages in `BotConversation` / `BotMessage`; 22 tools — read tools such as `get_dashboard_summary`, `search_users`, `get_orders`, `get_revenue_report`, `get_seminars`, `get_courses`, `get_scholarships`, `get_automations`, `get_event_log`, `get_readiness_stats` run instantly; write tools such as `create_seminar`, `update_user`, `send_notification`, `toggle_automation`, `emit_event`, `update_course`, `create_scholarship`, `crawl_and_create_seminar`, `crawl_and_create_scholarship`, `delete_user` return a preview first; confirmation posts to `POST /api/admin/ops-bot?action=confirm`; `delete_user` runs in a Mongoose transaction and cascades across related collections.
- Surfaces: `/dashboard/admin/ops-bot`, `lib/ai/ops-bot.ts`, `lib/ai/ops-tools.ts`, `lib/ops/tool-runner.ts`.
- Visual: chat panel → tool router → read lane / confirm lane, with SSE chunk labels.

**Slide 17 — Ops Bot: control panel & audit**
- What it does: "Admins configure the bot's persona, tools, rules, channels and audit trail visually."
- How it works: `/dashboard/admin/bot-config` tabs: `Persona` (name default "Bridge Ops", avatar, greeting, tone, detailLevel, systemPrompt, maxConversationLength), `Capabilities`, `Tools` (enable, `confirmationRequired`, `accessLevel`, custom instructions, display name), `Rules` (categories customer_service / pricing / content / operations; priorities high/medium/low), `Channels` (Telegram enabled, botToken, chatIds, events plus a test button), `Conversations`, `Audit Log`; `BotAuditLog` records who asked, the tool called, parameters, whether it was confirmed and the outcome; knowledge retrieval is lexical over `BotKnowledge`; admin-created rules are loaded by priority.
- Surfaces: `/dashboard/admin/bot-config`, `/api/admin/bot-config/*`, `BotConfig`, `BotTool`, `BotRule`, `BotKnowledge`, `BotAuditLog`.
- Visual: tabbed settings panel wireframe with the audit log table below.

**Slide 18 — SOP Generator**
- What it does: "A signed-in student turns their background and goals into a full Statement of Purpose, streamed live."
- How it works: input fields `fullName`, `targetCountry`, `level`, `program`, `university`, `academicBackground`, `workExperience`, `achievements`, `careerGoals`, `whyThisProgram`, `personalStory`, `additionalNotes`, plus `tone` and `length`; target country and program are required; `/api/sop-generator` validates, calls `generateSop()` (Groq via `getProvider()`, `AI_MODEL`) and streams SSE `data: {text, done}`; length targets 300–400 / 500–700 / 900–1200 words; the prompt explicitly says to use only supplied details and never invent facts, institutions, grades or scores, leaving bracketed placeholders for gaps; the UI supports stop/abort, copy and download; output lives in local React state — nothing is persisted.
- Surfaces: `/dashboard/sop-generator`, `/api/sop-generator`, `lib/ai/sop.ts`, `components/dashboard/user/sop-generator.tsx`.
- Visual: form → SSE stream → document preview with copy/download actions.

**Slide 19 — Resources library**
- What it does: "A searchable download library with free and members-only files, views, comments and reactions."
- How it works: `Resource` types `pdf | image | video | audio | other | link`, categories including IELTS, Study Abroad, Scholarships, Documents & Templates; `access: public | members`, `prices.USD/BDT`, `featured`, `published`, `youtubeUrl`, `viewCount`, `downloadCount`, `commentCount`, `loveCount`; public list filters by type and text client-side and hides unpublished items from non-managers; `GET /api/resources/[id]/file` checks published state, sign-in and ownership via a completed `Order`, logs a `LinkClick` (`resource_open` or `resource_download`) and 302-redirects to a 1-hour signed S3 URL (no byte proxying); views are anonymous, loves require sign-in and are rate-limited 60/min per IP, comments require sign-in for writes; admin CRUD plus bulk publish/unpublish/access changes (max 500).
- Surfaces: `/resources`, `/resources/[id]`, `/api/resources`, `/api/resources/[id]/file`, `/api/resources/[id]/comments`, `/dashboard/admin/resource-clicks`.
- Visual: resource card grid → detail → access gate → signed download redirect.

**Slide 20 — Seminars & notifications**
- What it does: "Live sessions drive registration, reminders and in-app/web-push notifications."
- How it works: seminar cards split into Upcoming/Completed; registration modal collects phone, signed-in users register instantly, others pass through Google sign-in; registration is idempotent by email, emits `seminar.registration_created`, sends confirmation email, creates a CRM lead and redirects to `/dashboard/seminars/mine/[id]`; managers CRUD seminars and view/delete registrations; in-app `Notification` types include `user_registered`, `seminar_registration`, `order_created`, `automation`; notification bell polls every 120 seconds, center lists 50; web push uses VAPID keys, `PushSubscription`, service worker `sw.js` and a click-through to `/dashboard/notifications`; Telegram messages are whitelisted to `order.created`, `order.fulfilled`, `course.enrolled`.
- Surfaces: `/seminars`, `/seminars/[id]`, `/api/seminars/[id]/register`, `/dashboard/notifications`, `/api/push/subscribe`, `public/sw.js`.
- Visual: seminar registration funnel feeding CRM + email + notification channels.

**Slide 21 — Stats & reports**
- What it does: "Admin dashboards answer what changed, what sold and what content performs."
- How it works: `/api/admin/overview` → `getOverviewAnalytics()` with models User, Order, CourseEnrollment, CourseProgress, QuizAttempt, MockTestAttempt, ReadinessRun, SeminarRegistration, UsageEvent; metrics include `totalMembers`, `newSignups`, `activeMembers`, `activeCourseMembers`, `engagementRate`, `courseEnrollments`, `courseCompletions`, `lessonViews`, `quizStarts`, `quizAttempts`, `averageQuizScore`, `mockTestAttempts`, `readinessChecks`, `seminarRegistrations`, `orders`, `completedOrders`, `revenue`; `/api/admin/orders-stats` adds totals by status, `totalRevenue`, `avgOrderValue`, month-over-month growth, top items and a chart, cached 30 seconds; `/api/admin/reports/[report]` exposes `overview`, `growth`, `top-courses`, `recent-signups`, `recent-orders`, `platform-activity` with days clamped 7–90; Growth & Sales (`/api/admin/analytics/summary`) shows paid orders, gross/net cash after refunds, AOV, trends and breakdowns by source/campaign/product/coupon in Asia/Dhaka dates.
- Surfaces: `/dashboard/admin`, `/dashboard/admin/analytics`, `/api/admin/overview`, `/api/admin/orders-stats`, `/api/admin/reports/[report]`.
- Visual: dashboard wireframe with metric cards, trend chart and breakdown table.

**Slide 22 — Usage analytics & AI insights**
- What it does: "A first-party picture of what signed-in users actually do inside the dashboard."
- How it works: `UsageEvent` types `page_view | lesson_view | quiz_start` with `user`, `path`, `courseSlug`, `moduleIndex`, `lessonIndex`; `POST /api/usage/events` accepts only signed-in `user` role, paths starting `/dashboard/` but not `/dashboard/admin/`, max length 300; client uses `keepalive: true` and a 2-second sessionStorage dedupe key; the auto tracker skips learn/certificate/take pages; `getUsageAnalytics()` adds `usageTrend` (union of usage events and quiz attempts), `topPages`, `topLessons`, `topQuizzes`; `POST /api/admin/usage/insights` asks the configured AI provider for a strict JSON `{ summary, insights: [{ title, detail, severity }] }` with 3–5 insights and an 80-word summary.
- Surfaces: `POST /api/usage/events`, `GET /api/admin/usage`, `POST /api/admin/usage/insights`, `components/dashboard/usage-tracker.tsx`.
- Visual: event ingestion → aggregation → ranked lists → AI insight card.

**Slide 23 — Tracking & attribution**
- What it does: "Every touch, click and email link is measured without mixing ad-platform numbers with the order ledger."
- How it works: `flybridge_marketing_attribution` cookie stores `firstTouch` / `lastTouch` for 180 days including UTMs, landing page, referrer, `fbclid` / `gclid`, and `_fbc` / `_fbp`; `orderAttributionFromRequest()` snapshots last touch onto `Order.attribution`; Meta Pixel fires `PageView`, `ViewContent`, `InitiateCheckout`, `Lead` browser-side, while `Purchase` is server-side only via CAPI with per-order delivery status; `LinkClick` kinds `resource_open | resource_download | email | affiliate | outbound`, with `/api/go?u=…` validating safe redirect URLs; email links are HMAC-signed `/e/[token]` redirects that append email UTMs and log `EmailClick` + `LinkClick`; `/api/admin/email-clicks` and `/api/admin/resource-clicks` expose trends, breakdowns and CSV export; rate limiting is process-local (`chat` 10/min, `readiness` 10/min, `verify` 30/min, seminar registration 5/min).
- Surfaces: `lib/marketing-attribution.ts`, `lib/meta-events.ts`, `lib/meta-capi.ts`, `lib/link-click-tracking.ts`, `lib/email-tracking.ts`, `/e/[token]`.
- Visual: five tracking streams flowing into one measurement layer, with "order ledger = financial truth" callout.

**Slide 24 — Affiliate program**
- What it does: "Short links, last-click attribution and a manual payout ledger."
- How it works: admin-created affiliates get a code and `/r/[code]` link; the route logs `AffiliateClick` + `LinkClick(kind: affiliate)`, sets the 90-day `flybridge_affiliate` cookie and 302s to a safe same-origin destination; `?ref=` / `?aff=` links are captured via `AffiliateRefCapture` and `/api/affiliate/click`; `affiliateFromRequest()` stamps `order.affiliate` at checkout; `recordAffiliateConversion()` creates a pending ledger entry with `availableAt = completedAt + 3 days`, excluding free orders, self-referrals and zero-percent affiliates; admin approves, pays (`AffiliatePayout`) or reverses on refund; balances are aggregated from the ledger, never stored on the affiliate.
- Surfaces: `/r/[code]`, `/dashboard/affiliate`, `/dashboard/admin/affiliates`, `lib/affiliate.ts`, `lib/affiliate-commission.ts`.
- Visual: link → cookie → order → conversion → payout, with the reversal branch.

**Slide 25 — Other learner surfaces**
- What it does: "Readiness, scholarships, blog, leaderboard and a mobile/PWA shell around the core learning product."
- How it works: Readiness wizard (`/readiness`) collects answers, `/api/readiness` scores them, result page renders a PDF via `lib/readiness/pdf.ts`, runs are saved as `ReadinessRun` and appear in admin stats; scholarships have public list/detail plus admin management and AI parsing (`/api/scholarships/parse`); blog posts support markdown authoring and AI generation (`/api/blogs/generate`); public leaderboard ranks learners and is shareable; success stories include video embeds; the dashboard switches to a bottom-tab app shell on mobile, with a service worker and install prompt for PWA use.
- Surfaces: `/readiness`, `/scholarships`, `/blogs`, `/leaderboard`, `/success-stories`, `components/dashboard/user/mobile-user-app.tsx`.
- Visual: phone mockup with bottom tabs surrounded by small cards for each surface.

**Slide 26 — Feature notes & next steps**
- Headline: "Accuracy notes for the roadmap conversation"
- Bullets: mock-test public pages and bundle APIs are currently staff-gated even though bundles are purchasable — public read + ownership-guarded attempts are planned; IELTS quizzes/attempts are not persisted, so they cannot contribute to certificates; permission toggles and tool access levels are configured in UI but not yet enforced at runtime; GA4 traffic endpoints exist but are not mounted in the current admin navigation; CSV export is documented for CRM but not implemented; certificate print-ready high-DPI renderer and real-device QA are pending.
- Visual: two columns — "Works today" vs "Next", with a final line: "Your future is built through learning."
- Speaker note: this slide exists so stakeholders do not mistake roadmap intent for shipped behavior.

### Final instructions

- Keep the exact 26-slide order and the three-part rhythm on every feature slide.
- Always include the specified diagram/wireframe; never substitute decorative imagery for a flow.
- Do not change identifiers, thresholds, or route names. Do not add emojis or invent numbers.

## PROMPT END
