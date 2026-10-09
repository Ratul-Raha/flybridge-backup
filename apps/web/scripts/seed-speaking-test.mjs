/**
 * One-off seed: add a "Speaking Test Seeded" mock test to the existing
 * "IELTS Mock Tests Bundle Pack", covering the three IELTS Speaking parts
 * (Part 1 intro questions, Part 2 cue card with prep/talk timings, Part 3
 * discussion). Answers are graded by the AI speaking judge from the
 * transcripts students record with Azure Speech.
 *
 * Idempotent: re-running with --apply updates the existing test in place.
 *
 * Usage:
 *   node scripts/seed-speaking-test.mjs             # dry-run (default)
 *   node scripts/seed-speaking-test.mjs --apply     # actually writes
 *   node scripts/seed-speaking-test.mjs --apply --publish   # writes as published
 */

import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadEnv(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv(path.resolve(process.cwd(), ".env.local"));

const DRY_RUN = !process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in .env.local — aborting.");
  process.exit(1);
}

const DB_NAME = process.env.MONGODB_DB || "flybridge";
const BUNDLE_SLUG = "ielts-reading-5-mock-tests-bundle-pack";
const TEST_TITLE = "Speaking Test Seeded";

function speakingQuestion(qid, prompt) {
  return {
    qid,
    type: "short-answer",
    prompt,
    options: [],
    correctOption: -1,
    multiple: false,
    correctOptions: [],
    answer: "",
    passageRef: "",
    wordHint: "",
  };
}

function buildContent() {
  const sections = [
    {
      id: "s1",
      passageId: "",
      type: "speaking-part-1",
      instructions: "",
      passage: "",
      bulletPoints: [],
      prepMinutes: 0,
      talkMinutes: 4,
      questions: [
        speakingQuestion("q1", "Where do you live at the moment?"),
        speakingQuestion("q2", "Do you work or are you a student?"),
        speakingQuestion("q3", "What do you like to do in your free time?"),
        speakingQuestion("q4", "Tell me about your favourite place in your hometown."),
      ],
    },
    {
      id: "s2",
      passageId: "",
      type: "speaking-part-2",
      instructions: "Describe a place you have visited that you really liked.",
      passage: "",
      bulletPoints: [
        "Where this place is",
        "How you got there",
        "What you did there",
        "And explain why you liked it so much",
      ],
      prepMinutes: 1,
      talkMinutes: 2,
      questions: [
        speakingQuestion(
          "q5",
          "Talk about a place you have visited that you really liked for one to two minutes."
        ),
      ],
    },
    {
      id: "s3",
      passageId: "",
      type: "speaking-part-3",
      instructions: "",
      passage: "",
      bulletPoints: [],
      prepMinutes: 0,
      talkMinutes: 4,
      questions: [
        speakingQuestion("q6", "Why do you think people enjoy travelling to new places?"),
        speakingQuestion("q7", "How has tourism changed in your country over the years?"),
        speakingQuestion("q8", "In your opinion, is it better to travel alone or with other people?"),
        speakingQuestion("q9", "What can cities do to attract more visitors?"),
      ],
    },
  ];

  return {
    type: "speaking",
    passage: "",
    passages: [],
    audioUrl: "",
    audioPublicId: "",
    videoUrl: "",
    sections,
    writingTask1: "",
    writingTask2: "",
  };
}

async function main() {
  const label = DRY_RUN ? "DRY RUN" : "LIVE";
  console.log(`\n=== seed-speaking-test (${label}) ===\n`);

  await mongoose.connect(uri, { dbName: DB_NAME, serverSelectionTimeoutMS: 10000, family: 4 });
  const db = mongoose.connection.db;

  const bundles = db.collection("mocktestbundles");
  const tests = db.collection("mocktests");

  const bundle = await bundles.findOne({ slug: BUNDLE_SLUG });
  if (!bundle) {
    console.error(`No bundle with slug "${BUNDLE_SLUG}" — aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const content = buildContent();
  const questionCount = content.sections.reduce(
    (n, s) => n + (Array.isArray(s.questions) ? s.questions.length : 0),
    0
  );
  const status = PUBLISH ? "published" : "draft";

  console.log(`  Bundle: ${bundle.title} (${BUNDLE_SLUG})`);
  console.log(`  Test:   ${TEST_TITLE}`);
  console.log(`  Skill:  speaking · ${status} · ${questionCount} questions · ${content.sections.length} parts`);
  console.log(`  Part 2: ${content.sections[1].prepMinutes} min prep + ${content.sections[1].talkMinutes} min talk`);

  const existing = await tests.findOne({ title: TEST_TITLE });
  if (existing) {
    console.log(`\n  Existing test found (${existing._id}) — will update in place.`);
    if (!DRY_RUN) {
      await tests.updateOne(
        { _id: existing._id },
        {
          $set: {
            content,
            questionCount,
            answerKey: "",
            status: PUBLISH ? "published" : existing.status,
            updatedAt: new Date(),
          },
        }
      );
      console.log("\nUpdated.");
    } else {
      console.log("\nRun again with --apply to write this.");
    }
    await mongoose.disconnect();
    return;
  }

  const lastSpeaking = await tests
    .find({ skill: "speaking" })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  const order = lastSpeaking.length > 0 ? (Number(lastSpeaking[0].order) || 0) + 1 : 0;

  const doc = {
    bundle: bundle._id,
    course: null,
    title: TEST_TITLE,
    skill: "speaking",
    status,
    durationMinutes: 14,
    questionCount,
    order,
    content,
    answerKey: "",
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!DRY_RUN) {
    const res = await tests.insertOne(doc);
    console.log(`\nWritten. Inserted _id: ${res.insertedId}`);
  } else {
    console.log("\nRun again with --apply to write this.");
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
