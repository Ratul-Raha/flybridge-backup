"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareLeaderboardButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/leaderboard`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "FlyBridge Weekly Leaderboard",
          text: "Check out this week's FlyBridge leaderboard — progress has a scoreboard.",
          url,
        });
        return;
      } catch {
        /* user cancelled or share failed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-[13px] font-semibold transition-all duration-200 hover:bg-[var(--bg-soft)] active:scale-[0.98]"
      style={{
        borderColor: "var(--line)",
        color: copied ? "#0FA968" : "var(--ink)",
      }}
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Link copied!" : "Share"}
    </button>
  );
}
