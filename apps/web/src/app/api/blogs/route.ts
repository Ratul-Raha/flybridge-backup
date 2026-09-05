import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Blog, type BlogDoc } from "@/lib/models/blog";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDto(b: BlogDoc) {
  return {
    id: b._id.toString(),
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt ?? "",
    content: b.content ?? "",
    category: b.category ?? "General",
    cover: b.cover ?? null,
    author: b.author ?? "FlyBridge",
    featured: b.featured ?? false,
    published: b.published ?? false,
    publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
    viewCount: b.viewCount ?? 0,
    createdAt: b.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const slug = searchParams.get("slug");

  try {
    await connectDb();

    if (slug) {
      const blog = await Blog.findOne({ slug, published: true });
      if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ blog: toDto(blog) });
    }

    if (all) {
      const session = await readSession();
      if (!isManager(session))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const blogs = await Blog.find().sort({ createdAt: -1 });
      return NextResponse.json({ blogs: blogs.map(toDto) });
    }

    const blogs = await Blog.find({ published: true }).sort({ publishedAt: -1 });
    return NextResponse.json({ blogs: blogs.map(toDto) });
  } catch (error) {
    console.error("blogs GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const slugInput = typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : "";
    let slug = slugInput ? slugify(slugInput) : slugify(title);

    // Ensure unique slug
    const existing = await Blog.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const published = body.published === true;
    const publishedAt = published ? new Date() : undefined;

    const blog = await Blog.create({
      title,
      slug,
      excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
      content,
      category: typeof body.category === "string" ? body.category.trim() : "General",
      cover: typeof body.cover === "string" ? body.cover.trim() || undefined : undefined,
      author: typeof body.author === "string" ? body.author.trim() || undefined : undefined,
      featured: typeof body.featured === "boolean" ? body.featured : false,
      published,
      publishedAt,
      createdBy: session!.userId,
    });

    return NextResponse.json({ blog: toDto(blog as BlogDoc) }, { status: 201 });
  } catch (error) {
    console.error("blogs POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}