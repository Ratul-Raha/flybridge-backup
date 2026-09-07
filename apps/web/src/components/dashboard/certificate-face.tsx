"use client";

import { Playfair_Display, Dancing_Script } from "next/font/google";
import { ShieldCheck, Lock, Award } from "lucide-react";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

const scriptFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export type CertificateGrade = {
  percentage: number;
  grade: string;
  englishLevel: string;
  completedQuizzes: number;
  totalQuizzes: number;
};

type CertificateFaceProps = {
  unlocked: boolean;
  issuedCertId: string;
  name: string;
  courseTitle: string;
  dateLabel: string;
  qrSrc: string;
  grade?: CertificateGrade | null;
};

export function CertificateFace({
  unlocked,
  issuedCertId,
  name,
  courseTitle,
  dateLabel,
  qrSrc,
  grade,
}: CertificateFaceProps) {
  return (
    <div id="certificate-print" className="cert-print w-full" style={{ aspectRatio: "1.55 / 1" }}>
      <div
        className="cert-face relative w-full h-full rounded-[6px] overflow-hidden"
        style={{ boxShadow: "0 40px 80px -40px rgba(18,32,67,0.35)" }}
      >
        <div className="print-cert-frame" style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg,#ffffff 0%,#F4FAF7 45%,#EAF7F1 100%)" }} />
        {/* Micro-dot grid, top-left */}
        <div
          className="absolute top-[6%] left-[3%] w-40 h-28 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(var(--brand-2) 1px, transparent 1.5px)",
            backgroundSize: "12px 12px",
            opacity: 0.14,
          }}
        />
        {/* Micro-dot grid, bottom-right */}
        <div
          className="absolute bottom-[8%] right-[3%] w-44 h-32 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(var(--brand) 1px, transparent 1.5px)",
            backgroundSize: "14px 14px",
            opacity: 0.12,
          }}
        />
        {/* Soft gradient blobs */}
        <div
          className="absolute -top-14 -right-12 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(15,169,104,0.12), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-16 -left-12 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(20,181,126,0.10), transparent 70%)",
          }}
        />

        {/* Outer brand rule */}
        <div
          className="absolute inset-[2.2%] pointer-events-none"
          style={{ border: "2px solid var(--brand-2)" }}
        />
        {/* Inner hairline rule */}
        <div
          className="absolute inset-[3%] pointer-events-none"
          style={{ border: "1px solid var(--brand)" }}
        />

        {/* Corner flourishes */}
        {[
          { top: "2.2%", left: "2.2%", rotate: "0deg" },
          { top: "2.2%", right: "2.2%", rotate: "90deg" },
          { bottom: "2.2%", right: "2.2%", rotate: "180deg" },
          { bottom: "2.2%", left: "2.2%", rotate: "270deg" },
        ].map((pos, i) => (
          <svg
            key={i}
            width="34"
            height="34"
            viewBox="0 0 34 34"
            className="absolute pointer-events-none"
            style={{ ...pos, transform: `rotate(${pos.rotate})` }}
          >
            <path
              d="M2 2 H16 M2 2 V16"
              stroke="var(--brand-2)"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="2" cy="2" r="3" fill="var(--brand-2)" />
          </svg>
        ))}

        {/* Header: logo + cert id */}
        <div className="relative flex items-start justify-between px-[6%] pt-[6%]">
          <div className="flex flex-col items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/transparent-logo-dark.png"
              alt="FlyBridge Education Group"
              className="h-[clamp(18px,2.6vw,28px)] w-auto object-contain"
            />
          </div>

          <div className="text-right">
            <p
              className="text-[7px] sm:text-[8px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--brand-2)" }}
            >
              Certificate No.
            </p>
            <p
              className="mt-0.5 text-[10px] sm:text-[12px] font-bold font-mono tracking-wider"
              style={{ color: unlocked ? "var(--brand)" : "#B5C1D4" }}
            >
              {unlocked ? issuedCertId : "FB-••••-••••"}
            </p>
          </div>
        </div>

        {/* Seal */}
        <div className="relative flex justify-center mt-[1%]">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: "clamp(34px, 4.2vw, 48px)",
              height: "clamp(34px, 4.2vw, 48px)",
              background: "linear-gradient(155deg,#14B57E,#0FA968)",
              boxShadow: "0 2px 6px rgba(15,169,104,0.35)",
            }}
          >
            <Award size={20} style={{ color: "#fff" }} />
          </div>
        </div>

        {/* Main content, centered */}
        <div className="relative flex flex-col items-center text-center px-[8%] mt-[1.5%]">
          <p
            className="text-[8px] sm:text-[9.5px] font-semibold uppercase tracking-[0.4em]"
            style={{ color: "var(--brand-2)" }}
          >
            Certificate of Completion
          </p>

          <h1
            className={`${displayFont.className} mt-1.5 italic font-bold`}
            style={{
              fontSize: "clamp(15px, 2vw, 20px)",
              color: "var(--ink)",
              letterSpacing: "0.01em",
            }}
          >
            This is to certify that
          </h1>

          <p
            className={`${scriptFont.className} leading-none`}
            style={{
              fontSize: "clamp(30px, 5.4vw, 54px)",
              color: "var(--ink)",
              marginTop: "clamp(4px, 1vw, 10px)",
            }}
          >
            {name || "Student Name"}
          </p>

          <p
            className={`${scriptFont.className}`}
            style={{
              fontSize: "clamp(13px, 1.9vw, 19px)",
              color: "var(--body)",
              maxWidth: "560px",
              marginTop: "clamp(4px, 1vw, 8px)",
              lineHeight: 1.35,
            }}
          >
            has successfully completed{" "}
            <span style={{ color: "var(--brand)", fontWeight: 700 }}>
              {courseTitle}
            </span>
            , demonstrating dedication and commitment throughout the
            program. We proudly recognize this achievement and wish
            continued success ahead.
          </p>
        </div>

        {/* Stats row */}
        {grade && (
          <div className="relative flex justify-center gap-[6%] sm:gap-[8%] mt-[2.2%] px-[8%]">
            {[
              { label: "Score", value: `${grade.percentage}%` },
              { label: "Grade", value: grade.grade },
              { label: "Level", value: grade.englishLevel.split(" ")[0] },
              {
                label: "Quizzes",
                value: `${grade.completedQuizzes}/${grade.totalQuizzes}`,
              },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-[6%] sm:gap-[8%]">
                {i !== 0 && (
                  <span
                    className="hidden sm:block h-6 w-px -ml-[3%] sm:-ml-[4%]"
                    style={{ background: "var(--brand)", opacity: 0.35 }}
                  />
                )}
                <div className="text-center">
                  <p
                    className="font-mono text-[6.5px] sm:text-[8px] uppercase tracking-wider"
                    style={{ color: "var(--body)" }}
                  >
                    {s.label}
                  </p>
                  <p
                    className={`${displayFont.className} mt-0.5 font-bold tabular-nums`}
                    style={{
                      fontSize: "clamp(11px, 1.6vw, 16px)",
                      color: "var(--ink)",
                    }}
                  >
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Signature + verification row */}
        <div className="relative flex items-end justify-between mx-[6%] mt-[2.8%] pb-[3.5%]">
          <div className="text-left">
            <p
              className={`${scriptFont.className} font-bold`}
              style={{ fontSize: "clamp(16px, 2.4vw, 24px)", color: "var(--brand)" }}
            >
              FlyBridge
            </p>
            <div
              className="mt-1 h-px w-24 sm:w-32"
              style={{ background: "var(--brand-2)" }}
            />
            <p
              className="mt-1 text-[7px] sm:text-[8.5px] uppercase tracking-[0.14em] flex items-center gap-1"
              style={{ color: "var(--body)" }}
            >
              <ShieldCheck size={10} />
              {unlocked ? "Authorized signature" : "Locked"}
            </p>
          </div>

          <div className="text-right flex items-center gap-2 sm:gap-3">
            {unlocked && (
              <>
                <div className="text-right">
                  <p
                    className="font-mono text-[6.5px] sm:text-[7.5px] uppercase tracking-wider"
                    style={{ color: "var(--body)" }}
                  >
                    Issued
                  </p>
                  <p
                    className="mt-0.5 text-[9px] sm:text-[11px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    {dateLabel}
                  </p>
                </div>
                <div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-sm border p-1 overflow-hidden"
                  style={{ borderColor: "var(--brand)", background: "#fff" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSrc}
                    alt="Verify certificate"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer: registered address */}
        <div
          className="absolute left-0 right-0 text-center"
          style={{ bottom: "3.4%" }}
        >
          <p
            className="font-mono text-[6.5px] sm:text-[7.5px] uppercase tracking-[0.14em]"
            style={{ color: "var(--body)" }}
          >
            FlyBridge Education Group &middot; 757 Gladstone Avenue, Toronto, ON M6H 3J5, Canada
          </p>
        </div>

        {/* Locked fade overlay */}
        {!unlocked && (
          <div className="absolute inset-x-0 bottom-0 h-[50%] pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(234,247,241,0) 0%, rgba(234,247,241,0.85) 55%, #EAF7F1 92%)",
              }}
            />
            <div className="absolute left-1/2 bottom-[18%] -translate-x-1/2 flex flex-col items-center gap-1.5 text-center">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full border"
                style={{ borderColor: "var(--brand)", background: "#F4FAF7" }}
              >
                <Lock size={16} style={{ color: "var(--brand)" }} />
              </div>
              <p
                className={`${displayFont.className} italic text-[10px] sm:text-[12px] font-bold`}
                style={{ color: "var(--ink)" }}
              >
                Unlock the full certificate
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}