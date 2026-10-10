import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { MockTest, type MockTestDoc } from "@/lib/models/mock-test";
import { Course } from "@/lib/models/course";
import { countMockTestQuestions, normalizeMockTestAnswers, resolveMockTestOwnership, testIsOwned } from "@/lib/mock-tests";

function isManager(session: { role: string } | null): boolean {
  return !!(session && (session.role === "admin" || session.role === "moderator"));
}

function sanitizeContent(
  content: MockTestDoc["content"] | undefined,
  includeAnswers: boolean
) {
  if (!content || typeof content !== "object") return {};
  const sections = Array.isArray(content.sections)
    ? content.sections.map((s) => ({
        id: s.id,
        passageId: s.passageId,
        type: s.type,
        instructions: s.instructions,
        passage: s.passage,
        image: s.image,
        imagePlacement: s.imagePlacement,
        bulletPoints: s.bulletPoints ?? [],
        prepMinutes: s.prepMinutes ?? 0,
        talkMinutes: s.talkMinutes ?? 0,
        questions: (s.questions ?? []).map((q) => ({
          qid: q.qid,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          multiple: q.multiple === true,
          passageRef: q.passageRef,
          wordHint: q.wordHint,
          ...(includeAnswers
            ? {
                correctOption: q.correctOption ?? -1,
                correctOptions: q.correctOptions ?? [],
                answer: q.answer ?? "",
                gapAnswers: q.gapAnswers ?? [],
              }
            : {}),
        })),
      }))
    : [];
  const passages = Array.isArray(content.passages)
    ? content.passages.map((p) => ({
        id: p.id,
        title: p.title,
        text: p.text,
      }))
    : [];
  return {
    type: content.type,
    passage: content.passage,
    passages,
    audioUrl: content.audioUrl,
    audioPublicId: content.audioPublicId,
    videoUrl: content.videoUrl,
    hasAudio: !!(content.audioUrl || content.audioPublicId || content.videoUrl),
    sections,
    writingTask1: content.writingTask1,
    writingTask1Chart: content.writingTask1Chart ?? null,
    writingTask2: content.writingTask2,
    writingTask1Image: content.writingTask1Image,
    writingTask1ImagePlacement: content.writingTask1ImagePlacement,
    writingTask2Image: content.writingTask2Image,
    writingTask2ImagePlacement: content.writingTask2ImagePlacement,
  };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const manager = isManager(session);
  const userId = session.userId;
  if (!userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const test = (await MockTest.findById(params.id).populate(
      "bundle",
      "title slug price currency"
    ).lean()) as unknown as (Omit<MockTestDoc, "bundle"> & {
      bundle: { _id: { toString(): string }; title: string; slug: string; price: number; currency: string } | null;
    });

    if (!test) return NextResponse.json({ test: null });

    // Students reach tests through an active course enrollment or a bundle they
    // bought. Staff keep the answer key; students never see it.
    let owned = true;
    if (!manager) {
      if (test.status !== "published") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const ownership = await resolveMockTestOwnership(userId);
      owned = testIsOwned(ownership, test);
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const bundle = test.bundle;

    let courseLink: { id: string; title: string; slug: string } | null = null;
    if (test.course) {
      const course = await Course.findById(test.course).select("title slug").lean();
      if (course) {
        courseLink = {
          id: course._id.toString(),
          title: course.title,
          slug: course.slug,
        };
      }
    }

    return NextResponse.json({
      test: {
        id: test._id.toString(),
        bundle: bundle
          ? {
              id: bundle._id.toString(),
              title: bundle.title,
              slug: bundle.slug,
              price: bundle.price,
              currency: bundle.currency,
            }
          : null,
        course: courseLink,
        title: test.title,
        skill: test.skill,
        status: test.status,
        durationMinutes: test.durationMinutes ?? 0,
        questionCount: test.questionCount ?? 0,
        owned,
        content: sanitizeContent(test.content, manager),
        answerKey: manager ? (test.answerKey ?? "") : "",
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
      },
    });
  } catch (error) {
    console.error("mock-test GET error", error);
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

    const test = await MockTest.findById(params.id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    if (typeof body.title === "string" && body.title.trim()) test.title = body.title.trim();
    if (body.skill) {
      if (body.skill !== "reading" && body.skill !== "listening" && body.skill !== "writing" && body.skill !== "speaking") {
        return NextResponse.json({ error: "Invalid skill" }, { status: 400 });
      }
      test.skill = body.skill;
    }
    if (typeof body.status === "string") test.status = body.status;
    if (typeof body.durationMinutes === "number") test.durationMinutes = Math.max(0, body.durationMinutes);
    if (typeof body.order === "number") test.order = Math.max(0, body.order);

    if (typeof body.course === "string" || body.course === null || body.course === undefined) {
      if (body.course === null || body.course === undefined || !body.course.trim()) {
        test.course = null;
      } else {
        const course = await Course.findById(body.course.trim());
        if (!course) return NextResponse.json({ error: "Course not found" }, { status: 400 });
        test.course = course._id;
      }
    }

    if (body.content && typeof body.content === "object") {
      normalizeMockTestAnswers(body.content);
      test.content = body.content as MockTestDoc["content"];
      test.questionCount = countMockTestQuestions(body.content);
    }
    if (typeof body.answerKey === "string") test.answerKey = body.answerKey;

    await test.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mock-test PATCH error", error);
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
    const test = await MockTest.findById(params.id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    await test.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("mock-test DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
