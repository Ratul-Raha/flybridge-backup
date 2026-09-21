"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CheckCircle2, Gift, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BengaliText } from "@/components/bengali-text";
import { WISHLIST_PENDING_KEY } from "@/lib/wishlist";

export function WaitlistForm({
  slug,
  title,
  discountPercent = 0,
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
        className="mx-auto inline-flex items-center gap-2.5 rounded-full px-5 py-3"
        style={{ background: "rgba(124,240,189,0.12)", border: "1px solid rgba(124,240,189,0.35)" }}
      >
        <CheckCircle2 className="h-[18px] w-[18px]" style={{ color: "var(--brand-2)" }} />
        <span className="text-[14px] font-semibold" style={{ color: "#7CF0BD" }}>
          <BengaliText>তুমি ওয়েটলিস্টে যুক্ত হয়েছ</BengaliText>
          {discountPercent > 0 ? ` · ${discountPercent}%` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || loading}
        className="browse-btn inline-flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-[15px] text-[15.5px] font-bold disabled:pointer-events-none disabled:opacity-60"
        style={{ background: "var(--brand)", color: "#052117", boxShadow: "0 10px 28px -10px rgba(46,158,107,0.6)" }}
      >
        {busy || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
        <BengaliText>
          {user ? "এখনই ওয়েটলিস্টে জয়েন করো" : "সাইন ইন করে জয়েন করো"}
        </BengaliText>
      </button>

      {error && (
        <p className="mt-3 rounded-xl px-4 py-3 text-[13px] font-medium" style={{ background: "rgba(185,28,28,0.12)", color: "#FCA5A5" }}>
          {error}
        </p>
      )}

      {!user && (
        <p className="mt-3 text-center text-[11.5px] leading-[1.6]" style={{ color: "#64748B" }}>
          <BengaliText>Google দিয়ে সাইন ইন করলেই অটোমেটিক ওয়েটলিস্টে যুক্ত হয়ে যাবে।</BengaliText>
        </p>
      )}
    </div>
  );
}
