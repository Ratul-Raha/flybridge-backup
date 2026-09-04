"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { SectionCard, StatusPill } from "@/components/dashboard/automations/ui";

type AuditEntry = {
  id: string;
  adminUser: string;
  message: string;
  toolId: string;
  parameters: Record<string, unknown>;
  confirmed: boolean;
  status: string;
  error: string;
  durationMs: number;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  success: "#059669",
  error: "#DC2626",
  cancelled: "#A6ADC0",
  pending_confirmation: "#F59E0B",
};

export function AuditTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bot-config/audit")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <SectionCard title="Audit Log">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--body)" }}>
          <Loader2 size={16} className="animate-spin" />
          Loading audit log...
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Audit Log"
        subtitle="Every action the bot has taken, with full details"
      >
        {logs.length === 0 ? (
          <p className="text-[13px] py-4 text-center" style={{ color: "var(--body)" }}>
            No audit entries yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--body)" }}>Time</th>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--body)" }}>Admin</th>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--body)" }}>Tool</th>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--body)" }}>Message</th>
                  <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--body)" }}>Status</th>
                  <th className="text-left py-2 font-semibold" style={{ color: "var(--body)" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: "var(--body)" }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-2.5 pr-3" style={{ color: "var(--ink)" }}>
                      {log.adminUser}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px]"
                        style={{ background: "rgba(110,76,255,0.08)", color: "#6E4CFF" }}
                      >
                        {log.toolId}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 max-w-[200px] truncate" style={{ color: "var(--ink)" }}>
                      {log.message}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusPill
                        label={log.status}
                        color={STATUS_COLORS[log.status] ?? "#A6ADC0"}
                      />
                    </td>
                    <td className="py-2.5 whitespace-nowrap" style={{ color: "var(--body)" }}>
                      {log.durationMs ? `${log.durationMs}ms` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
