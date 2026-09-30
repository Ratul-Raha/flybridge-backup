/**
 * Permission catalog.
 *
 * `MODULES` is the single declaration of what can be permissioned in the
 * product. The admin roles & permissions screen renders straight from it, and
 * the server-side `can()` helper is meant to consume the same keys so the UI
 * and the enforcement layer can never drift apart.
 *
 * NOTE: enforcement is not wired up yet. Today every route still does an
 * inline `role === "admin" || role === "moderator"` check, so these keys
 * describe intent only. See `system.md`.
 */

export type PermissionAction = "view" | "create" | "edit" | "delete";

export const PERMISSION_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete"];

export type PermissionKey = `${string}.${PermissionAction}`;

export type PermissionModule = {
  /** Stable key used in permission maps, e.g. "courses" or "mock_tests". */
  key: string;
  label: string;
  /** One line explaining what the module covers, shown in the UI. */
  description: string;
  group: PermissionGroupId;
  /** Actions that make sense for this module. Delete is opt-in. */
  actions: PermissionAction[];
  /** Admin-only modules cannot be granted to moderators. */
  adminOnly?: boolean;
};

export type PermissionGroupId =
  | "content"
  | "members"
  | "commerce"
  | "platform"
  | "admin";

export const PERMISSION_GROUP_LABELS: Record<PermissionGroupId, string> = {
  content: "Content",
  members: "Members",
  commerce: "Commerce",
  platform: "Platform",
  admin: "Administration",
};

export const PERMISSION_GROUP_ORDER: PermissionGroupId[] = [
  "content",
  "members",
  "commerce",
  "platform",
  "admin",
];

const CRUD: PermissionAction[] = ["view", "create", "edit", "delete"];
const CRUD_NO_DELETE: PermissionAction[] = ["view", "create", "edit"];
const READ_ONLY: PermissionAction[] = ["view"];

export const PERMISSION_MODULES: PermissionModule[] = [
  // ── Content ────────────────────────────────────────────────────────────
  {
    key: "blogs",
    label: "Blogs",
    description: "Blog posts, drafts, publishing and AI generation.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "courses",
    label: "Courses",
    description: "Course catalogue, lessons, quizzes, enrollments and certificates.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "mock_tests",
    label: "Mock Tests",
    description: "Mock tests, question papers, grading and attempt review.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "mock_test_bundles",
    label: "Mock Test Bundles",
    description: "Grouped mock test packages sold together.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "resources",
    label: "Resources",
    description: "Downloadable files, books and study material.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "seminars",
    label: "Seminars",
    description: "Live seminars, scheduling and registrations.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "scholarships",
    label: "Scholarships",
    description: "Scholarship listings, parsing and applications.",
    group: "content",
    actions: CRUD,
  },
  {
    key: "success_stories",
    label: "Success Stories",
    description: "Student success stories published on the marketing site.",
    group: "content",
    actions: CRUD,
  },

  // ── Members ────────────────────────────────────────────────────────────
  {
    key: "users",
    label: "Users",
    description: "Member directory, profiles, plans and status.",
    group: "members",
    actions: ["view", "edit"],
  },
  {
    key: "user_email",
    label: "Bulk Email",
    description: "Send targeted email to members and cohorts.",
    group: "members",
    actions: ["view", "create"],
  },
  {
    key: "readiness",
    label: "Readiness Checks",
    description: "Study-abroad readiness assessments submitted by members.",
    group: "members",
    actions: READ_ONLY,
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Broadcast notifications to members.",
    group: "members",
    actions: CRUD_NO_DELETE,
  },

  // ── Commerce ───────────────────────────────────────────────────────────
  {
    key: "orders",
    label: "Orders",
    description: "Order list, payment status and retry metadata.",
    group: "commerce",
    actions: ["view", "edit"],
  },
  {
    key: "refunds",
    label: "Refunds",
    description: "Refund requests, approval and payment reversal.",
    group: "commerce",
    actions: CRUD,
  },
  {
    key: "discounts",
    label: "Discounts",
    description: "Coupon codes and campaign discounts.",
    group: "commerce",
    actions: CRUD,
  },

  // ── Platform ───────────────────────────────────────────────────────────
  {
    key: "uploads",
    label: "Media & Uploads",
    description: "Upload files to storage and delete existing assets.",
    group: "platform",
    actions: CRUD,
  },
  {
    key: "chat_knowledge",
    label: "Chat Knowledge",
    description: "Knowledge entries that answer visitor questions.",
    group: "platform",
    actions: CRUD,
  },

  // ── Administration (admin only) ────────────────────────────────────────
  {
    key: "roles",
    label: "Roles & Permissions",
    description: "Promote members, demote staff and configure moderator access.",
    group: "admin",
    actions: CRUD,
    adminOnly: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Traffic and revenue reporting.",
    group: "admin",
    actions: READ_ONLY,
    adminOnly: true,
  },
  {
    key: "payment_settings",
    label: "Payment Settings",
    description: "Payment provider configuration and live mode.",
    group: "admin",
    actions: CRUD,
    adminOnly: true,
  },
  {
    key: "automations",
    label: "Automations",
    description: "Trigger / condition / action workflows.",
    group: "admin",
    actions: CRUD,
    adminOnly: true,
  },
  {
    key: "email_templates",
    label: "Email Templates",
    description: "Overrides for transactional email templates.",
    group: "admin",
    actions: CRUD,
    adminOnly: true,
  },
  {
    key: "event_log",
    label: "Event Log",
    description: "Audit trail of system events.",
    group: "admin",
    actions: READ_ONLY,
    adminOnly: true,
  },
  {
    key: "ops_bot",
    label: "Ops Bot",
    description: "The admin AI assistant and its tool set.",
    group: "admin",
    actions: CRUD,
    adminOnly: true,
  },
  {
    key: "bot_config",
    label: "Bot Config",
    description: "Bot tone, rules, channels, tools and knowledge.",
    group: "admin",
    actions: CRUD,
    adminOnly: true,
  },
];

export const MODULE_KEYS = PERMISSION_MODULES.map((m) => m.key);

export const MODULE_BY_KEY: Record<string, PermissionModule> = Object.fromEntries(
  PERMISSION_MODULES.map((m) => [m.key, m]),
);

/** Modules a moderator can ever be granted. */
export const GRANTABLE_MODULES = PERMISSION_MODULES.filter((m) => !m.adminOnly);

/** module key -> action -> boolean */
export type PermissionSet = Record<string, Record<PermissionAction, boolean>>;

/** An all-false set for every module. */
export function emptyPermissionSet(): PermissionSet {
  const set: PermissionSet = {};
  for (const mod of PERMISSION_MODULES) {
    set[mod.key] = { view: false, create: false, edit: false, delete: false };
  }
  return set;
}

/**
 * The set a moderator has right now, expressed in permission terms. It mirrors
 * the inline checks currently in the routes so the UI shows the status quo
 * rather than an aspiration.
 */
export function currentModeratorPermissions(): PermissionSet {
  const set = emptyPermissionSet();
  const grant = (key: string, actions: PermissionAction[]) => {
    for (const action of actions) set[key][action] = true;
  };

  grant("blogs", CRUD);
  grant("courses", CRUD);
  grant("mock_tests", CRUD);
  grant("mock_test_bundles", CRUD);
  grant("resources", CRUD);
  grant("seminars", CRUD);
  grant("scholarships", CRUD);
  grant("success_stories", CRUD);

  grant("users", ["view", "edit"]);
  grant("user_email", ["view", "create"]);
  grant("readiness", ["view"]);

  grant("orders", ["view", "edit"]);
  grant("refunds", CRUD);

  grant("uploads", CRUD);
  grant("chat_knowledge", CRUD);

  return set;
}

export function countGranted(set: PermissionSet): number {
  let total = 0;
  for (const mod of PERMISSION_MODULES) {
    const row = set[mod.key];
    if (!row) continue;
    for (const action of PERMISSION_ACTIONS) if (row[action]) total += 1;
  }
  return total;
}

export function countModulesWithAny(set: PermissionSet): number {
  return PERMISSION_MODULES.filter((mod) => {
    const row = set[mod.key];
    return !!row && mod.actions.some((action) => row[action]);
  }).length;
}