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
- Dashboards: `/dashboard/profile` (all), `/dashboard/moderator` (moderator+), `/dashboard/admin` (admin only)
- Admin can change roles/plans via the admin dashboard users table (writes directly to the `users` collection)
