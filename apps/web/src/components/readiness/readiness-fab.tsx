"use client";

import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

const PUBLIC_PREFIXES = ["/", "/about", "/faq", "/help", "/login", "/programs", "/readiness", "/resources", "/seminars", "/success-stories", "/partnership", "/privacy", "/terms", "/payment"];

export function ReadinessFab() {
  const pathname = usePathname();

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard || !isPublic) return null;

  return (
    <a
      href="/readiness"
      className="fixed bottom-5 left-5 z-[70] group flex items-center gap-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 pl-[18px] pr-5 py-[14px]"
      style={{
        background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
        boxShadow: "0 14px 34px -10px rgba(15,169,104,0.55)",
      }}
    >
      <span
        className="absolute inset-0 rounded-full fb-pulse pointer-events-none"
        style={{ boxShadow: "0 0 0 0 rgba(15,169,104,0.45)" }}
      />
      <Compass size={20} className="text-white relative" />
      <span className="text-white text-[14px] font-semibold relative">Am I Ready?</span>
    </a>
  );
}
