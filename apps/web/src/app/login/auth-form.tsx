"use client";

import { useState } from "react";
import Link from "next/link";

type Mode = "login" | "register";

export function AuthForm({ initialMode }: { initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  const inputClass =
    "w-full text-[14px] rounded-xl border bg-white px-4 py-[13px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-2/30" +
    " hover:border-brand-2/60";

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
          ? "Log in to continue your courses and progress."
          : "Create a free account to save your courses and progress."}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          className="flex items-center justify-center gap-2.5 rounded-xl border px-4 py-[11px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2/60 hover:bg-brand-soft/50"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2.5 rounded-xl border px-4 py-[11px] text-[13.5px] font-medium transition-all duration-200 hover:border-brand-2/60 hover:bg-brand-soft/50"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        <span className="font-mono text-[10.5px] tracking-[0.15em] uppercase" style={{ color: "var(--body)" }}>
          or with email
        </span>
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
      </div>

      <form className="flex flex-col gap-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                First name
              </label>
              <input type="text" placeholder="Jane" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                Last name
              </label>
              <input type="text" placeholder="Doe" className={inputClass} style={{ borderColor: "var(--line)", color: "var(--ink)" }} required />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
              Password
            </label>
            {mode === "login" && (
              <a href="#" className="text-[12px] font-medium hover:text-brand-2 transition-colors" style={{ color: "var(--brand)" }}>
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={inputClass}
              style={{ borderColor: "var(--line)", color: "var(--ink)", paddingRight: "44px" }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--body)" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <label className="flex items-start gap-2.5 text-[12px] leading-[1.55] cursor-pointer select-none" style={{ color: "var(--body)" }}>
            <input
              type="checkbox"
              className="mt-[2px] w-[15px] h-[15px] rounded accent-[#0FA968]"
              required
            />
            I agree to the Terms of Service and confirm I&apos;m 16 or older.
          </label>
        )}

        <button
          type="submit"
          className="w-full rounded-full text-white text-[14.5px] font-medium py-[14px] mt-1 transition-all duration-250 hover:translate-y-[-1px] hover:opacity-90"
          style={{ background: "var(--brand)", boxShadow: "0 12px 28px -12px rgba(15,169,104,0.55)" }}
        >
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-[13px] mt-6" style={{ color: "var(--body)" }}>
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
