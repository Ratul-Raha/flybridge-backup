/**
 * One-off backfill: create the "IELTS Band Score Machine" lead list and move
 * every CourseWishlist entry for that course into it as a lead.
 *
 * Dedup rules match `upsertLeadFromSignal`: a lead is anchored to an email (or a
 * linked user). Existing leads are moved into this list and given the course
 * interest if they don't already have it; new leads are created as `new`.
 *
 * Usage:
 *   node scripts/backfill-leads-ielts-bsm.mjs           # dry-run (default)
 *   node scripts/backfill-leads-ielts-bsm.mjs --apply   # actually writes
 */

import mongoose from "mongoose";

const DRY_RUN = !process.argv.includes("--apply");
const LIST_NAME = "IELTS Band Score Machine";
const COURSE_SLUG = "ielts-band-score-machine-en";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set — aborting.");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB || "flybridge";

async function main() {
  const label = DRY_RUN ? "DRY RUN" : "LIVE";
  console.log(`\n=== backfill-leads-ielts-bsm (${label}) ===\n`);

  await mongoose.connect(uri, { dbName });
  const db = mongoose.connection.db;
  const courses = db.collection("courses");
  const wishlists = db.collection("coursewishlists");
  const leadlists = db.collection("leadlists");
  const leads = db.collection("leads");

  const course = await courses.findOne({ slug: COURSE_SLUG });
  if (!course) {
    console.error(`Course "${COURSE_SLUG}" not found — aborting.`);
    process.exit(1);
  }
  console.log(`Course: ${course.title} (${course._id})`);

  let list = await leadlists.findOne({ name: LIST_NAME });
  if (list) {
    console.log(`List already exists: "${list.name}" (${list._id})`);
  } else if (DRY_RUN) {
    console.log(`[dry-run] would create list "${LIST_NAME}"`);
  } else {
    const res = await leadlists.insertOne({
      name: LIST_NAME,
      description: "",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    list = await leadlists.findOne({ _id: res.insertedId });
    console.log(`Created list "${list.name}" (${list._id})`);
  }

  const listId = list ? list._id : null;

  const entries = await wishlists.find({ course: course._id }).toArray();
  console.log(`Wishlist entries for this course: ${entries.length}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const w of entries) {
    const email = (w.email ?? "").trim().toLowerCase();
    const name =
      (w.name ?? "").trim() || (email ? email.split("@")[0] : "Lead");
    const phone = (w.phone ?? "").trim() || undefined;

    // Consistent with upsertLeadFromSignal: only email-anchored leads are created.
    if (!email) {
      skipped++;
      console.log(`  skip: no email (wishlist ${w._id})`);
      continue;
    }

    const interest = {
      itemType: "course",
      itemId: String(course._id),
      title: course.title,
      createdAt: w.createdAt ?? new Date(),
    };

    const match = [];
    if (email) match.push({ email });
    if (w.user) match.push({ user: w.user });
    const existing = await leads.findOne({ $or: match });

    if (existing) {
      const hasInterest = (existing.interests ?? []).some(
        (i) => i.itemId === String(course._id)
      );
      const set = { list: listId, lastActivityAt: new Date() };
      if (!existing.attribution && w.attribution) set.attribution = w.attribution;
      const op = { $set: set };
      if (!hasInterest) op.$push = { interests: interest };

      if (DRY_RUN) {
        console.log(`  [dry-run] update lead ${email} -> list "${LIST_NAME}"`);
      } else {
        await leads.updateOne({ _id: existing._id }, op);
      }
      updated++;
      continue;
    }

    const doc = {
      user: w.user ?? null,
      list: listId,
      name,
      email,
      phone,
      status: "new",
      source: "waitlist",
      priority: "medium",
      customFields: {},
      attribution: w.attribution ?? undefined,
      interests: [interest],
      notes: [],
      tags: [],
      followUpAt: null,
      lastContactedAt: null,
      lastActivityAt: w.createdAt ?? new Date(),
      convertedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] create lead ${email} (${name})`);
    } else {
      await leads.insertOne(doc);
    }
    created++;
  }

  console.log(
    `\n${DRY_RUN ? "Would process" : "Processed"}: created=${created}, updated=${updated}, skipped=${skipped}`
  );
  console.log(
    DRY_RUN ? "\nRun again with --apply to write." : "\nDone."
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
