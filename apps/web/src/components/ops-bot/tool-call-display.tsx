"use client";

import { Wrench, Loader2 } from "lucide-react";

type ToolCallInfo = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

const TOOL_LABELS: Record<string, string> = {
  get_dashboard_summary: "Dashboard Summary",
  search_users: "Search Users",
  get_user_detail: "User Detail",
  get_orders: "Orders",
  get_revenue_report: "Revenue Report",
  get_seminars: "Seminars",
  get_courses: "Courses",
  get_scholarships: "Scholarships",
  get_automations: "Automations",
  get_event_log: "Event Log",
  get_readiness_stats: "Readiness Stats",
  create_seminar: "Create Seminar",
  update_seminar: "Update Seminar",
  update_user: "Update User",
  send_notification: "Send Notification",
  toggle_automation: "Toggle Automation",
  emit_event: "Emit Event",
  update_course: "Update Course",
  create_scholarship: "Create Scholarship",
  delete_user: "Delete User",
};

export function ToolCallDisplay({ toolCall }: { toolCall: ToolCallInfo }) {
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name;
  const hasParams = Object.keys(toolCall.arguments).length > 0;

  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11.5px]"
      style={{ background: "rgba(110,76,255,0.06)", color: "#6E4CFF" }}
    >
      <Wrench size={12} />
      <span className="font-medium">{label}</span>
      <Loader2 size={11} className="animate-spin opacity-50" />
      {hasParams && (
        <span className="text-[10px] opacity-60 truncate max-w-[200px]">
          {Object.entries(toolCall.arguments)
            .map(([k, v]) => `${k}=${typeof v === "string" ? v.slice(0, 20) : JSON.stringify(v).slice(0, 15)}`)
            .join(", ")}
        </span>
      )}
    </div>
  );
}
