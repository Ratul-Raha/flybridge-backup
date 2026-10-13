"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-events";

export function LandingPixelEvents({
  contentId,
  contentName,
  value,
  currency,
}: {
  contentId: string;
  contentName: string;
  value?: number;
  currency: string;
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
      ...(value != null ? { value, currency } : {}),
    });
  }, [contentId, contentName, value, currency]);

  return null;
}
