# FlyBridge Growth & Sales Analytics — Plan and Checklist

**Status:** Core attribution and the sales dashboard are implemented; Meta verification, custom dates, visit funnels, and ad-spend integration remain.

**Primary question:** Which marketing activity is creating paid orders and retained revenue?

## Business reporting principles

- **FlyBridge orders are the financial source of truth.** Gross sales include paid orders that were later refunded; show refund payouts separately and subtract them for net cash. Never combine BDT and USD without an explicit exchange-rate policy.
- **Keep attribution honest.** Store the first touch and latest non-direct touch captured by FlyBridge. Label missing campaign data as unattributed rather than guessing.
- **Meta is an advertising/optimization source, not our order ledger.** The Pixel and Conversions API help Meta optimize ads and report Meta-attributed conversions. Meta's attribution window can differ from our internal campaign attribution.
- **ROAS and acquisition cost require ad spend.** Pixel events alone do not include spend. Add Meta Marketing API data or a reviewed spend import before presenting ROAS/CAC as measured values.
- **Reporting calendar:** Asia/Dhaka business dates; store timestamps in UTC. Compare each selected period with the preceding period of the same length.

## Baseline audit

- [x] Confirm the admin Analytics page is a GA4 realtime traffic view, not a sales or campaign report.
- [x] Confirm GA4 is also loaded site-wide through `NEXT_PUBLIC_GA_MEASUREMENT_ID`; removing it from this dashboard does not automatically remove the site tag.
- [x] Confirm Meta Pixel sends `PageView` site-wide and currently has product/checkout events on limited surfaces.
- [x] Confirm completed orders send a server-side Meta `Purchase`, with per-order delivery status stored for troubleshooting.
- [x] Identify gaps: order records lack UTM fields, Meta cookie names need correction, seminar checkouts omit attribution, and the Purchase source URL is course-specific.
- [x] Confirm existing order summaries have basic sales metrics but no campaign-level revenue view.

## Phase 1 — Capture campaign attribution

- [x] Capture UTM fields plus stable campaign/ad-set/ad IDs from landing URLs.
- [x] Capture landing path, external referrer, `fbclid`, and `gclid`; infer a source only when reliable campaign parameters exist.
- [x] Preserve first touch and latest non-direct touch in a first-party cookie for 180 days, with bounded values.
- [x] Read Meta's standard `_fbc` and `_fbp` cookies and build an `fbc` fallback from a captured `fbclid` when needed.
- [x] Snapshot attribution and request context onto new orders across the general order route, seminar registration, and waitlist leads.
- [x] Preserve existing attribution when a pending order is retried; do not overwrite its original campaign with an unrelated later visit.
- [x] Correct the Meta Purchase `event_source_url` for courses, seminars, resources, and mock-test bundles.
- [x] Add tests for attribution parsing, cookie handling, and first/last-touch behavior.

### UTM convention for campaign links

- `utm_source`: `meta`, `google`, `newsletter`, or the partner/platform name.
- `utm_medium`: `paid_social`, `organic_social`, `paid_search`, `email`, or `referral`.
- `utm_campaign`: stable campaign name; `utm_content`: ad/creative name; `utm_term`: audience or keyword where applicable.
- Add stable `campaign_id`, `adset_id`, and `ad_id` URL parameters for later spend joins; keep names consistent between Facebook and Instagram placements.
- `fbclid` remains available for Meta event matching.
- Meta ad URL parameters example: `utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}`.

## Phase 2 — Complete key Meta events

- [x] Send `ViewContent` consistently from course, seminar, resource, and mock-bundle detail pages.
- [x] Send `InitiateCheckout` when a paid checkout is actually submitted across all product types; waitlist anchors are no longer mislabeled as checkouts.
- [x] Keep waitlist signup as `Lead` and send `Purchase` only from server-side order fulfillment.
- [x] Track `PageView` on client-side route changes and queue browser events until the Pixel loader initializes.
- [ ] Confirm the mock-bundle detail page is customer-accessible when published; the current route is staff-gated, so customer view events cannot be verified there yet.
- [ ] Verify values, currencies, content IDs, click IDs, and Purchase delivery/deduplication in Meta Events Manager.

## Phase 3 — Replace the GA4 realtime admin view

- [x] Replace the GA4 setup/realtime UI with a sales-focused Growth & Sales page; retain the global GA4 tag until separately decided.
- [x] Add preset periods: last 7 days, last 30 days, month-to-date, and previous month; a custom range remains a follow-up.
- [x] Add currency filters and keep currency totals separate.
- [x] Show paid orders, gross sales, net cash after refunds issued in-period, average order value, zero-value order records, and waitlist leads.
- [x] Show daily paid-order/revenue trends for the selected period and compare KPI values with the previous equivalent period.
- [x] Break down orders and revenue by source, medium, campaign, product, and coupon.
- [x] Show Meta Purchase delivery health so reported, failed, and unreported conversions are visible.
- [x] Exclude pending, failed, and cancelled orders from sales metrics; state the date basis and definitions in the UI.
- [ ] Count direct free enrollments that do not currently create an Order document.

## Phase 4 — Funnel and ad-spend reporting

- [ ] Decide whether to retain GA4 as a supplemental visit/session source or store a minimal first-party funnel (visits, product views, checkout starts, leads) for internal conversion rates.
- [ ] Add Meta campaign/ad-set spend, clicks, and impressions through the Marketing API or a reviewed import.
- [ ] Calculate campaign ROAS and cost per purchase only when spend and attribution coverage are available; disclose attribution differences from Ads Manager.
- [ ] Consider a weekly email summary after the dashboard metrics are trusted.

## Acceptance criteria

- [x] An admin can answer, for a selected week or month: paid orders, gross/net cash, refunds, best-selling products, and top attributable campaigns.
- [x] An order created from a tagged campaign retains its first and latest non-direct campaign across checkout and payment redirects.
- [x] Each checkout path uses the shared server-side Purchase fulfillment path and stores Meta delivery status.
- [x] Missing campaign data is visible as unattributed; totals are split by currency and use the order/refund ledger.
- [x] ROAS/CAC are not shown as factual metrics without corresponding ad-spend data.
