# FlyBridge Ops Bot — Features & Implementation Plan

## Overview

The Ops Bot is an **AI-powered internal admin assistant** that lives inside the FlyBridge admin dashboard. It allows admin team members (2–5 people) to query business data and execute actions via natural language, with a full **Bot Control Panel** for visual configuration.

**Location:**
- Chat interface: `/dashboard/admin/ops-bot`
- Control panel: `/dashboard/admin/bot-config`

---

## Core Features

### 1. AI Chat Interface

A ChatGPT-style chat interface where admins type natural language and the bot either fetches data or performs actions using LLM function calling (tool use).

- **Model:** Groq `llama-3.3-70b-versatile` (supports function calling)
- **Streaming:** SSE streaming for real-time responses
- **Memory:** Conversation history stored in MongoDB, survives page refresh
- **Welcome:** Greeting message + quick-start suggestions

### 2. Tool System (Function Calling)

The bot has access to pre-built tools that query MongoDB and execute business actions. Tools are defined as JSON schemas and dispatched by the LLM.

#### Read-Only Tools (instant, no confirmation)

| Tool | Purpose | Example Prompt |
|---|---|---|
| `get_dashboard_summary` | Key metrics snapshot | "Give me an overview" |
| `search_users` | Filter users by criteria | "Find paid users who signed up this month" |
| `get_user_detail` | Full user profile | "Show me Ahmed's profile" |
| `get_orders` | Filter orders | "Show pending orders" |
| `get_revenue_report` | Revenue analytics | "Revenue this month vs last month" |
| `get_seminars` | List seminars | "What seminars are coming up?" |
| `get_courses` | List courses | "Which courses are most popular?" |
| `get_scholarships` | List scholarships | "Active scholarships from Canada" |
| `get_automations` | Automation status | "Which automations are running?" |
| `get_event_log` | Recent events | "Show recent events" |
| `get_readiness_stats` | Readiness analytics | "Readiness check statistics" |

#### Write Tools (require confirmation)

| Tool | Purpose | Safety |
|---|---|---|
| `create_seminar` | Create a new seminar | Confirm |
| `update_seminar` | Update seminar details | Confirm |
| `update_user` | Change user role/subscription | Confirm |
| `send_notification` | Send in-app notifications | Confirm |
| `toggle_automation` | Enable/disable automation | Confirm |
| `emit_event` | Manually trigger an event | Confirm |
| `update_course` | Update course properties | Confirm |
| `create_scholarship` | Create a scholarship | Confirm |
| `delete_user` | Delete a user + all data | Destructive (extra confirmation) |

#### Confirmation Flow

1. LLM returns `tool_call` with write action
2. Backend executes tool in "preview mode" → returns confirmation payload
3. Stream confirmation card to frontend (title, details, affected entities)
4. User clicks "Confirm" → frontend sends confirmation with run ID
5. Backend executes the actual write action
6. Audit log records the action

### 3. Conversation Memory

- Server-side conversation storage (MongoDB)
- Full message history within a session
- Context carryover ("What about the first one?" references previous result)
- New session = fresh start
- Conversation length configurable

### 4. Safety & Audit Trail

Every action logged in `BotAuditLog`:
- Who asked (admin user ID + name)
- What was asked (user message)
- What tool was called (tool name + parameters)
- Was it confirmed? (for write actions)
- Did it succeed? (result status)
- When (timestamp)

---

## Bot Control Panel

### Tab 1: Bot Persona & Personality

Configure the bot's identity and behavior:

| Setting | Type | Description |
|---|---|---|
| Bot Name | Text | e.g., "Bridge Ops", "FlyBot" |
| Avatar | Image upload | Shows in chat messages |
| Greeting Message | Text area | What the bot says on new conversation |
| Personality/Tone | Dropdown/sliders | Formal ↔ Casual, Concise ↔ Detailed |
| System Prompt | Advanced text area | Direct prompt editing with preview |
| Max Conversation Length | Number | Messages before suggesting new chat |

### Tab 2: Tool & Action Configuration

Visual configuration of all available tools:

| Setting | Per Tool |
|---|---|
| Enable/Disable | Toggle on/off |
| Display Name | Rename for admin view |
| Description | Hint text for AI |
| Access Level | Admin only / Admin + Moderator / All |
| Confirmation Required | Always / Never / Only destructive |
| Custom Instructions | Extra AI behavior notes |

### Tab 3: Rules & Policies Editor

Visual rules management (not chat-based):

| Field | Description |
|---|---|
| Title | Short name for the rule |
| Content | Policy text the bot follows |
| Category | Customer Service, Pricing, Content, Operations |
| Priority | High / Medium / Low |
| Status | Active / Draft / Disabled |

All active rules are injected into the bot's system prompt.

### Tab 4: Knowledge Base Management

File/document manager for knowledge sources:

| Source Type | How to Add |
|---|---|
| Text | Paste content directly |
| File | Upload PDF, TXT, MD files |
| URL | Paste a URL (scraped and indexed) |
| Database | Toggle which DB collections to reference |

### Tab 5: Conversation History

View all conversations with full chat logs:

- Filter by admin user, date range, tools used
- View full message history + tool calls + confirmations
- Export conversation logs as JSON/CSV

### Tab 6: Access Control

Per-user permission matrix:

| Permission | Description |
|---|---|
| Bot Access | Can they use the bot? |
| Read Tools | Can they query data? |
| Write Tools | Can they create/update? |
| Destructive Tools | Can they delete/refund? |
| Config Access | Can they change bot settings? |

### Tab 7: Channel Configuration

Connect the bot to external channels:

| Channel | Status |
|---|---|
| Web Widget | Active (admin dashboard) |
| WhatsApp | Configurable (Business API) |
| Telegram | Configurable (Bot Token) |
| Slack | Configurable (Slack App) |
| Email | Configurable (forwarded emails) |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Bot Control Panel                     │
│  Persona │ Tools │ Rules │ Knowledge │ History │ ...  │
└───────────────────────┬──────────────────────────────┘
                        │ reads config from
                        ▼
┌──────────────────────────────────────────────────────┐
│                   Bot Engine                          │
│  src/lib/ai/ops-bot.ts                               │
│                                                       │
│  1. Load BotConfig (persona, prompt)                  │
│  2. Load BotTools (enabled tools + schemas)           │
│  3. Load BotRules (active rules)                      │
│  4. Load BotKnowledge (relevant chunks)               │
│  5. Build system prompt from all of the above         │
│  6. Call LLM with tools parameter                     │
│  7. If tool_call → dispatch to tool handler           │
│  8. If confirm_needed → return preview payload        │
│  9. If text → stream text response                    │
└───────────────────────┬──────────────────────────────┘
                        │ uses
                        ▼
┌──────────────────────────────────────────────────────┐
│              Tool Implementations                     │
│  src/lib/ops/tools/*.ts                               │
│                                                       │
│  Each tool: validate → execute → format               │
│  Read tools: direct MongoDB queries                   │
│  Write tools: preview mode → confirm → execute        │
└───────────────────────┬──────────────────────────────┘
                        │ queries/modifies
                        ▼
┌──────────────────────────────────────────────────────┐
│                 MongoDB (existing)                     │
│  Users, Orders, Courses, Seminars, Scholarships,      │
│  Automations, Notifications, EventLogs                 │
└──────────────────────────────────────────────────────┘
```

---

## Data Models

### BotConfig
Stores bot persona and personality settings.

```typescript
{
  name: String,           // Bot name (default: "Bridge Ops")
  avatar: String,         // Avatar URL
  greeting: String,       // Greeting message
  tone: String,           // "formal" | "casual" | "balanced"
  detailLevel: String,    // "concise" | "detailed" | "balanced"
  systemPrompt: String,   // Base system prompt (editable)
  maxConversationLength: Number,  // Max messages per session
  updatedAt: Date,
}
```

### BotTool
Stores tool definitions and configuration.

```typescript
{
  toolId: String,         // Unique identifier (e.g., "get_dashboard_summary")
  name: String,           // Display name
  description: String,    // Description for AI
  category: String,       // "data" | "action"
  enabled: Boolean,       // Is tool active?
  confirmationRequired: String,  // "always" | "never" | "destructive"
  accessLevel: String,    // "admin" | "moderator" | "all"
  customInstructions: String,    // Extra AI notes
  parameters: Mixed,      // JSON schema for parameters
  isDestructive: Boolean, // Extra warning for destructive actions
}
```

### BotRule
Stores rules and policies.

```typescript
{
  title: String,          // Rule name
  content: String,        // Policy text
  category: String,       // "customer_service" | "pricing" | "content" | "operations"
  priority: String,       // "high" | "medium" | "low"
  status: String,         // "active" | "draft" | "disabled"
  createdBy: ObjectId,    // Ref User
}
```

### BotKnowledgeSource
Stores knowledge base entries.

```typescript
{
  name: String,           // Source name
  type: String,           // "text" | "file" | "url" | "database"
  content: String,        // Text content or file reference
  fileUrl: String,        // For file uploads
  url: String,            // For URL sources
  chunks: [{              // Pre-processed chunks
    text: String,
    tokens: String[],
  }],
  status: String,         // "active" | "processing" | "error"
  createdBy: ObjectId,    // Ref User
}
```

### BotConversation
Stores conversation sessions.

```typescript
{
  adminUser: ObjectId,    // Ref User
  title: String,          // Auto-generated from first message
  status: String,         // "active" | "archived"
  messageCount: Number,
  toolsUsed: [String],
  startedAt: Date,
  lastMessageAt: Date,
}
```

### BotMessage
Stores individual messages.

```typescript
{
  conversation: ObjectId, // Ref BotConversation
  role: String,           // "user" | "assistant" | "system"
  content: String,
  toolCalls: [{           // If assistant called tools
    toolId: String,
    parameters: Mixed,
    result: Mixed,
    status: String,       // "success" | "error" | "pending_confirmation"
    confirmed: Boolean,
  }],
  createdAt: Date,
}
```

### BotAccessPolicy
Stores per-user permissions.

```typescript
{
  user: ObjectId,         // Ref User
  botAccess: Boolean,     // Can use the bot
  readTools: Boolean,     // Can query data
  writeTools: Boolean,    // Can create/update
  destructiveTools: Boolean,  // Can delete
  configAccess: Boolean,  // Can change bot settings
  dailyMessageLimit: Number,  // 0 = unlimited
}
```

### BotAuditLog
Stores all bot actions.

```typescript
{
  adminUser: ObjectId,    // Ref User
  conversation: ObjectId, // Ref BotConversation
  message: String,        // User's original message
  toolId: String,         // Tool that was called
  parameters: Mixed,      // Tool parameters
  confirmed: Boolean,     // Was it confirmed?
  status: String,         // "success" | "error" | "cancelled"
  result: Mixed,          // Tool result
  error: String,          // Error message if failed
  durationMs: Number,     // Execution time
}
```

---

## File Structure

### New Files

```
apps/web/src/
├── app/
│   ├── dashboard/admin/
│   │   ├── ops-bot/
│   │   │   └── page.tsx              # Chat interface page
│   │   └── bot-config/
│   │       └── page.tsx              # Control panel page
│   └── api/admin/
│       ├── ops-bot/
│       │   └── route.ts              # Chat SSE endpoint
│       └── bot-config/
│           ├── route.ts              # GET/PUT bot config
│           ├── tools/
│           │   └── route.ts          # GET/PUT tools
│           ├── rules/
│           │   └── route.ts          # CRUD rules
│           ├── knowledge/
│           │   └── route.ts          # CRUD knowledge sources
│           ├── conversations/
│           │   ├── route.ts          # List conversations
│           │   └── [id]/
│           │       └── route.ts      # Get conversation detail
│           ├── access/
│           │   └── route.ts          # GET/PUT access policies
│           └── audit/
│               └── route.ts          # GET audit logs
├── components/
│   └── ops-bot/
│       ├── chat-interface.tsx         # Main chat UI
│       ├── message-bubble.tsx         # Message rendering
│       ├── confirmation-card.tsx      # Write action confirmation
│       ├── tool-call-display.tsx      # Collapsible tool call info
│       ├── config/
│       │   ├── persona-tab.tsx        # Persona settings
│       │   ├── tools-tab.tsx          # Tool configuration
│       │   ├── rules-tab.tsx          # Rules editor
│       │   ├── knowledge-tab.tsx      # Knowledge base
│       │   ├── conversations-tab.tsx  # Conversation history
│       │   ├── access-tab.tsx         # Access control
│       │   └── channels-tab.tsx       # Channel config
│       └── shared/
│           ├── config-tabs.tsx        # Tab navigation
│           └── empty-state.tsx        # Empty state component
├── lib/
│   ├── ai/
│   │   ├── ops-bot.ts                 # Core bot engine
│   │   ├── ops-tools.ts              # Tool definitions (schemas)
│   │   └── ops-tool-runner.ts        # Tool execution + dispatch
│   ├── ops/
│   │   └── tools/
│   │       ├── dashboard.ts          # get_dashboard_summary
│   │       ├── users.ts              # search_users, get_user_detail, update_user
│   │       ├── orders.ts             # get_orders, get_revenue_report
│   │       ├── courses.ts            # get_courses, update_course
│   │       ├── seminars.ts           # get_seminars, create_seminar, update_seminar
│   │       ├── scholarships.ts       # get_scholarships, create_scholarship
│   │       ├── notifications.ts      # send_notification
│   │       ├── automations.ts        # get_automations, toggle_automation
│   │       ├── events.ts             # get_event_log, emit_event
│   │       └── export.ts             # export_users_csv, export_orders_csv
│   └── models/
│       ├── bot-config.ts
│       ├── bot-tool.ts
│       ├── bot-rule.ts
│       ├── bot-knowledge.ts
│       ├── bot-conversation.ts
│       ├── bot-message.ts
│       ├── bot-access.ts
│       └── bot-audit-log.ts
```

### Modified Files

```
apps/web/src/components/dashboard/dashboard-layout.tsx
  - Add "Ops Bot" and "Bot Config" links to admin nav section
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create all 8 data models
- [ ] Seed default BotConfig and BotTools on first load
- [ ] Add models to db.ts imports

### Phase 2: Bot Engine
- [ ] Create tool definitions (JSON schemas)
- [ ] Build tool runner (dispatch + execute)
- [ ] Build core engine (system prompt generation, LLM call with tools, tool loop)
- [ ] Add function calling support to Groq provider

### Phase 3: Tool Implementations
- [ ] Read-only tools (dashboard, users, orders, courses, seminars, scholarships, automations, events)
- [ ] Write tools (create seminar, update user, send notification, etc.)

### Phase 4: API Routes
- [ ] POST /api/admin/ops-bot (chat SSE)
- [ ] GET/PUT /api/admin/bot-config (config CRUD)
- [ ] Tool, rule, knowledge, conversation, access, audit routes

### Phase 5: Chat Interface
- [ ] Chat UI page + components
- [ ] Message rendering with markdown
- [ ] Confirmation cards for write actions
- [ ] Tool call display (collapsible)
- [ ] Quick-start suggestions

### Phase 6: Control Panel
- [ ] Tab navigation component
- [ ] Persona tab
- [ ] Tools tab
- [ ] Rules tab
- [ ] Knowledge tab
- [ ] Conversations tab
- [ ] Access tab
- [ ] Channels tab

### Phase 7: Admin Navigation
- [ ] Add links to dashboard sidebar

---

## Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| LLM Model | `llama-3.3-70b-versatile` (Groq) | Supports function calling, fast, good reasoning |
| Function calling | OpenAI-compatible `tools` parameter | Both Groq and existing provider support this |
| Conversation storage | MongoDB (BotConversation + BotMessage) | Survives page refresh, no token waste |
| Confirmation flow | Preview → Confirm → Execute | Safe, auditable, user-controlled |
| Audit trail | BotAuditLog model | Every action logged |
| Admin-only access | `requireAdmin()` guard | Same pattern as existing admin routes |
| Chat UI | Client component with SSE streaming | Same pattern as existing Bridge chatbot |
| Knowledge injection | System prompt + retrieved chunks | Same RAG pattern as existing chat |

---

## API Endpoints

### Chat

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/admin/ops-bot` | Admin | Send message, receive SSE stream |
| POST | `/api/admin/ops-bot/confirm` | Admin | Confirm a write action |

### Config

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config` | Admin | Get bot persona config |
| PUT | `/api/admin/bot-config` | Admin | Update bot persona config |

### Tools

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config/tools` | Admin | List all tools with config |
| PUT | `/api/admin/bot-config/tools` | Admin | Update tool configuration |

### Rules

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config/rules` | Admin | List all rules |
| POST | `/api/admin/bot-config/rules` | Admin | Create a rule |
| PUT | `/api/admin/bot-config/rules/[id]` | Admin | Update a rule |
| DELETE | `/api/admin/bot-config/rules/[id]` | Admin | Delete a rule |

### Knowledge

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config/knowledge` | Admin | List knowledge sources |
| POST | `/api/admin/bot-config/knowledge` | Admin | Add knowledge source |
| PUT | `/api/admin/bot-config/knowledge/[id]` | Admin | Update knowledge source |
| DELETE | `/api/admin/bot-config/knowledge/[id]` | Admin | Delete knowledge source |

### Conversations

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config/conversations` | Admin | List all conversations |
| GET | `/api/admin/bot-config/conversations/[id]` | Admin | Get conversation with messages |

### Access

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config/access` | Admin | List access policies |
| PUT | `/api/admin/bot-config/access` | Admin | Update access policies |

### Audit

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/bot-config/audit` | Admin | List audit log entries |
