import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { ResourceDownload } from "@/lib/models/resource-download";
import { Order } from "@/lib/models/order";
import { assertSafeFetchUrl, assertSafeRedirectUrl } from "@/lib/url-safety";
import { isS3Ref, getS3Object } from "@/lib/storage";

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

    const session = await readSession();

    if (resource.access !== "public") {
      if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((resource.price ?? 0) > 0) {
        const owned = await Order.exists({
          user: session.userId,
          "items.itemId": resource._id.toString(),
          "items.itemType": "resource",
          status: "completed",
        });
        if (!owned) {
          return NextResponse.json({ error: "Purchase required" }, { status: 403 });
        }
      }
    }

    if (resource.fileType === "link") {
      try {
        assertSafeRedirectUrl(resource.fileUrl);
      } catch {
        return NextResponse.json({ error: "Unsafe link target" }, { status: 400 });
      }
      return NextResponse.redirect(resource.fileUrl);
    }

    const fileName = resource.fileName || `download.${extOf(resource.fileUrl)}`;
    const ext = extOf(fileName);
    const mime = MIME[ext] ?? "application/octet-stream";
    const inlineTypes = new Set(["pdf", "mp3", "wav", "m4a", "txt"]);
    const forceDownload = _request.nextUrl.searchParams.get("dl") === "1";
    const disposition = forceDownload || !inlineTypes.has(ext) ? "attachment" : "inline";

    const headers = new Headers();
    headers.set("Content-Type", mime);
    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${asciiSafe(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    headers.set("Cache-Control", "public, max-age=3600");

    if (session?.userId) {
      ResourceDownload.create({ user: session.userId, resource: resource._id }).catch((e) =>
        console.error("resource download tracking error", e)
      );
    }

    // New private S3 storage — pipe the object stream straight through.
    if (isS3Ref(resource.fileUrl)) {
      try {
        const { stream, contentLength, contentType } = await getS3Object(resource.fileUrl);
        if (!stream) {
          return NextResponse.json({ error: "File unavailable" }, { status: 502 });
        }
        if (contentType) headers.set("Content-Type", contentType);
        if (contentLength) headers.set("Content-Length", String(contentLength));
        return new Response(stream, { status: 200, headers });
      } catch (error) {
        console.error("resource S3 file GET error", error);
        return NextResponse.json({ error: "File unavailable" }, { status: 502 });
      }
    }

    try {
      await assertSafeFetchUrl(resource.fileUrl);
    } catch {
      return NextResponse.json({ error: "Unsafe file URL" }, { status: 400 });
    }

    const upstream = await fetch(resource.fileUrl, { cache: "no-store", redirect: "error" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "File unavailable" }, { status: 502 });
    }

    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("resource file GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
