"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

type Mode = "login" | "register";

export function AuthForm({ initialMode, next, source }: { initialMode: Mode; next?: string | null; source?: string | null }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signingIn, setSigningIn] = useState(false);
  const { user, error, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle(source ?? null);
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    if (user) router.replace(next ?? "/dashboard");
  }, [user, router, next]);

  return (
    <div>
      <div
        className="grid grid-cols-2 gap-1 rounded-full p-1 mb-8"
        style={{ background: "var(--bg-soft)", border: "1px solid var(--line)" }}
      >
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full py-[9px] text-[13.5px] font-medium transition-all duration-250 ${
              mode === m ? "text-white" : ""
            }`}
            style={
              mode === m
                ? { background: "var(--brand)" }
                : { color: "var(--body)" }
            }
          >
            {m === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <h1
        className="font-display text-[26px] font-semibold tracking-[-0.02em] text-center"
        style={{ color: "var(--ink)" }}
      >
        {mode === "login" ? "Welcome back" : "Start your journey"}
      </h1>
      <p
        className="text-center text-[13.5px] leading-[1.6] mt-2 mb-8"
        style={{ color: "var(--body)" }}
      >
        {mode === "login"
          ? "Sign in with Google to continue your courses and progress."
          : "Sign up with Google — we'll create your free account if you're new."}
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="flex items-center justify-center gap-2.5 rounded-xl border px-4 py-[11px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2/60 hover:bg-brand-soft/50 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          {signingIn ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          {signingIn ? "Signing in…" : "Google"}
        </button>
      </div>

      {error && (
        <div
          className="text-[12.5px] rounded-xl border px-4 py-3 mb-6"
          style={{ color: "#C0392B", borderColor: "rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)" }}
        >
          {error}
        </div>
      )}

      <p className="text-center text-[13px]" style={{ color: "var(--body)" }}>
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/login?mode=register" className="font-medium hover:text-brand-2 transition-colors" style={{ color: "var(--brand)" }}>
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium hover:text-brand-2 transition-colors" style={{ color: "var(--brand)" }}>
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
