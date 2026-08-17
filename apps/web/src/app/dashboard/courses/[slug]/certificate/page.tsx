"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Award, ArrowLeft, Download, Mail, User, Loader2 } from "lucide-react";

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
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userRes = await fetch("/api/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.name ?? "");
        setUserEmail(userData.email ?? "");
      }

      const courseRes = await fetch(`/api/courses?slug=${params.slug}`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        const courseId = courseData.course?.id;
        if (courseId) {
          const progRes = await fetch(`/api/courses/${courseId}/progress`);
          if (progRes.ok) {
            const progData = await progRes.json();
            setProgress(progData);
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
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      // Background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, w, h, "F");

      // Outer border
      doc.setDrawColor(107, 76, 224);
      doc.setLineWidth(1.5);
      doc.roundedRect(8, 8, w - 16, h - 16, 4, 4);

      // Inner decorative border
      doc.setDrawColor(107, 76, 224);
      doc.setLineWidth(0.4);
      doc.roundedRect(14, 14, w - 28, h - 28, 3, 3);

      // Corner ornaments
      const cornerSize = 12;
      const corners = [
        [18, 18],
        [w - 18, 18],
        [18, h - 18],
        [w - 18, h - 18],
      ];
      doc.setFillColor(107, 76, 224);
      for (const [cx, cy] of corners) {
        doc.circle(cx, cy, cornerSize / 3, "F");
        doc.setFillColor(255, 255, 255);
        doc.circle(cx, cy, cornerSize / 5, "F");
        doc.setFillColor(107, 76, 224);
      }

      // Header decorative line
      doc.setDrawColor(107, 76, 224);
      doc.setLineWidth(0.6);
      doc.line(w * 0.25, 40, w * 0.75, 40);

      // Small diamond
      doc.setFillColor(107, 76, 224);
      doc.triangle(w / 2, 37, w / 2 + 3, 40, w / 2, 43, "F");
      doc.triangle(w / 2, 37, w / 2 - 3, 40, w / 2, 43, "F");

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.setTextColor(107, 76, 224);
      doc.text("CERTIFICATE", w / 2, 56, { align: "center" });

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(120, 120, 120);
      doc.text("of COMPLETION", w / 2, 66, { align: "center" });

      // Decorative line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(w * 0.3, 72, w * 0.7, 72);

      // "This is to certify that"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("This is to certify that", w / 2, 84, { align: "center" });

      // Student name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(40, 40, 40);
      doc.text(userName || "Student", w / 2, 98, { align: "center" });

      // Name underline
      doc.setDrawColor(107, 76, 224);
      doc.setLineWidth(0.8);
      const nameWidth = doc.getTextWidth(userName || "Student");
      doc.line(
        w / 2 - nameWidth / 2 - 10,
        101,
        w / 2 + nameWidth / 2 + 10,
        101
      );

      // "has successfully completed the course"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "has successfully completed the course",
        w / 2,
        110,
        { align: "center" }
      );

      // Course name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(107, 76, 224);
      const courseTitle = params.slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      doc.text(courseTitle, w / 2, 122, { align: "center" });

      // Results section
      const grade = progress?.grade;
      if (grade) {
        const resultY = 138;

        // Grade box
        const boxWidth = 40;
        const boxGap = 10;
        const totalBoxWidth = boxWidth * 3 + boxGap * 2;
        const startX = (w - totalBoxWidth) / 2;

        const drawResultBox = (
          x: number,
          label: string,
          value: string
        ) => {
          doc.setFillColor(248, 248, 255);
          doc.roundedRect(x, resultY, boxWidth, 28, 2, 2, "F");
          doc.setDrawColor(107, 76, 224);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, resultY, boxWidth, 28, 2, 2, "S");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(label, x + boxWidth / 2, resultY + 9, {
            align: "center",
          });

          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(107, 76, 224);
          doc.text(value, x + boxWidth / 2, resultY + 21, {
            align: "center",
          });
        };

        drawResultBox(startX, "GRADE", grade.grade);
        drawResultBox(
          startX + boxWidth + boxGap,
          "SCORE",
          `${grade.percentage}%`
        );
        drawResultBox(
          startX + (boxWidth + boxGap) * 2,
          "ENGLISH LEVEL",
          grade.englishLevel.split(" ")[0]
        );
      }

      // Footer
      const footerY = h - 35;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(w * 0.2, footerY, w * 0.45, footerY);
      doc.line(w * 0.55, footerY, w * 0.8, footerY);

      // Date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Date of Issue", w * 0.325, footerY - 4, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        w * 0.325,
        footerY + 6,
        { align: "center" }
      );

      // Signature line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("FlyBridge Education Group", w * 0.675, footerY - 4, {
        align: "center",
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text("Authorized Signature", w * 0.675, footerY + 6, {
        align: "center",
      });

      // Email in small text at very bottom
      if (userEmail) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(userEmail, w / 2, h - 12, { align: "center" });
      }

      // Certificate ID
      const certId = `FB-${Date.now().toString(36).toUpperCase()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(`Certificate ID: ${certId}`, w / 2, h - 18, {
        align: "center",
      });

      doc.save(`FlyBridge-Certificate-${params.slug}.pdf`);
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
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  const grade = progress?.grade;
  const canDownload =
    grade &&
    grade.passed &&
    grade.completedQuizzes === grade.totalQuizzes;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/dashboard/courses/${params.slug}/learn`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-black/5 mb-8"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <ArrowLeft size={14} />
          Back to course
        </Link>

        {/* Certificate preview card */}
        <div
          className="rounded-[20px] border overflow-hidden"
          style={{ borderColor: "var(--line)", background: "#fff" }}
        >
          {/* Header */}
          <div
            className="px-8 py-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(107,76,224,0.06) 0%, rgba(107,76,224,0.02) 100%)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(107,76,224,0.1)" }}
            >
              <Award size={28} style={{ color: "var(--brand)" }} />
            </div>
            <h1 className="font-display text-[24px] font-bold" style={{ color: "var(--ink)" }}>
              Course Certificate
            </h1>
            <p className="text-[14px] mt-2" style={{ color: "var(--body)" }}>
              Complete all quizzes with a score of 60% or higher to earn your certificate.
            </p>
          </div>

          {/* Grade summary */}
          {grade && (
            <div className="px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Overall Score", value: `${grade.percentage}%`, color: grade.passed ? "#2EE6A8" : "#F87171" },
                { label: "Grade", value: grade.grade, color: "var(--brand)" },
                { label: "English Level", value: grade.englishLevel.split(" ")[0], color: "#6B4CE0" },
                { label: "Quizzes Done", value: `${grade.completedQuizzes}/${grade.totalQuizzes}`, color: "var(--brand)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: "var(--brand-soft, rgba(107,76,224,0.04))" }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                    {item.label}
                  </p>
                  <p className="text-[20px] font-bold mt-1" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Student info */}
          <div className="px-8 py-5 border-t" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 flex-1">
                <User size={16} style={{ color: "var(--body)" }} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                    Student Name
                  </p>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                    {userName || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <Mail size={16} style={{ color: "var(--body)" }} />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--body)" }}>
                    Email
                  </p>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                    {userEmail || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download section */}
          <div className="px-8 py-6 border-t" style={{ borderColor: "var(--line)" }}>
            {canDownload ? (
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
            ) : (
              <div className="text-center">
                <div
                  className="rounded-xl p-4 mb-4"
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
                >
                  <p className="text-[13px] font-medium" style={{ color: "#B45309" }}>
                    {grade && grade.completedQuizzes < grade.totalQuizzes
                      ? `Complete all quizzes to unlock your certificate (${grade.completedQuizzes}/${grade.totalQuizzes} done)`
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
