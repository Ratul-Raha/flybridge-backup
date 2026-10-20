import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { trackLinkClick } from "./link-click-tracking.ts";

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
  await trackLinkClick({
    request,
    resource,
    userId,
    kind: kind === "open" ? "resource_open" : "resource_download",
    page,
  });
}
