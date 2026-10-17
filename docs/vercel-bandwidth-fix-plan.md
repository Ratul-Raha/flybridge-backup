# FlyBridge Vercel Bandwidth & Video Delivery — Fix Plan

**Status:** Phase 1 (the bandwidth fix) is implemented in code; pending deploy and Vercel/AWS verification.

**Problem:** Vercel spend reached ~$200.85 against a $30 budget. Fast Data Transfer ($95.98) + Fast Origin Transfer ($102.43) = **98.8% of the bill**. Video bytes were being streamed *through* Vercel Functions instead of going straight from storage to the browser.

## Root cause

Both media routes piped object bytes from S3 through a Serverless Function:

- `apps/web/src/app/api/resources/[id]/file/route.ts` (resource videos/files, plus the public `?dl=1` downloads)
- `apps/web/src/app/api/courses/[id]/lessons/[index]/video/route.ts` (course lesson videos)

Per Vercel's definitions, moving bytes through a Function is billed **twice**:

- **Fast Origin Transfer** = data between the CDN and the Function (the Function's response body).
- **Fast Data Transfer** = data between the CDN and the visitor.

Both routes also sent `Cache-Control: private, no-store`, so nothing was ever cached, and the public resources grid mounted a `<video preload="metadata">` for **every** video card, producing a metadata-fetch per card per page load. That inflated Fast Origin Transfer relative to Fast Data Transfer (2 TB vs 1 TB) because aborted metadata streams still push bytes Function → CDN.

## Phase 1 — Stop proxying media (this deploy)

- [x] `presignGetUrl` / `signMediaUrl` accept an optional `contentDisposition` / `contentType` override (for downloads and MIME).
- [x] Resource file route: for `s3://` refs, sign a short-lived URL and **302 redirect** to S3 instead of streaming. Access checks (public/members/purchase) still run before signing.
- [x] Resource file route: legacy external URLs are validated (`assertSafeRedirectUrl`) and redirected directly, no proxying.
- [x] Resource file route: download tracking only counts non-Range requests, so video seeking/metadata probes no longer inflate download counts.
- [x] Course lesson video route: same presigned-redirect pattern; enrollment check and `recordLessonPlay` are preserved.
- [x] Public resources grid: replaced the per-card `<video>` with the thumbnail + play button. Only the watch dialog mounts a player.
- [x] Resource video player: `preload="metadata"` → `preload="none"`.

**Expected effect:** video bytes no longer traverse Vercel at all. Fast Origin Transfer for `/api/resources/*/file` and `/api/courses/*/video` should drop to near-zero (tiny 302s). Media egress moves to S3 (billed once). Playback/seek improves because S3 handles HTTP Range natively.

## Phase 2 — Cut the remaining Vercel-side bandwidth

- [ ] Put CloudFront (signed URLs / signed cookies) in front of the S3 bucket for cheaper egress and edge caching; point `presignGetUrl` output at the distribution.
- [ ] `next.config.js`: set `images.minimumCacheTTL` (default is 60 s) and constrain `sizes`/`quality` so the Image Optimizer stops re-fetching originals.
- [ ] Review ISR (`revalidate = 60` on `/`, `/programs`, `/blogs`) — Data Cache reads count as Fast Origin Transfer.
- [ ] Move the bundled `public/videos/intro.mp4` (2.25 MB) and `review_video.mp4` (2.5 MB) to S3/CloudFront.
- [ ] Trim `/api/resources` payload (concatenated list metadata) if it grows.

## Phase 3 — Guardrails

- [ ] Set a Vercel spend/budget alert; confirm whether auto-pause should be enabled.
- [ ] Add a lightweight regression check that `<video src>` on public pages resolves to S3/CloudFront, not `flybridge…/api/`.

## Rollback

Phase 1 is isolated to the two media routes, `lib/s3.ts`, `lib/storage.ts`, and the two resource components. Reverting the commit restores the streaming behaviour (and the cost).
