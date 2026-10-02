import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTestBundle } from "@/lib/models/mock-test-bundle";
import { MockTest, type MockTestDoc } from "@/lib/models/mock-test";
import { Course } from "@/lib/models/course";
import {
  countMockTestQuestions,
  normalizeMockTestAnswers,
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

async function toDto(
  test: StaffTest,
  ownership: MockTestOwnership | null,
  bundleTitle: string,
  bundlePrice: number,
  bundleCurrency: string,
  bundleSlug: string,
  courseMap: Map<string, { id: string; title: string; slug: string }>
) {
  const courseId = test.course ? test.course.toString() : undefined;
  return {
    id: test._id.toString(),
    bundle: {
      id: typeof test.bundle === "string" ? test.bundle : test.bundle.toString(),
      title: bundleTitle,
      slug: bundleSlug,
      price: bundlePrice,
      currency: bundleCurrency,
    },
    course: courseId ? (courseMap.get(courseId) ?? null) : null,
    title: test.title,
    skill: test.skill,
    status: test.status,
    durationMinutes: test.durationMinutes ?? 0,
    questionCount: test.questionCount ?? 0,
    order: test.order ?? 0,
    owned: ownership ? testIsOwned(ownership, test) : false,
    createdAt: test.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");
  const all = searchParams.get("all") === "true";

  try {
    await connectDb();
    const session = await readSession();
    const manager = isManager(session);
    if (!manager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter: Record<string, unknown> = {};
    if (!all) filter.status = "published";
    if (skill) filter.skill = skill;

    const tests = (await MockTest.find(filter)
      .sort({ skill: 1, order: 1, createdAt: 1 })
      .lean()) as unknown as StaffTest[];

    const bundleIds = [
      ...new Set(
        tests.map((t) => (typeof t.bundle === "string" ? t.bundle : t.bundle.toString()))
      ),
    ];
    const bundles = await MockTestBundle.find({ _id: { $in: bundleIds } }).lean();
    const bundleMap = new Map(
      bundles.map((b) => [
        b._id.toString(),
        { title: b.title, price: b.price, currency: b.currency, slug: b.slug },
      ])
    );

    const courseIds = [
      ...new Set(tests.map((t) => t.course?.toString()).filter((c): c is string => !!c)),
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

    const list = await Promise.all(
      tests.map((t) => {
        const bundleId = typeof t.bundle === "string" ? t.bundle : t.bundle.toString();
        const bundle = bundleMap.get(bundleId);
        return toDto(
          t,
          ownership,
          bundle?.title ?? "",
          bundle?.price ?? 0,
          bundle?.currency ?? "USD",
          bundle?.slug ?? "",
          courseMap
        );
      })
    );

    return NextResponse.json({ tests: list });
  } catch (error) {
    console.error("mock-tests GET error", error);
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

    const skill = body.skill;
    if (skill !== "reading" && skill !== "listening" && skill !== "writing" && skill !== "speaking") {
      return NextResponse.json({ error: "Invalid skill" }, { status: 400 });
    }

    const bundleId = typeof body.bundleId === "string" ? body.bundleId : "";
    const bundle = await MockTestBundle.findById(bundleId);
    if (!bundle) return NextResponse.json({ error: "Bundle not found" }, { status: 400 });

    let course: string | undefined;
    if (typeof body.course === "string" && body.course.trim()) {
      const courseDoc = await Course.findById(body.course.trim());
      if (!courseDoc) return NextResponse.json({ error: "Course not found" }, { status: 400 });
      course = courseDoc._id.toString();
    }

    const content = body.content && typeof body.content === "object" ? body.content : {};
    normalizeMockTestAnswers(content);
    const questionCount = countMockTestQuestions(content) || 0;

    const test = await MockTest.create({
      bundle: bundle._id,
      course: course ?? null,
      title,
      skill,
      status: typeof body.status === "string" ? body.status : "draft",
      durationMinutes: Math.max(0, Number(body.durationMinutes) || 0),
      questionCount,
      order: Math.max(0, Number(body.order) || 0),
      content,
      answerKey: typeof body.answerKey === "string" ? body.answerKey : "",
      createdBy: session!.userId,
    });

    const bundleMeta = {
      title: bundle.title,
      price: bundle.price,
      currency: bundle.currency,
      slug: bundle.slug,
    };

    return NextResponse.json(
      {
        test: await toDto(
          test as unknown as StaffTest,
          null,
          bundleMeta.title,
          bundleMeta.price,
          bundleMeta.currency,
          bundleMeta.slug,
          new Map()
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("mock-tests POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}