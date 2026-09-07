"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// The certificate art is responsive (sm:/lg: breakpoints in certificate-face),
// so it is always captured from a fixed-width element. Capturing at a constant
// width (instead of the on-screen width, which differs between mobile and
// desktop) guarantees the generated PDF is pixel-identical on every device.
export const CERT_CAPTURE_WIDTH = 1000;
export const CERT_ASPECT = 1.55;

export async function downloadCertificatePdf(
  el: HTMLElement,
  fileName: string
): Promise<void> {
  await document.fonts?.ready;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    windowWidth: CERT_CAPTURE_WIDTH,
    windowHeight: CERT_CAPTURE_WIDTH / CERT_ASPECT,
  });

  const imgData = canvas.toDataURL("image/png");
  const pageWidthMm = 297;
  const pageHeightMm = pageWidthMm / CERT_ASPECT;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageWidthMm, pageHeightMm],
    compress: true,
  });
  pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
  pdf.save(fileName);
}
