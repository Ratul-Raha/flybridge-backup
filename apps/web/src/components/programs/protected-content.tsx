"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Watermark } from "./watermark";

export function ProtectedContent({
  children,
  watermark,
  className,
  style,
}: {
  children: ReactNode;
  watermark?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectionInside = () => {
      const node = regionRef.current;
      const selection = window.getSelection();
      if (!node || !selection || selection.rangeCount === 0) return false;
      const anchor = selection.getRangeAt(0).commonAncestorContainer;
      const element = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;
      return element ? node.contains(element) : false;
    };

    const blockIfInside = (event: Event) => {
      if (selectionInside()) event.preventDefault();
    };

    const blockContextMenu = (event: MouseEvent) => {
      const node = regionRef.current;
      if (node?.contains(event.target as Node)) event.preventDefault();
    };

    const blockShortcuts = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();
      if ((key === "c" || key === "x") && selectionInside()) event.preventDefault();
      if (event.shiftKey && ["i", "j", "c"].includes(key) && selectionInside()) {
        event.preventDefault();
      }
    };

    document.addEventListener("copy", blockIfInside);
    document.addEventListener("cut", blockIfInside);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockShortcuts, true);

    return () => {
      document.removeEventListener("copy", blockIfInside);
      document.removeEventListener("cut", blockIfInside);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockShortcuts, true);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={regionRef}
        className={`select-none print:hidden ${className ?? ""}`.trim()}
        style={style}
        onContextMenu={(event) => event.preventDefault()}
      >
        {children}
      </div>
      <p
        className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] select-none print:hidden"
        style={{ color: "var(--body)" }}
      >
        <Lock size={11} className="shrink-0" />
        Copying is disabled for lesson text
      </p>
      {watermark && <Watermark text={watermark} />}
    </div>
  );
}
