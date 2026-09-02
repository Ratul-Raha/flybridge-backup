# FlyBridge Admin Analytics System — Plan

## Goal
Add an analytics/engagement tracking system to the admin dashboard showing how visitors and users interact with the site. Complements existing GA4 + internal event system.

## Decisions (from user)
- Track **both anonymous visitors and authenticated users** (merge on sign-in)
- Store in a **separate analytics DB**
- Scope: page engagement, feature usage, funnel/conversion, real-time activity

## Open questions (to confirm before building)
1. **Analytics DB config**: same `MONGODB_URI` with `dbName: "flybridge_analytics"` (no new creds) vs. separate `MONGODB_ANALYTICS_URI`
2. **Build scope**: full build in one pass vs. incremental (overview first)
3. **Consent gate**: cookie-consent gate for anonymous tracking vs. none

## Architecture

### 1. Data storage — separate MongoDB database
- New env var `MONGODB_ANALYTICS_URI` (add to `.env.example`, `.env.local`)
- New `lib/analytics/db.ts` — lazy singleton `connectAnalyticsDb()` using `mongoose.createConnection(uri, { dbName: "flybridge_analytics" })`, models registered only on that connection. Keeps analytics traffic isolated from main DB/model registry.

### 2. New Mongoose models (on analytics connection, following `lib/models/` conventions)
| Model | Collection | Purpose |
|---|---|---|
| `Session` | analytics_sessions | `sessionId`, optional `userId`/`uid`, `userAgent`, `ipHash`, `referrer`, `landingPage`, `startedAt`, `lastActiveAt`, `events`, `durationSec`, `endAt` |
| `PageView` | analytics_pageviews | path, title, referrer, sessionId, userId, timestamps |
| `EngagementEvent` | analytics_engagement | clicks, scroll depth, time-on-page, outbound clicks, CTA interactions |
| `FeatureEvent` | analytics_feature_events | chat sent, SOP generated, readiness run, quiz attempt, resource download |
| `FunnelEvent` | analytics_funnel_events | visit → signup_started → signed_up → course_viewed → enrolled → order_created → order_fulfilled |

### 3. Client-side tracking layer
- New `lib/analytics/client.ts` (`"use client"`):
  - Generates/reads persistent `flybridge_session` ID (localStorage/cookie) for anonymous→signed-in merge
  - `trackPageView()`, `trackEngagement()`, `trackFeature(name, props)`, `trackFunnel(stage, props)`
  - Uses `navigator.sendBeacon` (non-blocking, survives navigation)
  - Merges identity when `useAuth().user` available

### 4. Ingest API routes (server-side)
- `POST /api/analytics/ingest` — session heartbeats, pageviews, engagement, feature events (rate-limited, validated, batched)
- `POST /api/analytics/identify` — merge anonymous session with authenticated user (`userId`, `uid`)

### 5. Feature usage instrumentation (add trackFeature calls)
- AI chat widget → `chat.message_sent` (`components/chat/chat-widget.tsx`)
- SOP Generator → `sop.generated`
- Readiness assessment → `readiness.assessment_started` / `readiness.assessment_completed`
- Quiz attempts → `course.quiz_attempted`
- Resource downloads → `resource.download`
- Server events (`user.registered`, `order.fulfilled`, `course.enrolled`) mirrored into funnel at same call sites

### 6. Reporting / query layer
- New `lib/analytics/queries.ts` (`"server-only"`), admin-guarded via `requireAdminReport()`:
  - `overview`: total sessions, active visitors (30 min), avg session duration, bounce rate, total pageviews, top content
  - `engagement`: time-on-page, scroll depth, click counts by selector/CTA
  - `feature-usage`: counts per feature over time (daily series for ECharts)
  - `funnel`: stage counts + conversion % over date range
  - `realtime`: currently-active sessions with recent actions
  - `growth`: sessions & pageviews over time

### 7. Admin API routes
- `GET /api/admin/analytics/[metric]` following `reports/[report]` pattern (admin-guard, `days` param). Metrics: `overview`, `engagement`, `feature-usage`, `funnel`, `realtime`, `growth`

### 8. Admin UI — new "Analytics" section
- Add **Analytics** nav entry (icon `BarChart3`) under admin "Administration" in `dashboard-layout.tsx:271`, link to `/dashboard/admin/analytics`
- New components in `components/dashboard/reports/analytics/` reusing existing `Chart`, `card`, color helpers:
  - **Overview page** (`app/dashboard/admin/analytics/page.tsx`):
    - Stat cards: active visitors now, sessions today, avg duration, bounce rate
    - Traffic/Growth chart (pageviews + sessions over time) — ECharts
    - Top pages list
    - Feature usage chart (bar/line per feature)
    - Funnel visualization (stage conversion bars)
    - Real-time activity feed (auto-refresh ~15s)
  - **Date-range selector** (7/14/30/90 days), consistent with `days` param

### 9. Wiring & config
- Root layout (`app/layout.tsx`): add `<AnalyticsTracker />` (pageview on route change) alongside `AuthProvider`, `ChatWidget`
- `.env.example` & `.env.local`: add analytics DB env var
