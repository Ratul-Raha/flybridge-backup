"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle2, Gift, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BengaliText } from "@/components/bengali-text";
import { WISHLIST_PENDING_KEY, WISHLIST_DISCOUNT_PERCENT } from "@/lib/wishlist";

export function WaitlistForm({
  slug,
  title,
  discountPercent = WISHLIST_DISCOUNT_PERCENT,
}: {
  slug: string;
  title: string;
  discountPercent?: number;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const autoTried = useRef(false);

  const join = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      sessionStorage.removeItem(WISHLIST_PENDING_KEY);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, [slug, title]);

  useEffect(() => {
    if (loading || !user || autoTried.current) return;
    if (sessionStorage.getItem(WISHLIST_PENDING_KEY) !== slug) return;
    autoTried.current = true;
    join();
  }, [loading, user, slug, join]);

  const handleClick = () => {
    if (!user) {
      sessionStorage.setItem(WISHLIST_PENDING_KEY, slug);
      router.push(`/login?next=${encodeURIComponent(`${pathname}#waitlist`)}`);
      return;
    }
    join();
  };

  if (done) {
    return (
      <div
        className="mx-auto w-full max-w-[460px] rounded-[14px] px-8 py-9"
        style={{ background: "rgba(124,240,189,0.08)", border: "1px solid rgba(124,240,189,0.35)" }}
      >
        <span
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(124,240,189,0.14)" }}
        >
          <CheckCircle2 className="h-7 w-7" style={{ color: "var(--brand-2)" }} />
        </span>
        <h3 className="font-display text-[20px] font-semibold text-white">
          <BengaliText>তুমি ওয়েটলিস্টে!</BengaliText>
        </h3>
        <p className="mt-2 text-[14px] leading-[1.7]" style={{ color: "#8CA0B8" }}>
          <BengaliText>
            লঞ্চের সাথে সাথে আমরা তোমাকে জানিয়ে দেব।
          </BengaliText>
        </p>
        <div
          className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: "rgba(124,240,189,0.12)", border: "1px solid rgba(124,240,189,0.35)" }}
        >
          <Gift className="h-4 w-4" style={{ color: "#7CF0BD" }} />
          <span className="text-[13px] font-semibold" style={{ color: "#7CF0BD" }}>
            <BengaliText>{discountPercent}% Discount তোমার জন্য সংরক্ষিত</BengaliText>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div
        className="flex flex-col gap-4 rounded-[14px] p-6 sm:p-8"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="text-left">
          <p className="font-mono text-[10.5px] font-semibold tracking-[0.3em]" style={{ color: "var(--brand-2)" }}>
            JOIN THE WAITLIST
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "#8CA0B8" }}>
            <BengaliText>এক ক্লিকেই যুক্ত হয়ে যাও — কোনো ফর্ম পূরণ নেই</BengaliText>
          </p>
        </div>

        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left"
          style={{ background: "rgba(124,240,189,0.1)", border: "1px solid rgba(124,240,189,0.35)" }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(124,240,189,0.16)" }}
          >
            <Gift className="h-[18px] w-[18px]" style={{ color: "#7CF0BD" }} />
          </span>
          <div>
            <div className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-white">
              <Sparkles className="h-[14px] w-[14px]" style={{ color: "#7CF0BD" }} />
              {discountPercent}% Discount
            </div>
            <div className="mt-0.5 text-[12.5px] leading-snug" style={{ color: "#B7C4D6" }}>
              <BengaliText>
                ওয়েটলিস্টে জয়েন করলেই কোর্সে {discountPercent}% ছাড়।
              </BengaliText>
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: "rgba(185,28,28,0.12)", color: "#FCA5A5" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={busy || loading}
          className="browse-btn inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-[15px] text-[15.5px] font-bold disabled:pointer-events-none disabled:opacity-60"
          style={{ background: "var(--brand)", color: "#052117", boxShadow: "0 10px 28px -10px rgba(46,158,107,0.6)" }}
        >
          {busy || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
          <BengaliText>
            {user ? "এখনই ওয়েটলিস্টে জয়েন করো" : "সাইন ইন করে জয়েন করো"}
          </BengaliText>
        </button>

        <p className="text-center text-[11.5px] leading-[1.6]" style={{ color: "#64748B" }}>
          <BengaliText>
            {user
              ? `জয়েন করলেই তোমার ${discountPercent}% ছাড় স্বয়ংক্রিয়ভাবে যোগ হবে।`
              : "Google দিয়ে সাইন ইন করলেই অটোমেটিক ওয়েটলিস্টে যুক্ত হয়ে যাবে।"}
          </BengaliText>
        </p>
      </div>
    </div>
  );
}
