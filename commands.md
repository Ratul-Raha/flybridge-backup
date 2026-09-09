# FlyBridge Commands

## Development

```bash
# Start the web app (dev server on http://localhost:3000)
pnpm dev

# Typecheck only
pnpm --filter @flybridge/web typecheck

# Production build
pnpm --filter @flybridge/web build
```

## Database (MongoDB Atlas)

```bash
# Promote an existing user to admin / moderator / user
# NOTE: user must have signed in via Google at least once first
pnpm --filter @flybridge/web promote <email> admin
pnpm --filter @flybridge/web promote <email> moderator
pnpm --filter @flybridge/web promote <email> user
```

Example: `pnpm --filter @flybridge/web promote dev@flybridgeedu.com admin`

Manual fallback (Atlas UI): edit the user document in the `users` collection and set `accountType` to `admin` | `moderator` | `user`.

### Troubleshooting: "Could not connect to Atlas"
Atlas blocks unknown IPs. Add your current IP:
1. https://cloud.mongodb.com → cluster → **Network Access** → **Add IP Address** → **Add Current IP Address**

## Firebase (Google login)

- Config lives in `apps/web/.env.local` under `NEXT_PUBLIC_FIREBASE_*` (from Firebase console → Project settings → Your apps)
- Web client ID: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Session signing secret: `AUTH_SECRET` (regenerate via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` if ever leaked)
- Authorized domains: Firebase console → **Authentication → Settings → Authorized domains** (`localhost` needed for local dev)

## Auth flow notes

- Google sign-in uses `signInWithRedirect` (avoids popup/COOP issues in Chrome)
- Public signups always create `accountType: user` / `subscription: free`
- Roles: `admin` / `moderator` / `user` — see `apps/web/src/lib/roles.ts`
- Dashboards: `/dashboard` (general user home), `/dashboard/seminars` (all / manage), `/dashboard/seminars/mine`, `/dashboard/courses`, `/dashboard/courses/mine`, `/dashboard/resources`, `/dashboard/resources/mine`, `/dashboard/settings` (profile settings), `/dashboard/moderator` (moderator+), `/dashboard/admin` (admin only)
- General user dashboard has web and mobile versions; mobile renders as a bottom-tab app shell (`apps/web/src/components/dashboard/user/mobile-user-app.tsx`)
- Admin can change roles/plans via the admin dashboard users table (writes directly to the `users` collection)

## Automations (nurture email sequence)

- **Seed on demand:** every visit to `/dashboard/admin/automations` runs `seedDefaultAutomations()` (`apps/web/src/lib/automation/seed.ts`). Seeded defaults never overwrite admin edits — an automation is only created if a doc with the same name doesn't exist yet.
- **New seeded campaigns (active by default):**
  - **12-day onboarding nurture** — one `user.registered` flow that sends: instant welcome → day-3 free-course nudge → day-6 free resources → day-9 readiness nudge → day-12 certificate push. Each step skips users who've already enrolled / downloaded / assessed / earned progress (DB-aware condition operators).
  - **Certificate push at 50% progress** — fires on `course.progress_updated` when a learner's course progress crosses 50% and they don't have a certificate yet.
  - Seeding also deactivates the legacy standalone **"Welcome email"** automation (replaced by the nurture's day-0 welcome) — admin can re-enable it from the UI.
- **Day-level delays:** the Delay node now supports hours/days (up to 365 days). Delays ≤ 1 min run inline; longer delays persist a pending run (`AutomationPending`) that the cron resumes.
- **Cron:** `vercel.json` runs `/api/cron/automations` daily (`0 0 * * *`). Guarded by `CRON_SECRET` (header `x-cron-secret` or `Authorization: Bearer <secret>`).
  - Set `CRON_SECRET` in Vercel (and `.env.local` for local runs).
  - Manual test: `curl -H "x-cron-secret: $CRON_SECRET" https://<site>/api/cron/automations`
- **DB-aware condition operators** (evaluate against the payload's `user.id`): `has_enrolled` (value = course slug, optional), `has_resource_download`, `has_readiness_run`, `has_certificate`, `progress_gte`, `progress_lt`.
- **New events:** `course.progress_updated` (emitted on quiz submit).
