"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Lock } from "lucide-react";
import { useCertificateData } from "@/hooks/use-certificate-data";
import { CertificateFace } from "@/components/dashboard/certificate-face";
import { qrCodeDataUrl } from "@/lib/qr-code";
import {
  CERT_CAPTURE_WIDTH,
  downloadCertificatePdf,
} from "@/lib/download-certificate-pdf";

export default function CertificatePage({
  params,
}: {
  params: { slug: string };
}) {
  const {
    courseId,
    courseTitle,
    userName,
    progress,
    serverEligible,
    issuedCertId,
    issuedAt,
    downloadCount,
    loading,
  } = useCertificateData(params.slug);

  const [origin, setOrigin] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (origin && issuedCertId && !qrSrc) {
      const verifyUrl = `${origin}/verify/${issuedCertId}`;
      qrCodeDataUrl(verifyUrl)
        .then(setQrSrc)
        .catch(() => setQrSrc(""));
    }
  }, [origin, issuedCertId, qrSrc]);

  const handleDownload = async () => {
    // Record the issuance server-side without blocking the download.
    if (courseId) {
      fetch(`/api/courses/${courseId}/certificate`, {
        method: "POST",
        cache: "no-store",
      }).catch(() => {});
    }

    const el = captureRef.current;
    if (!el) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const firstName = (userName || "Student").trim().split(/\s+/)[0];
      await downloadCertificatePdf(el, `FlyBridge-Certificate-${firstName}.pdf`);
    } catch {
      setDownloadError(
        "Sorry, the PDF could not be generated in your browser. Please try the browser's print dialog (Ctrl/Cmd + P and choose Save as PDF) as a fallback, or try a different browser."
      );
    } finally {
      setDownloading(false);
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
  const unlocked = serverEligible || (grade ? grade.passed : false);

  const displayDate = (issuedAt ? new Date(issuedAt) : new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

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

        {/* Off-screen, fixed-width copy used only for PDF capture. Keeping the
            capture element at a constant width makes the responsive font/breakpoint
            sizing resolve identically on mobile and desktop, so the saved PDF is
            pixel-identical on every device. */}
        {unlocked && (
          <div
            ref={captureRef}
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ left: -9999, top: 0, width: CERT_CAPTURE_WIDTH }}
          >
            <CertificateFace
              unlocked
              issuedCertId={issuedCertId}
              name={userName}
              courseTitle={displayCourseTitle}
              dateLabel={displayDate}
              qrSrc={qrSrc}
              grade={grade ?? null}
            />
          </div>
        )}

        {/* ============ Download / status section ============ */}
        <div className="no-print mt-6 rounded-2xl border" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <div className="p-6">
            {serverEligible ? (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: "var(--brand)" }}
                >
                  {downloading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download Certificate
                    </>
                  )}
                </button>
                {downloadError && (
                  <p className="mt-3 text-center text-[12px] leading-relaxed" style={{ color: "#B42318" }}>
                    {downloadError}
                  </p>
                )}
                <p className="mt-3 text-center text-[12px] leading-relaxed" style={{ color: "var(--body)" }}>
                  Click <strong>Download Certificate</strong> to save your certificate directly as a
                  high-resolution PDF — no new tab needed. The same print-ready design is used on
                  every device.
                </p>
                {issuedCertId && (
                  <p className="mt-2 text-center text-[12px]" style={{ color: "var(--body)" }}>
                    Scan the QR code on the certificate to verify it publicly at{" "}
                    <span
                      className="font-mono text-[11px] font-semibold"
                      style={{ color: "var(--brand)" }}
                    >
                      {origin ? `${origin.replace(/^https?:\/\//, "")}/verify/${issuedCertId}` : `/verify/${issuedCertId}`}
                    </span>
                  </p>
                )}
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