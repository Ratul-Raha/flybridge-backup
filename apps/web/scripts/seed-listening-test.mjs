/**
 * One-off seed: add a "Listening Test Seeded" mock test to the existing
 * "IELTS Mock Tests Bundle Pack", covering all 9 supported listening question
 * types across a full 40-question listening test. Audio is intentionally left
 * empty.
 *
 * Idempotent: re-running with --apply updates the existing test in place.
 *
 * Usage:
 *   node scripts/seed-listening-test.mjs           # dry-run (default)
 *   node scripts/seed-listening-test.mjs --apply   # actually writes
 */

import mongoose from "mongoose";

const DRY_RUN = !process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set — aborting.");
  process.exit(1);
}

const DB_NAME = process.env.MONGODB_DB || "flybridge";
const BUNDLE_SLUG = "ielts-reading-5-mock-tests-bundle-pack";
const TEST_TITLE = "Listening Test Seeded";

function section(id, type, instructions, passage, questions) {
  return {
    id,
    passageId: "",
    type,
    instructions,
    passage: passage ?? "",
    questions,
  };
}

function choiceQuestion(qid, type, prompt, options, correctOption) {
  return {
    qid,
    type,
    prompt,
    options,
    correctOption,
    multiple: false,
    correctOptions: [],
    maxSelections: 0,
    answer: options[correctOption] ?? "",
    passageRef: "",
    wordHint: "",
  };
}

function multiChoiceQuestion(qid, type, prompt, options, correctIdxs) {
  const sorted = Array.from(new Set(correctIdxs)).sort((a, b) => a - b);
  return {
    qid,
    type,
    prompt,
    options,
    correctOption: -1,
    multiple: true,
    correctOptions: sorted,
    maxSelections: sorted.length,
    answer: sorted.map((i) => String.fromCharCode(65 + i)).join(", "),
    passageRef: "",
    wordHint: "",
  };
}

function completionQuestion(qid, type, prompt, answers, wordHint = "") {
  const list = Array.isArray(answers) ? answers : [answers];
  let n = 0;
  const promptWithGaps = prompt.replace(/___/g, () => `[[gap:${++n}]]`);
  return {
    qid,
    type,
    prompt: promptWithGaps,
    options: [],
    correctOption: -1,
    multiple: false,
    correctOptions: [],
    maxSelections: 0,
    answer: list.join(" / "),
    gapAnswers: list,
    passageRef: "",
    wordHint,
  };
}

function shortAnswerQuestion(qid, prompt, answer, wordHint = "") {
  return {
    qid,
    type: "short-answer",
    prompt,
    options: [],
    correctOption: -1,
    multiple: false,
    correctOptions: [],
    maxSelections: 0,
    answer,
    gapAnswers: [],
    passageRef: "",
    wordHint,
  };
}

function buildContent() {
  // Four IELTS listening parts. Each part mixes several question types, which
  // is how a real paper is structured — the section itself carries no type.
  const sections = [
    section(
      "s1",
      "",
      "PART 1 – Questions 1–10.\n\nComplete the form below.\n\nWrite ONE WORD AND/OR A NUMBER for each answer.",
      "Harbour City Sports Centre — membership form",
      [
        completionQuestion("q1", "form-completion", "Name: Sarah ___", "Milton", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q2", "form-completion", "Membership number: ___", "8472", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q3", "form-completion", "Address: 14 ___ Road", "Kestrel", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q4", "form-completion", "Contact number: 07700 ___", "900318", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q5", "form-completion", "Preferred class: ___ yoga", "morning", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q6", "form-completion", "Payment method: ___ card", "credit", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q7", "form-completion", "Date of birth: 3 ___ 1992", "March", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q8", "form-completion", "Emergency contact: ___, brother", "Tom", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q9", "form-completion", "Extra class: swimming on ___", "Tuesday", "ONE WORD AND/OR A NUMBER"),
        completionQuestion("q10", "form-completion", "Total cost: £___ per month", "25", "ONE WORD AND/OR A NUMBER"),
      ]
    ),
    section(
      "s2",
      "",
      "PART 2 – Questions 11–20.\n\nQuestions 11–14: complete the notes below.\nWrite ONE WORD ONLY for each answer.\n\nQuestions 15–18: match each facility to the correct floor, A–C.\n\nQuestions 19–20: choose the correct letters, A, B, C or D.",
      "Guided tour notes",
      [
        completionQuestion("q11", "notes-completion", "The museum opens at ___ every morning.", "nine", "ONE WORD ONLY"),
        completionQuestion("q12", "notes-completion", "Visitors should meet at the ___ entrance.", "east", "ONE WORD ONLY"),
        completionQuestion("q13", "notes-completion", "The tour lasts ___ hours.", "two", "ONE WORD ONLY"),
        completionQuestion("q14", "notes-completion", "Bring a ___ for the roof.", "jacket", "ONE WORD ONLY"),
        choiceQuestion("q15", "matching-features", "Swimming pool", ["Ground floor", "First floor", "Basement"], 2),
        choiceQuestion("q16", "matching-features", "Café", ["Ground floor", "First floor", "Basement"], 0),
        choiceQuestion("q17", "matching-features", "Gym", ["Ground floor", "First floor", "Basement"], 1),
        choiceQuestion("q18", "matching-features", "Cinema", ["Ground floor", "First floor", "Basement"], 1),
        multiChoiceQuestion("q19", "multiple-choice", "Which TWO facilities are open after 9 pm?", ["Swimming pool", "Library", "Fitness centre", "Café"], [2, 3]),
        choiceQuestion("q20", "multiple-choice", "How often does the research team collect samples?", ["Daily", "Weekly", "Monthly"], 2),
      ]
    ),
    section(
      "s3",
      "",
      "PART 3 – Questions 21–30.\n\nQuestions 21–23: choose the correct letter, A, B or C.\n\nQuestions 24–27: write TRUE, FALSE or NOT GIVEN.\n\nQuestions 28–30: complete the sentences below.\nWrite NO MORE THAN TWO WORDS for each answer.",
      "",
      [
        choiceQuestion("q21", "multiple-choice", "Who funds the research project?", ["The government", "The university", "A private company"], 0),
        choiceQuestion("q22", "multiple-choice", "Where is the next field trip?", ["The coast", "The desert", "The mountains"], 2),
        choiceQuestion("q23", "multiple-choice", "When must students submit their work?", ["Friday", "Monday", "Wednesday"], 1),
        choiceQuestion("q24", "true-false-ng", "The speaker has lived in the city for five years.", ["True", "False", "Not Given"], 1),
        choiceQuestion("q25", "true-false-ng", "The city plans to build a new bridge next year.", ["True", "False", "Not Given"], 2),
        choiceQuestion("q26", "true-false-ng", "The old market will be demolished.", ["True", "False", "Not Given"], 0),
        choiceQuestion("q27", "true-false-ng", "The new library opened last month.", ["True", "False", "Not Given"], 1),
        completionQuestion("q28", "sentence-completion", "The first experiment was carried out in ___ conditions.", "controlled", "NO MORE THAN TWO WORDS"),
        completionQuestion("q29", "sentence-completion", "The results were published in a scientific ___.", "journal", "NO MORE THAN TWO WORDS"),
        completionQuestion("q30", "sentence-completion", "The researcher used a ___ to record the data.", "questionnaire", "NO MORE THAN TWO WORDS"),
      ]
    ),
    section(
      "s4",
      "",
      "PART 4 – Questions 31–40.\n\nQuestions 31–34: choose the correct heading for each talk from A–D.\n\nQuestions 35–38: complete the summary below.\nWrite ONE WORD ONLY for each answer.\n\nQuestions 39–40: answer the questions below.\nWrite NO MORE THAN THREE WORDS for each answer.",
      "",
      [
        choiceQuestion("q31", "heading-matching", "Talk 1", ["The history of printing", "Modern digital media", "The future of libraries", "The rise of radio"], 0),
        choiceQuestion("q32", "heading-matching", "Talk 2", ["The history of printing", "Modern digital media", "The future of libraries", "The rise of radio"], 2),
        choiceQuestion("q33", "heading-matching", "Talk 3", ["The history of printing", "Modern digital media", "The future of libraries", "The rise of radio"], 1),
        choiceQuestion("q34", "heading-matching", "Talk 4", ["The history of printing", "Modern digital media", "The future of libraries", "The rise of radio"], 3),
        completionQuestion("q35", "summary-completion", "The study found that sleep improves memory ___.", "retention", "ONE WORD ONLY"),
        completionQuestion("q36", "summary-completion", "Participants were tested after a short ___.", "break", "ONE WORD ONLY"),
        completionQuestion("q37", "summary-completion", "Those who slept showed ___ recall.", "better", "ONE WORD ONLY"),
        completionQuestion("q38", "summary-completion", "The effect was strongest in ___ adults.", "young", "ONE WORD ONLY"),
        shortAnswerQuestion("q39", "When does the library close on Fridays?", "ten o'clock", "NO MORE THAN THREE WORDS"),
        shortAnswerQuestion("q40", "Which room is the workshop held in?", "Room B", "NO MORE THAN THREE WORDS"),
      ]
    ),
  ];

  return {
    type: "listening",
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

function buildAnswerKey(content) {
  const lines = [];
  let n = 1;
  for (const s of content.sections) {
    for (const q of s.questions) {
      const answer =
        q.multiple === true && Array.isArray(q.correctOptions) && q.correctOptions.length > 0
          ? q.correctOptions.map((i) => String.fromCharCode(65 + i)).join(", ")
          : Array.isArray(q.options) && q.options.length > 1
            ? String.fromCharCode(65 + (q.correctOption ?? 0))
            : Array.isArray(q.gapAnswers) && q.gapAnswers.length > 0
              ? q.gapAnswers.join(" / ")
              : q.answer;
      lines.push(`${n}. ${answer}`);
      n += 1;
    }
  }
  return lines.join("\n");
}

async function main() {
  const label = DRY_RUN ? "DRY RUN" : "LIVE";
  console.log(`\n=== seed-listening-test (${label}) ===\n`);

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
  const answerKey = buildAnswerKey(content);

  console.log(`  Bundle: ${bundle.title} (${BUNDLE_SLUG})`);
  console.log(`  Test:   ${TEST_TITLE}`);
  console.log(`  Skill:  listening · draft · ${questionCount} questions · ${content.sections.length} sections`);
  console.log(`  Audio:  none (intentionally skipped)`);
  const types = [
    ...new Set(
      content.sections.flatMap((s) => s.questions.map((q) => q.type))
    ),
  ];
  console.log(`  Types:  ${types.join(", ")}`);

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
            answerKey,
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

  const lastListening = await tests
    .find({ skill: "listening" })
    .sort({ order: -1 })
    .limit(1)
    .toArray();
  const order = lastListening.length > 0 ? (Number(lastListening[0].order) || 0) + 1 : 0;

  const doc = {
    bundle: bundle._id,
    course: null,
    title: TEST_TITLE,
    skill: "listening",
    status: "draft",
    durationMinutes: 30,
    questionCount,
    order,
    content,
    answerKey,
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
