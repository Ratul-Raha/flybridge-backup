"use client";

import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { SignInModal } from "@/components/resources/sign-in-modal";

function formatCount(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/**
 * Social-style "love" toggle for a video resource. Optimistically flips state,
 * reverts on failure, and prompts guests to sign in (401).
 */
export function ResourceLoveButton({
  resourceId,
  initialCount = 0,
  initialLoved = false,
  size = "sm",
  onChanged,
}: {
  resourceId: string;
  initialCount?: number;
  initialLoved?: boolean;
  size?: "sm" | "md";
  onChanged?: (loved: boolean, loveCount: number) => void;
}) {
  const { user } = useAuth();
  const [loved, setLoved] = useState(initialLoved);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const toggle = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowSignIn(true);
      return;
    }
    if (busy) return;

    const next = !loved;
    setBusy(true);
    setLoved(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    try {
      const res = await fetch(`/api/resources/${resourceId}/love`, { method: "POST" });
      if (res.status === 401) {
        setShowSignIn(true);
        setLoved(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { loved: boolean; loveCount: number };
      setLoved(data.loved);
      setCount(data.loveCount);
      onChanged?.(data.loved, data.loveCount);
    } catch {
      setLoved(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  };

  const isSm = size === "sm";

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        title={loved ? "Remove love" : "Love this video"}
        aria-label={loved ? "Remove love" : "Love this video"}
        aria-pressed={loved}
        className={
          isSm
            ? "inline-flex items-center gap-1 rounded-full px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.04em] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
            : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
        }
        style={{
          background: loved ? "rgba(233,64,87,0.12)" : "rgba(18,32,67,0.06)",
          color: loved ? "#E94057" : "var(--body)",
        }}
      >
        <Heart
          size={isSm ? 9 : 14}
          strokeWidth={2.5}
          fill={loved ? "#E94057" : "none"}
        />
        {formatCount(count)}
      </button>

      {showSignIn && (
        <SignInModal
          title="Sign in to love this video"
          message="Join the community — sign in with Google to leave a love. Your free account is created automatically if you're new."
          onClose={() => setShowSignIn(false)}
        />
      )}
    </>
  );
}
