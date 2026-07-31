import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        body: "var(--body)",
        brand: { DEFAULT: "var(--brand)", 2: "var(--brand-2)", soft: "var(--brand-soft)" },
        bg: { DEFAULT: "var(--bg)", soft: "var(--bg-soft)" },
        line: "var(--line)",
        mint: { bg: "var(--mint-bg)", ink: "var(--mint-ink)" },
        lav: { bg: "var(--lav-bg)", ink: "var(--lav-ink)" },
        peach: { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
        blue: { bg: "var(--blue-bg)", ink: "var(--blue-ink)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-lg": ["clamp(36px,4.6vw,58px)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "title": ["1.25rem", { lineHeight: "1.3" }],
        "body": ["1rem", { lineHeight: "1.65" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.65" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.5" }],
        "mono-sm": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.03em" }],
      },
      borderRadius: {
        full: "9999px",
        "2xl": "16px",
      },
      animation: {
        "bob": "bob 5s ease-in-out infinite",
        "scroll-reel": "scrollReel 14s linear infinite",
        "fade-in": "fadeIn 0.6s ease-out",
        "fade-up": "fadeUp 0.6s ease-out",
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scrollReel: {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
