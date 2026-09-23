"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, BadgeCheck, Loader2, ShieldAlert, ShieldQuestion } from "lucide-react";

type VerifyState =
  | { status: "loading" }
  | { status: "valid"; recipientName: string; courseTitle: string; courseSlug: string; issuedAt: string; grade: { percentage: number; grade: string; performance?: string; englishLevel: string; totalQuizzes: number; completedQuizzes: number } | null }
  | { status: "invalid"; reason: string };

const REASON_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "Certificate not found",
    body: "We could not find this certificate in our records. Please double-check the certificate number and try again.",
  },
  revoked: {
    title: "Certificate revoked",
    body: "This certificate has been revoked by FlyBridge Education Group and is no longer valid.",
  },
  invalid: {
    title: "Invalid certificate number",
    body: "The certificate number entered is not in a valid format. Please check the ID printed on the certificate.",
  },
  error: {
    title: "Verification unavailable",
    body: "Something went wrong while verifying this certificate. Please try again in a few moments.",
  },
};

export default function VerifyPage({ params }: { params: { certId: string } }) {
  const [state, setState] = useState<VerifyState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/verify/${params.certId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data?.valid) {
        setState({
          status: "valid",
          recipientName: data.recipientName,
          courseTitle: data.courseTitle,
          courseSlug: data.courseSlug,
          issuedAt: data.issuedAt,
          grade: data.grade,
        });
      } else {
        setState({ status: "invalid", reason: data?.reason ?? "not_found" });
      }
    } catch {
      setState({ status: "invalid", reason: "error" });
    }
  }, [params.certId]);

  useEffect(() => {
    load();
    document.title = "Certificate Verification | FlyBridge Education Group";
  }, [load]);

  const certId = (params.certId ?? "").toUpperCase();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(20,181,126,0.14), transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F6FAF8 100%)",
      }}
    >
      <div className="w-full max-w-[520px]">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <Image
            src="/transparent-logo-dark.png"
            alt="FlyBridge Education Group"
            width={180}
            height={36}
            className="h-9 w-auto object-contain"
          />
        </Link>

        <div
          className="rounded-3xl border bg-white p-8 shadow-[0_24px_60px_-30px_rgba(18,32,67,0.25)]"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="mb-6 text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-3"
              style={{ background: "var(--brand-soft)" }}
            >
              <ShieldQuestion size={22} style={{ color: "var(--brand)" }} />
            </div>
            <h1
              className="text-[20px] font-bold tracking-tight"
              style={{ color: "var(--ink)" }}
            >
              Certificate Verification
            </h1>
            <p
              className="mt-1 font-mono text-[11px] uppercase tracking-wider"
              style={{ color: "var(--body)" }}
            >
              {certId}
            </p>
          </div>

          {state.status === "loading" && (
            <div className="flex justify-center py-10">
              <Loader2
                size={26}
                className="animate-spin"
                style={{ color: "var(--brand)" }}
              />
            </div>
          )}

          {state.status === "valid" && (
            <div>
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full mb-3"
                  style={{ background: "var(--brand-soft)" }}
                >
                  <BadgeCheck size={34} style={{ color: "var(--brand)" }} />
                </div>
                <h2
                  className="text-[22px] font-bold tracking-tight"
                  style={{ color: "var(--brand)" }}
                >
                  Verified Certificate
                </h2>
                <p className="mt-1 text-[13px]" style={{ color: "var(--body)" }}>
                  This certificate is authentic and was issued by FlyBridge
                  Education Group.
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--line)", background: "var(--bg-soft)" }}
              >
                <dl className="space-y-4">
                  <div>
                    <dt
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--body)" }}
                    >
                      Recipient
                    </dt>
                    <dd
                      className="mt-0.5 text-[16px] font-bold"
                      style={{ color: "var(--ink)" }}
                    >
                      {state.recipientName}
                    </dd>
                  </div>
                  <div>
                    <dt
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--body)" }}
                    >
                      Program
                    </dt>
                    <dd
                      className="mt-0.5 text-[15px] font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {state.courseTitle}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <dt
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--body)" }}
                      >
                        Issued
                      </dt>
                      <dd
                        className="mt-0.5 text-[14px] font-semibold"
                        style={{ color: "var(--ink)" }}
                      >
                        {new Date(state.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </dd>
                    </div>
                    {state.grade && (
                      <div className="text-right">
                        <dt
                          className="text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--body)" }}
                        >
                          Result
                        </dt>
                        <dd
                          className="mt-0.5 text-[14px] font-semibold uppercase"
                          style={{ color: "var(--brand)" }}
                        >
                          {state.grade.grade} &middot; {state.grade.percentage}%
                          {state.grade.performance ? (
                            <span className="block text-[12px] font-medium uppercase">
                              {state.grade.performance}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    )}
                  </div>
                </dl>
              </div>

              {state.grade && (
                <p
                  className="mt-4 text-center text-[12px]"
                  style={{ color: "var(--body)" }}
                >
                  {state.grade.completedQuizzes}/{state.grade.totalQuizzes}{" "}
                  quizzes completed &middot; {state.grade.englishLevel}
                </p>
              )}
            </div>
          )}

          {state.status === "invalid" && (
            <div className="text-center py-2">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-3"
                style={{ background: "#FEF3F2" }}
              >
                <ShieldAlert size={32} style={{ color: "#B42318" }} />
              </div>
              <h2 className="text-[20px] font-bold" style={{ color: "var(--ink)" }}>
                {REASON_COPY[state.reason]?.title ?? "Certificate not found"}
              </h2>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: "var(--body)" }}
              >
                {REASON_COPY[state.reason]?.body ??
                  "We could not find this certificate in our records."}
              </p>
            </div>
          )}
        </div>

        <div
          className="mt-6 flex items-center justify-center gap-2 text-center"
          style={{ color: "var(--body)" }}
        >
          <Award size={14} style={{ color: "var(--brand)" }} />
          <p className="text-[12px]">
            Issued by <span className="font-semibold">FlyBridge Education Group</span> &middot;{" "}
            <Link
              href="/"
              className="underline underline-offset-2 hover:text-[#0FA968]"
            >
              flybridgeedu.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}