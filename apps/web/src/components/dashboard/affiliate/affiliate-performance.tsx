"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import {
  AffiliatePerformanceTable,
  type AffiliatePerformanceRow,
} from "@/components/dashboard/affiliate/affiliate-performance-table";

type SortField = "affiliate" | "clicks" | "orders" | "rate" | "orderValue" | "commission";
type SortDirection = "asc" | "desc";
type Amounts = Record<string, number>;

type AffiliateGroup = {
  affiliateId: string;
  name: string;
  code: string;
  status: string;
  currency: string;
  urls: AffiliatePerformanceRow[];
  visibleUrls: AffiliatePerformanceRow[];
  clicks: number;
  orders: number;
  orderValue: Amounts;
  commission: Amounts;
};

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-[10px] text-[14px] outline-none transition-colors focus:border-brand-2 focus:ring-2 focus:ring-brand-2/15";

function primaryCurrency(group: AffiliateGroup): string {
  if (group.orderValue[group.currency] !== undefined || group.commission[group.currency] !== undefined) {
    return group.currency;
  }
  return Object.keys(group.orderValue).sort()[0] || group.currency || "BDT";
}

function formatAmounts(amounts: Amounts, fallbackCurrency: string): string {
  const entries = Object.entries(amounts)
    .filter(([, amount]) => Number.isFinite(amount) && amount !== 0)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length
    ? entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" · ")
    : formatMoney(0, fallbackCurrency);
}

export function AffiliatePerformance() {
  const [rows, setRows] = useState<AffiliatePerformanceRow[]>([]);
  const [affiliateFilter, setAffiliateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
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
    const byAffiliate = new Map<string, AffiliateGroup>();
    for (const row of rows) {
      let group = byAffiliate.get(row.affiliateId);
      if (!group) {
        group = {
          affiliateId: row.affiliateId,
          name: row.affiliateName || "Affiliate",
          code: row.code || "",
          status: row.status || "active",
          currency: row.affiliateCurrency || "BDT",
          urls: [],
          visibleUrls: [],
          clicks: 0,
          orders: 0,
          orderValue: {},
          commission: {},
        };
        byAffiliate.set(row.affiliateId, group);
      }

      group.urls.push(row);
      group.clicks += row.clicks;
      group.orders += row.conversions;
      for (const [currency, totals] of Object.entries(row.currencies)) {
        group.orderValue[currency] = (group.orderValue[currency] ?? 0) + totals.orderTotal;
        group.commission[currency] = (group.commission[currency] ?? 0) + totals.commission;
      }
    }

    const query = search.trim().toLocaleLowerCase();
    const min = minOrders === "" ? null : Number(minOrders);
    const max = maxOrders === "" ? null : Number(maxOrders);

    return [...byAffiliate.values()]
      .filter((group) => affiliateFilter === "all" || group.affiliateId === affiliateFilter)
      .filter((group) => min === null || group.orders >= min)
      .filter((group) => max === null || group.orders <= max)
      .map((group) => {
        const affiliateMatches = `${group.name} ${group.code}`.toLocaleLowerCase().includes(query);
        const matchingUrls = !query || affiliateMatches
          ? group.urls
          : group.urls.filter((url) =>
              `${url.destination} ${url.link}`.toLocaleLowerCase().includes(query)
            );
        if (query && !affiliateMatches && matchingUrls.length === 0) return null;
        return { ...group, visibleUrls: matchingUrls };
      })
      .filter((group): group is AffiliateGroup => group !== null)
      .sort((a, b) => {
        const aRate = a.clicks ? a.orders / a.clicks : 0;
        const bRate = b.clicks ? b.orders / b.clicks : 0;
        const currencyA = primaryCurrency(a);
        const currencyB = primaryCurrency(b);
        const values: Record<SortField, [string | number, string | number]> = {
          affiliate: [a.name.toLocaleLowerCase(), b.name.toLocaleLowerCase()],
          clicks: [a.clicks, b.clicks],
          orders: [a.orders, b.orders],
          rate: [aRate, bRate],
          orderValue: [a.orderValue[currencyA] ?? 0, b.orderValue[currencyB] ?? 0],
          commission: [a.commission[currencyA] ?? 0, b.commission[currencyB] ?? 0],
        };
        const [left, right] = values[sortField];
        const comparison = typeof left === "string" && typeof right === "string"
          ? left.localeCompare(right)
          : Number(left) - Number(right);
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [affiliateFilter, maxOrders, minOrders, rows, search, sortDirection, sortField]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "affiliate" ? "asc" : "desc");
    }
  };

  const toggleExpanded = (affiliateId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(affiliateId)) next.delete(affiliateId);
      else next.add(affiliateId);
      return next;
    });
  };

  const sortHeader = (field: SortField, label: string, alignRight = false) => (
    <th
      key={field}
      scope="col"
      aria-sort={sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-3 font-medium ${alignRight ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1.5 ${alignRight ? "justify-end" : "justify-start"}`}
        style={{ color: "inherit" }}
      >
        {label}
        <span aria-hidden="true" className="font-mono text-[10px]">
          {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: "var(--line)" }}>
        <p className="mb-4 text-[12.5px]" style={{ color: "var(--body)" }}>
          Select an affiliate row to expand its URL breakdown. Click a column heading to sort. Order-count filters apply to each affiliate’s total. Order value includes attributed orders; commission excludes reversed orders.
        </p>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium" htmlFor="affiliate-performance-filter" style={{ color: "var(--ink)" }}>
              Affiliate
            </label>
            <select
              id="affiliate-performance-filter"
              value={affiliateFilter}
              onChange={(event) => setAffiliateFilter(event.target.value)}
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            >
              <option value="all">All affiliates</option>
              {affiliateOptions.map((affiliate) => (
                <option key={affiliate.affiliateId} value={affiliate.affiliateId}>
                  {affiliate.affiliateName || "Affiliate"} ({affiliate.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium" htmlFor="affiliate-performance-search" style={{ color: "var(--ink)" }}>
              Search affiliates or URLs
            </label>
            <input
              id="affiliate-performance-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, code, or destination"
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium" htmlFor="affiliate-performance-min-orders" style={{ color: "var(--ink)" }}>
              Min orders
            </label>
            <input
              id="affiliate-performance-min-orders"
              type="number"
              min="0"
              step="1"
              value={minOrders}
              onChange={(event) => setMinOrders(event.target.value)}
              placeholder="Any"
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium" htmlFor="affiliate-performance-max-orders" style={{ color: "var(--ink)" }}>
              Max orders
            </label>
            <input
              id="affiliate-performance-max-orders"
              type="number"
              min="0"
              step="1"
              value={maxOrders}
              onChange={(event) => setMaxOrders(event.target.value)}
              placeholder="Any"
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            />
          </div>
        </div>

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
            No affiliates match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
                  {sortHeader("affiliate", "Affiliate")}
                  {sortHeader("clicks", "Clicks", true)}
                  {sortHeader("orders", "Orders", true)}
                  {sortHeader("rate", "Order rate", true)}
                  {sortHeader("orderValue", "Order value")}
                  {sortHeader("commission", "Commission")}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const isExpanded = expanded.has(group.affiliateId);
                  const currency = primaryCurrency(group);
                  const rate = group.clicks ? (group.orders / group.clicks) * 100 : 0;
                  return (
                    <Fragment key={group.affiliateId}>
                      <tr
                        onClick={() => toggleExpanded(group.affiliateId)}
                        className="cursor-pointer border-b transition-colors hover:bg-[var(--bg-soft)]"
                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                      >
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(group.affiliateId);
                            }}
                            className="flex items-center gap-2 text-left"
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            <span>
                              <span className="block font-semibold">{group.name}</span>
                              <span className="mt-0.5 block font-mono text-[11px]" style={{ color: "var(--body)" }}>
                                {group.code} · {group.urls.length} URL{group.urls.length === 1 ? "" : "s"} · {group.status}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{group.clicks.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{group.orders.toLocaleString()}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{group.clicks ? `${rate.toFixed(1)}%` : "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{formatAmounts(group.orderValue, currency)}</td>
                        <td className="px-3 py-3 tabular-nums">{formatAmounts(group.commission, currency)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b" style={{ borderColor: "var(--line)" }}>
                          <td colSpan={6} className="bg-[var(--bg-soft)] px-2 py-3 sm:px-4">
                            <AffiliatePerformanceTable rows={group.visibleUrls} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
