import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import {
  type StorageScope,
  isS3Configured,
  kindOf,
  buildKey,
  visibilityFor,
  presignPutUrl,
  makeRef,
} from "@/lib/s3";

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  video: 1000 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  file: 50 * 1024 * 1024,
};

const ALLOWED_EXTENSIONS =
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpe?g|webp|gif|svg|mp4|mov|webm|mp3|wav|m4a|aac|txt|csv|zip)$/i;

const SCOPES: StorageScope[] = ["courses", "resources", "stories", "scholarships", "blogs", "mock-tests"];

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  zip: "application/zip",
  txt: "text/plain",
  csv: "text/csv",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function sanitizeContentType(value: string | undefined, fileName: string): string {
  const fromClient = (value ?? "").trim().toLowerCase();
  if (fromClient.length <= 120 && /^[a-z0-9!#$&^_.+*\/-]+(?:; *[a-z0-9!#$&^_.+=:",-]+)*$/.test(fromClient)) {
    return fromClient;
  }
  return MIME_BY_EXT[extOf(fileName)] ?? "application/octet-stream";
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "S3 storage is not configured. Set AWS_REGION, S3_BUCKET and AWS access keys." },
      { status: 501 }
    );
  }

  try {
    const body = await request.json();
    const scope = (body?.scope ?? "") as string;
    const use = body?.use === "thumbnail" ? "thumbnail" : "file";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const size = typeof body?.size === "number" ? body.size : 0;
    const contentType = typeof body?.contentType === "string" ? body.contentType : undefined;

    if (!SCOPES.includes(scope as StorageScope)) {
      return NextResponse.json({ error: "Invalid upload scope" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }
    if (!ALLOWED_EXTENSIONS.test(name)) {
      return NextResponse.json(
        { error: "File type not allowed. Upload a PDF, image, video, audio or document." },
        { status: 400 }
      );
    }

    const kind = kindOf(name);
    if (size <= 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (size > MAX_SIZES[kind]) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(MAX_SIZES[kind] / 1024 / 1024)}MB for this type.` },
        { status: 400 }
      );
    }

    const visibility = visibilityFor(scope as StorageScope, kind, use);
    const key = buildKey(scope as StorageScope, name, use);
    const finalContentType = sanitizeContentType(contentType, name);
    const uploadUrl = await presignPutUrl(key, finalContentType, size);
    const ref = makeRef(key, visibility);

    return NextResponse.json({
      uploadUrl,
      contentType: finalContentType,
      ref,
      key,
      visibility,
      expiresIn: 900,
    });
  } catch (error) {
    console.error("uploads presign error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}