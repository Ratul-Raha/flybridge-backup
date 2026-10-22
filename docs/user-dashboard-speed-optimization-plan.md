# User Dashboard Speed Optimization Plan

**Status:** Implemented — runtime/browser verification pending  
**Target:** Reduce TTFB/LCP on `/dashboard`, cut duplicate client fetches on mobile, lower MongoDB query volume, shrink client bundle  
**Owner:** Engineering  
**Last updated:** 2026-10-22

## Goals
- Eliminate double-fetch on mobile dashboard (use server `initial` data)
- Cache `getUserDashboardData` to reduce Mongo queries per visit
- Add route-level loading boundaries for better perceived performance
- Reduce unnecessary client `cache: "no-store"` where safe
- Identify and trim heavy client bundles
- Keep changes low-risk and compatible with existing auth/session model

## Current state (findings)
- Desktop: `app/dashboard/page.tsx` fetches via `getUserDashboardData()` and passes `initial` to `DashboardHome` (RSC-first)
- Mobile: `DashboardLayout` swaps to `MobileUserApp` on mobile for users (L517-524) and `MobileUserApp` renders `MobileDashboardHome` which fetches `/api/me/dashboard` with `cache: "no-store"` in `useEffect` (discards server payload, shows loader)
- `getUserDashboardData` does up to 9 Mongo queries, not cached (admin equivalent uses `unstable_cache`)
- Many client components use `cache: "no-store"` (courses, seminars, resources, notifications, etc.)
- Heavy chunks: echarts (608KB), jspdf+html2canvas (328KB), firebase/resend/qrcode (125KB)
- `DashboardLayout` is a large client component imported by all dashboard routes
- No `loading.tsx`/`error.tsx` in `app/dashboard/`
- No bundle analyzer

## Implementation plan (ordered)

### Phase 1: Mobile hydration (biggest UX win) — P0
- [x] **1.1** Pass `initial` through layout to mobile shell
  - Modify `app/dashboard/layout.tsx` to read session and fetch `getUserDashboardData` for `user` role (or accept children data). Alternatively, thread `initial` via props/context.
  - Or simpler: in `app/dashboard/page.tsx`, when mobile, we still render server component tree but layout decides shell. Easier: have `DashboardLayout` accept `dashboardInitial?: UserDashboardData | null` and pass to `MobileUserApp`.
- [x] **1.2** Update `MobileUserApp` to accept `initial?: UserDashboardData | null` and pass to `MobileDashboardHome`
- [x] **1.3** Update `MobileDashboardHome` to accept `initial?: UserDashboardData | null`, hydrate state from it, skip fetch if present
- [ ] **1.4** Test on mobile viewport (or simulate) — should load without loader when SSR data available _(pending runtime test)_

**Files:** `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/dashboard/layout.tsx`, `apps/web/src/components/dashboard/dashboard-layout.tsx`, `apps/web/src/components/dashboard/user/mobile-user-app.tsx`, `apps/web/src/components/dashboard/user/mobile-dashboard-home.tsx`

### Phase 2: Cache user dashboard aggregate — P0
- [x] **2.1** Wrap `getUserDashboardData` with `unstable_cache`
  - Key: `["user-dashboard", userId]` (or include email if needed, but userId is stable)
  - TTL: 60s (configurable)
  - Tags: [`user-dashboard`] (global tag; cache key still includes userId)
- [x] **2.2** Add cache invalidation
  - Invalidate on: enrollment created/cancelled, course progress/quiz updates, seminar registration, readiness run created, notification changes affecting counts, profile updates that affect dashboard
  - `revalidateTag()` wired through `lib/dashboard/tags.ts` into order/refund fulfillment, readiness, course progress/quiz, seminar registration, notifications, and profile routes
- [x] **2.3** Ensure cache key doesn't leak cross-user data
- [ ] **2.4** Test: first load hits DB, subsequent within TTL served from cache _(pending runtime test)_

**Files:** `apps/web/src/lib/dashboard/user.ts`, relevant API routes (`app/api/orders/*`, `app/api/me/readiness/*`, `app/api/seminars/*/register`, `app/api/notifications/*`, etc.)

### Phase 3: Route loading boundaries — P1
- [x] **3.1** Add `app/dashboard/loading.tsx` with skeleton matching dashboard layout
- [x] **3.2** Add `app/dashboard/error.tsx` for graceful errors
- [x] **3.3** Consider loading.tsx for heavy subroutes (courses, readiness) — root boundary covers all dashboard routes, so no per-route copies added

**Files:** `apps/web/src/app/dashboard/loading.tsx`, `apps/web/src/app/dashboard/error.tsx`

### Phase 4: Reduce client fetch overhead — P1
- [x] **4.1** Audit and replace `cache: "no-store"` with revalidation where appropriate
  - Mobile dashboard now uses server-initial data (no client fetch on SSR path)
  - User dashboard aggregate cached server-side
- [x] **4.2** Pass initial data from server to client components where possible
- [x] **4.3** Consider batching related requests — parallelized the only sequential pair (`all-seminars`); remaining requests are independent and per-tab

**Files:** Various dashboard client components and API routes

### Phase 5: Bundle optimization — P2
- [x] **5.1** Add bundle analyzer
  - Install `@next/bundle-analyzer` (devDependency)
  - Update `next.config.js` to wrap with analyzer
  - Add script: `"analyze": "ANALYZE=true next build"`
- [x] **5.2** Add `optimizePackageImports` for `lucide-react`
- [x] **5.3** Lazy-load heavy widgets — `OpsBotWidget` now uses `next/dynamic` with `ssr: false`
- [x] **5.4** Ensure echarts only loaded in admin (already dynamic in reports)

**Files:** `apps/web/package.json`, `apps/web/next.config.js`

## Verification
- [x] Build passes: `pnpm build` in `apps/web`
- [x] Typecheck passes: `pnpm typecheck`
- [ ] Lint: no ESLint config in the repo, so `pnpm lint` was not run
- [ ] Manual test: `/dashboard` on desktop loads quickly with SSR data _(pending)_
- [ ] Manual test: `/dashboard` on mobile loads quickly without extra fetch _(pending)_
- [ ] Check network tab: mobile should not call `/api/me/dashboard` if hydrated _(pending)_
- [ ] Mongo queries reduced (check logs) _(pending)_

## Rollback
All changes are additive/modifiable. Cache can be bypassed by adjusting TTL/tags. Mobile hydration can be reverted to previous behavior.
