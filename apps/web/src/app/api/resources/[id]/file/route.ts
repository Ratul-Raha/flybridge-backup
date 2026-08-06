import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Resource } from "@/lib/models/resource";

const MIME: Record<string, string> = {
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
  zip: "application/zip",
  txt: "text/plain",
  csv: "text/csv",
};

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function asciiSafe(name: string) {
  return name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    if (!resource.fileUrl) {
      return NextResponse.json({ error: "No file attached" }, { status: 404 });
    }

    if (resource.fileType === "link") {
      return NextResponse.redirect(resource.fileUrl);
    }

    const upstream = await fetch(resource.fileUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "File unavailable" }, { status: 502 });
    }

    const fileName = resource.fileName || `download.${extOf(resource.fileUrl)}`;
    const ext = extOf(fileName);
    const mime = MIME[ext] ?? "application/octet-stream";
    const inlineTypes = new Set(["pdf", "mp3", "wav", "m4a", "txt"]);
    const disposition = inlineTypes.has(ext) ? "inline" : "attachment";

    const headers = new Headers();
    headers.set("Content-Type", mime);
    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${asciiSafe(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("resource file GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
