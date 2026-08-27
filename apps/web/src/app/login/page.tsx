import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = {
  title: "Log in | FlyBridge Education Group",
  description:
    "Log in or create a free account to access your FlyBridge courses, documents and progress.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string; next?: string };
}) {
  const { mode, next } = searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;

  return (
    <main className="min-h-screen flex flex-col items-center px-[clamp(20px,4.5vw,56px)] pt-[clamp(96px,14vh,150px)] pb-16">
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center mb-10">
          <Link href="/" className="brand flex flex-col items-center leading-none" aria-label="FlyBridge home">
            <Image
              src="/logo-light.png"
              alt="FlyBridge Education Group"
              width={113}
              height={38}
              className="w-auto h-[38px] object-contain"
              priority
            />
          </Link>
        </div>

        <div
          className="rounded-lg border bg-white p-[clamp(24px,5vw,40px)]"
          style={{ borderColor: "var(--line)", boxShadow: "0 24px 60px -32px rgba(18,32,67,0.18)" }}
        >
          <AuthForm initialMode={mode === "register" ? "register" : "login"} next={safeNext} />
        </div>

        <p className="text-center text-[12.5px] leading-[1.6] mt-6" style={{ color: "var(--body)" }}>
          By continuing you agree to the{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-brand-2 transition-colors">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/terms" className="underline underline-offset-2 hover:text-brand-2 transition-colors">
            Terms of Service
          </a>
          .
        </p>
      </div>
    </main>
  );
}
