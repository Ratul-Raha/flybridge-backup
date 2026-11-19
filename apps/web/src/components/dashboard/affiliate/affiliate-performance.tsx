"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  AffiliatePerformanceTable,
  type AffiliatePerformanceRow,
} from "@/components/dashboard/affiliate/affiliate-performance-table";

export function AffiliatePerformance() {
  const [rows, setRows] = useState<AffiliatePerformanceRow[]>([]);
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

  return (
    <div>
      <PageHeader
        title="Affiliate Performance"
        subtitle="Compare partner link traffic, attributed orders, and commissions by destination."
        action={
          <Link
            href="/dashboard/admin/affiliates"
            className="rounded-full border px-4 py-2 text-[13px] font-medium"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          >
            Manage affiliates
          </Link>
        }
      />

      <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <p className="mb-4 text-[12.5px]" style={{ color: "var(--body)" }}>
          Commission totals include pending, approved, and paid amounts; reversed commissions are excluded. Order value includes all attributed orders.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--body)" }}>
            <Loader2 size={16} className="animate-spin" /> Loading affiliate performance…
          </div>
        ) : error ? (
          <p className="text-[13px] font-medium" style={{ color: "#C0392B" }}>
            {error}
          </p>
        ) : (
          <AffiliatePerformanceTable
            rows={rows}
            showAffiliate
            emptyMessage="No affiliates are available yet."
          />
        )}
      </div>
    </div>
  );
}
