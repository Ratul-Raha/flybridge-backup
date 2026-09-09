import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Blog, type BlogDoc } from "@/lib/models/blog";
import { deleteMediaRef } from "@/lib/storage";

function isManager(session: { role: string } | null) {
  return session && (session.role === "admin" || session.role === "moderator");
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
    coverPublicId: b.coverPublicId ?? null,
    author: b.author ?? "FlyBridge",
    featured: b.featured ?? false,
    published: b.published ?? false,
    publishedAt: b.publishedAt ? b.publishedAt.toISOString() : null,
    viewCount: b.viewCount ?? 0,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    const session = await readSession();
    const blog = await Blog.findById(params.id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!blog.published && !isManager(session)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ blog: toDto(blog) });
  } catch (error) {
    console.error("blog GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await connectDb();
    const blog = await Blog.findById(params.id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    function slugify(value: string): string {
      return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (typeof body.title === "string" && body.title.trim()) {
      blog.title = body.title.trim();
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      const raw = slugify(body.slug.trim());
      const clash = await Blog.findOne({ slug: raw, _id: { $ne: blog._id } });
      if (!clash) blog.slug = raw;
    }
    if (typeof body.excerpt === "string") blog.excerpt = body.excerpt.trim();
    if (typeof body.content === "string" && body.content.trim()) blog.content = body.content.trim();
    if (typeof body.category === "string") blog.category = body.category.trim();
    if (typeof body.author === "string") blog.author = body.author.trim() || undefined;
    if (typeof body.cover === "string") {
      // Clean up old cover if switching
      if (blog.cover && body.cover.trim() !== blog.cover && blog.coverPublicId) {
        await deleteMediaRef(blog.coverPublicId, "image").catch(() => {});
      }
      blog.cover = body.cover.trim() || undefined;
    }
    if (typeof body.coverPublicId === "string") blog.coverPublicId = body.coverPublicId.trim() || undefined;
    if (typeof body.featured === "boolean") blog.featured = body.featured;
    if (typeof body.published === "boolean") {
      if (!blog.published && body.published) blog.publishedAt = new Date();
      blog.published = body.published;
    }

    await blog.save();
    return NextResponse.json({ blog: toDto(blog) });
  } catch (error) {
    console.error("blog PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!isManager(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDb();
    const blog = await Blog.findByIdAndDelete(params.id);
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (blog.coverPublicId) {
      await deleteMediaRef(blog.coverPublicId, "image").catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("blog DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}