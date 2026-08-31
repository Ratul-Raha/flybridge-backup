import { jsPDF } from "jspdf";

export type CertificateData = {
  userName: string;
  userEmail: string;
  courseTitle: string;
  courseSlug: string;
  instructorName: string;
  grade: {
    percentage: number;
    grade: string;
    englishLevel: string;
  };
  certId: string;
  issuedAt: Date;
};

/* ------------------------------------------------------------------ */
/*  Palette (matches the on-screen engraving design)                   */
/* ------------------------------------------------------------------ */

const PAPER = "#FFFEFA";
const FRAME = "#B8952F";
const GOLD_DARK = "#8A6D1E";
const INK = "#1F2937";
const NAME_INK = "#111827";
const BODY_INK = "#57534E";
const SOFT = "#78716C";
const FAINT = "#A8A29E";
const HAIRLINE = "#D6D3D1";

/* ------------------------------------------------------------------ */
/*  Asset / font helpers                                               */
/* ------------------------------------------------------------------ */

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function pngSize(dataUrl: string) {
  try {
    const buf = atob(dataUrl.split(",")[1]);
    const w =
      (buf.charCodeAt(16) << 24) |
      (buf.charCodeAt(17) << 16) |
      (buf.charCodeAt(18) << 8) |
      buf.charCodeAt(19);
    const h =
      (buf.charCodeAt(20) << 24) |
      (buf.charCodeAt(21) << 16) |
      (buf.charCodeAt(22) << 8) |
      buf.charCodeAt(23);
    if (!w || !h) return null;
    return { w, h };
  } catch {
    return null;
  }
}

function toHexFill(pdf: jsPDF, hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  pdf.setFillColor((n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff);
}

function toHexDraw(pdf: jsPDF, hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  pdf.setDrawColor((n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff);
}

function toHexText(pdf: jsPDF, hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  pdf.setTextColor((n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff);
}

let caveatRegistered = false;
async function registerCaveat(pdf: jsPDF): Promise<boolean> {
  if (caveatRegistered) {
    try {
      pdf.setFont("Caveat", "normal");
      return true;
    } catch {
      return false;
    }
  }
  try {
    const res = await fetch("/fonts/Caveat.ttf");
    if (!res.ok) return false;
    const blob = await res.blob();
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return false;
    const base64 = dataUrl.split(",")[1];
    pdf.addFileToVFS("Caveat.ttf", base64);
    pdf.addFont("Caveat.ttf", "Caveat", "normal");
    caveatRegistered = true;
    pdf.setFont("Caveat", "normal");
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Serif helper (Times matches the font-serif look of the preview)    */
/* ------------------------------------------------------------------ */

function serif(
  pdf: jsPDF,
  weight: "normal" | "bold" | "italic" | "bolditalic",
  size: number
) {
  const name: Record<string, string> = {
    normal: "times",
    bold: "timesBold",
    italic: "timesItalic",
    bolditalic: "timesBoldItalic",
  };
  pdf.setFont(name[weight]);
  pdf.setFontSize(size);
}

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export async function generateCertificatePdf(data: CertificateData): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  const hasCaveat = await registerCaveat(pdf);
  const logo = await loadImageDataUrl("/transparent-logo-dark.png");

  /* ---- Background: warm ivory ---- */
  toHexFill(pdf, PAPER);
  pdf.rect(0, 0, W, H, "F");

  /* ---- Engraved frames ---- */
  const outerInset = 38;
  const innerInset = 47;
  toHexDraw(pdf, FRAME);
  pdf.setLineWidth(3);
  pdf.rect(outerInset, outerInset, W - outerInset * 2, H - outerInset * 2);
  pdf.setLineWidth(1);
  pdf.rect(innerInset, innerInset, W - innerInset * 2, H - innerInset * 2);

  // Corner miters (gold L-shapes)
  const msize = 16;
  const mdraw = (x: number, y: number) => {
    toHexDraw(pdf, FRAME);
    pdf.setLineWidth(2);
    pdf.lines(
      [
        [0, 0],
        [msize, 0],
      ],
      x,
      y
    );
    pdf.lines(
      [
        [0, 0],
        [0, msize],
      ],
      x,
      y
    );
  };
  mdraw(24, 24);
  mdraw(W - 24 - msize, 24);
  mdraw(W - 24 - msize, H - 24 - msize);
  mdraw(24, H - 24 - msize);

  const cx = W / 2;

  /* ---- Wordmark (small, centered) ---- */
  let y = innerInset + 20;
  if (logo) {
    try {
      const size = pngSize(logo);
      const logoH = 40;
      const logoW = size ? (logoH * size.w) / size.h : logoH * 2.57;
      pdf.addImage(logo, "PNG", cx - logoW / 2, y, logoW, logoH);
      y += logoH;
    } catch {
      /* logo embed failed — skip */
    }
  }

  /* ---- Tagline ---- */
  y += 18;
  serif(pdf, "normal", 10);
  toHexText(pdf, GOLD_DARK);
  pdf.text("FLYBRIDGE EDUCATION GROUP", cx, y, { align: "center" });

  /* ---- Divider with diamond ---- */
  y += 14;
  const divHalf = 60;
  toHexDraw(pdf, FRAME);
  pdf.setLineWidth(1);
  pdf.line(cx - divHalf, y, cx - 8, y);
  pdf.line(cx + 8, y, cx + divHalf, y);
  toHexFill(pdf, FRAME);
  pdf.triangle(cx - 4, y, cx, y - 4, cx, y + 4, "F");
  pdf.triangle(cx + 4, y, cx, y - 4, cx, y + 4, "F");

  /* ---- Title ---- */
  y += 30;
  serif(pdf, "bold", 27);
  toHexText(pdf, INK);
  pdf.text("CERTIFICATE OF COMPLETION", cx, y, { align: "center" });

  /* ---- Subtitle ---- */
  y += 24;
  serif(pdf, "italic", 12);
  toHexText(pdf, BODY_INK);
  pdf.text("This certificate is proudly presented to", cx, y, { align: "center" });

  /* ---- Name (handwritten) ---- */
  y += 24;
  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(46);
  } else {
    serif(pdf, "bold", 30);
  }
  toHexText(pdf, NAME_INK);
  pdf.text(data.userName || "Student Name", cx, y, { align: "center" });

  // hairline under name
  y += 10;
  const nameWidth = Math.min(pdf.getTextWidth(data.userName || "Student Name") + 30, 240);
  toHexDraw(pdf, HAIRLINE);
  pdf.setLineWidth(0.8);
  pdf.line(cx - nameWidth / 2, y, cx + nameWidth / 2, y);

  /* ---- Recognition line ---- */
  y += 22;
  serif(pdf, "italic", 12);
  toHexText(pdf, BODY_INK);
  pdf.text("in recognition of the successful completion of the course", cx, y, {
    align: "center",
  });

  /* ---- Course title ---- */
  y += 18;
  serif(pdf, "bold", 16);
  toHexText(pdf, GOLD_DARK);
  const courseLines = pdf.splitTextToSize(data.courseTitle || "Course", 520);
  pdf.text(courseLines, cx, y, { align: "center" });

  /* ---- Supporting paragraph ---- */
  y += 22;
  serif(pdf, "normal", 9.5);
  toHexText(pdf, SOFT);
  const para = pdf.splitTextToSize(
    "The recipient has fulfilled all requirements of the course and demonstrated commitment to developing knowledge and skills in the field.",
    470
  );
  pdf.text(para, cx, y, { align: "center" });

  /* ---- Detail row (Completion Date + Certificate ID) ---- */
  y += 34;
  const dateStr = data.issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const detailY = y;
  const leftX = cx - 120;
  const rightX = cx + 120;

  serif(pdf, "normal", 8);
  toHexText(pdf, FAINT);
  pdf.text("COMPLETION DATE", leftX, detailY, { align: "center" });
  pdf.text("CERTIFICATE ID", rightX, detailY, { align: "center" });

  serif(pdf, "bold", 10.5);
  toHexText(pdf, INK);
  pdf.text(dateStr, leftX, detailY + 16, { align: "center" });
  pdf.text(data.certId, rightX, detailY + 16, { align: "center" });

  // vertical divider between the two
  toHexDraw(pdf, HAIRLINE);
  pdf.setLineWidth(0.8);
  pdf.line(cx, detailY - 6, cx, detailY + 22);

  /* ---- Footer: instructor signature (left) + digital seal (right) ---- */
  const footY = H - innerInset - 34;

  // Instructor signature (left-anchored)
  const sigX = innerInset + 38;
  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(26);
  } else {
    serif(pdf, "italic", 13);
  }
  toHexText(pdf, INK);
  pdf.text(data.instructorName || "Course Instructor", sigX, footY, {
    align: "left",
  });

  toHexDraw(pdf, FAINT);
  pdf.setLineWidth(0.8);
  pdf.line(sigX, footY + 6, sigX + 150, footY + 6);
  serif(pdf, "normal", 8);
  toHexText(pdf, FAINT);
  pdf.text("COURSE INSTRUCTOR", sigX, footY + 18, { align: "left" });

  // Digital seal (right): gold circle w/ check + caption below
  const sealmargin = innerInset + 38;
  const sealR = 26;
  const sealcx = W - sealmargin - sealR;
  const sealcy = footY - 6;

  toHexFill(pdf, "#FBF6E8");
  pdf.circle(sealcx, sealcy, sealR, "F");
  toHexDraw(pdf, FRAME);
  pdf.setLineWidth(2);
  pdf.circle(sealcx, sealcy, sealR, "S");

  // checkmark
  toHexDraw(pdf, GOLD_DARK);
  pdf.setLineWidth(2.4);
  pdf.line(sealcx - 8, sealcy, sealcx - 3, sealcy + 6);
  pdf.line(sealcx - 3, sealcy + 6, sealcx + 9, sealcy - 8);

  serif(pdf, "normal", 7.5);
  toHexText(pdf, FAINT);
  pdf.text(
    pdf.splitTextToSize("DIGITALLY CERTIFIED & ISSUED BY FLYBRIDGE EDUCATION GROUP", 150),
    sealcx,
    sealcy + sealR + 12,
    { align: "center" }
  );

  /* ---- Email caption (bottom center, subtle) ---- */
  serif(pdf, "normal", 7);
  toHexText(pdf, FAINT);
  pdf.text(data.userEmail || "", cx, H - innerInset - 8, { align: "center" });

  pdf.save(`FlyBridge-Certificate-${data.courseSlug || "course"}.pdf`);
}
