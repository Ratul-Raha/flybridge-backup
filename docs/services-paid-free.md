# FlyBridge — Third-Party Services: Paid vs Free

Inventory of every external service the platform depends on, with its cost model.
Sources: `apps/web/package.json`, `apps/web/.env.example`, `system.md`, `vercel.json`.
Prices checked Oct 2026 — always confirm your current plan in the provider dashboard.

## Paid (we spend money)

| Service | Used for | Cost model | Notes |
| --- | --- | --- | --- |
| **Vercel** | Hosting, deploys, cron (`vercel.json`), Image Optimizer, edge CDN | Pro $20/mo + metered usage (credit-based, overage pay-as-you-go) | Cannot be Hobby: commercial project, and `docs/vercel-mongodb-usage-reduction-plan.md` records ~$200/mo overage (1.21M function invocations, 2TB transfer) |
| **AWS S3** (`eu-north-1`) | Primary media storage — courses, resources, stories, PDFs, video (`lib/s3.ts`) | Pay per GB stored + egress + requests (no always-free tier) | Bandwidth cost driver; CloudFront signed URLs planned to cut egress (`docs/vercel-bandwidth-fix-plan.md`) |
| **Stripe** | International card payments for courses/seminars/resources | No monthly fee — per-transaction % + fixed fee | Keys/env in `.env.example` §Payments; live vs test mode toggled from admin |
| **EPS (eps.com.bd)** | Local BDT payments (bKash-style gateway) | No monthly fee — merchant commission per transaction | Sandbox free; production merchant credentials required |
| **MongoDB Atlas** | Primary database (Mongoose) | M0 free forever (512MB, 100 ops/s, 10GB transfer/7d) → M2 $9/mo, M5 $25/mo, M10+ ~$9+/mo | **Tier not recorded in repo** — if Atlas op counters are being watched for spend (`docs/vercel-mongodb-usage-reduction-plan.md`), likely paid tier; verify in Atlas console |
| **Resend** | All transactional + automation email | Free 3,000/mo (100/day) → Pro $20/mo = 50,000/mo, overage $0.90/1k | Automation email fan-outs (welcome, seminar confirmations, campaigns) burn volume fast |
| **Groq** (`GROQ_API_KEY`) | Default AI provider — chat widget, SOP generator, quizzes, grading, blog, ops bot | Free dev tier with rate limits → paid usage-based for production | Highest risk of silent cost/limit issues: AI is called on many user-facing paths |
| **x.ai (Grok)** (`GROK_API_KEY`) | Alternate AI provider (`lib/ai/grok.ts`) | Paid credits | Wired as placeholder/fallback, not the default |
| **Azure Speech** | IELTS speaking practice — speech-to-text + text-to-speech | Free F0 tier (~500k chars/mo) → paid per 1M chars | `microsoft-cognitiveservices-speech-sdk`, `/api/speech-token` |
| **Cloudinary** | Legacy media (avatars, seminar images, old resource files) | Free ~25 monthly credits → paid | `.env.example`: "legacy only"; new uploads go to S3 |
| **Domain (flybridgeedu.com)** | Production domain | Paid renewal (yearly) | Referenced as canonical `SITE_URL` throughout |

## Free

| Service | Used for | Notes |
| --- | --- | --- |
| **Firebase Auth** | Google sign-in (`signInWithRedirect`), server ID-token verification | Spark free tier — unlimited auth users. Auth only; Firestore/Storage/Hosting **not** used |
| **Google OAuth / Google Identity** | Sign-in client (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`) | Free |
| **Google Analytics 4 + Data API** | Site analytics + admin realtime traffic dashboard | Free (unlimited properties/events); service account or OAuth credentials |
| **Meta Pixel + Conversions API** | Ads tracking, server-side `Purchase` events | Free — you pay Meta only when running ads |
| **Telegram Bot API** | Ops/notification bot (`lib/notifications/telegram.ts`) | Free — bot token stored in app settings |
| **Web Push (VAPID)** | Browser push notifications (`web-push`, `pnpm gen-vapid`) | Free — self-hosted keys, delivery via browser vendor push services |
| **GitHub** | Source repo + Vercel integration | Free tier (public repo here; `LICENSE` present) |
| **Tooling** | Next.js 14, React 18, Tailwind, Turbo, pnpm, TypeScript, Mongoose, ECharts, Lucide, jose, Tailwind, pdf/qrcode libs | Open source — $0 |

## Cost hot spots (watch these)

1. **Vercel usage** — biggest bill; mitigations already shipped: S3 direct media serving, session/query caching, ISR 300s, notification poll 120s (`docs/vercel-mongodb-usage-reduction-plan.md`).
2. **S3 egress** — video/PDF downloads; CloudFront signed URLs pending.
3. **Resend volume** — automation fan-out writes one email per recipient on events.
4. **Groq AI calls** — chat widget on every page + quiz grading.
5. **MongoDB tier** — confirm whether you're on free M0 or a paid cluster.

## Env vars → service map

Defined in `apps/web/.env.example` (Firebase/Google OAuth vars are used in code but not yet listed there):

- `STRIPE_*`, `EPS_*` → Stripe, EPS
- `MONGODB_URI`, `MONGODB_DB` → MongoDB Atlas
- `RESEND_API_KEY`, `EMAIL_FROM` → Resend
- `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` → AWS S3
- `CLOUDINARY_*` → Cloudinary (legacy)
- `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` → Azure Speech
- `GROQ_API_KEY`, `AI_MODEL`, `AI_QUIZ_MODEL` → Groq; `GROK_API_KEY` → x.ai
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `GA4_*`, `GOOGLE_*` → Google Analytics
- `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN` → Meta
- `VAPID_*` → Web Push
- `NEXT_PUBLIC_FIREBASE_*` → Firebase Auth
