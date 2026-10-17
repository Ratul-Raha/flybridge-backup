import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { PhoneCapture } from "./phone-capture";

export const metadata: Metadata = {
  title: "Complete your profile | FlyBridge Education Group",
  description: "Add your phone number to complete your account setup.",
};

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");

  const safeNext = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
    ? searchParams.next
    : "/dashboard";

  return (
    <main className="min-h-screen flex flex-col items-center px-[clamp(20px,4.5vw,56px)] pt-[clamp(96px,14vh,150px)] pb-16">
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center text-center mb-10">
          <Link href="/" className="brand flex flex-col items-center leading-none" aria-label="FlyBridge home">
            <Image
              src="/transparent-logo-dark.png"
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
          <PhoneCapture next={safeNext} />
        </div>
      </div>
    </main>
  );
}
