import { jsPDF } from "jspdf";

export type CertificateData = {
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  courseTitle: string;
  courseSlug: string;
  grade: {
    percentage: number;
    grade: string;
    englishLevel: string;
    completedQuizzes?: number;
    totalQuizzes?: number;
  };
  certId: string;
  issuedAt: Date;
  unlocked: boolean;
  verifyUrl: string;
};

/* ------------------------------------------------------------------ */
/*  Brand palette (light theme credential)                             */
/* ------------------------------------------------------------------ */

const PAPER_TOP = "#FFFFFF";
const PAPER_MID = "#F4FAF7";
const PAPER_BOTTOM = "#EAF7F1";
const INK = "#122043";
const BODY = "#5B6478";
const MUTED = "#8A98B8";
const BRAND = "#0FA968";
const BRAND_2 = "#14B57E";

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

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHexFill(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexRgb(hex);
  pdf.setFillColor(r, g, b);
}

function toHexDraw(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexRgb(hex);
  pdf.setDrawColor(r, g, b);
}

function toHexText(pdf: jsPDF, hex: string) {
  const [r, g, b] = hexRgb(hex);
  pdf.setTextColor(r, g, b);
}

function sans(
  pdf: jsPDF,
  weight: "normal" | "bold" | "italic" | "bolditalic",
  size: number
) {
  const name: Record<string, string> = {
    normal: "helvetica",
    bold: "helveticaBold",
    italic: "helveticaOblique",
    bolditalic: "helveticaBoldOblique",
  };
  pdf.setFont(name[weight]);
  pdf.setFontSize(size);
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

function drawBg(pdf: jsPDF, W: number, H: number) {
  toHexFill(pdf, PAPER_TOP);
  pdf.rect(0, 0, W, H, "F");
  toHexFill(pdf, PAPER_MID);
  pdf.rect(0, H * 0.4, W, H * 0.4, "F");
  toHexFill(pdf, PAPER_BOTTOM);
  pdf.rect(0, H * 0.86, W, H * 0.14, "F");

  // soft brand gradient blobs (top-right, bottom-left)
  for (let i = 4; i >= 1; i--) {
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
    toHexFill(pdf, BRAND);
    pdf.circle(W - 30, -30, 90 + i * 30, "F");
    pdf.restoreGraphicsState();
  }
  for (let i = 4; i >= 1; i--) {
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity: 0.045 }));
    toHexFill(pdf, BRAND_2);
    pdf.circle(20, H + 30, 80 + i * 26, "F");
    pdf.restoreGraphicsState();
  }

  // micro-dot grids (top-left, bottom-right)
  pdf.saveGraphicsState();
  pdf.setGState(new (pdf as any).GState({ opacity: 0.12 }));
  const drawDots = (x0: number, y0: number, cols: number, rows: number, step: number, color: string) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        toHexFill(pdf, color);
        pdf.circle(x0 + c * step, y0 + r * step, 0.9, "F");
      }
    }
  };
  drawDots(60, 60, 10, 8, 14, BRAND);
  drawDots(W - 220, H - 180, 11, 8, 15, BRAND_2);
  pdf.restoreGraphicsState();
}

function drawFrame(pdf: jsPDF, W: number, H: number, M: number) {
  const inset = M - 16;
  toHexDraw(pdf, BRAND_2);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.9 }));
  pdf.setLineWidth(1.8);
  pdf.rect(inset, inset, W - inset * 2, H - inset * 2);
  toHexDraw(pdf, BRAND);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.5 }));
  pdf.setLineWidth(0.7);
  pdf.rect(inset + 8, inset + 8, W - (inset + 8) * 2, H - (inset + 8) * 2);
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // corner dots
  const c = inset - 4;
  toHexFill(pdf, BRAND_2);
  pdf.circle(c, c, 2.4, "F");
  pdf.circle(W - c, c, 2.4, "F");
  pdf.circle(c, H - c, 2.4, "F");
  pdf.circle(W - c, H - c, 2.4, "F");
}

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export async function generateCertificatePdf(data: CertificateData): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 60;

  const hasCaveat = await registerCaveat(pdf);
  const logo = await loadImageDataUrl("/transparent-logo-dark.png");
  const qr =
    data.unlocked && data.verifyUrl
      ? await loadImageDataUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
            data.verifyUrl
          )}`
        )
      : null;

  drawBg(pdf, W, H);
  drawFrame(pdf, W, H, M);

  const cx = W / 2;

  /* ---- Header: logo (left) + cert id (right) ---- */
  if (logo) {
    const size = pngSize(logo);
    const logoH = 24;
    const logoW = size ? (logoH * size.w) / size.h : 110;
    try {
      pdf.addImage(logo, "PNG", M, M - 20, logoW, logoH);
    } catch {
      /* logo failed */
    }
  } else {
    sans(pdf, "bold", 22);
    toHexText(pdf, INK);
    pdf.text("flybridge", M, M);
  }

  sans(pdf, "bold", 6.5);
  toHexText(pdf, BRAND_2);
  pdf.text("EDUCATION GROUP", M, M - 4 + 18, { align: "left" });

  const idLabelY = M - 16;
  sans(pdf, "bold", 6.5);
  toHexText(pdf, BRAND_2);
  pdf.text("CERTIFICATE NO.", W - M, idLabelY, { align: "right" });
  sans(pdf, "bold", 11);
  toHexText(pdf, data.unlocked ? BRAND : MUTED);
  pdf.text(data.unlocked ? data.certId : "FB-••••-••••", W - M, idLabelY + 13, {
    align: "right",
  });

  /* ---- Seal (center, above title) ---- */
  const sealR = 22;
  const sealCY = M + 62;
  toHexFill(pdf, BRAND_2);
  toHexDraw(pdf, BRAND_2);
  pdf.circle(cx, sealCY, sealR, "F");
  toHexFill(pdf, "#fff");
  sans(pdf, "bold", 20);
  pdf.text("✓", cx, sealCY + 7, { align: "center" });

  /* ---- Centered title ---- */
  sans(pdf, "bold", 9);
  toHexText(pdf, BRAND_2);
  pdf.text("CERTIFICATE OF COMPLETION", cx, sealCY + 40, { align: "center" });

  sans(pdf, "bolditalic", 12);
  toHexText(pdf, INK);
  pdf.text("This is to certify that", cx, sealCY + 58, { align: "center" });

  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(46);
  } else {
    sans(pdf, "bolditalic", 26);
  }
  toHexText(pdf, INK);
  pdf.text(data.userName || "Student Name", cx, sealCY + 86, { align: "center" });

  sans(pdf, "normal", 9.5);
  toHexText(pdf, BODY);
  const bodyY = sealCY + 104;
  const bodyLines = pdf.splitTextToSize(
    `has successfully completed ${data.courseTitle || "Course"}, demonstrating dedication and commitment throughout the program. We proudly recognize this achievement and wish continued success ahead.`,
    W - M * 3
  );
  // draw courseTitle in brand on first line
  const first = bodyLines[0];
  pdf.text(first, cx, bodyY, { align: "center" });

  /* ---- Stats row ---- */
  const statsY = bodyY + bodyLines.length * 12 + 24;
  const stats = [
    { label: "SCORE", value: `${data.grade.percentage}%` },
    { label: "GRADE", value: data.grade.grade },
    { label: "LEVEL", value: data.grade.englishLevel.split(" ")[0] },
    { label: "QUIZZES", value: `${data.grade.completedQuizzes ?? "—"}/${data.grade.totalQuizzes ?? "—"}` },
  ];
  const slotW = (W - M * 2) / stats.length;
  const valY = statsY + 18;
  stats.forEach((s, i) => {
    const x = M + i * slotW;
    if (i !== 0) {
      toHexDraw(pdf, BRAND);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.35 }));
      pdf.setLineWidth(0.8);
      pdf.line(x - slotW / 2, statsY - 2, x - slotW / 2, statsY + 2);
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
    }
    sans(pdf, "bold", 6.5);
    toHexText(pdf, BODY);
    pdf.text(s.label, x + slotW / 2, statsY, { align: "center" });
    sans(pdf, "bold", 15);
    toHexText(pdf, INK);
    pdf.text(s.value, x + slotW / 2, valY, { align: "center" });
  });

  /* ---- Bottom row ---- */
  const bottomY = H - M - 8;

  if (data.unlocked) {
    // signature (left)
    sans(pdf, "bold", 13);
    toHexText(pdf, BRAND);
    pdf.text("FlyBridge", M, bottomY - 26, { align: "left" });
    toHexDraw(pdf, BRAND_2);
    pdf.setLineWidth(1);
    pdf.line(M, bottomY - 18, M + 150, bottomY - 18);
    sans(pdf, "bold", 6.5);
    toHexText(pdf, BODY);
    pdf.text("AUTHORIZED SIGNATURE", M, bottomY - 10, { align: "left" });

    // email (bottom center)
    sans(pdf, "normal", 7);
    toHexText(pdf, MUTED);
    pdf.text(data.userEmail || "", cx, H - 10, { align: "center" });

    // QR + date (right)
    if (qr) {
      const qrBox = 58;
      const qrX = W - M - 10 - qrBox;
      const qrY = bottomY - qrBox;
      try {
        pdf.addImage(qr, "PNG", qrX, qrY, qrBox, qrBox);
      } catch {
        /* qr failed */
      }
      toHexDraw(pdf, BRAND);
      pdf.setLineWidth(1);
      pdf.rect(qrX, qrY, qrBox, qrBox);

      sans(pdf, "bold", 6);
      toHexText(pdf, BODY);
      pdf.text("ISSUED", qrX - 14, qrY + 10, { align: "right" });
      sans(pdf, "bold", 9);
      toHexText(pdf, INK);
      pdf.text(
        data.issuedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        qrX - 14,
        qrY + 22,
        { align: "right" }
      );
    }
  } else {
    // locked: fade lower half
    const startY = H * 0.52;
    const bands = 10;
    for (let i = 0; i <= bands; i++) {
      const t = i / bands;
      const y = startY + (H - startY) * (i / bands);
      const alpha = 0.06 + t * 0.9;
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: alpha }));
      toHexFill(pdf, PAPER_BOTTOM);
      pdf.rect(0, y, W, (H - startY) / bands + 2);
      pdf.restoreGraphicsState();
    }
    // lock hint
    const lx = cx;
    const ly = startY + 24;
    toHexFill(pdf, PAPER_MID);
    toHexDraw(pdf, BRAND);
    pdf.roundedRect(lx - 120, ly - 16, 240, 34, 17, 17, "FD");
    toHexDraw(pdf, BRAND);
    pdf.setLineWidth(1.4);
    pdf.circle(lx - 84, ly, 6, "S");
    pdf.line(lx - 84, ly - 6, lx - 84, ly - 8);
    pdf.line(lx - 84, ly + 6, lx - 84, ly + 1);
    sans(pdf, "bold", 9);
    toHexText(pdf, BRAND);
    pdf.text("Unlock the full certificate", lx - 72, ly + 3, { align: "left" });
  }

  pdf.save(`FlyBridge-Certificate-${data.courseSlug || "course"}.pdf`);
}
