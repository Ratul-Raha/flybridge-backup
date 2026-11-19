"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AffiliatePerformanceTable,
  type AffiliatePerformanceRow,
} from "@/components/dashboard/affiliate/affiliate-performance-table";

export function AffiliatePerformance() {
  const [rows, setRows] = useState<AffiliatePerformanceRow[]>([]);
  const [affiliateFilter, setAffiliateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/affiliates/performance", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load affiliate performance");
      setRows(data.rows ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load affiliate performance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const affiliateOptions = useMemo(() => {
    const unique = new Map<string, AffiliatePerformanceRow>();
    for (const row of rows) {
      if (!unique.has(row.affiliateId)) unique.set(row.affiliateId, row);
    }
    return [...unique.values()].sort((a, b) =>
      (a.affiliateName ?? "").localeCompare(b.affiliateName ?? "")
    );
  }, [rows]);

  const groups = useMemo(() => {
    const filtered = affiliateFilter === "all"
      ? rows
      : rows.filter((row) => row.affiliateId === affiliateFilter);
    const byAffiliate = new Map<string, {
      affiliateId: string;
      name: string;
      code: string;
      status: string;
      rows: AffiliatePerformanceRow[];
    }>();

    for (const row of filtered) {
      let group = byAffiliate.get(row.affiliateId);
      if (!group) {
        group = {
          affiliateId: row.affiliateId,
          name: row.affiliateName || "Affiliate",
          code: row.code || "",
          status: row.status || "active",
          rows: [],
        };
        byAffiliate.set(row.affiliateId, group);
      }
      group.rows.push(row);
    }

    return [...byAffiliate.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [affiliateFilter, rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <p className="mb-4 text-[12.5px]" style={{ color: "var(--body)" }}>
          Commission totals include pending, approved, and paid amounts; reversed commissions are excluded. Order value includes all attributed orders.
        </p>
        <label className="mb-2 block text-[12.5px] font-medium" htmlFor="affiliate-performance-filter" style={{ color: "var(--ink)" }}>
          Filter by affiliate
        </label>
        <select
          id="affiliate-performance-filter"
          value={affiliateFilter}
          onChange={(event) => setAffiliateFilter(event.target.value)}
          className="mb-5 min-w-[260px] rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          <option value="all">All affiliates</option>
          {affiliateOptions.map((affiliate) => (
            <option key={affiliate.affiliateId} value={affiliate.affiliateId}>
              {affiliate.affiliateName || "Affiliate"} ({affiliate.code})
            </option>
          ))}
        </select>

        {loading ? (
          <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
            <Loader2 size={16} className="animate-spin" /> Loading affiliate performance…
          </div>
        ) : error ? (
          <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>
            {error}
          </p>
        ) : groups.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--body)" }}>
            No affiliates are available yet.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((group) => (
              <section
                key={group.affiliateId}
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--line)" }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3"
                  style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
                >
                  <div>
                    <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      {group.name}
                    </h2>
                    <p className="mt-0.5 font-mono text-[11.5px]" style={{ color: "var(--body)" }}>
                      {group.code}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                    style={group.status === "active"
                      ? { color: "#065F46", background: "rgba(20,181,126,0.12)" }
                      : { color: "#92400E", background: "rgba(217,119,6,0.12)" }}
                  >
                    {group.status}
                  </span>
                </div>
                <div className="p-2 sm:p-3">
                  <AffiliatePerformanceTable rows={group.rows} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
