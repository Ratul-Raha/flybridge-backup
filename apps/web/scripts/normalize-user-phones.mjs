/**
 * One-off migration: normalize existing User.phone values into the
 * canonical Bangladeshi format (+8801XXXXXXXXX) and clear invalid ones.
 *
 * Usage:
 *   node scripts/normalize-user-phones.mjs            # dry-run (default)
 *   node scripts/normalize-user-phones.mjs --apply    # actually writes
 */

import { MongoClient } from "mongodb";

const DRY_RUN = !process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set — aborting.");
  process.exit(1);
}

const client = new MongoClient(uri);

function normalizeBdPhone(input) {
  if (!input) return "";
  const cleaned = String(input).trim().replace(/[\s\-()]/g, "");
  if (/^\+8801\d{9}$/.test(cleaned)) return cleaned;
  if (/^8801\d{9}$/.test(cleaned)) return "+" + cleaned;
  if (/^01\d{9}$/.test(cleaned)) return "+88" + cleaned.slice(1);
  if (/^1\d{9}$/.test(cleaned)) return "+880" + cleaned;
  return "";
}

async function main() {
  await client.connect();
  const db = client.db();
  const users = db.collection("users");

  const cursor = users.find({ $or: [{ phone: { $exists: true, $ne: null } }, { phone: null }] });
  let updated = 0;
  let cleared = 0;
  let already = 0;

  for await (const doc of cursor) {
    const original = doc.phone ?? null;
    if (!original) {
      already++;
      continue;
    }
    const normalized = normalizeBdPhone(original);
    if (!normalized) {
      cleared++;
      if (DRY_RUN) {
        console.log(`  [dry-run] ${doc._id}: would clear invalid phone "${original}"`);
      } else {
        await users.updateOne({ _id: doc._id }, { $unset: { phone: "" } });
      }
      continue;
    }
    if (normalized === original) {
      already++;
      continue;
    }
    updated++;
    if (DRY_RUN) {
      console.log(`  [dry-run] ${doc._id}: "${original}" -> "${normalized}"`);
    } else {
      await users.updateOne({ _id: doc._id }, { $set: { phone: normalized } });
    }
  }

  console.log(`\n${DRY_RUN ? "[dry-run]" : "[apply]"} done. updated=${updated}, cleared=${cleared}, unchanged=${already}`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
