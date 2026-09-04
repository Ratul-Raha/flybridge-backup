export type ToolParameterProperty = {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
};

export const OPS_TOOLS: ToolDefinition[] = [
  {
    name: "get_dashboard_summary",
    description: "Get a high-level overview of the FlyBridge business: total users, revenue, enrollments, orders, seminars, and key trends. Use when the user asks for a summary, overview, or general business status.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_users",
    description: "Search and filter FlyBridge users. Returns a paginated list with stats. Use when the user asks about specific users or groups of users.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search by name, email, or phone" },
        accountType: { type: "string", enum: ["admin", "moderator", "user"], description: "Filter by account type" },
        subscription: { type: "string", enum: ["free", "paid"], description: "Filter by subscription tier" },
        sortBy: { type: "string", enum: ["newest", "oldest", "name"], description: "Sort order" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_user_detail",
    description: "Get detailed information about a specific user, including their enrollments, orders, readiness scores, and activity. Use when the user asks about a specific person.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "User email, name, or ID to look up" },
      },
      required: ["identifier"],
    },
  },
  {
    name: "get_orders",
    description: "Search and filter orders. Returns order list with totals and status. Use when the user asks about orders, purchases, or payments.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "completed", "failed", "cancelled", "refunded"], description: "Filter by order status" },
        days: { type: "number", description: "Look back N days (default 30)" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_revenue_report",
    description: "Get revenue analytics: total revenue, average order value, monthly trends, top items by revenue. Use when the user asks about money, revenue, or financial performance.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look back N days (default 30)" },
      },
    },
  },
  {
    name: "get_seminars",
    description: "List seminars with registration counts. Use when the user asks about seminars, events, or upcoming sessions.",
    parameters: {
      type: "object",
      properties: {
        upcoming: { type: "string", enum: ["true", "false"], description: "Filter upcoming vs past seminars" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_courses",
    description: "List courses with enrollment counts and ratings. Use when the user asks about courses, classes, or learning content.",
    parameters: {
      type: "object",
      properties: {
        sortBy: { type: "string", enum: ["popular", "newest", "rating"], description: "Sort order" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_scholarships",
    description: "List scholarships. Use when the user asks about scholarships, grants, or financial aid.",
    parameters: {
      type: "object",
      properties: {
        country: { type: "string", description: "Filter by country" },
        activeOnly: { type: "string", enum: ["true", "false"], description: "Only show active scholarships (default true)" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
    },
  },
  {
    name: "get_automations",
    description: "List automation workflows with their status and recent run history. Use when the user asks about automations, workflows, or email sequences.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_event_log",
    description: "View recent system events. Use when the user asks about events, activity logs, or what happened recently.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default 20)" },
      },
    },
  },
  {
    name: "get_readiness_stats",
    description: "Get readiness check analytics: average scores, distribution, common issues. Use when the user asks about readiness checks or student preparedness.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "number", description: "Look back N days (default 30)" },
      },
    },
  },
  {
    name: "create_seminar",
    description: "Create a new seminar. REQUIRES CONFIRMATION. Use when the user wants to add a new seminar, event, or session.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Seminar title" },
        description: { type: "string", description: "Seminar description" },
        dateTime: { type: "string", description: "Date and time (ISO 8601 format)" },
        type: { type: "string", enum: ["free", "paid"], description: "Free or paid seminar" },
        price: { type: "number", description: "Price for paid seminars" },
        duration: { type: "string", description: "Duration (e.g. '90 min')" },
        url: { type: "string", description: "Meeting URL" },
      },
      required: ["title", "dateTime"],
    },
  },
  {
    name: "update_seminar",
    description: "Update an existing seminar's details. REQUIRES CONFIRMATION. Use when the user wants to modify a seminar.",
    parameters: {
      type: "object",
      properties: {
        seminarId: { type: "string", description: "Seminar ID or title to identify which seminar to update" },
        title: { type: "string", description: "New title" },
        description: { type: "string", description: "New description" },
        dateTime: { type: "string", description: "New date/time (ISO 8601)" },
        type: { type: "string", enum: ["free", "paid"], description: "New type" },
        price: { type: "number", description: "New price" },
        duration: { type: "string", description: "New duration" },
        url: { type: "string", description: "New meeting URL" },
      },
      required: ["seminarId"],
    },
  },
  {
    name: "update_user",
    description: "Change a user's role or subscription tier. REQUIRES CONFIRMATION. Use when the user wants to promote, demote, or change a user's access level.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "User email, name, or ID" },
        accountType: { type: "string", enum: ["admin", "moderator", "user"], description: "New account type" },
        subscription: { type: "string", enum: ["free", "paid"], description: "New subscription tier" },
      },
      required: ["identifier"],
    },
  },
  {
    name: "send_notification",
    description: "Send an in-app notification to users. REQUIRES CONFIRMATION. Use when the user wants to notify users about something.",
    parameters: {
      type: "object",
      properties: {
        recipientType: { type: "string", enum: ["all", "paid", "free", "admins", "moderators"], description: "Who to notify" },
        title: { type: "string", description: "Notification title" },
        message: { type: "string", description: "Notification message" },
      },
      required: ["recipientType", "title", "message"],
    },
  },
  {
    name: "toggle_automation",
    description: "Enable or disable an automation workflow. REQUIRES CONFIRMATION. Use when the user wants to turn an automation on or off.",
    parameters: {
      type: "object",
      properties: {
        automationId: { type: "string", description: "Automation ID or name" },
        active: { type: "string", enum: ["true", "false"], description: "Enable or disable" },
      },
      required: ["automationId", "active"],
    },
  },
  {
    name: "emit_event",
    description: "Manually trigger a system event. REQUIRES CONFIRMATION. Use when the user wants to manually fire an event (e.g., for testing automations).",
    parameters: {
      type: "object",
      properties: {
        eventName: {
          type: "string",
          enum: [
            "user.registered",
            "seminar.created",
            "seminar.updated",
            "seminar.deleted",
            "course.launched",
            "course.created",
            "course.updated",
            "course.deleted",
            "resource.created",
            "scholarship.created",
          ],
          description: "Event to trigger",
        },
        payloadDescription: { type: "string", description: "Description of the payload data for the event" },
      },
      required: ["eventName"],
    },
  },
  {
    name: "update_course",
    description: "Update a course's properties. REQUIRES CONFIRMATION. Use when the user wants to modify a course.",
    parameters: {
      type: "object",
      properties: {
        courseSlug: { type: "string", description: "Course slug or title to identify which course" },
        published: { type: "string", enum: ["true", "false"], description: "Publish or unpublish" },
        featured: { type: "string", enum: ["true", "false"], description: "Feature or unfeature" },
        upcoming: { type: "string", enum: ["true", "false"], description: "Mark as upcoming" },
        price: { type: "number", description: "New price" },
      },
      required: ["courseSlug"],
    },
  },
  {
    name: "create_scholarship",
    description: "Create a new scholarship entry. REQUIRES CONFIRMATION. Use when the user wants to add a scholarship.",
    parameters: {
      type: "object",
      properties: {
        institution: { type: "string", description: "Institution name" },
        title: { type: "string", description: "Scholarship title" },
        description: { type: "string", description: "Description" },
        country: { type: "string", description: "Country" },
        amount: { type: "string", description: "Amount (e.g. '$10,000')" },
        deadline: { type: "string", description: "Application deadline" },
        eligibility: { type: "string", description: "Eligibility criteria" },
        applyUrl: { type: "string", description: "Application URL" },
      },
      required: ["institution", "title"],
    },
  },
  {
    name: "delete_user",
    description: "Permanently delete a user and ALL their data. DESTRUCTIVE - REQUIRES EXPLICIT CONFIRMATION. This cannot be undone. Use only when the user explicitly asks to delete a specific user.",
    parameters: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "User email, name, or ID to delete" },
      },
      required: ["identifier"],
    },
  },
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return OPS_TOOLS.find((t) => t.name === name);
}

export function getToolSchemaForLLM(): Array<{
  type: "function";
  function: ToolDefinition;
}> {
  return OPS_TOOLS.map((tool) => ({
    type: "function" as const,
    function: tool,
  }));
}
