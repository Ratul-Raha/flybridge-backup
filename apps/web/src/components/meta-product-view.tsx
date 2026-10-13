"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-events";

export function MetaProductView({
  contentId,
  contentName,
  value,
  currency,
}: {
  contentId: string;
  contentName: string;
  value?: number | null;
  currency?: string;
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
      ...(typeof value === "number" && Number.isFinite(value) && currency
        ? { value, currency: currency.toUpperCase() }
        : {}),
    });
  }, [contentId, contentName, value, currency]);

  return null;
}
