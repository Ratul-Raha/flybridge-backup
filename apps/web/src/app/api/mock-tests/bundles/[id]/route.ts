import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestBundle, type MockTestBundleDoc } from "@/lib/models/mock-test-bundle";
import { MockTest, type MockTestDoc } from "@/lib/models/mock-test";
import { Course } from "@/lib/models/course";
import { sanitizePrices, cleanPrices } from "@/lib/pricing";
import {
  resolveMockTestOwnership,
  testIsOwned,
  type MockTestOwnership,
} from "@/lib/mock-tests";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

type StaffTest = Omit<MockTestDoc, "bundle" | "course"> & {
  bundle: MockTestDoc["bundle"] | string;
  course?: MockTestDoc["course"];
};

type TestDto = {
  id: string;
  course: { id: string; title: string; slug: string } | null;
  title: string;
  skill: string;
  status: string;
  durationMinutes: number;
  questionCount: number;
  order: number;
  owned: boolean;
};

function toDto(b: MockTestBundleDoc, skills?: { reading: number; listening: number; writing: number; speaking: number }) {
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

async function toTestDto(
  test: StaffTest,
  ownership: MockTestOwnership | null,
  courseMap: Map<string, { id: string; title: string; slug: string }>
): Promise<TestDto> {
  const courseId = test.course ? test.course.toString() : undefined;
  return {
    id: test._id.toString(),
    course: courseId ? (courseMap.get(courseId) ?? null) : null,
    title: test.title,
    skill: test.skill,
    status: test.status,
    durationMinutes: test.durationMinutes ?? 0,
    questionCount: test.questionCount ?? 0,
    order: test.order ?? 0,
    owned: ownership ? testIsOwned(ownership, test) : false,
  };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  const manager = isManager(session);
  if (!manager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();

    const bundle = await MockTestBundle.findById(params.id);
    if (!bundle) return NextResponse.json({ bundle: null, tests: [] });

    const tests = (await MockTest.find({ bundle: bundle._id })
      .sort({ order: 1, createdAt: 1 })
      .lean()) as unknown as StaffTest[];

    const courseIds = [
      ...new Set(
        tests.map((t) => t.course?.toString()).filter((c): c is string => !!c)
      ),
    ];
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("title slug")
      .lean();
    const courseMap = new Map(
      (courses as { _id: { toString(): string }; title: string; slug: string }[]).map((c) => [
        c._id.toString(),
        { id: c._id.toString(), title: c.title, slug: c.slug },
      ])
    );

    const ownership =
      session && session.userId ? await resolveMockTestOwnership(session.userId) : null;

    const dtoTests = await Promise.all(
      tests.map((t) => toTestDto(t, ownership, courseMap))
    );

    return NextResponse.json({ bundle: toDto(bundle), tests: dtoTests });
  } catch (error) {
    console.error("mock-test bundle GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const bundle = await MockTestBundle.findById(params.id);
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    if (typeof body.title === "string" && body.title.trim()) {
      bundle.title = body.title.trim();
    }
    if (typeof body.description === "string") bundle.description = body.description.trim();
    if (typeof body.badge === "string") bundle.badge = body.badge.trim();
    if (typeof body.image === "string") bundle.image = body.image.trim();
    if (typeof body.slug === "string" && body.slug.trim()) {
      const slug = body.slug.trim();
      const conflict = await MockTestBundle.findOne({ slug, _id: { $ne: bundle._id } });
      if (conflict) {
        return NextResponse.json(
          { error: `A bundle with slug "${slug}" already exists` },
          { status: 409 }
        );
      }
      bundle.slug = slug;
    }
    if (typeof body.price === "number") bundle.price = Math.max(0, body.price);
    if (typeof body.currency === "string" && body.currency.trim()) {
      bundle.currency = body.currency.trim();
    }
    const prices = sanitizePrices(body.prices);
    if (prices) bundle.prices = prices;
    if (typeof body.featured === "boolean") bundle.featured = body.featured;
    if (typeof body.published === "boolean") bundle.published = body.published;

    await bundle.save();

    return NextResponse.json({ bundle: toDto(bundle) });
  } catch (error) {
    console.error("mock-test bundle PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const bundle = await MockTestBundle.findById(params.id);
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 404 });

    await MockTest.deleteMany({ bundle: bundle._id });
    await bundle.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mock-test bundle DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}