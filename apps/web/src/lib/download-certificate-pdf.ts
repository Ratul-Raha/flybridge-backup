"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// The certificate art is responsive (sm:/lg: breakpoints in certificate-face),
// so it is always captured from a fixed-width element. Capturing at a constant
// width (instead of the on-screen width, which differs between mobile and
// desktop) guarantees the generated PDF is pixel-identical on every device.
export const CERT_CAPTURE_WIDTH = 1000;
export const CERT_ASPECT = 1.55;

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" &&
      typeof navigator.maxTouchPoints === "number" &&
      navigator.maxTouchPoints > 1)
  );
}

function savePdf(pdf: jsPDF, fileName: string): void {
  const output = pdf.output("bloburl");
  const url = typeof output === "string" ? output : String(output);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // iOS Safari ignores the `download` attribute on anchors, so the click above
  // silently does nothing on iPhone/iPad. Opening the PDF blob in a new tab is
  // the reliable path there: Safari shows the PDF and the user taps the share
  // button -> "Save to Files". Desktop and Android browsers just download via
  // the anchor and the extra tab is skipped.
  if (isIOSDevice()) {
    window.setTimeout(() => {
      window.open(url, "_blank");
    }, 600);
  }
}

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
  savePdf(pdf, fileName);
}
