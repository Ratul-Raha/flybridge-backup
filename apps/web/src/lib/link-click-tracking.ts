import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { LinkClick } from "@/lib/models/link-click";
import { ResourceDownload } from "@/lib/models/resource-download";
import { linkAttribution, visitorKeyFor, type LinkAttribution } from "./link-attribution.ts";

export type LinkClickKind = "resource_open" | "resource_download" | "email" | "affiliate" | "outbound";

export type TrackLinkClickInput = {
  request: NextRequest;
  kind: LinkClickKind;
  /** Page the click came from; usually derived from the referer. */
  page: string;
  userId?: string;
  resource?: { _id: Types.ObjectId };
  affiliate?: { _id: Types.ObjectId };
  emailRecipient?: string;
  templateId?: string;
  destination?: string;
  label?: string;
  /** Skip the legacy ResourceDownload mirror (non-resource surfaces). */
  mirrorResourceDownload?: boolean;
};

export type TrackedClick = LinkAttribution & { visitorKey: string };

export async function trackLinkClick(input: TrackLinkClickInput): Promise<TrackedClick> {
  const attribution = linkAttribution(input.request, input.page);
  const visitorKey = visitorKeyFor(input.userId, attribution);

  try {
    await connectDb();
    await LinkClick.create({
      kind: input.kind,
      user: input.userId,
      visitorKey,
      resource: input.resource?._id,
      affiliate: input.affiliate?._id,
      emailRecipient: input.emailRecipient ?? "",
      templateId: input.templateId ?? "",
      destination: input.destination ?? "",
      label: input.label ?? "",
      ...attribution,
    });
  } catch (error) {
    console.error("link click tracking error", error);
  }

  const isResource =
    input.resource && (input.kind === "resource_open" || input.kind === "resource_download");
  if (isResource && input.mirrorResourceDownload !== false) {
    try {
      await ResourceDownload.create({
        user: input.userId,
        resource: input.resource!._id,
        visitorKey,
        kind: input.kind === "resource_open" ? "open" : "download",
        ...attribution,
      });
    } catch (error) {
      console.error("resource download mirror error", error);
    }
  }

  return { ...attribution, visitorKey };
}
