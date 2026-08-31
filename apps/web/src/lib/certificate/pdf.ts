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
  verifyUrl: string;
};

/* ------------------------------------------------------------------ */
/*  Brand palette (modern flybridge)                                   */
/* ------------------------------------------------------------------ */

const INK = "#122043";
const BODY = "#5B6478";
const BRAND = "#0FA968";
const BRAND_DARK = "#0B7A4B";
const BG_SOFT = "#F6F8FC";
const LINE = "#E7EAF2";
const WHITE = "#FFFFFF";

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

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export async function generateCertificatePdf(data: CertificateData): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 44;

  const hasCaveat = await registerCaveat(pdf);
  const avatar = data.userAvatar
    ? await loadImageDataUrl(data.userAvatar)
    : null;

  /* ---- Background ---- */
  toHexFill(pdf, WHITE);
  pdf.rect(0, 0, W, H, "F");

  // Decorative wave bottom-left (soft)
  pdf.saveGraphicsState();
  pdf.setGState(new (pdf as any).GState({ opacity: 0.5 }));
  pdf.setFillColor(BG_SOFT);
  pdf.lines(
    [
      [0, 40],
      [120, 0],
      [160, 50],
      [240, 10],
      [300, 40],
      [360, 0],
      [400, 30],
    ],
    -60,
    H - 160,
    "F"
  );
  pdf.setFillColor(BRAND);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.06 }));
  pdf.lines(
    [
      [0, 30],
      [120, -20],
      [170, 30],
      [240, 0],
      [300, 30],
      [360, -10],
      [400, 20],
    ],
    -60,
    H - 120,
    "F"
  );
  pdf.restoreGraphicsState();

  /* ---- Top header: wordmark (left) + cert id (right) ---- */
  const cx = W / 2;

  sans(pdf, "bold", 24);
  toHexText(pdf, INK);
  pdf.text("flybridge", M, M + 6);

  sans(pdf, "bold", 7.5);
  toHexText(pdf, BRAND);
  pdf.text("EDUCATION GROUP", M, M + 17);

  sans(pdf, "bold", 7);
  toHexText(pdf, BODY);
  pdf.text("CERTIFICATE ID", W - M, M + 6, { align: "right" });
  sans(pdf, "bold", 11);
  toHexText(pdf, INK);
  pdf.text(data.certId, W - M, M + 18, { align: "right" });

  /* ---- Ribbon badge (top-right) ---- */
  const badgeR = 17;
  const badgeX = W - M - 60;
  const badgeY = M;
  toHexDraw(pdf, BRAND);
  pdf.setLineWidth(2);
  toHexFill(pdf, WHITE);
  pdf.circle(badgeX, badgeY, badgeR, "FD");
  // award/check glyph inside
  toHexDraw(pdf, BRAND);
  pdf.setLineWidth(2);
  pdf.line(badgeX - 4, badgeY, badgeX + 5, badgeY);
  pdf.line(badgeX + 5, badgeY, badgeX + 5, badgeY - 6);

  /* ---- Main: avatar (left) + text (right) ---- */
  const avatarR = 40;
  const avatarCX = M + avatarR + 16;
  const avatarCY = M + 78;

  if (avatar) {
    try {
      const size = pngSize(avatar);
      if (size) {
        const aspect = size.w / size.h;
        let imgW = avatarR * 2;
        let imgH = avatarR * 2;
        if (aspect > 1) imgH = imgW / aspect;
        else imgW = imgH * aspect;
        pdf.saveGraphicsState();
        pdf.circle(avatarCX, avatarCY, avatarR, "clip");
        pdf.addImage(
          avatar,
          "JPEG",
          avatarCX - imgW / 2,
          avatarCY - imgH / 2,
          imgW,
          imgH
        );
        pdf.restoreGraphicsState();
      }
    } catch {
      /* avatar failed */
    }
  }
  toHexDraw(pdf, LINE);
  pdf.setLineWidth(1.5);
  pdf.circle(avatarCX, avatarCY, avatarR, "S");
  if (!avatar) {
    toHexFill(pdf, BG_SOFT);
    pdf.circle(avatarCX, avatarCY, avatarR, "F");
    sans(pdf, "bold", 30);
    toHexText(pdf, BRAND);
    const initial = (data.userName || "S").trim().charAt(0).toUpperCase() || "S";
    pdf.text(initial, avatarCX, avatarCY + 11, { align: "center" });
  }

  // Text column
  const tx = avatarCX + avatarR + 24;
  const tW = W - tx - M;

  sans(pdf, "bold", 34);
  toHexText(pdf, INK);
  pdf.text("CERTIFICATE", tx, M + 52);

  sans(pdf, "bold", 15);
  toHexText(pdf, INK);
  pdf.text("OF", tx, M + 68);
  sans(pdf, "bold", 15);
  toHexText(pdf, BRAND);
  pdf.text("COMPLETION", tx + 18, M + 68);

  toHexFill(pdf, BRAND);
  pdf.roundedRect(tx, M + 74, 44, 3, 1.5, 1.5, "F");

  sans(pdf, "normal", 11);
  toHexText(pdf, BODY);
  pdf.text("This is proudly presented to", tx, M + 96);

  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(34);
  } else {
    sans(pdf, "bold", 24);
  }
  toHexText(pdf, INK);
  pdf.text(data.userName || "Student Name", tx, M + 120);

  sans(pdf, "normal", 11);
  toHexText(pdf, BODY);
  pdf.text("for successfully completing the course", tx, M + 138);

  // course title with icon dot
  toHexFill(pdf, BG_SOFT);
  pdf.roundedRect(tx, M + 146, 16, 16, 4, 4, "F");
  toHexText(pdf, BRAND);
  sans(pdf, "bold", 9);
  pdf.text("✓", tx + 8, M + 157, { align: "center" });
  sans(pdf, "bold", 13);
  toHexText(pdf, BRAND_DARK);
  const courseLines = pdf.splitTextToSize(data.courseTitle || "Course", tW - 26);
  pdf.text(courseLines, tx + 24, M + 153, { align: "left" });

  const afterCourseY = M + 153 + (courseLines.length - 1) * 15 + 14;

  // supporting paragraph
  sans(pdf, "normal", 8.5);
  toHexText(pdf, BODY);
  const para = pdf.splitTextToSize(
    "The recipient has fulfilled all course requirements and demonstrated commitment to developing knowledge and skills in the field.",
    tW
  );
  pdf.text(para, tx, afterCourseY, { align: "left" });

  /* ---- Divider ---- */
  const divY = Math.max(afterCourseY + para.length * 11 + 18, M + 200);
  toHexDraw(pdf, LINE);
  pdf.setLineWidth(0.8);
  pdf.line(M, divY, W - M, divY);

  /* ---- Stats row ---- */
  const statsY = divY + 16;
  const boxW = (W - M * 2 - 18 * 3) / 4;
  const boxH = 34;
  const stats = [
    { label: "OVERALL SCORE", value: `${data.grade.percentage}%` },
    { label: "GRADE", value: data.grade.grade },
    { label: "ENGLISH LEVEL", value: data.grade.englishLevel.split(" ")[0] },
    { label: "QUIZZES DONE", value: `${data.grade.completedQuizzes ?? "—"}/${data.grade.totalQuizzes ?? "—"}` },
  ];

  stats.forEach((s, i) => {
    const x = M + i * (boxW + 18);
    toHexFill(pdf, BG_SOFT);
    pdf.roundedRect(x, statsY, boxW, boxH, 6, 6, "F");
    toHexDraw(pdf, LINE);
    pdf.setLineWidth(0.7);
    pdf.roundedRect(x, statsY, boxW, boxH, 6, 6, "S");

    sans(pdf, "bold", 6);
    toHexText(pdf, BODY);
    pdf.text(s.label, x + boxW / 2, statsY + 11, { align: "center" });
    sans(pdf, "bold", 12);
    toHexText(pdf, BRAND_DARK);
    pdf.text(s.value, x + boxW / 2, statsY + 26, { align: "center" });
  });

  /* ---- Bottom row: verified note (left) + QR + date (right) ---- */
  const bottomY = H - M - 10;
  sans(pdf, "bold", 7);
  toHexText(pdf, BRAND);
  pdf.text("✓ VERIFIED", M, bottomY - 8, { align: "left" });
  sans(pdf, "normal", 7);
  toHexText(pdf, BODY);
  pdf.text(
    pdf.splitTextToSize(
      "Digitally issued & verified by FlyBridge Education Group. Scan to confirm authenticity.",
      tW * 0.6
    ),
    M,
    bottomY - 1,
    { align: "left" }
  );

  // QR code (from verify URL)
  const qrTarget: string = data.verifyUrl || data.certId;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
    qrTarget
  )}`;
  const qr = await loadImageDataUrl(qrSrc);
  const qrBox = 58;
  const qrX = W - M - qrBox;
  const qrY = bottomY - qrBox;

  if (qr) {
    try {
      pdf.addImage(qr, "PNG", qrX, qrY, qrBox, qrBox);
    } catch {
      /* qr failed */
    }
  } else {
    toHexFill(pdf, BG_SOFT);
    pdf.rect(qrX, qrY, qrBox, qrBox, "F");
  }
  toHexDraw(pdf, LINE);
  pdf.setLineWidth(0.8);
  pdf.rect(qrX, qrY, qrBox, qrBox);

  // date next to QR
  sans(pdf, "bold", 6.5);
  toHexText(pdf, BODY);
  pdf.text("COMPLETION DATE", qrX - 12, bottomY - 8, { align: "right" });
  sans(pdf, "bold", 9);
  toHexText(pdf, INK);
  pdf.text(
    data.issuedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    qrX - 12,
    bottomY - 1,
    { align: "right" }
  );

  /* ---- Email caption (bottom center) ---- */
  sans(pdf, "normal", 7);
  toHexText(pdf, BODY);
  pdf.text(data.userEmail || "", cx, H - 14, { align: "center" });

  pdf.save(`FlyBridge-Certificate-${data.courseSlug || "course"}.pdf`);
}
