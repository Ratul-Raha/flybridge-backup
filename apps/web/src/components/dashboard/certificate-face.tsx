"use client";

import { Playfair_Display, Dancing_Script } from "next/font/google";
import { ShieldCheck, Lock, Award } from "lucide-react";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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

const LOCKED_TONE = "#B5C1D4";

// One flourish, reused and rotated into all four corners —
// an actual ornamental curl rather than a plain right-angle bracket.
function CornerFlourish({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const rotation = { tl: 0, tr: 90, bl: 270, br: 180 }[position];
  const placement = {
    tl: { top: "2.4%", left: "2.4%" },
    tr: { top: "2.4%", right: "2.4%" },
    bl: { bottom: "2.4%", left: "2.4%" },
    br: { bottom: "2.4%", right: "2.4%" },
  }[position];

  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      className="absolute pointer-events-none"
      style={{ ...placement, transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <path d="M1 1 C 1 12, 1 20, 1 20 M1 1 C 12 1, 20 1, 20 1" stroke="var(--brand-2)" strokeWidth="1.1" fill="none" />
      <path d="M1 1 C 8 3, 10 8, 10 14" stroke="var(--brand-2)" strokeWidth="0.9" fill="none" opacity="0.55" />
      <circle cx="1" cy="1" r="2.2" fill="var(--brand-2)" />
    </svg>
  );
}

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
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(165deg,#ffffff 0%,#F4FAF7 45%,#EAF7F1 100%)" }}
        />

        {/* Frame: outer rule, a quiet mat, then an inner hairline — like a mounted diploma */}
        <div className="absolute inset-[2.1%] pointer-events-none" style={{ border: "1.5px solid var(--brand-2)" }} />
        <div className="absolute inset-[2.7%] pointer-events-none" style={{ border: "1px solid var(--brand)", opacity: 0.5 }} />

        <CornerFlourish position="tl" />
        <CornerFlourish position="tr" />
        <CornerFlourish position="bl" />
        <CornerFlourish position="br" />

        {/* Header: logo + certificate number */}
        <div className="relative flex items-start justify-between px-[7%] pt-[6.5%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/transparent-logo-dark.png"
            alt="FlyBridge Education Group"
            className="h-[clamp(18px,2.6vw,28px)] w-auto object-contain"
          />
          <div className="text-right">
            <p
              className="font-semibold tracking-[0.16em]"
              style={{ fontSize: "clamp(6.5px,0.85vw,7.5px)", color: "var(--brand-2)" }}
            >
              Certificate no.
            </p>
            <p
              className="mt-0.5 font-mono font-bold tracking-wider"
              style={{ fontSize: "clamp(10px,1.2vw,12px)", color: unlocked ? "var(--brand)" : LOCKED_TONE }}
            >
              {unlocked ? issuedCertId : "FB-••••-••••"}
            </p>
          </div>
        </div>

        {/* Seal, with a small ribbon beneath it */}
        <div className="relative flex flex-col items-center mt-[1.2%]">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: "clamp(34px,4.2vw,48px)",
              height: "clamp(34px,4.2vw,48px)",
              background: "linear-gradient(155deg,#14B57E,#0FA968)",
              boxShadow: "0 2px 6px rgba(15,169,104,0.35)",
            }}
          >
            <Award size={20} style={{ color: "#fff" }} />
          </div>
          <svg width="30" height="14" viewBox="0 0 30 14" className="-mt-[1px]" aria-hidden="true">
            <path d="M5 0 L15 10 L25 0 L21 14 L15 8 L9 14 Z" fill="var(--brand-2)" opacity="0.55" />
          </svg>
        </div>

        {/* Main content */}
        <div className="relative flex flex-col items-center text-center px-[9%] mt-[0.5%]">
          <p
            className="font-semibold tracking-[0.3em]"
            style={{ fontSize: "clamp(7.5px,0.9vw,9px)", color: "var(--brand-2)" }}
          >
            Certificate of Completion
          </p>

          <p
            className={`${displayFont.className} italic mt-1.5`}
            style={{ fontSize: "clamp(13px,1.7vw,17px)", color: "var(--body)" }}
          >
            This is to certify that
          </p>

          <p
            className={`${scriptFont.className} leading-none`}
            style={{
              fontSize: "clamp(30px,5.2vw,52px)",
              color: unlocked ? "var(--ink)" : LOCKED_TONE,
              marginTop: "clamp(4px,1vw,10px)",
            }}
          >
            {name || "Student Name"}
          </p>

          <p
            className={displayFont.className}
            style={{
              fontSize: "clamp(11px,1.5vw,14px)",
              color: unlocked ? "var(--body)" : LOCKED_TONE,
              maxWidth: "500px",
              marginTop: "clamp(5px,1.1vw,10px)",
              lineHeight: 1.55,
            }}
          >
            has successfully completed{" "}
            <span style={{ color: unlocked ? "var(--brand)" : LOCKED_TONE, fontWeight: 700 }}>
              {courseTitle}
            </span>
            , meeting every requirement of the program with consistency and care.
          </p>
        </div>

        {/* Stats row */}
        {grade && (
          <div className="relative flex justify-center gap-[6%] sm:gap-[8%] mt-[2.4%] px-[8%]">
            {[
              { label: "Score", value: `${grade.percentage}%` },
              { label: "Grade", value: grade.grade },
              { label: "Level", value: grade.englishLevel.split(" ")[0] },
              { label: "Quizzes", value: `${grade.completedQuizzes}/${grade.totalQuizzes}` },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-[6%] sm:gap-[8%]">
                {i !== 0 && (
                  <span
                    className="hidden sm:block h-6 w-px -ml-[3%] sm:-ml-[4%]"
                    style={{ background: "var(--brand-2)", opacity: 0.35 }}
                  />
                )}
                <div className="text-center">
                  <p style={{ fontSize: "clamp(6.5px,0.85vw,7.5px)", color: "var(--body)" }}>{s.label}</p>
                  <p
                    className={`${displayFont.className} mt-0.5 font-bold tabular-nums`}
                    style={{ fontSize: "clamp(11px,1.6vw,16px)", color: "var(--ink)" }}
                  >
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Signature + verification row */}
        <div className="relative flex items-end justify-between mx-[6.5%] mt-[2.8%] pb-[3.8%]">
          <div className="text-left">
            <p
              className={`${scriptFont.className} font-bold`}
              style={{ fontSize: "clamp(16px,2.4vw,24px)", color: "var(--brand)" }}
            >
              FlyBridge
            </p>
            <div className="mt-1 h-px w-24 sm:w-32" style={{ background: "var(--brand-2)" }} />
            <p
              className="mt-1 flex items-center gap-1"
              style={{ fontSize: "clamp(7px,0.85vw,8.5px)", color: "var(--body)" }}
            >
              <ShieldCheck size={10} />
              {unlocked ? "Authorized signature" : "Locked"}
            </p>
          </div>

          {unlocked && (
            <div className="text-right flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <p style={{ fontSize: "clamp(6.5px,0.8vw,7.5px)", color: "var(--body)" }}>Issued</p>
                <p className="mt-0.5 font-semibold" style={{ fontSize: "clamp(9px,1.1vw,11px)", color: "var(--ink)" }}>
                  {dateLabel}
                </p>
              </div>
              <div
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-sm border p-1 overflow-hidden"
                style={{ borderColor: "var(--brand)", background: "#fff" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrSrc} alt="Verify certificate" className="w-full h-full object-contain" loading="lazy" />
              </div>
            </div>
          )}
        </div>

        {/* Footer: registered address */}
        <div className="absolute left-0 right-0 text-center" style={{ bottom: "3.2%" }}>
          <p style={{ fontSize: "clamp(6.5px,0.75vw,7.5px)", color: "var(--body)", opacity: 0.85 }}>
            FlyBridge Education Group &middot; 757 Gladstone Avenue, Toronto, ON M6H 3J5, Canada
          </p>
        </div>

        {/* Locked overlay — same medallion language as the seal above, not a generic paywall circle */}
        {!unlocked && (
          <div className="absolute inset-x-0 bottom-0 h-[46%] pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(234,247,241,0) 0%, rgba(234,247,241,0.9) 58%, #EAF7F1 92%)",
              }}
            />
            <div className="absolute left-1/2 bottom-[20%] -translate-x-1/2 flex flex-col items-center gap-1.5 text-center">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(155deg,#C9D4E2,#B5C1D4)",
                  boxShadow: "0 2px 6px rgba(120,135,160,0.35)",
                }}
              >
                <Lock size={16} style={{ color: "#fff" }} />
              </div>
              <p
                className={`${displayFont.className} italic font-semibold`}
                style={{ fontSize: "clamp(10px,1.3vw,12.5px)", color: "var(--ink)" }}
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
