/**
 * One-off seed: put the IELTS Band Score Machine launch offer on the course
 * itself.
 *
 * This offer only ever existed as marketing copy in `course-data.ts`, so the
 * database knows nothing about it. Left alone, the landing page would advertise
 * the launch price while checkout charged the full price. Setting it here makes
 * the course the single source of truth for both.
 *
 * It will not touch a course that already has a discount set up, so re-running
 * it after someone has edited the offer in the course editor is harmless.
 *
 * Usage:
 *   node scripts/seed-ielts-launch-discount.mjs           # dry-run (default)
 *   node scripts/seed-ielts-launch-discount.mjs --apply   # actually writes
 */

import mongoose from "mongoose";

const DRY_RUN = !process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set — aborting.");
  process.exit(1);
}

const SLUG = "ielts-band-score-machine";
const NAME = "Exclusive Launch Deal";
const PRICE = 2999;
const ENDS_AT = "2026-10-30T23:59:59+06:00";

function isConfigured(discount) {
  if (!discount) return false;
  return (
    discount.active === true ||
    Boolean(discount.name?.trim()) ||
    Number(discount.price) > 0 ||
    discount.startsAt != null ||
    discount.endsAt != null
  );
}

async function main() {
  const label = DRY_RUN ? "DRY RUN" : "LIVE";
  console.log(`\n=== seed-ielts-launch-discount (${label}) ===\n`);

  await mongoose.connect(uri);
  const courses = mongoose.connection.db.collection("courses");

  const course = await courses.findOne({ slug: SLUG });
  if (!course) {
    console.error(`No course with slug "${SLUG}" — aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const base = course.prices?.BDT;
  if (typeof base !== "number" || base <= 0) {
    console.error(`${SLUG} has no BDT price — aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  if (PRICE >= base) {
    console.error(`Launch price ${PRICE} is not below the full price ${base} — aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (isConfigured(course.discount)) {
    console.log(
      `${SLUG} already has a discount (${course.discount?.name || "unnamed"}, ` +
        `active=${course.discount?.active === true}) — nothing to do.`
    );
    await mongoose.disconnect();
    return;
  }

  console.log(`  ${SLUG}: ${NAME} — BDT ${PRICE} (was BDT ${base}, saves BDT ${base - PRICE})`);
  console.log(`  ends ${ENDS_AT}`);

  if (!DRY_RUN) {
    await courses.updateOne(
      { slug: SLUG },
      {
        $set: {
          discount: {
            active: true,
            name: NAME,
            price: PRICE,
            startsAt: null,
            endsAt: new Date(ENDS_AT),
          },
        },
      }
    );
    console.log("\nWritten.");
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