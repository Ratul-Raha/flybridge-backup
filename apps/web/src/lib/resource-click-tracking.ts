import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { ResourceDownload } from "@/lib/models/resource-download";
import { resourceClickAttribution } from "./resource-click-attribution.ts";

export async function trackResourceClick({
  request,
  resource,
  userId,
  kind,
  page,
}: {
  request: NextRequest;
  resource: { _id: Types.ObjectId };
  userId?: string;
  kind: "open" | "download";
  page: string;
}) {
  try {
    const attribution = resourceClickAttribution(request, page);
    const visitorKey = userId ? `u:${userId}` : `a:${attribution.ip}|${attribution.userAgent}`;
    await ResourceDownload.create({
      user: userId,
      resource: resource._id,
      visitorKey,
      kind,
      ...attribution,
    });
  } catch (error) {
    console.error("resource click tracking error", error);
  }
}
