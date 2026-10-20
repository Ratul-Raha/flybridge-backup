"use client";

import { useState } from "react";
import { Loader2, Lock, Play, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export function SignInModal({
  title = "Sign in to view",
  message = "This video is for FlyBridge members. Sign in with Google to watch it — your free account is created automatically if you're new.",
  youtubeUrl,
  onClose,
}: {
  title?: string;
  message?: string;
  youtubeUrl?: string | null;
  onClose: () => void;
}) {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle("resources");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-[rgba(10,14,26,0.82)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[380px] rounded-2xl bg-white p-7"
        style={{ boxShadow: "0 40px 90px -30px rgba(0,0,0,0.6)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
          style={{ color: "var(--body)" }}
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "rgba(107,76,224,0.12)", color: "#6B4CE0" }}
        >
          <Lock size={22} strokeWidth={2} />
        </div>

        <h2
          className="mt-4 font-display text-[20px] font-semibold tracking-[-0.01em]"
          style={{ color: "var(--ink)" }}
        >
          {title}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.7]" style={{ color: "var(--body)" }}>
          {message}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-[12px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2/60 hover:bg-brand-soft/50 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg className="h-[16px] w-[16px]" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-3 text-center text-[12.5px]" style={{ color: "#C0392B" }}>
            {error}
          </p>
        )}

        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="mt-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-[12px] text-[13.5px] font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: "#FF0000" }}
          >
            <Play size={15} fill="currentColor" strokeWidth={0} />
            Watch on YouTube instead
          </a>
        )}

        <p className="mt-4 text-center text-[11.5px]" style={{ color: "var(--body)" }}>
          Nothing is posted publicly — signing in just unlocks your member content.
        </p>
      </div>
    </div>
  );
}
