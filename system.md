# FlyBridge Education Group — System Overview

Current features and flows of the FlyBridge platform (web app in `apps/web`, Next.js 14 App Router + MongoDB).

## Architecture at a glance

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router), React 18, Tailwind CSS |
| Database | MongoDB (Mongoose), via Atlas |
| Auth | Google sign-in (Firebase Auth, `signInWithRedirect`), signed server session cookie (Jose JWT) |
| Email | Resend (transactional + automation emails) |
| Media | Cloudinary (uploads) |
| AI | Groq (default LLM provider), Grok (x.ai) wired as placeholder, streaming chat |
| Analytics | Google Analytics 4 (gtag via `@next/third-parties`) |

**Roles:** `user` (default), `moderator`, `admin` (assigned via the admin dashboard or a promote script).
**Subscriptions:** `free` (default), `paid` (role field only — no payment processor yet).

---

## 1. Public site

### Pages
| Route | Purpose |
| --- | --- |
| `/` | Marketing landing (hero, programs, courses, features, testimonials, success stories, CTA, promo popup) |
| `/about` | About FlyBridge |
| `/programs` | Course catalog — static list of programs (study visa, English, work permit, interview prep) |
| `/programs/[id]` | Program detail page with enroll/join CTA |
| `/courses` | Course listing (variant of programs content) |
| `/seminars` | Live seminar listing — upcoming & recent, search-free grid |
| `/seminars/[id]` | Seminar detail page (shareable, SEO metadata) |
| `/resources` | Resource library with category filters + search |
| `/resources/[id]` | Resource detail page (share/download) |
| `/success-stories` | Story gallery with video embeds |
| `/faq`, `/help`, `/terms`, `/privacy`, `/partnership`, `/login` | Static/content pages |

### Shared site components
- **Nav / Footer** with route links
- **Chat widget** (`/api/chat`) — AI assistant floating on every page; streams answers grounded in a knowledge base (KB articles), returns cited sources
- **Promo popup** — occasional promotional modal
- **Theme toggle** — light/dark

### Key flows
- **Visitor → member:** Register for a seminar with Gmail (account auto-created) or sign in via Google on any gated action → redirected into the dashboard.
- **Share:** every seminar and resource card has a copy-link share button; detail pages have a Share button too.

---

## 2. Seminars

### Public flow
1. `/seminars` lists all sessions, split into **Upcoming** and **Completed**, showing date, type (Free / Paid + price), description and join count.
2. Click a card → `/seminars/[id]` detail page: hero image, date/duration/joined stats, full description, **Register with Gmail**, **Join session** (external link if the seminar has a `url`), Share.
3. **Register flow:** modal asks for phone number → if signed in, registers instantly; otherwise triggers Google sign-in (account auto-created) → registration POSTs to `/api/seminars/[id]/register` → confirmation email sent → user redirected to their dashboard seminar page (`/dashboard/seminars/mine/[id]`).
4. Registration is idempotent per email ("already registered" state is handled).

### Dashboard flow (users)
- `/dashboard/seminars` — all seminars + registrations management (staff view).
- `/dashboard/seminars/mine` — the user's registered seminars with status tracking.
- `/dashboard/seminars/mine/[id]` — individual seminar tracking page (session link, progress).
- `/dashboard/seminars/[id]/registrations` — full registrant list for a seminar (moderator+).

### Management flow (admin / moderator)
- Create / edit / delete seminars via the dashboard (title, description, dateTime, image, type free/paid, price, url, duration).
- View registrations; delete individual registrations.
- Every create/update/delete fires an event (`seminar.created`, `seminar.updated`, `seminar.deleted`) which can trigger automations.

---

## 3. Resources

### Public flow
1. `/resources` — grid of cards (category filter chips + search box), each with file-type icon, category, release date, size, free/members badge.
2. Click a card → `/resources/[id]` detail page with Share and Download/Open-link actions.
3. **Download flow:** `/api/resources/[id]/file` proxies the file from Cloudinary with correct MIME + content-disposition; downloads are tracked in `ResourceDownload` (when signed in). Link-type resources redirect to the external URL. Paid ("members") resources require sign-in on the detail page (`/login?next=...`); the file endpoint itself does not gate access.

### Management flow (admin / moderator)
- Publish / edit / delete resources via the dashboard (`/dashboard/resources`): title, description, category, file type, file URL (uploaded via Cloudinary `/api/uploads`), thumbnail, release date, access (free/paid), price, featured flag.
- **Paid resources** appear in public list but downloads require login.
- Publishing fires `resource.created` event (automation trigger).

---

## 4. Programs & courses

- Static marketing content driven by `src/lib/programs.ts` (slug, badge, title, description, price in BDT, image).
- Detail page `/programs/[id]` renders the program with an enroll CTA.
- `course.launched` event exists as a manual trigger for automations (announcement emails).

---

## 5. Auth & accounts

### Flow
1. User clicks "Sign in with Google" (or registers for a seminar) → Firebase `signInWithRedirect` → ID token verified server-side (`verifyIdToken`) → user looked up/created in MongoDB → signed session cookie issued.
2. Session cookie carries role + userId; `readSession()` guards every gated API route and page.
3. Logout clears the session cookie.
4. New accounts default to `accountType: user`, `subscription: free`.

### Role gates
- `user` — own dashboard (seminars, courses, resources, settings, profile).
- `moderator` — everything user can, plus seminar/resource management and registrations.
- `admin` — everything above, plus user management, event log, reports, automations.

---

## 6. Dashboards

### User dashboard (`/dashboard`)
- Home: overview cards, quick links.
- **Seminars** — mine / all / registrations (see §2).
- **Courses** — mine / all.
- **Resources** — mine / all (download history).
- **Settings** — profile (name, email, phone, avatar via Cloudinary upload).
- **Profile** — public profile view.
- **Notifications** — in-app notification list (from automations).
- **SOP Generator** (`/dashboard/sop-generator`) — fills in study-abroad details and generates a Statement of Purpose via AI (signed-in only; `/api/sop-generator`).
- Mobile layout renders as a bottom-tab app shell.

### Moderator dashboard (`/dashboard/moderator`)
- Manage all seminars (CRUD + registrations).
- Manage all resources (CRUD).

### Admin dashboard (`/dashboard/admin`)
- **Users** (`/dashboard/admin/users`) — search, stats, change roles/subscriptions, per-user download tracking.
- **Events** (`/dashboard/admin/events`) — event log of all fired events.
- **Reports** (`/api/admin/reports/[report]`) — prebuilt analytics reports (registrations, users, etc.).
- **Automations** (`/dashboard/admin/automations`) — visual automation builder, run history.

---

## 7. Events & automations

### Events (`/api/events/emit`)
Emitted by the app and logged to the event log:
- `user.registered`
- `seminar.registration_created`
- `seminar.created` / `seminar.updated` / `seminar.deleted`
- `course.launched`
- `resource.created`

### Automation engine
- **Triggers:** any event above.
- **Nodes:** trigger → condition (field/operator/value against payload) → actions → end.
- **Actions:** send email (Resend; recipient from payload path, fixed list, or all users; template variables), create in-app notification, delay.
- **Builder UI:** admin can compose a graph (nodes + edges), enable/disable, and view run history with per-step timing and statuses (`/dashboard/admin/automations`).
- Built-in email templates exist for seminar confirmation, welcome, announcements, etc.

---

## 8. AI features

- **Chat widget** (all pages): streaming answers from the AI provider (Groq default), grounded in FlyBridge knowledge-base articles with cited sources.
- **SOP Generator** (signed-in): collects study details (level, program, country, background, goals) + tone/length options → drafts a full Statement of Purpose.

---

## 9. Notifications & email

- **Email (Resend):** seminar registration confirmation (automation), transactional emails, automation-sent campaigns.
- **In-app notifications:** created by automation actions, listed at `/dashboard/notifications` (read/unread).

---

## 10. Supporting systems

- **Uploads:** `/api/uploads` (Cloudinary) + `/api/uploads/delete` for images/files (avatars, seminar images, resource files).
- **Google Analytics:** GA4 tag loaded site-wide via `NEXT_PUBLIC_GA_MEASUREMENT_ID`; automatic pageview tracking.
- **Downloads tracking:** every resource file download by a signed-in user is recorded (visible in admin user detail).
- **Admin CLI:** `pnpm --filter @flybridge/web promote <email> <role>` to set roles manually.