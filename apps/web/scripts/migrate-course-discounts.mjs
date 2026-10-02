/**
 * One-off migration: fold the standalone promo collection into the course's own
 * `discount` block, then retire it.
 *
 * The old system stored an offer per item with a rule engine (percent or fixed
 * off, audience, usage cap, code). The replacement is four fields on the course:
 * on/off, a name, the discounted price, and a date window. So this can only
 * carry across the offers that map cleanly onto that — a fixed discount on a
 * single course, with no audience narrowing it.
 *
 * Anything it cannot represent is reported and left in place rather than
 * guessed at, so no offer is silently dropped.
 *
 * Usage:
 *   node scripts/migrate-course-discounts.mjs           # dry-run (default)
 *   node scripts/migrate-course-discounts.mjs --apply   # actually writes
 */

import mongoose from "mongoose";

const DRY_RUN = !process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set — aborting.");
  process.exit(1);
}

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** The price a buyer actually paid, so the new field carries the real number. */
function resolvePrice(rule, basePrice) {
  if (rule.type === "percent") {
    const percent = Number(rule.percent);
    if (!Number.isFinite(percent) || percent <= 0) return null;
    return Math.round(basePrice * (1 - percent / 100));
  }
  const amount = Number(rule.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  // The old rules rounded a fixed discount down to the nearest whole unit.
  return basePrice - amount;
}

function describeSkipped(discount) {
  const reasons = [];
  if (discount.itemType !== "course") {
    reasons.push(`applies to ${discount.itemType}, not a course`);
  }
  if (discount.code) reasons.push("requires a promo code");
  if (discount.audience && discount.audience !== "everyone") {
    reasons.push(`audience is ${JSON.stringify(discount.audience)}`);
  }
  const rules = discount.rules ?? [];
  if (rules.length === 0) reasons.push("has no rules");
  if (rules.length > 1) reasons.push("has more than one rule");
  const rule = rules[0];
  if (rule && rule.type !== "fixed") reasons.push(`rule type is ${rule.type}`);
  if (rule && rule.type === "fixed" && rule.currency && rule.currency !== "BDT") {
    reasons.push(`fixed discount is in ${rule.currency}, not BDT`);
  }
  if (discount.usageLimit && discount.usageLimit !== null && discount.usageLimit !== undefined) {
    reasons.push(`has a usage cap of ${discount.usageLimit}`);
  }
  return reasons;
}

async function main() {
  const label = DRY_RUN ? "DRY RUN" : "LIVE";
  console.log(`\n=== migrate-course-discounts (${label}) ===\n`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const discounts = db.collection("discounts");
  const courses = db.collection("courses");

  // Every offer that is switched on, whatever its dates — the course's discount
  // carries the same window over, so an offer that has not started yet or has
  // already ended survives the move and starts and stops on its own.
  const active = await discounts.find({ active: { $ne: false } }).toArray();

  const live = [];
  const skipped = [];

  for (const discount of active) {
    const reasons = describeSkipped(discount);
    if (reasons.length > 0) {
      skipped.push({ discount, reasons });
      continue;
    }
    live.push(discount);
  }

  if (skipped.length > 0) {
    console.log("Left alone (cannot be expressed as a course discount):");
    for (const { discount, reasons } of skipped) {
      console.log(`  ${discount.name || discount._id} — ${reasons.join("; ")}`);
    }
    console.log("");
  }

  let migrated = 0;

  for (const discount of live) {
    const courseId =
      typeof discount.itemId === "object" && discount.itemId?._id
        ? discount.itemId._id
        : discount.itemId;

    const course = await courses.findOne({ _id: courseId });
    if (!course) {
      console.log(`  ${discount.name}: course ${courseId} not found — skipped`);
      continue;
    }

    const basePrice = course.prices?.BDT;
    if (typeof basePrice !== "number" || basePrice <= 0) {
      console.log(`  ${discount.name}: ${course.slug} has no BDT price — skipped`);
      continue;
    }

    const price = resolvePrice(discount.rules[0], basePrice);
    if (price === null || price >= basePrice) {
      console.log(`  ${discount.name}: rule gives ${price} for base ${basePrice} — skipped`);
      continue;
    }

    const name = (discount.name || "Discount").trim();
    const startsAt = toDate(discount.startsAt);
    const endsAt = toDate(discount.endsAt);
    const savings = basePrice - price;

    console.log(
      `  ${course.slug}: ${name} — BDT ${price} (was BDT ${basePrice}, saves BDT ${savings})` +
        `${endsAt ? `, ends ${endsAt.toISOString()}` : ", no end date"}`
    );

    if (!DRY_RUN) {
      await courses.updateOne(
        { _id: course._id },
        {
          $set: {
            discount: {
              active: true,
              name,
              price,
              startsAt,
              endsAt,
            },
          },
        }
      );
    }
    migrated += 1;
  }

  console.log(`\n${DRY_RUN ? "Would migrate" : "Migrated"} ${migrated} course discount(s).`);

  if (!DRY_RUN && migrated > 0) {
    // The standalone collection is now redundant. Left empty rather than dropped
    // so the promotion history in admin stays readable.
    await discounts.deleteMany({});
    console.log("Cleared the now-unused discounts collection.");
  }

  console.log(
    DRY_RUN
      ? "\nRun again with --apply to write these."
      : "\nDone. Course discounts are now set in the course editor."
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});