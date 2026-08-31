import type { MetadataRoute } from "next";
import { connectDb } from "@/lib/db";
import { Course } from "@/lib/models/course";
import { Seminar } from "@/lib/models/seminar";
import { Scholarship } from "@/lib/models/scholarship";
import { Resource } from "@/lib/models/resource";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

const staticRoutes = [
  "",
  "/about",
  "/programs",
  "/seminars",
  "/resources",
  "/scholarships",
  "/leaderboard",
  "/faq",
  "/help",
  "/success-stories",
  "/readiness",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    await connectDb();

    const [programs, seminars, scholarships, resources] = await Promise.all([
      Course.find({ $or: [{ published: true }, { upcoming: true }] })
        .select("slug")
        .lean(),
      Seminar.find().select("_id updatedAt").lean(),
      Scholarship.find({ active: true }).select("_id").lean(),
      Resource.find().select("_id").lean(),
    ]);

    for (const p of programs) {
      dynamicEntries.push({
        url: `${SITE_URL}/programs/${(p as { slug: string }).slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.9,
      });
    }
    for (const s of seminars) {
      dynamicEntries.push({
        url: `${SITE_URL}/seminars/${String((s as { _id: unknown })._id)}`,
        lastModified: (s as { updatedAt?: Date }).updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const s of scholarships) {
      dynamicEntries.push({
        url: `${SITE_URL}/scholarships/${String((s as { _id: unknown })._id)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const r of resources) {
      dynamicEntries.push({
        url: `${SITE_URL}/resources/${String((r as { _id: unknown })._id)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // return static routes if DB is unavailable
  }

  return [...staticEntries, ...dynamicEntries];
}
