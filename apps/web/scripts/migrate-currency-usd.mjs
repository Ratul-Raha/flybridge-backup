/**
 * One-off migration: update all existing Course and Order records
 * whose currency is still "BDT" to "USD".
 *
 * Usage:
 *   node scripts/migrate-currency-usd.mjs              # dry-run (default)
 *   node scripts/migrate-currency-usd.mjs --apply      # actually writes
 */

import { MongoClient } from "mongodb";

const DRY_RUN = !process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set — aborting.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function migrateCollection(db, collection, filter) {
  const coll = db.collection(collection);
  const count = await coll.countDocuments(filter);
  if (count === 0) return 0;
  if (DRY_RUN) {
    console.log(`  [dry-run] ${collection}: would update ${count} documents`);
    return count;
  }
  const result = await coll.updateMany(filter, { $set: { currency: "USD" } });
  console.log(`  ${collection}: updated ${result.modifiedCount} documents`);
  return result.modifiedCount;
}

async function main() {
  const label = DRY_RUN ? "DRY RUN" : "LIVE";
  console.log(`\n=== migrate-currency-usd (${label}) ===\n`);

  await client.connect();
  const db = client.db();

  const courseCount = await migrateCollection(db, "courses", { currency: "BDT" });
  const orderCount = await migrateCollection(db, "orders", { currency: "BDT" });

  const total = courseCount + orderCount;
  console.log(`\n${total === 0 ? "Nothing to do." : `Done — ${total} documents ${DRY_RUN ? "would be" : "were"} updated.`}`);
  await client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
