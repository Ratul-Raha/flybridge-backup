"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  ShieldCheck,
  Lock,
  MessageCircle,
  Award,
} from "lucide-react";

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
            className="relative w-full h-full rounded-[20px] overflow-hidden shadow-[0_40px_80px_-40px_rgba(10,18,40,0.85)]"
            style={{
              background:
                "radial-gradient(120% 90% at 85% -10%, rgba(15,169,104,0.28) 0%, rgba(15,169,104,0) 55%), linear-gradient(150deg, #0D1B33 0%, #132243 55%, #0B1528 100%)",
            }}
          >
            {/* Thin brand-green inner frame */}
            <div
              className="absolute inset-[1.5%] rounded-[14px] pointer-events-none"
              style={{ border: "1px solid rgba(52,211,153,0.35)" }}
            />
            {/* Corner accents */}
            <div className="absolute top-[1.5%] left-[1.5%] w-8 h-8 rounded-tl-[14px] border-t-2 border-l-2" style={{ borderColor: "rgba(52,211,153,0.7)" }} />
            <div className="absolute top-[1.5%] right-[1.5%] w-8 h-8 rounded-tr-[14px] border-t-2 border-r-2" style={{ borderColor: "rgba(52,211,153,0.7)" }} />
            <div className="absolute bottom-[1.5%] left-[1.5%] w-8 h-8 rounded-bl-[14px] border-b-2 border-l-2" style={{ borderColor: "rgba(52,211,153,0.7)" }} />
            <div className="absolute bottom-[1.5%] right-[1.5%] w-8 h-8 rounded-br-[14px] border-b-2 border-r-2" style={{ borderColor: "rgba(52,211,153,0.7)" }} />

            {/* Decorative dot grid, top-left */}
            <div
              className="absolute top-[10%] left-[3.5%] w-24 h-16 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(52,211,153,0.5) 1px, transparent 1.5px)",
                backgroundSize: "10px 10px",
                opacity: 0.25,
              }}
            />

            {/* Decorative wave, bottom-left */}
            <svg
              className="absolute bottom-0 left-0 w-[45%] h-[55%] pointer-events-none"
              viewBox="0 0 400 300"
              fill="none"
              style={{ opacity: 0.5 }}
            >
              <path
                d="M0 220 C 80 180, 140 260, 220 210 S 360 150, 400 190 V300 H0 Z"
                fill="rgba(52,211,153,0.06)"
              />
              <path
                d="M0 250 C 90 210, 150 280, 240 240 S 370 190, 400 220 V300 H0 Z"
                fill="rgba(52,211,153,0.10)"
              />
            </svg>

            {/* Header row: logo + id */}
            <div className="relative flex items-start justify-between px-[4%] pt-[4%]">
              <div className="flex flex-col items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/transparent-logo-light.png"
                  alt="FlyBridge Education Group"
                  className="h-[clamp(20px,3vw,34px)] w-auto object-contain"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="h-[5px] w-[5px] rounded-full" style={{ background: "#34D399" }} />
                  <p
                    className="text-[7.5px] sm:text-[8.5px] font-semibold uppercase tracking-[0.3em]"
                    style={{ color: "#9FB0CC" }}
                  >
                    Education Group · Certificate
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "#9FB0CC" }}
                >
                  Certificate ID
                </p>
                <p
                  className="mt-0.5 text-[11px] sm:text-[13px] font-bold font-mono tracking-wider"
                  style={{ color: unlocked ? "#34D399" : "#6B7A99" }}
                >
                  {unlocked ? issuedCertId : "FB-••••-••••"}
                </p>
              </div>
            </div>

            {/* Main content row: photo + text */}
            <div className="relative flex items-start gap-4 sm:gap-6 px-[4%] mt-[3%]">
              {/* Avatar with brand ring */}
              <div
                className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  width: "clamp(56px, 9vw, 100px)",
                  height: "clamp(56px, 9vw, 100px)",
                  background: "#14253F",
                  boxShadow: "0 0 0 2px #11203A, 0 0 0 3.5px rgba(52,211,153,0.55)",
                }}
              >
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#34D399" }}
                  >
                    {(userName || "S").trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Text column */}
              <div className="flex-1 text-left">
                <p
                  className="font-mono text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.35em]"
                  style={{ color: "#34D399" }}
                >
                  Certificate of
                </p>
                <h1
                  className="font-extrabold uppercase leading-[0.95] tracking-tight"
                  style={{ fontSize: "clamp(24px, 4.2vw, 44px)", color: "#F4F7FF" }}
                >
                  Completion
                </h1>
                <div
                  className="mt-1.5 h-[3px] w-16 sm:w-20 rounded-full"
                  style={{ background: "linear-gradient(90deg,#34D399,#0FA968)" }}
                />

                <p
                  className="mt-3 sm:mt-4 text-[11px] sm:text-[13px]"
                  style={{ color: "#9FB0CC" }}
                >
                  This is proudly presented to
                </p>
                <p
                  className="mt-0.5 font-bold leading-tight"
                  style={{ fontSize: "clamp(20px, 3.4vw, 36px)", color: "#F4F7FF" }}
                >
                  {userName || "Student Name"}
                </p>

                <p
                  className="mt-2.5 text-[11px] sm:text-[13px]"
                  style={{ color: "#9FB0CC" }}
                >
                  for successfully completing the course
                </p>
                <div className="mt-1.5 inline-flex items-center gap-2">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "rgba(52,211,153,0.14)" }}
                  >
                    <MessageCircle size={14} style={{ color: "#34D399" }} />
                  </div>
                  <p
                    className="font-bold text-[13px] sm:text-[16px]"
                    style={{ color: "#34D399" }}
                  >
                    {courseTitle || params.slug.replace(/-/g, " ")}
                  </p>
                </div>

                <p
                  className="mt-2.5 max-w-[520px] text-[9.5px] sm:text-[11px] leading-relaxed"
                  style={{ color: "#A8B6CF" }}
                >
                  The recipient has fulfilled all course requirements and demonstrated
                  commitment to developing knowledge and skills in the field.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className="relative mx-[4%] mt-[3%] h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(52,211,153,0.35),transparent)" }}
            />

            {/* Stats row */}
            {grade && (
              <div className="relative grid grid-cols-4 gap-2 sm:gap-4 mx-[4%] mt-[2.5%]">
                {[
                  { label: "Overall Score", value: `${grade.percentage}%`, accent: grade.passed },
                  { label: "Grade", value: grade.grade, accent: true },
                  { label: "English Level", value: grade.englishLevel.split(" ")[0], accent: false },
                  { label: "Quizzes Done", value: `${grade.completedQuizzes}/${grade.totalQuizzes}`, accent: true },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="relative rounded-xl px-2 py-2.5 text-center overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-b-full"
                      style={{ background: s.accent ? "#34D399" : "rgba(52,211,153,0.35)" }}
                    />
                    <p className="font-mono text-[7px] sm:text-[9px] uppercase tracking-wider truncate" style={{ color: "#8A98B8" }}>
                      {s.label}
                    </p>
                    <p
                      className="mt-1 text-[13px] sm:text-[20px] font-bold tabular-nums"
                      style={{ color: s.accent ? "#4BE0A8" : "#F4F7FF" }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom row: verified note + QR + date */}
            <div className="relative flex items-center justify-between mx-[4%] mt-[3%] pb-[3%]">
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: "rgba(52,211,153,0.16)" }}>
                    <ShieldCheck size={11} style={{ color: "#34D399" }} />
                  </span>
                  <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#34D399" }}>
                    {unlocked ? "Verified" : "Locked"}
                  </p>
                </div>
                <p className="mt-1 text-[8px] sm:text-[10px] max-w-[240px] leading-snug" style={{ color: "#8A98B8" }}>
                  {unlocked
                    ? "Digitally issued & verified by FlyBridge Education Group. Scan to confirm authenticity."
                    : "Complete all quizzes with 60% or higher to reveal the completion details."}
                </p>
              </div>

              {unlocked && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-md border p-1 overflow-hidden"
                    style={{ borderColor: "rgba(255,255,255,0.12)", background: "#fff" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrSrc}
                      alt="Verify certificate"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[7px] sm:text-[8px] uppercase tracking-wider" style={{ color: "#8A98B8" }}>
                      Completion Date
                    </p>
                    <p className="mt-0.5 text-[10px] sm:text-[12px] font-semibold" style={{ color: "#F4F7FF" }}>
                      {displayDate}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Locked fade overlay: lower half fades to invisible */}
            {!unlocked && (
              <div className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(13,27,51,0.05) 0%, rgba(13,27,51,0.55) 45%, #0B1528 92%)",
                  }}
                />
                <div className="absolute left-1/2 bottom-[20%] -translate-x-1/2 flex flex-col items-center gap-1.5 text-center">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full border"
                    style={{ borderColor: "rgba(52,211,153,0.5)", background: "rgba(13,27,51,0.85)" }}
                  >
                    <Lock size={16} style={{ color: "#34D399" }} />
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-semibold" style={{ color: "#D6E0F2" }}>
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
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}
                >
                  <Lock size={18} style={{ color: "#B45309", marginTop: 1 }} />
                  <p className="text-[13px] font-medium" style={{ color: "#B45309" }}>
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
