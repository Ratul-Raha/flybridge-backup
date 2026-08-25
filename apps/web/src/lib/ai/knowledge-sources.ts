import "server-only";

import { connectDb } from "@/lib/db";
import { Seminar } from "@/lib/models/seminar";
import { Course } from "@/lib/models/course";
import { programs } from "@/lib/programs";
import { courseDetails } from "@/app/programs/[slug]/course-data";
import { tokenize, type KnowledgeChunk } from "@/lib/ai/knowledge";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://flybridgeedu.com";

function makeChunk(source: string, heading: string, content: string): KnowledgeChunk {
  return {
    id: `${source}:${heading}`,
    source,
    heading,
    content,
    tokens: tokenize(`${heading}\n${content}`),
  };
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function generateSeminarChunks(): Promise<KnowledgeChunk[]> {
  await connectDb();
  const seminars = await Seminar.find().sort({ dateTime: 1 }).lean();

  const chunks: KnowledgeChunk[] = [];
  const overview: string[] = [];

  for (const seminar of seminars) {
    const date = formatDate(seminar.dateTime);
    const price = seminar.type === "paid" && seminar.price ? `$${seminar.price}` : null;

    const lines = [
      `The ${seminar.type} seminar "${seminar.title}" takes place on ${date}.`,
      ...(seminar.description ? [seminar.description] : []),
      `- Type: ${seminar.type === "paid" ? "Paid" : "Free"} seminar`,
      `- Date and time: ${date}`,
      ...(price ? [`- Price: ${price}`] : []),
      ...(seminar.duration ? [`- Duration: ${seminar.duration}`] : []),
      ...(seminar.url ? [`- Live session link: ${seminar.url}`] : []),
      `- How to join: register on the [Seminars page](${SITE_URL}/seminars);`,
      "  a confirmation email is sent automatically and the live link appears in",
      "  your dashboard.",
    ];

    chunks.push(makeChunk("seminars.md", seminar.title, lines.join("\n")));
    overview.push(`- ${seminar.title} — ${date} (${seminar.type === "paid" ? "Paid" : "Free"})`);
  }

  if (overview.length > 0) {
    chunks.push(makeChunk("seminars.md", "Current seminar list", overview.join("\n")));
  }

  return chunks;
}

export function generateProgramChunks(): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const overview: string[] = [];

  for (const program of programs) {
    const details = courseDetails[program.slug];
    const status = program.upcoming ? "Upcoming" : "Available now";

    const lines = [
      details ? details.subtitle : program.desc,
      `- Course page: [${program.title}](${SITE_URL}/programs/${program.slug})`,
      `- Status: ${status}`,
      ...(program.price ? [`- Price: ${program.price}`] : []),
      ...(details?.level ? [`- Level: ${details.level}`] : []),
      ...(details?.language ? [`- Language: ${details.language}`] : []),
      ...(details?.pace ? [`- Pace: ${details.pace}`] : []),
      ...(details?.access ? [`- Access: ${details.access}`] : []),
    ];

    if (details && details.modules.length > 0) {
      lines.push("- Modules:");
      for (const module of details.modules) {
        lines.push(`  - ${module.title}`);
        for (const lesson of module.lessons) {
          lines.push(`    - ${lesson.title}`);
        }
      }
    }

    chunks.push(makeChunk("programs.md", program.title, lines.join("\n")));
    overview.push(
      `- ${program.title} — ${program.desc} (${status}${program.price ? `, ${program.price}` : ""})`
    );
  }

  if (overview.length > 0) {
    chunks.push(makeChunk("programs.md", "Program list", overview.join("\n")));
  }

  return chunks;
}

export async function generateCourseChunks(): Promise<KnowledgeChunk[]> {
  await connectDb();
  const courses = await Course.find().sort({ createdAt: 1 }).lean();

  const chunks: KnowledgeChunk[] = [];
  const overview: string[] = [];

  for (const course of courses) {
    const price =
      course.price && course.price > 0 ? `${course.currency ?? "USD"} ${course.price}` : "Free";
    const status = course.published ? "Available now" : "Not published yet";

    const lines = [
      ...(course.subtitle ? [course.subtitle] : []),
      ...(course.description ? [course.description] : []),
      `- Course page: [${course.title}](${SITE_URL}/programs/${course.slug})`,
      `- Status: ${status}`,
      `- Price: ${price}`,
      ...(course.level ? [`- Level: ${course.level}`] : []),
      ...(course.language ? [`- Language: ${course.language}`] : []),
      ...(course.pace ? [`- Pace: ${course.pace}`] : []),
    ];

    if (course.modules.length > 0) {
      lines.push("- Modules:");
      for (const module of course.modules) {
        lines.push(`  - ${module.title}`);
        for (const lesson of module.lessons) {
          lines.push(`    - ${lesson.title}`);
        }
      }
    }

    chunks.push(makeChunk("courses.md", course.title, lines.join("\n")));
    overview.push(
      `- ${course.title} — ${course.subtitle ?? course.description} (${status}, ${price})`
    );
  }

  if (overview.length > 0) {
    chunks.push(makeChunk("courses.md", "Course list", overview.join("\n")));
  }

  return chunks;
}

export async function generateDynamicChunks(): Promise<KnowledgeChunk[]> {
  try {
    const [seminarChunks, programChunks, courseChunks] = await Promise.all([
      generateSeminarChunks(),
      Promise.resolve(generateProgramChunks()),
      generateCourseChunks(),
    ]);
    return [...seminarChunks, ...programChunks, ...courseChunks];
  } catch (error) {
    console.error("dynamic knowledge generation error", error);
    return [];
  }
}
