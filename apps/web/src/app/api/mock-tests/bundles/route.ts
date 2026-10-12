import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestBundle, type MockTestBundleDoc } from "@/lib/models/mock-test-bundle";
import { MockTest } from "@/lib/models/mock-test";
import { sanitizePrices, cleanPrices } from "@/lib/pricing";
import { emitEvent } from "@/lib/events/emit";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type BundleSkills = Record<"reading" | "listening" | "writing" | "speaking", number>;

async function skillsFor(bundleIds: string[]): Promise<Map<string, BundleSkills>> {
  if (bundleIds.length === 0) return new Map();
  // Mongoose does NOT cast aggregation pipelines, so the ObjectIds must be
  // cast manually — otherwise every bundle reports 0 tests.
  const oids = bundleIds.map((id) => new mongoose.Types.ObjectId(id));
  const rows = await MockTest.aggregate([
    { $match: { bundle: { $in: oids } } },
    { $group: { _id: { bundle: "$bundle", skill: "$skill" }, count: { $sum: 1 } } },
  ]);
  const map = new Map<string, BundleSkills>();
  for (const row of rows) {
    const bundleId = row._id.bundle.toString();
    const skill = row._id.skill as keyof BundleSkills;
    const entry = map.get(bundleId) ?? {
      reading: 0,
      listening: 0,
      writing: 0,
      speaking: 0,
    };
    entry[skill] = row.count as number;
    map.set(bundleId, entry);
  }
  return map;
}

function toDto(b: MockTestBundleDoc, skills: BundleSkills | undefined) {
  const counts = skills ?? { reading: 0, listening: 0, writing: 0, speaking: 0 };
  return {
    id: b._id.toString(),
    title: b.title,
    slug: b.slug,
    description: b.description ?? "",
    badge: b.badge ?? "",
    image: b.image ?? null,
    price: b.price ?? 0,
    currency: b.currency ?? "USD",
    prices: cleanPrices(b.prices),
    featured: b.featured ?? false,
    published: b.published ?? false,
    testCount: counts.reading + counts.listening + counts.writing + counts.speaking,
    skills: counts,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  try {
    await connectDb();
    const session = await readSession();
    const manager = isManager(session);

    if (!manager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bundles = all
      ? await MockTestBundle.find().sort({ createdAt: -1 })
      : await MockTestBundle.find({ published: true }).sort({ createdAt: -1 });

    const skills = await skillsFor(bundles.map((b) => b._id.toString()));

    return NextResponse.json({
      bundles: bundles.map((b) => toDto(b, skills.get(b._id.toString()))),
    });
  } catch (error) {
    console.error("mock-test bundles GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const rawSlug =
      typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : slugify(title);
    const existing = await MockTestBundle.findOne({ slug: rawSlug });
    if (existing) {
      return NextResponse.json(
        { error: `A bundle with slug "${rawSlug}" already exists` },
        { status: 409 }
      );
    }

    const bundle = await MockTestBundle.create({
      slug: rawSlug,
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      badge: typeof body.badge === "string" ? body.badge.trim() : "",
      image: typeof body.image === "string" ? body.image.trim() || undefined : undefined,
      price: Math.max(0, Number(body.price) || 0),
      currency:
        typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : "USD",
      prices: sanitizePrices(body.prices),
      featured: body.featured === true,
      published: body.published === true,
      createdBy: session!.userId,
    });

    await emitEvent("mock-bundle.created", {
      bundle: {
        id: bundle._id.toString(),
        slug: bundle.slug,
        title: bundle.title,
        price: bundle.price,
        badge: bundle.badge,
      },
      actor: { name: session?.name, email: session?.email, userId: session?.userId },
    });

    return NextResponse.json(
      { bundle: toDto(bundle as MockTestBundleDoc, undefined) },
      { status: 201 }
    );
  } catch (error) {
    console.error("mock-test bundles POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}