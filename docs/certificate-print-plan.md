# Certificate Print-Ready Rendering — Plan

Status: deferred (not started). Frontend direct-download + fixed-width capture fix is done; this document covers the follow-ups.

## 1. Verified issues already fixed in code

- **Mobile "Download Certificate" opened a new tab** → now generates and saves the PDF in place (single tap, no second click, no popup).
- **PDF design differed between mobile and desktop** → the certificate is captured from a hidden, fixed `1000px`-wide DOM copy (`apps/web/src/lib/download-certificate-pdf.ts`), so `sm:`/`lg:` breakpoints and `vw` clamp fonts resolve identically on every device.
- `/dashboard/courses/{slug}/certificate/pdf` route was deleted as redundant.

## 2. Remaining QA that must be done on real devices

| Risk | Why it matters | How to verify |
|---|---|---|
| `html2canvas` capturing an off-screen element | Off-screen capture pattern is proven but is the least-tested part of the change | iPhone Safari + Android Chrome, real issued cert |
| Webfont rendering in the canvas clone | Playfair/Dancing Script must render with correct metrics | Diff the name/script lines against the desktop PDF |
| iOS Safari PDF UX | iOS opens PDFs in a Quick Look/preview instead of instantly saving to Files | Confirm a usable save action is reachable |
| Large-screen desktop | Aspect-ratio/capture at 1000px vs large `lg:` viewport | Verify PDF matches preview at 1440px wide |

Failures are contained (e.g. `onclone` width override, or temporarily parking the visible cert at 1000px during capture) — no redesign expected.

## 3. Python high-resolution print-ready renderer

Goal: produce a print-quality certificate image/PDF (~300–600 DPI) that is pixel-identical to the web design, independent of the user's browser. The browser's `html2canvas` path is capped at ~171–341 DPI to stay stable on phones; this tool is for real printing.

### Toolchain
- `playwright` (Chromium headless) — renders the real page with real fonts, CSS variables, gradients, and the QR-photo data URL intact.
- `Pillow` — image scaling / DPI tagging / JPEG output.
- `reportlab` — embed into a landscape PDF at 297×191.6 mm (matches `CERT_ASPECT = 1.55`).
- Driver script: `scripts/certificate-render.py` (repo-level `scripts/`, run on demand, auth via env).

### Approach
1. Launch Chromium headless with a fixed viewport of `1000 × 645` and `device_scale_factor: 4`
   → ~4000 px wide capture ≈ 342 DPI at 297 mm. Raise scale to 6 (~515 DPI) if memory allows.
2. Authenticate: inject a session cookie (or reuse the FBRIDGE session from an env var / `netscape` cookie file) so the eligibility gate passes for the target user.
3. Load `/dashboard/courses/{slug}/certificate`, wait for `networkidle`, `document.fonts.ready`, and the hidden capture element (`1000px` fixed-width div) to be present.
4. `locator.screenshot` the capture element only (no toolbars, no tab):
   - PNG at full res for archival/minilab printing.
   - JPEG (`quality=95`) for email/reportlab embedding.
5. `reportlab`: create an A4–landscape-equivalent page `297×191.6 mm`, draw the JPEG edge-to-edge → `FlyBridge-Certificate-{name}-print.pdf`.
6. CLI (target users/courses) reads JSON or CSV: `{courseSlug, userId or email, outDir}`.

### Print sizing (reference)
- 300 DPI at 297 mm → 3508 px wide; 600 DPI → 7016 px.
- Current web capture = 2000 px wide ≈ 171 DPI — fine on screen, not for high-end printing.

### Out of scope (unless asked)
- Server-side PDF streaming for end users (would require replicating the CSS art in a vector lib or a headless render pool — bigger change).
- Watermarks / variant templates.

## 4. Acceptance checklist
- [ ] PDF downloads directly on first tap (no tab) — iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari.
- [ ] Generated PDF visually identical on mobile and desktop for the same cert.
- [ ] Python renderer emits 300+ DPI PNG + print PDF matching the web design.
- [ ] QR code scans to the correct `/verify/{certId}` and the certificate verifies publicly.