/**
 * Promote a user to admin / moderator / user.
 *
 * Usage:
 *   node scripts/promote-user.mjs you@example.com admin
 *   node scripts/promote-user.mjs you@example.com moderator
 *   node scripts/promote-user.mjs you@example.com user
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

const [email, role] = process.argv.slice(2);
if (!email || !["admin", "moderator", "user"].includes(role)) {
  console.error("Usage: node scripts/promote-user.mjs <email> <admin|moderator|user>");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not set in .env.local");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB ?? "flybridge";

try {
  await mongoose.connect(uri, { dbName });

  const updated = await mongoose.connection
    .collection("users")
    .findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: { accountType: role } },
      { returnDocument: "after" }
    );

  if (!updated) {
    console.log(`User "${email}" not found. Create the account via Google login first, then run this again.`);
    process.exit(1);
  }

  console.log(`Done. ${updated.email} is now: ${updated.accountType}`);
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}
