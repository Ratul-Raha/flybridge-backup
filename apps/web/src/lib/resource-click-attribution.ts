import type { NextRequest } from "next/server";
import { linkAttribution, type LinkAttribution } from "./link-attribution.ts";

export type ResourceClickAttribution = LinkAttribution;

export const resourceClickAttribution = (request: NextRequest, fallbackPage: string) =>
  linkAttribution(request, fallbackPage);
