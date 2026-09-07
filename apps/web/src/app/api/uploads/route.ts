import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { uploadAsset } from "@/lib/cloudinary";

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  default: 50 * 1024 * 1024,
};

const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav|txt|csv|zip)$/i;

function hasMagic(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((b, i) => bytes[i] === b);
}

function sniffValidMagic(bytes: Uint8Array, lower: string): boolean {
  const zipMagic =
    hasMagic(bytes, [0x50, 0x4b, 0x03, 0x04]) || hasMagic(bytes, [0x50, 0x4b, 0x05, 0x06]);
  const oleMagic = hasMagic(bytes, [0xd0, 0xcf, 0x11, 0xe0]);

  if (lower.endsWith(".pdf")) return hasMagic(bytes, [0x25, 0x50, 0x44, 0x46]);
  if (lower.endsWith(".png")) return hasMagic(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (lower.endsWith(".gif")) {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  }
  if (lower.endsWith(".webp")) {
    return (
      hasMagic(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes.length >= 12 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    );
  }
  if (lower.endsWith(".mp4") || lower.endsWith(".mov")) {
    return bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  }
  if (lower.endsWith(".webm")) return hasMagic(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  if (lower.endsWith(".mp3")) {
    return hasMagic(bytes, [0x49, 0x44, 0x33]) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  }
  if (lower.endsWith(".wav")) {
    return (
      hasMagic(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes.length >= 12 &&
      bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
    );
  }
  if (lower.endsWith(".zip") || lower.endsWith(".docx") || lower.endsWith(".xlsx") || lower.endsWith(".pptx")) {
    return zipMagic;
  }
  if (lower.endsWith(".doc") || lower.endsWith(".xls") || lower.endsWith(".ppt")) {
    return oleMagic || zipMagic;
  }
  if (lower.endsWith(".txt") || lower.endsWith(".csv")) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const session = await readSession();
  if (!session || (session.role !== "admin" && session.role !== "moderator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      return NextResponse.json(
        { error: "File type not allowed. Upload a PDF, image, video, audio or document." },
        { status: 400 }
      );
    }

    const lower = file.name.toLowerCase();
    const kind: keyof typeof MAX_SIZES = lower.endsWith(".pdf")
      ? "pdf"
      : /\.(png|jpe?g|webp|gif|svg)$/.test(lower)
      ? "image"
      : /\.(mp4|mov|webm)$/.test(lower)
      ? "video"
      : /\.(mp3|wav)$/.test(lower)
      ? "audio"
      : "default";

    if (file.size > MAX_SIZES[kind]) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(MAX_SIZES[kind] / 1024 / 1024)}MB for this type.` },
        { status: 400 }
      );
    }

    const scopeParam = request.nextUrl.searchParams.get("scope");
    const scope: "courses" | "resources" | "stories" | "scholarships" | "blogs" =
      scopeParam === "courses"
        ? "courses"
        : scopeParam === "stories"
        ? "stories"
        : scopeParam === "scholarships"
        ? "scholarships"
        : scopeParam === "blogs"
        ? "blogs"
        : "resources";
    const base =
      scope === "courses"
        ? "flybridge/courses"
        : scope === "stories"
        ? "flybridge/stories"
        : scope === "scholarships"
        ? "flybridge/scholarships"
        : scope === "blogs"
        ? "flybridge/blogs"
        : "flybridge/resources";

    const folder =
      kind === "image"
        ? `${base}/thumbnails`
        : kind === "video"
        ? `${base}/videos`
        : kind === "pdf"
        ? `${base}/pdfs`
        : base;

    const resourceType =
      kind === "image" ? "image" : kind === "video" ? "video" : "raw";

    const asset = await uploadAsset(file, folder, resourceType);

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("uploads POST error", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
