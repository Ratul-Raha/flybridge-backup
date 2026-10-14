"use client";

import { useEffect } from "react";

const REF_PARAMS = ["ref", "aff"];
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

/**
 * Reads an affiliate code from `?ref=`/`?aff=` on any page and hands it to the
 * server so the last-click cookie is set and the click is logged. This lets an
 * affiliate share a normal product URL instead of a `/r/CODE` link.
 */
export function AffiliateRefCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = REF_PARAMS.map((key) => params.get(key)).find(
        (value): value is string => Boolean(value && value.trim())
      );
      if (!raw) return;

      const code = raw.trim().toUpperCase();
      if (!CODE_PATTERN.test(code)) return;

      // One capture per code per browser session keeps refreshes from inflating
      // the click count.
      const key = `fb_aff_ref_${code}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");

      void fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, path: window.location.pathname }),
        keepalive: true,
      }).catch(() => {
        // Attribution capture must never break the page.
      });
    } catch {
      // Ignore — storage or URL parsing being unavailable is not fatal.
    }
  }, []);

  return null;
}
