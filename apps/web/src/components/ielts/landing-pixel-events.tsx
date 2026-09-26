"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-events";

/** Any anchor pointing at checkout or the waitlist anchor counts as an offer CTA. */
const CTA_HINTS = ["/checkout", "#waitlist"];

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

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!CTA_HINTS.some((hint) => href.includes(hint))) return;

      trackMetaEvent("InitiateCheckout", {
        content_ids: [contentId],
        content_name: contentName,
        content_type: "product",
        ...(value != null ? { value, currency } : {}),
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [contentId, contentName, value, currency]);

  return null;
}
