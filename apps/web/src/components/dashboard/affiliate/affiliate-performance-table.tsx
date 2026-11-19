import { formatMoney } from "@/lib/pricing";

export type AffiliatePerformanceRow = {
  affiliateId: string;
  affiliateName?: string;
  code?: string;
  status?: string;
  destination: string;
  link: string;
  clicks: number;
  conversions: number;
  currencies: Record<
    string,
    {
      conversions: number;
      orderTotal: number;
      commission: number;
      pending: number;
      approved: number;
      paid: number;
      reversed: number;
    }
  >;
};

export function AffiliatePerformanceTable({
  rows,
  showAffiliate = false,
  emptyMessage = "No tracked affiliate link visits yet.",
}: {
  rows: AffiliatePerformanceRow[];
  showAffiliate?: boolean;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-[13px]" style={{ color: "var(--body)" }}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--line)", color: "var(--body)" }}>
            {showAffiliate && <th className="px-3 py-3 font-medium">Affiliate</th>}
            <th className="px-3 py-3 font-medium">Destination</th>
            <th className="px-3 py-3 font-medium">Affiliate URL</th>
            <th className="px-3 py-3 text-right font-medium">Clicks</th>
            <th className="px-3 py-3 text-right font-medium">Orders</th>
            <th className="px-3 py-3 text-right font-medium">Order rate</th>
            <th className="px-3 py-3 font-medium">Order value</th>
            <th className="px-3 py-3 font-medium">Commission</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const currencies = Object.entries(row.currencies).sort(([a], [b]) => a.localeCompare(b));
            return (
              <tr
                key={`${row.affiliateId}:${row.destination}`}
                className="border-b last:border-b-0"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                {showAffiliate && (
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium">{row.affiliateName || "Affiliate"}</p>
                    <p className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--body)" }}>
                      {row.code ?? ""}
                      {row.status && row.status !== "active" ? ` · ${row.status}` : ""}
                    </p>
                  </td>
                )}
                <td className="max-w-[220px] px-3 py-3 align-top">
                  <span className="break-all">{row.destination === "/" ? "Homepage" : row.destination}</span>
                </td>
                <td className="max-w-[260px] px-3 py-3 align-top">
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all font-mono text-[11px] underline decoration-dotted underline-offset-2"
                    style={{ color: "var(--brand)" }}
                  >
                    {row.link}
                  </a>
                </td>
                <td className="px-3 py-3 text-right align-top tabular-nums">{row.clicks.toLocaleString()}</td>
                <td className="px-3 py-3 text-right align-top tabular-nums">{row.conversions.toLocaleString()}</td>
                <td className="px-3 py-3 text-right align-top tabular-nums">
                  {row.clicks ? `${((row.conversions / row.clicks) * 100).toFixed(1)}%` : "—"}
                </td>
                <td className="px-3 py-3 align-top">
                  {currencies.length ? (
                    <div className="flex flex-col gap-1">
                      {currencies.map(([currency, totals]) => (
                        <span key={currency} className="whitespace-nowrap tabular-nums">
                          {formatMoney(totals.orderTotal, currency)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "var(--body)" }}>—</span>
                  )}
                </td>
                <td className="px-3 py-3 align-top">
                  {currencies.length ? (
                    <div className="flex flex-col gap-1">
                      {currencies.map(([currency, totals]) => (
                        <span key={currency} className="whitespace-nowrap tabular-nums">
                          {formatMoney(totals.commission, currency)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "var(--body)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
