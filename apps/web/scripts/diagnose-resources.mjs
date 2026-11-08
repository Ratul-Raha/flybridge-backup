import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB });
 //comment
const Resource =
  mongoose.models.Resource ?? mongoose.model("Resource", new mongoose.Schema({}, { strict: false }));

const docs = await Resource.find().sort({ createdAt: -1 }).limit(10);

console.log(`Found ${docs.length} resources\n`);
for (const d of docs) {
  console.log(`- ${d.title}`);
  console.log(`  fileUrl: ${d.fileUrl}`);
  console.log(`  fileName: ${d.fileName} | fileType: ${d.fileType} | publicId: ${d.publicId}`);
  if (d.fileUrl) {
    try {
      const res = await fetch(d.fileUrl, { method: "GET", redirect: "follow" });
      const cd = res.headers.get("content-disposition");
      const ct = res.headers.get("content-type");
      const body = await res.arrayBuffer();
      const head = Buffer.from(body.slice(0, 8)).toString("hex");
      const isPdf = head.startsWith("25504446");
      console.log(`  HTTP ${res.status} | content-type: ${ct} | disposition: ${cd} | isPDF: ${isPdf} | finalUrl: ${res.url.slice(0, 110)}`);
    } catch (e) {
      console.log(`  fetch error: ${e.message}`);
    }
  }
  console.log("");
}

await mongoose.disconnect();
