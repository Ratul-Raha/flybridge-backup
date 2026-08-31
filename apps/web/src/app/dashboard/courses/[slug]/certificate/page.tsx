"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Playfair_Display, Dancing_Script } from "next/font/google";
import {
  ArrowLeft,
  Download,
  Loader2,
  ShieldCheck,
  Lock,
  Award,
} from "lucide-react";

const displayFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

const scriptFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type GradeData = {
  percentage: number;
  grade: string;
  englishLevel: string;
  passed: boolean;
  totalQuizzes: number;
  completedQuizzes: number;
};

type ProgressData = {
  grade: GradeData;
  certificateIssued: boolean;
};

export default function CertificatePage({
  params,
}: {
  params: { slug: string };
}) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [serverEligible, setServerEligible] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [issuedCertId, setIssuedCertId] = useState("");
  const [origin, setOrigin] = useState("");

  const certId = useCallback(() => {
    return `FB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const userRes = await fetch("/api/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.name ?? "");
        setUserEmail(userData.email ?? "");
        setUserAvatar(userData.avatar ?? null);
        setIsStaff(
          userData.accountType === "admin" ||
            userData.accountType === "moderator"
        );
      }

      const courseRes = await fetch(`/api/courses?slug=${params.slug}`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        const course = courseData.course;
        setCourseTitle(course?.title ?? "");
        setCourseId(course?.id ?? "");
        if (course?.id) {
          const progRes = await fetch(`/api/courses/${course.id}/progress`);
          if (progRes.ok) {
            const progData = await progRes.json();
            setProgress(progData);
            setServerEligible(Boolean(progData.certificateIssued));
          }
        }
      }
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!issuedCertId) setIssuedCertId(certId());
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, [issuedCertId, certId]);

  const generateCertificate = async () => {
    if (!courseId) return;
    setGenerating(true);
    try {
      const gateRes = await fetch(`/api/courses/${courseId}/certificate`);
      if (!gateRes.ok) {
        setGenerating(false);
        return;
      }
      const gateData = await gateRes.json();
      setServerEligible(Boolean(gateData.certificateIssued));

      const { generateCertificatePdf } = await import(
        "@/lib/certificate/pdf"
      );
      await generateCertificatePdf({
        userName,
        userEmail,
        userAvatar,
        courseTitle: courseTitle || params.slug.replace(/-/g, " "),
        courseSlug: params.slug,
        grade: progress?.grade ?? {
          percentage: 100,
          grade: "A",
          englishLevel: "Advanced (C2)",
        },
        certId: issuedCertId,
        issuedAt: new Date(),
        unlocked,
        verifyUrl: origin ? `${origin}/verify/${issuedCertId}` : "",
      });
    } catch (err) {
      console.error("Certificate generation failed", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--brand)" }}
        />
      </div>
    );
  }

  const grade = progress?.grade;
  const unlocked = isStaff || (grade ? grade.passed : false);
  const clientEligible = unlocked;

  const displayGrade = grade ?? {
    percentage: 100,
    grade: "A",
    englishLevel: "Advanced (C2)",
  };

  const displayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayCourseTitle = courseTitle || params.slug.replace(/-/g, " ");

  const verifyUrl = origin ? `${origin}/verify/${issuedCertId}` : issuedCertId;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
    verifyUrl
  )}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/dashboard/courses/${params.slug}/learn`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-black/5 mb-8"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <ArrowLeft size={14} />
          Back to course
        </Link>

        {/* ============ Certificate Preview ============ */}
        <div className="w-full" style={{ aspectRatio: "1.55 / 1" }}>
          <div
            className="relative w-full h-full rounded-[6px] overflow-hidden shadow-[0_40px_80px_-40px_rgba(18,32,67,0.35)]"
            style={{
              background:
                "linear-gradient(165deg,#ffffff 0%,#F4FAF7 45%,#EAF7F1 100%)",
            }}
          >
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
            <div className="relative flex items-start justify-between px-[6%] pt-[4.5%]">
              <div className="flex flex-col items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/transparent-logo-dark.png"
                  alt="FlyBridge Education Group"
                  className="h-[clamp(18px,2.6vw,28px)] w-auto object-contain"
                />
                <p
                  className="mt-1.5 text-[7px] sm:text-[8px] font-semibold uppercase tracking-[0.35em]"
                  style={{ color: "var(--brand-2)" }}
                >
                  Education Group
                </p>
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
                {userName || "Student Name"}
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
                  {displayCourseTitle}
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
                        {displayDate}
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

        {/* ============ Download / status section ============ */}
        <div className="mt-6 rounded-2xl border" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <div className="p-6">
            {clientEligible && (serverEligible || isStaff) ? (
              <button
                type="button"
                onClick={generateCertificate}
                disabled={generating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating certificate…
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Certificate (PDF)
                  </>
                )}
              </button>
            ) : clientEligible ? (
              <button
                type="button"
                onClick={generateCertificate}
                disabled={generating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying &amp; generating…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Verify &amp; Download Certificate (PDF)
                  </>
                )}
              </button>
            ) : (
              <div className="text-center">
                <div
                  className="rounded-xl p-4 mb-4 flex items-start gap-3 text-left"
                  style={{ background: "var(--brand-soft)", border: "1px solid rgba(15,169,104,0.25)" }}
                >
                  <Lock size={18} style={{ color: "var(--brand)", marginTop: 1 }} />
                  <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                    {grade && grade.completedQuizzes < grade.totalQuizzes
                      ? `Complete all quizzes to unlock your certificate (${grade.completedQuizzes}/${grade.totalQuizzes} done).`
                      : grade && grade.percentage < 60
                        ? `Your average score is ${grade.percentage}%. You need at least 60% to earn a certificate.`
                        : "Complete all quizzes with 60% or higher to earn your certificate."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold opacity-40 cursor-not-allowed"
                  style={{ background: "var(--line)", color: "var(--body)" }}
                >
                  <Download size={16} />
                  Certificate Locked
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}