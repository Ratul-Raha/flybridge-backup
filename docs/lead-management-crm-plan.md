# Lead Management, CRM & Sales Funnels — Plan

**Status:** Planning  
**Goal:** Give the admin team a lightweight way to manage interested people, follow up, and understand how marketing activity leads to paid orders.

## Product direction

Build **CRM Lite** alongside funnel analytics. Keep lead follow-up, purchase records, and conversion reporting connected, but treat them as separate workflows.

FlyBridge primarily sells self-serve courses and learning resources. The initial CRM should make it easy to identify genuine interest and follow up thoughtfully, without treating every registered user as a sales lead or introducing a heavy traditional sales pipeline.

## Current state

- The admin dashboard already manages orders, refunds, coupons, and affiliates.
- **Growth & Sales** reports paid orders, refunds, revenue, products, campaigns, coupons, and course waitlist leads.
- Orders and course waitlists can store first- and last-touch marketing attribution.
- Course waitlists are the closest existing lead record. Users, waitlists, seminar registrations, and orders are stored separately.
- The automation system supports events such as user registration and order creation, as well as email and delay actions.
- Usage-event tracking is limited and requires a signed-in user. Checkout starts are sent to Meta but are not currently persisted as internal funnel events. As a result, the full anonymous visitor-to-purchase funnel cannot yet be measured reliably.

## 1. CRM Lite — manage people who have shown interest

Add a **Leads** area under **People**. A lead is a person who has expressed interest, for example by joining a waitlist, registering for a seminar, submitting an inquiry, or starting checkout. Account creation alone should not automatically mean sales-qualified lead.

### Lead list

- Search by name, email, or phone.
- Filter by status, product of interest, source/campaign, assigned owner, and follow-up date.
- Show last activity, purchase status, and overdue follow-ups.
- Provide a **Today / overdue** follow-up queue.

### Lead profile

- Contact details and source/marketing attribution.
- Products or courses of interest.
- Timeline of waitlists, seminar registrations, checkout attempts, orders, and staff activity.
- Internal notes and follow-up reminders.
- Quick email or WhatsApp action, subject to the team's preferred contact workflow and consent requirements.

### Initial statuses

`New → Contacted → Interested → Follow-up → Converted`

Additional outcomes: `Not interested` and `Unqualified`.

Lead status is operational CRM information and must remain separate from payment/order status. A person may be an interested lead, a customer, or both over time. Purchase status and revenue should be derived from the order records rather than manually maintained CRM fields.

### Contact identity

Use one contact profile per person and link it to a FlyBridge user account when one exists. Attach multiple product interests and orders to that profile rather than creating a separate contact for every waitlist or purchase. This should support future inquiry forms and manually added contacts without requiring a user account.

## 2. Funnels — measure the journey before building an editor

The term “funnel” can describe two related but distinct workflows:

1. **Marketing/conversion funnel:** how people progress from discovering FlyBridge to buying.
2. **Lead pipeline:** how staff follow up with interested people.

For the initial release, build a predefined conversion-funnel report rather than a visual funnel builder. The product and checkout flows already exist; building and editing pages or funnel steps would be a separate, larger feature.

### Initial conversion funnel

1. Campaign or landing-page visit.
2. Product detail viewed.
3. Sign-up, waitlist, or seminar registration.
4. Checkout started / pending order created.
5. Paid order completed.

Potential later steps include post-purchase engagement and repeat purchases.

### Tracking required

- Persist first-party events for the funnel steps, including an anonymous visitor/session identifier before sign-in.
- Associate anonymous activity with a contact when the person signs in or submits an identifiable lead form, where appropriate.
- Preserve source, medium, campaign, product, and relevant timestamps.
- Define deduplication and reporting rules so refreshes, retries, or repeated event delivery do not inflate counts.
- Report stage counts, step-to-step conversion rates, and drop-off by product and campaign.
- Keep BDT and USD reporting separate.
- Use completed/refunded order records as the financial source of truth. A checkout event is not a sale.
- Do not report ROAS or acquisition cost as factual metrics until ad-spend data is integrated or imported and reviewed.

## 3. Connect lead follow-up to existing sales tools

After CRM records and funnel events are established:

- Show pending checkouts and completed purchases on the contact timeline.
- Let staff record contact attempts and set the next follow-up date.
- Consider reminders and targeted email automation for new leads and abandoned checkouts.
- Connect campaign attribution to order revenue in Growth & Sales.
- Add ROAS or acquisition-cost reporting only when corresponding ad-spend data is available.

## Delivery phases

### Phase 0 — Agree on semantics

- Decide what events create a lead and whether account creation alone qualifies.
- Confirm the initial statuses and follow-up workflow.
- Decide whether staff contact leads through WhatsApp, phone, email, or a combination.
- Define funnel event names, counting rules, attribution behavior, and reporting calendar.

### Phase 1 — CRM Lite

- Create a unified contact/lead data layer, linked to a FlyBridge user when applicable.
- Build the admin lead list and contact detail/timeline.
- Add status, owner, internal notes, and follow-up reminders.
- Provide the Today / overdue queue and useful search/filtering.

### Phase 2 — Connect current records

- Link users, course waitlists, seminar registrations, and orders to the appropriate contact.
- Show product interest, source/attribution, and purchase history in the contact profile.
- Establish identity matching and duplicate handling rules.

### Phase 3 — First-party funnel events

- Record anonymous visits, product views, lead actions, checkout starts, and verified paid orders.
- Preserve attribution and associate events with contacts when identity becomes available.
- Add event deduplication and document metric definitions.

### Phase 4 — Funnel reporting and follow-up automation

- Report funnel counts, conversion rates, drop-off, and product/campaign breakdowns.
- Add suitable reminders or automation triggers after the underlying events are reliable.
- Consider ad-spend integration/import as a separate step before presenting ROAS or acquisition cost.

## Data and reporting principles

- Do not count every registered account as a lead by default; distinguish a contact from explicit product interest.
- Do not treat a pending checkout as a paid order.
- Use the verified order/refund ledger for financial metrics.
- Keep currencies separate unless an explicit exchange-rate policy is approved.
- Preserve existing first- and last-touch attribution and label missing attribution honestly.
- Keep CRM lead status separate from order status.
- Minimize contact data and respect the person's contact preferences and opt-outs.

## Decisions to confirm

1. Will staff actively follow up with leads through WhatsApp, phone, or email, or is the main goal reporting and automated nurture?
2. Which actions should create a lead: waitlist, seminar registration, inquiry, checkout start, or a combination? Should sign-up alone count?
3. Should funnels initially be measured through reports only, or should the admin also create/edit funnel steps or landing pages?

## Initial recommendation

Start with **CRM Lite plus measurable, predefined funnels**. Focus human follow-up on explicit interest rather than treating every registered user as a sales lead. Defer a visual funnel builder until the team has a clear need to create custom funnel steps or landing pages inside the admin dashboard.
