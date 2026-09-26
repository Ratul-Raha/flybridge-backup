# FlyBridge Admin Analytics — Traffic Density

## Goal
Show live traffic density in the admin dashboard: how many people are on the site
right now, what they are looking at, and where they came from.

## Decision (supersedes the earlier self-hosted plan)

The first draft of this doc proposed a bespoke first-party tracker — its own Mongo
database, five event models, an ingest API, a client SDK, and instrumenting every
feature call site. That was not built.

GA4 is already collecting everything needed, so the shipped version reads GA4 back
through the **GA4 Data API** instead of duplicating collection. No new database, no
new models, no new client bundle, and no consent question beyond the one GA4 already
imposes on itself.

## How it works

The browser tag (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) only *sends* data. Reading it back
requires the Data API, which authenticates as a service account granted `Viewer` on
the GA4 property.

- **Live window → realtime endpoint.** `runRealtimeReport` with
  `minuteRanges: [{ startMinutesAgo, endMinutesAgo: 0 }]` is what backs GA4's own
  Realtime view, so `minutesAgo: 30` is genuinely the last half hour. The standard
  report is delayed by up to ~24h and cannot answer "right now".
- **Today's shape → standard endpoint.** `runReport` over `dateRanges: [today]` with
  the `hour` dimension, so the live window has something to be measured against.

## Files

| File | Role |
| --- | --- |
| `lib/analytics/types.ts` | Shared response types (no `server-only`, so components can import them) |
| `lib/analytics/ga.ts` | Data API client, service-account auth, config detection, 15s memo cache |
| `lib/analytics/traffic.ts` | Query layer — live window, per-minute series, breakdowns, today |
| `app/api/admin/analytics/traffic/route.ts` | Admin-guarded endpoint, `?minutes=` clamped to 5/15/30/60 |
| `components/dashboard/reports/analytics/` | Dashboard UI (see below) |
| `app/dashboard/admin/analytics/page.tsx` | Admin-only page |

## Setup

1. GA4 → Admin → Property settings → copy the **numeric Property ID** (not the
   `G-XXXXXXXXXX` measurement id) → `GA4_PROPERTY_ID`.
2. Google Cloud → enable the Analytics Data API → create a service account → download
   a JSON key.
3. GA4 → Admin → Property access management → add the service account with `Viewer`.
4. `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` (keep the `\n` escapes).
   Alternatively `GA4_SERVICE_ACCOUNT_JSON` (whole JSON on one line) or
   `GOOGLE_APPLICATION_CREDENTIALS` (path to the key file, local dev only).

Until these are set the page renders the missing variable names instead of an error.

## Dashboard

- Stat cards: active users right now, page views, events/min, users today
- Traffic density chart — active users per minute across the window, with peak/avg
  concurrency
- Today's shape — hourly active users and sessions
- Pages right now, live events
- Traffic sources, devices, countries
- Window picker (5/15/30/60 min) + manual refresh; auto-refresh every 30s

## Design notes

- **Quota.** Each poll is 8 realtime requests, memoised for 15s so several admins
  refreshing at once share one result.
- **Partial failure.** Realtime dimension/metric compatibility is narrower than the
  standard report and shifts as GA4 adds fields, so each slice is fetched inside its
  own `try/catch`. One rejected dimension costs you that panel, not the page.
- **Empty minutes.** GA omits minutes with no traffic, which would give the chart a
  ragged axis — the series is backfilled across the window.
- **Privacy.** Page titles and referrer URLs are only ever read by the admin-only,
  `Viewer`-scoped service account. Nothing is persisted locally; this is a read path,
  not a second copy of anyone's browsing.
- **Bundle.** `@google-analytics/data` is a Node gRPC library, so it is listed in
  `experimental.serverComponentsExternalPackages` and stays a server-side require
  rather than going through webpack.
