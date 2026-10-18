import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { Resource } from "@/lib/models/resource";
import { ResourceDownload } from "@/lib/models/resource-download";
import { Order } from "@/lib/models/order";
import { assertSafeRedirectUrl } from "@/lib/url-safety";
import { isS3Configured } from "@/lib/s3";
import { isS3Ref, signMediaUrl } from "@/lib/storage";

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
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
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

/** 302 the browser straight to the storage backend so media bytes never
 *  travel through this Function (proxying them bills every byte twice). */
function redirectNoStore(url: string) {
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
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
      return redirectNoStore(resource.fileUrl);
    }

    const fileName = resource.fileName || `download.${extOf(resource.fileUrl)}`;
    const ext = extOf(fileName);
    const mime = MIME[ext] ?? "application/octet-stream";
    const inlineTypes = new Set(["pdf", "mp3", "wav", "m4a", "mp4", "webm", "mov", "txt"]);
    const forceDownload = _request.nextUrl.searchParams.get("dl") === "1";
    const disposition = forceDownload || !inlineTypes.has(ext) ? "attachment" : "inline";
    const range = _request.headers.get("range") ?? undefined;

    // Count a download once per open/play — ranged follow-ups (video seeking,
    // metadata probes) belong to the same view, not a new download. Download
    // counts are high-frequency, so they rely on the counts cache TTL rather
    // than invalidating (which would thrash the aggregate).
    if (session?.userId && !range) {
      ResourceDownload.create({ user: session.userId, resource: resource._id }).catch((e) =>
        console.error("resource download tracking error", e)
      );
    }

    // Private S3 storage — sign a short-lived URL and redirect so the object
    // streams straight from S3 to the browser, off the Vercel bandwidth meter.
    if (isS3Ref(resource.fileUrl)) {
      if (!isS3Configured()) {
        return NextResponse.json({ error: "File unavailable" }, { status: 502 });
      }
      try {
        const contentDisposition =
          disposition === "attachment"
            ? `attachment; filename="${asciiSafe(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
            : undefined;
        const signed = await signMediaUrl(resource.fileUrl, 60 * 60, {
          ...(contentDisposition ? { contentDisposition } : {}),
          contentType: mime,
        });
        return redirectNoStore(signed);
      } catch (error) {
        console.error("resource S3 file signing error", error);
        return NextResponse.json({ error: "File unavailable" }, { status: 502 });
      }
    }

    // Legacy external URLs (e.g. Cloudinary) — validate and send the browser
    // there directly instead of streaming through the Function.
    try {
      assertSafeRedirectUrl(resource.fileUrl);
    } catch {
      return NextResponse.json({ error: "Unsafe file URL" }, { status: 400 });
    }
    return redirectNoStore(resource.fileUrl);
  } catch (error) {
    console.error("resource file GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
