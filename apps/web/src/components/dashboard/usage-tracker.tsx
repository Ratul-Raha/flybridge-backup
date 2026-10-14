"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { trackUsageEvent } from "@/lib/usage/client";

// Pages that already emit a richer event (lesson_view) or are dedicated
// full-screen experiences should not also count as a generic page_view.
const SKIP_PREFIXES = ["/dashboard/admin"];
const SKIP_PATTERN =
  /^\/dashboard\/courses\/[^/]+\/(learn|certificate)|\/dashboard\/mock-tests\/[^/]+\/take/;

export function UsageTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!pathname) return;
    if (user?.accountType !== "user") return;
    if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    if (SKIP_PATTERN.test(pathname)) return;

    trackUsageEvent({ event: "page_view", path: pathname });
  }, [pathname, user?.accountType]);

  return null;
}
