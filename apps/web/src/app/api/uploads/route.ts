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

const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpe?g|webp|gif|svg|mp4|mov|webm|mp3|wav|txt|csv|zip)$/i;

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

    const folder =
      kind === "image"
        ? "flybridge/resources/thumbnails"
        : kind === "video"
        ? "flybridge/resources/videos"
        : kind === "pdf"
        ? "flybridge/resources/pdfs"
        : "flybridge/resources";

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
