# CRM Module — Plan & Status

**Status:** In progress
**Goal:** Give the admin team a lightweight CRM to manage interested people, follow up, and understand how marketing activity leads to paid orders.

This document replaces the earlier "Lead Management, CRM & Sales Funnels" plan. It records the current direction and, for each item, whether it is **done**, **in progress**, or **planned**.

## Product direction

FlyBridge primarily sells self-serve courses and learning resources. The CRM should make it easy to identify genuine interest and follow up thoughtfully, without treating every registered user as a sales lead or introducing a heavy traditional sales pipeline.

The CRM is a single module in the admin dashboard (sidebar entry **"CRM"**), organised into tabs:

1. **Leads** — the working lead list (table, filters, inline editing, bulk actions, CSV import, add/edit).
2. **Integrations** — lead sources beyond native signals; primarily **Google Forms**.

A dedicated **Settings** tab is deferred for now. Lead lists and custom fields are managed inline from the Leads tab (like the reference CRM).

## Current state (implemented)

- **Leads** model + admin list/detail pages, statuses, owner, follow-up reminders, notes, timeline of waitlists / seminar registrations / orders / staff activity. ✅
- Automatic lead creation from **course waitlist** and **seminar registration** signals. ✅
- Sidebar entry under Administration → People (was "Leads", now **"CRM"**). ✅

## Module structure

```
/dashboard/admin/crm                 → redirects to /leads
/dashboard/admin/crm/leads           → Leads tab (list)
/dashboard/admin/crm/leads/[id]      → Lead detail
/dashboard/admin/crm/integrations    → Integrations tab (Google Forms)
```

## Data model

| Model | Purpose | Status |
|---|---|---|
| `Lead` | Person of interest. Core identity + status + priority + custom field values. | ✅ (priority/custom fields in progress) |
| `LeadList` | Named list a lead belongs to; a default "General" list always exists. | ✅ |
| `LeadField` | Admin-defined custom input fields (text, select, date, checkbox, …) shown in the form + table. | In progress |
| `GoogleFormIntegration` | A configured Google Forms source: webhook key, field mapping, enabled flag. | Planned/in progress |

### Lead statuses

`new → contacted → interested → follow-up → converted` plus outcomes `not-interested` and `unqualified`.

Lead status is operational CRM information and stays separate from payment/order status. Purchase status and revenue are derived from order records, not CRM fields.

### Lead priorities

`low · medium · high · urgent` — a lightweight triage signal, independent of status.

## Leads tab (redesign)

Replaces the card list with a proper CRM table, mirroring the reference CRM:

- **Columns:** name/email, phone, source, status (inline edit), priority (inline edit), owner (inline edit), interest, follow-up date, created, actions.
- **Filters:** search, status, priority, source, owner, follow-up (overdue/today/upcoming/none).
- **Bulk actions:** change status / priority / owner, delete selected.
- **CSV import** with preview; **CSV export** of the current view.
- **Add/Edit lead** modal with core + custom fields.
- **Lead lists** selector + create/delete (inline).
- **Manage fields** dialog to add/toggle custom fields.

## Integrations tab — Google Forms

Webhook-based, no OAuth/service account required:

1. Admin creates an integration → a secret **webhook key** + URL is generated.
2. Admin pastes a generated **Apps Script snippet** into their Google Form, which forwards responses to the webhook URL.
3. Admin maps **form question titles → lead fields** (name, email, phone, and custom fields).
4. Incoming submissions create/enrich a lead (source `form`).

## Contact identity

One contact per person, linked to a FlyBridge user account when one exists. Multiple product interests and orders attach to that profile rather than separate contacts per signal.

## Funnels (unchanged, later phase)

A predefined conversion-funnel report, not a visual funnel builder:

1. Campaign / landing-page visit
2. Product detail viewed
3. Sign-up, waitlist, or seminar registration
4. Checkout started / pending order
5. Paid order completed

Tracking requires first-party funnel events (including anonymous session identifiers), attribution preservation, deduplication, and BDT/USD separation. Deferred until CRM records and funnel events are reliable.

## Delivery phases

- **Phase 0 — Agree on semantics** ✅
- **Phase 1 — CRM Lite** ✅ (list, detail, status/owner/notes/follow-up, signals)
- **Phase 1.5 — CRM module redesign** 🔄 (rename to CRM, tabs, table redesign, priority, custom fields, lead lists, CSV import, bulk actions, Google Forms webhook integration)
- **Phase 2 — Connect current records** ✅/🔄 (waitlists, seminar registrations, orders already linked; identity matching to be hardened)
- **Phase 3 — First-party funnel events** ⏳
- **Phase 4 — Funnel reporting and follow-up automation** ⏳

## Data and reporting principles

- Do not count every registered account as a lead by default.
- Do not treat a pending checkout as a paid order; use the order/refund ledger for financials.
- Keep currencies separate unless an exchange-rate policy is approved.
- Preserve first/last-touch attribution; label missing attribution honestly.
- Keep CRM lead status separate from order status.
- Minimise contact data and respect opt-outs.
