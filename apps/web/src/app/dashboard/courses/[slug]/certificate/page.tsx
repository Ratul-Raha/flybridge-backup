"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Lock } from "lucide-react";
import { useCertificateData } from "@/hooks/use-certificate-data";
import { CertificateFace } from "@/components/dashboard/certificate-face";
import { qrCodeDataUrl } from "@/lib/qr-code";

export default function CertificatePage({
  params,
}: {
  params: { slug: string };
}) {
  const { courseId, courseTitle, userName, progress, serverEligible, loading } =
    useCertificateData(params.slug);

  const [issuedCertId, setIssuedCertId] = useState("");
  const [origin, setOrigin] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [opening, setOpening] = useState(false);

  const certId = useCallback(() => {
    return `FB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  useEffect(() => {
    if (!issuedCertId) setIssuedCertId(certId());
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, [issuedCertId, certId]);

  useEffect(() => {
    if (origin && issuedCertId && !qrSrc) {
      const verifyUrl = `${origin}/verify/${issuedCertId}`;
      qrCodeDataUrl(verifyUrl)
        .then(setQrSrc)
        .catch(() => setQrSrc(""));
    }
  }, [origin, issuedCertId, qrSrc]);

  const handleDownload = () => {
    // Record the issuance server-side without blocking the navigation.
    if (courseId) {
      fetch(`/api/courses/${courseId}/certificate`, {
        method: "POST",
        cache: "no-store",
      }).catch(() => {});
    }
    // Open the print-ready page in a new tab. That page renders the full-size
    // certificate and offers a one-click "Download PDF" button (a real .pdf
    // download, not a print dialog).
    setOpening(true);
    window.open(`/dashboard/courses/${params.slug}/certificate/pdf`, "_blank", "noopener");
    setTimeout(() => setOpening(false), 3000);
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
  const unlocked = serverEligible || (grade ? grade.passed : false);

  const displayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayCourseTitle = courseTitle || params.slug.replace(/-/g, " ");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/dashboard/courses/${params.slug}/learn`}
          className="no-print inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-black/5 mb-8"
          style={{ color: "var(--ink)", borderColor: "var(--line)" }}
        >
          <ArrowLeft size={14} />
          Back to course
        </Link>

        {/* ============ Certificate Preview ============ */}
        <CertificateFace
          unlocked={unlocked}
          issuedCertId={issuedCertId}
          name={userName}
          courseTitle={displayCourseTitle}
          dateLabel={displayDate}
          qrSrc={qrSrc}
          grade={grade ?? null}
        />

        {/* ============ Download / status section ============ */}
        <div className="no-print mt-6 rounded-2xl border" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <div className="p-6">
            {serverEligible ? (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--brand)" }}
                >
                  {opening ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Opening certificate…
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download Certificate
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
                  Your certificate is ready. Click <strong>Download Certificate</strong> — it will
                  open in a new tab along with the <strong>Download PDF</strong> option to save it
                  directly as a high-resolution PDF.
                </p>
              </>
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