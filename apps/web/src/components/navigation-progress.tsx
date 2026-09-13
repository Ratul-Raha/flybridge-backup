"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const FALLBACK_MS = 6000;

export function NavigationProgress() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    if (creepTimer.current) clearInterval(creepTimer.current);
    fallbackTimer.current = null;
    creepTimer.current = null;
  };

  const start = () => {
    clearTimers();
    setVisible(true);
    setProgress(24);

    requestAnimationFrame(() => setProgress(72));

    creepTimer.current = setInterval(() => {
      setProgress((p) => (p < 92 ? p + 2 : p));
    }, 420);

    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = setTimeout(finish, FALLBACK_MS);
  };

  const finish = () => {
    clearTimers();
    setProgress(100);
    const fade = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
    fallbackTimer.current = fade;
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      if (!anchor) return;
      const href = (anchor as HTMLAnchorElement).getAttribute("href") ?? "";
      if (href.startsWith("#") || href.startsWith("mailto:")) return;
      start();
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    finish();
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: "100%",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, var(--brand), var(--brand-2) 70%, rgba(47,95,224,0.9))",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 12px rgba(15,169,104,0.55)",
          transition: `width ${
            progress >= 100 ? "0.2s ease-out" : "0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }, opacity 0.2s ease-out`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}