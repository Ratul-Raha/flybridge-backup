"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  ShieldCheck,
  Lock,
  BadgeCheck,
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
  const [instructorName, setInstructorName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [serverEligible, setServerEligible] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [issuedCertId, setIssuedCertId] = useState("");

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
        setInstructorName(course?.instructor?.name ?? "FlyBridge Faculty");
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

  // Certificate ID is generated once per view/session so it stays stable
  // between the preview and the actual PDF that gets downloaded.
  useEffect(() => {
    if (!issuedCertId) setIssuedCertId(certId());
  }, [issuedCertId, certId]);

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
        courseTitle: courseTitle || params.slug.replace(/-/g, " "),
        courseSlug: params.slug,
        instructorName,
        grade: progress?.grade ?? {
          percentage: 100,
          grade: "A",
          englishLevel: "Advanced (C2)",
        },
        certId: issuedCertId,
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
    isStaff ||
    (grade &&
      grade.passed &&
      grade.completedQuizzes === grade.totalQuizzes);

  const displayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/dashboard/courses/${params.slug}/learn`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-black/5 mb-8"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <ArrowLeft size={14} />
          Back to course
        </Link>

        {/* ============ Certificate Preview ============ */}
        <div className="w-full" style={{ aspectRatio: "1.294 / 1" }}>
          <div
            className="relative w-full h-full overflow-hidden shadow-lg"
            style={{
              background: "#FFFEFA",
              border: "1px solid #D8C48C",
            }}
          >
            {/* Outer engraved-style frame */}
            <div className="absolute inset-[14px] border-[3px]" style={{ borderColor: "#B8952F" }} />
            <div className="absolute inset-[19px] border" style={{ borderColor: "#B8952F" }} />

            {/* Corner miters */}
            {[
              { pos: "top-[10px] left-[10px]", rotate: "0deg" },
              { pos: "top-[10px] right-[10px]", rotate: "90deg" },
              { pos: "bottom-[10px] right-[10px]", rotate: "180deg" },
              { pos: "bottom-[10px] left-[10px]", rotate: "270deg" },
            ].map((c) => (
              <div
                key={c.pos}
                className={`absolute ${c.pos} w-6 h-6 pointer-events-none`}
                style={{ transform: `rotate(${c.rotate})` }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    borderTop: "2px solid #B8952F",
                    borderLeft: "2px solid #B8952F",
                  }}
                />
              </div>
            ))}

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center text-center px-[6%]" style={{ paddingTop: "3.6%" }}>
              {/* Wordmark */}
              <picture style={{ width: "15%", minWidth: "64px" }}>
                <img
                  src="/transparent-logo-dark.png"
                  alt="FlyBridge"
                  className="w-full h-auto object-contain mx-auto"
                />
              </picture>
              <p
                className="mt-2 font-serif text-[10px] sm:text-[11px] uppercase tracking-[0.32em]"
                style={{ color: "#8A6D1E" }}
              >
                FlyBridge Education Group
              </p>

              <div className="mt-3 flex items-center gap-3 w-full justify-center">
                <div className="h-px w-16 sm:w-24" style={{ background: "#B8952F" }} />
                <div className="w-1.5 h-1.5 rotate-45" style={{ background: "#B8952F" }} />
                <div className="h-px w-16 sm:w-24" style={{ background: "#B8952F" }} />
              </div>

              <h1
                className="mt-3 font-serif font-semibold uppercase tracking-[0.06em] leading-tight"
                style={{
                  fontSize: "clamp(18px, 3.6vw, 32px)",
                  color: "#1F2937",
                }}
              >
                Certificate of Completion
              </h1>

              <p
                className="mt-4 text-[11px] sm:text-[13px] italic font-serif"
                style={{ color: "#57534E" }}
              >
                This certificate is proudly presented to
              </p>

              <p
                className="mt-1.5 leading-none"
                style={{
                  fontFamily: "var(--font-hand), cursive",
                  fontSize: "clamp(22px, 4.6vw, 40px)",
                  color: "#111827",
                }}
              >
                {userName || "Student Name"}
              </p>
              <div className="mt-1.5 h-px w-56 sm:w-72" style={{ background: "#D6D3D1" }} />

              <p
                className="mt-3 text-[11px] sm:text-[13px] italic font-serif"
                style={{ color: "#57534E" }}
              >
                in recognition of the successful completion of the course
              </p>
              <p
                className="mt-1 px-4 font-serif font-bold text-[13px] sm:text-[17px]"
                style={{ color: "#8A6D1E" }}
              >
                {courseTitle || params.slug.replace(/-/g, " ")}
              </p>

              <p
                className="mt-2.5 max-w-[560px] text-[9.5px] sm:text-[11px] leading-relaxed font-serif"
                style={{ color: "#78716C" }}
              >
                The recipient has fulfilled all requirements of the course and demonstrated
                commitment to developing knowledge and skills in the field.
              </p>

              {/* Detail row */}
              <div className="mt-4 flex items-center justify-center gap-4 sm:gap-8 w-full max-w-[560px]">
                {[
                  { label: "Completion Date", value: displayDate },
                  { label: "Certificate ID", value: progress?.certificateIssued ? issuedCertId : "FB-••••••" },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-4 sm:gap-8">
                    {i !== 0 && <div className="h-8 w-px" style={{ background: "#D6D3D1" }} />}
                    <div className="text-center">
                      <p
                        className="font-serif text-[8px] sm:text-[9px] uppercase tracking-[0.18em]"
                        style={{ color: "#A8A29E" }}
                      >
                        {item.label}
                      </p>
                      <p className="mt-0.5 font-serif text-[10px] sm:text-[12px] font-semibold" style={{ color: "#1F2937" }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: instructor signature + digital seal */}
              <div className="mt-auto mb-4 sm:mb-5 w-full flex items-end justify-between px-2 sm:px-6">
                <div className="text-left">
                  <p
                    className="leading-none"
                    style={{
                      fontFamily: "var(--font-hand), cursive",
                      fontSize: "clamp(16px, 2.6vw, 24px)",
                      color: "#1F2937",
                    }}
                  >
                    {instructorName || "Course Instructor"}
                  </p>
                  <div className="mt-1 h-px w-32 sm:w-40" style={{ background: "#A8A29E" }} />
                  <p className="mt-1 font-serif text-[8px] sm:text-[9px] uppercase tracking-[0.18em]" style={{ color: "#A8A29E" }}>
                    Course Instructor
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2"
                    style={{ borderColor: "#B8952F", background: "#FBF6E8" }}
                  >
                    <BadgeCheck size={20} style={{ color: "#8A6D1E" }} />
                  </div>
                  <p className="mt-1 font-serif text-[7px] sm:text-[8px] uppercase tracking-[0.14em] text-center max-w-[110px] sm:max-w-[130px]" style={{ color: "#A8A29E" }}>
                    Digitally Certified &amp; Issued by FlyBridge Education Group
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Status / stats / download section ============ */}
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