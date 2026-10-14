import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { findAffiliateForSession } from "@/lib/affiliate";
import { Course } from "@/lib/models/course";
import { Seminar } from "@/lib/models/seminar";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { Resource } from "@/lib/models/resource";

export const dynamic = "force-dynamic";

type Product = {
  type: "course" | "seminar" | "mock-bundle" | "resource";
  id: string;
  title: string;
  path: string;
  paid: boolean;
};

function pricePositive(prices: unknown, fallback: unknown): boolean {
  const p = (prices ?? {}) as Record<string, unknown>;
  const anyPrice =
    (typeof p.BDT === "number" && p.BDT > 0) || (typeof p.USD === "number" && p.USD > 0);
  return anyPrice || (typeof fallback === "number" && fallback > 0);
}

/**
 * A catalogue of everything an affiliate can point a link at, so the dashboard
 * link builder does not make them hunt for a slug. Only published (or upcoming)
 * items are listed, since those are the ones a visitor can actually reach.
 */
export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();

    const affiliate = await findAffiliateForSession(session);
    if (!affiliate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [courses, seminars, bundles, resources] = await Promise.all([
      Course.find({ $or: [{ published: true }, { upcoming: true }] })
        .select("slug title price prices")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Seminar.find().select("title type price prices").sort({ dateTime: -1 }).limit(200).lean(),
      MockTestBundle.find({ published: true })
        .select("slug title price prices")
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      Resource.find().select("title price prices").sort({ releaseDate: -1 }).limit(200).lean(),
    ]);

    const products: Product[] = [
      ...courses.map((c) => ({
        type: "course" as const,
        id: c._id.toString(),
        title: c.title,
        path: `/programs/${c.slug}`,
        paid: pricePositive(c.prices, c.price),
      })),
      ...seminars.map((s) => ({
        type: "seminar" as const,
        id: s._id.toString(),
        title: s.title,
        path: `/seminars/${s._id.toString()}`,
        paid: s.type === "paid" && pricePositive(s.prices, s.price),
      })),
      ...bundles.map((b) => ({
        type: "mock-bundle" as const,
        id: b._id.toString(),
        title: b.title,
        path: `/mock-tests/${b._id.toString()}`,
        paid: pricePositive(b.prices, b.price),
      })),
      ...resources.map((r) => ({
        type: "resource" as const,
        id: r._id.toString(),
        title: r.title,
        path: `/resources/${r._id.toString()}`,
        paid: pricePositive(r.prices, r.price),
      })),
    ];

    return NextResponse.json({ products });
  } catch (error) {
    console.error("affiliate products GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
