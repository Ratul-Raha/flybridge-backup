"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileDown, Loader2 } from "lucide-react";
import { useCertificateData } from "@/hooks/use-certificate-data";
import { CertificateFace } from "@/components/dashboard/certificate-face";
import { qrCodeDataUrl } from "@/lib/qr-code";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const CARD_ASPECT = 1.55;

export default function CertificatePdfPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const {
    courseTitle,
    userName,
    progress,
    serverEligible,
    issuedCertId,
    issuedAt,
    loading,
  } = useCertificateData(params.slug);

  const certRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    document.title = "Certificate — FlyBridge Education Group";
  }, []);

  const handleDownloadPdf = async () => {
    const el = certRef.current;
    if (!el) return;
    setGenerating(true);
    setError("");
    try {
      if (document.fonts?.ready) await document.fonts.ready;

      // Capture the certificate at a fixed viewport so vw-based font sizing is
      // deterministic; the resulting PDF page is sized to the certificate's own
      // aspect ratio (1.55:1 landscape) so the art fills exactly one PDF page
      // with no clipping, no extra whitespace and no spillover onto page 2.
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        windowWidth: width,
        windowHeight: height,
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidthMm = 297;
      const pageHeightMm = pageWidthMm / CARD_ASPECT;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [pageWidthMm, pageHeightMm],
        compress: true,
      });
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");

      const firstName = (userName || "Student").trim().split(/\s+/)[0];
      pdf.save(`FlyBridge-Certificate-${firstName}.pdf`);
    } catch {
      setError(
        "Sorry, the PDF could not be generated in your browser. Please use the browser's print dialog (Ctrl/Cmd + P and choose Save as PDF) as a fallback, or try a different browser."
      );
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
  // The main page only opens this view when serverEligible, but compute the
  // same rule here so a deep link (e.g., a manager's email) still unlocks.
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Non-printed toolbar */}
      <header
        className="no-print sticky top-0 z-20 backdrop-blur border-b"
        style={{ background: "rgba(244,250,247,0.9)", borderColor: "var(--line)" }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/courses/${params.slug}/certificate`)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium rounded-full border px-3.5 py-[7px] transition-colors hover:bg-black/5"
              style={{ color: "var(--ink)", borderColor: "var(--line)" }}
            >
              <ArrowLeft size={14} />
              Certificate
            </button>
            <span className="hidden sm:block text-[13px]" style={{ color: "var(--body)" }}>
              Print-ready view
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-[11px] text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--brand)" }}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileDown size={16} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </header>

      {error && (
        <div
          className="no-print max-w-[1200px] mx-auto w-full px-4 sm:px-6 mt-4"
        >
          <div
            className="rounded-xl p-4 text-[13px] font-medium"
            style={{ background: "#FEF3F2", border: "1px solid #FECACA", color: "#B42318" }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Certificate, sized for capture */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
        <div
          ref={certRef}
          className="w-full sm:w-[820px] lg:w-[1000px]"
          style={{ aspectRatio: `${CARD_ASPECT} / 1` }}
        >
          <CertificateFace
            unlocked={unlocked}
            issuedCertId={issuedCertId}
            name={userName}
            courseTitle={displayCourseTitle}
            dateLabel={displayDate}
            qrSrc={qrSrc}
            grade={grade ?? null}
          />
        </div>

        <p
          className="no-print mt-6 text-center text-[12px] leading-relaxed"
          style={{ color: "var(--body)" }}
        >
          <Download size={12} className="inline mr-1" />
          Click <strong>Download PDF</strong> above to save your certificate directly as a
          high-resolution PDF. A new tab is not required — the download starts immediately.
        </p>
      </main>
    </div>
  );
}