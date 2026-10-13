"use client";

import { useEffect } from "react";
import {
  MARKETING_ATTRIBUTION_COOKIE,
  MARKETING_ATTRIBUTION_MAX_AGE_SECONDS,
  marketingTouchFromUrl,
  parseMarketingAttributionCookie,
  updateMarketingTouchHistory,
} from "@/lib/marketing-attribution";

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const pair = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return pair?.slice(prefix.length);
}

export function MarketingAttributionCapture() {
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      const existing = parseMarketingAttributionCookie(
        readCookie(MARKETING_ATTRIBUTION_COOKIE)
      );
      const current = marketingTouchFromUrl(currentUrl, document.referrer);
      const history = updateMarketingTouchHistory(existing, current);
      const encoded = encodeURIComponent(JSON.stringify(history));
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${MARKETING_ATTRIBUTION_COOKIE}=${encoded}; Path=/; Max-Age=${MARKETING_ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    } catch {
      // Attribution capture must never prevent the page or checkout from working.
    }
  }, []);

  return null;
}
