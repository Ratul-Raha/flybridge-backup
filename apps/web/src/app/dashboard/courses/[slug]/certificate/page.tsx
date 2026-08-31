"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  ArrowLeft,
  Download,
  Mail,
  User,
  Loader2,
  ShieldCheck,
  Lock,
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

  const certId = useCallback(() => {
    return `FB-${Date.now().toString(36).toUpperCase()}`;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const userRes = await fetch("/api/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.name ?? "");
        setUserEmail(userData.email ?? "");
        setUserAvatar(userData.avatar ?? null);
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

  const generateCertificate = async () => {
    if (!courseId) return;
    setGenerating(true);
    try {
      // Server-side gate: recompute completion on the server before issuance.
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
        certId: certId(),
        issuedAt: new Date(),
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
  const clientEligible =
    grade &&
    grade.passed &&
    grade.completedQuizzes === grade.totalQuizzes;

  const displayGrade = grade ?? {
    percentage: 100,
    grade: "A",
    englishLevel: "Advanced (C2)",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/dashboard/courses/${params.slug}/learn`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-black/5 mb-8"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <ArrowLeft size={14} />
          Back to course
        </Link>

        {/* ============ Certificate Preview Card ============ */}
        <div className="w-full" style={{ aspectRatio: "1.414 / 1" }}>
          <div
            className="relative w-full h-full rounded-[12px] overflow-hidden shadow-xl"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, #ffffff 96%, #f2ead1 100%)",
              border: "2.5px solid #C9A227",
            }}
          >
            {/* inner frame */}
            <div
              className="absolute inset-[10px] rounded-[8px]"
              style={{ border: "1px solid #0FA968" }}
            />
            {/* top mint + bottom gold bands */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-[#E2F6EE]" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#C9A227]" />

            {/* corner ornaments */}
            {[
              "top-3.5 left-3.5",
              "top-3.5 right-3.5",
              "bottom-3.5 left-3.5",
              "bottom-3.5 right-3.5",
            ].map((pos) => (
              <div key={pos} className={`absolute ${pos} pointer-events-none`}>
                <div className="w-5 h-5 rounded-full border-2 border-[#C9A227] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#C9A227]" />
                </div>
              </div>
            ))}

            {/* Guaranteed-scale content via fixed pixel layout on a proportional wrapper */}
            <div
              className="absolute inset-0 flex flex-col items-center text-center px-6"
              style={{ paddingTop: "4.5%" }}
            >
              {/* Logo */}
              <picture className="h-auto" style={{ width: "42%" }}>
                <img
                  src="/transparent-logo-dark.png"
                  alt="FlyBridge"
                  className="w-full h-auto object-contain"
                />
              </picture>
              <p
                className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em]"
                style={{ color: "var(--body)" }}
              >
                FlyBridge Education Group
              </p>

              {/* divider */}
              <div className="mt-3 flex items-center gap-3 w-full justify-center">
                <div className="h-px w-12 bg-[#EBD9A8]" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C9A227]" />
                <div className="h-px w-12 bg-[#EBD9A8]" />
              </div>

              {/* heading */}
              <h2
                className="mt-3 leading-tight"
                style={{
                  fontFamily: "var(--font-hand), cursive",
                  fontSize: "clamp(16px, 3.4vw, 30px)",
                  color: "#C9A227",
                }}
              >
                Certificate of Completion
              </h2>
              <p className="mt-1 text-[11px] sm:text-[12px]" style={{ color: "var(--body)" }}>
                This is to proudly certify that
              </p>

              {/* Avatar + name */}
              <div className="mt-2.5 flex flex-col items-center">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-[3px] border-[#C9A227] ring-2 ring-[#0FA968]/40 overflow-hidden"
                  style={{ background: "var(--mint-bg)" }}
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
                      className="text-lg font-bold"
                      style={{ color: "#0B7A4B" }}
                    >
                      {(userName || "S").trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p
                  className="mt-1.5 leading-none"
                  style={{
                    fontFamily: "var(--font-hand), cursive",
                    fontSize: "clamp(20px, 5vw, 44px)",
                    color: "var(--ink)",
                  }}
                >
                  {userName || "Student"}
                </p>
                <div className="mt-1 flex items-center gap-2 w-40 justify-center">
                  <div className="h-px flex-1 bg-[#C9A227]" />
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#C9A227]" />
                  <div className="h-px flex-1 bg-[#C9A227]" />
                </div>
              </div>

              {/* completion line */}
              <p className="mt-1 text-[11px] sm:text-[12px]" style={{ color: "var(--body)" }}>
                has successfully completed the course
              </p>
              <p
                className="mt-0.5 px-4 text-[13px] sm:text-[16px] font-bold text-center"
                style={{ color: "#0B7A4B" }}
              >
                {courseTitle || params.slug.replace(/-/g, " ")}
              </p>

              {/* stats */}
              <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-[360px]">
                {[
                  { label: "GRADE", value: displayGrade.grade },
                  { label: "SCORE", value: `${displayGrade.percentage}%` },
                  {
                    label: "ENGLISH LEVEL",
                    value: displayGrade.englishLevel.split(" ")[0],
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg px-2 py-1.5 text-center border"
                    style={{ background: "#E2F6EE", borderColor: "#0FA968" }}
                  >
                    <p
                      className="font-mono text-[8px] uppercase tracking-wider"
                      style={{ color: "var(--body)" }}
                    >
                      {s.label}
                    </p>
                    <p className="text-[12px] sm:text-[15px] font-bold mt-0.5" style={{ color: "#0B7A4B" }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* footer */}
              <div className="mt-auto mb-3 w-full">
                <div className="grid grid-cols-3 gap-2 text-center px-1">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                      Issued On
                    </p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--ink)" }}>
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                      Certificate ID
                    </p>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--ink)" }}>
                      {progress?.certificateIssued ? "Issued" : "FB-••••••"}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                      Authorized Signature
                    </p>
                    <p
                      className="leading-none text-[12px]"
                      style={{
                        fontFamily: "var(--font-hand), cursive",
                        color: "#0B7A4B",
                      }}
                    >
                      FlyBridge
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Download / status section ============ */}
        <div className="mt-6 rounded-2xl border" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <div className="p-6">
            {grade && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Overall Score", value: `${grade.percentage}%`, color: grade.passed ? "#0FA968" : "#F87171" },
                  { label: "Grade", value: grade.grade, color: "var(--brand)" },
                  { label: "English Level", value: grade.englishLevel.split(" ")[0], color: "#C9A227" },
                  { label: "Quizzes Done", value: `${grade.completedQuizzes}/${grade.totalQuizzes}`, color: "var(--brand)" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl p-3.5 text-center"
                    style={{ background: "var(--bg-soft)" }}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                      {item.label}
                    </p>
                    <p className="text-[18px] font-bold mt-1" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {clientEligible && serverEligible ? (
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
            ) : clientEligible && !serverEligible ? (
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
