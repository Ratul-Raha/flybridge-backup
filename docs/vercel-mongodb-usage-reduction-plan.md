# FlyBridge Vercel & MongoDB Usage Reduction — Fix Plan

**Status:** Phase 1 complete; Phase 2 pending product decisions.

**Problem:** Vercel spend ~$200.85 vs $30 budget. Function Invocations 1.21M,
Fluid Active CPU 43h, Observability Events 4.23M, Fast Origin Transfer 2TB.
The video bandwidth fix (`docs/vercel-bandwidth-fix-plan.md`, deployed) removed
the largest FOT/FDT line item. What remains is **request/DB amplification**:
a live DB read on nearly every authenticated request, uncached full-collection
aggregations, and repeated polling from every open tab.

## Root causes (ranked)

1. **Per-request session DB read.** `readSession()` verifies the JWT and then
   runs `User.findById` on every call (`apps/web/src/lib/auth/session.ts:60,81-132`).
   It is called at **209 sites across 168 files**, plus the client fetches
   `/api/auth/session` on every page load (`lib/auth/auth-context.tsx:63-89`).
2. **Uncached resource count aggregations.** `GET /api/resources` runs three
   full-collection `$group` aggregations over `ResourceDownload`,
   `ResourceComment`, `ResourceLove` on every listing request
   (`app/api/resources/route.ts:58-97`), with no cache and no `limit`.
3. **Polling.** Notifications poll every 60s per open tab
   (`components/notifications/notification-bell.tsx:11,49`); usage events POST
   on every dashboard navigation (`components/dashboard/usage-tracker.tsx:18-25`).
4. **Event fan-out writes.** Every seminar/course/resource/scholarship create
   writes one `Notification` per registered user (`lib/events/handlers.ts:171,200,225,243`).
5. **ISR/force-dynamic regeneration** on `/`, `/programs`, `/blogs` (`revalidate = 60`)
   and 18 force-dynamic routes; Image Optimizer default `minimumCacheTTL` of 60s.

## Phase 1 — Low-risk, high-impact (this pass)

- [x] Cache `getUserSnapshot` with a short TTL so repeated `readSession()` calls
      in one request/instance don't each hit Mongo; invalidate on profile/role writes.
- [x] Cache the resource count aggregations (Tag `resource-counts`, 60s TTL);
      invalidate on download/comment/love writes.
- [x] Raise the notification poll interval from 60s to 120s.
- [x] `next.config.js`: set `images.minimumCacheTTL` to reduce re-optimization.
- [x] Raise ISR `revalidate` on `/`, `/programs`, `/blogs` from 60s to 300s.

## Phase 2 — Structural (needs product decision)

- [ ] Event fan-out: replace per-user `Notification` documents with a broadcast
      model (one doc + per-user read markers), or throttle/gate to opted-in users.
- [ ] `UsageEvent`: batch client-side and flush periodically, sample, or move to
      an analytics store instead of Mongo.
- [ ] `/api/resources`: encode counts on the `Resource` doc (or a counters
      collection) and add pagination instead of returning every resource.
- [ ] CloudFront signed URLs in front of S3 for cheaper egress (see bandwidth plan).

## Phase 3 — Guardrails

- [ ] Vercel budget/spend alert; confirm auto-pause policy.
- [ ] Dashboard to watch Function Invocations, Fluid CPU, FOT, and Atlas op counters.

## Rollback

Phase 1 touches `lib/auth/session.ts`, `app/api/resources/route.ts`,
`components/notifications/notification-bell.tsx`, the three ISR pages, and
`next.config.js`. Reverting the commit restores prior behaviour. All caches
expire within their TTL, so no data migration is required.
