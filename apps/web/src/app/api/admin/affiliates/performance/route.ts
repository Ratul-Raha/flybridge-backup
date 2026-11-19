import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Affiliate } from "@/lib/models/affiliate";
import {
  AFFILIATE_SITE_URL,
  affiliateTargetLink,
} from "@/lib/affiliate";
import { computeAffiliateLinkPerformance } from "@/lib/affiliate-stats";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const [affiliates, performance] = await Promise.all([
      Affiliate.find().select("name code status currency").sort({ name: 1 }).lean(),
      computeAffiliateLinkPerformance(),
    ]);

    const rowsByAffiliate = new Map<string, typeof performance>();
    for (const row of performance) {
      const rows = rowsByAffiliate.get(row.affiliateId) ?? [];
      rows.push(row);
      rowsByAffiliate.set(row.affiliateId, rows);
    }

    const rows = affiliates.flatMap((affiliate) => {
      const id = affiliate._id.toString();
      const links = rowsByAffiliate.get(id) ?? [];
      if (!links.some((row) => row.destination === "/")) {
        links.push({
          affiliateId: id,
          destination: "/",
          clicks: 0,
          conversions: 0,
          currencies: {},
        });
      }
      return links.map((row) => ({
        ...row,
        affiliateName: affiliate.name ?? "",
        code: affiliate.code,
        status: affiliate.status,
        affiliateCurrency: affiliate.currency ?? "BDT",
        link: affiliateTargetLink(AFFILIATE_SITE_URL, affiliate.code, row.destination),
      }));
    });
    rows.sort(
      (a, b) =>
        a.affiliateName.localeCompare(b.affiliateName) ||
        b.clicks - a.clicks ||
        a.destination.localeCompare(b.destination)
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("admin affiliate performance GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
