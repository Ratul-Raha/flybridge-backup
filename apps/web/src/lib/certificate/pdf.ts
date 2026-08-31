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
  };
  certId: string;
  issuedAt: Date;
};

/* ------------------------------------------------------------------ */
/*  Brand palette                                                      */
/* ------------------------------------------------------------------ */

const INK = "#122043";
const BODY = "#5B6478";
const BRAND = "#0FA968";
const BRAND_DARK = "#0B7A4B";
const GOLD = "#C9A227";
const GOLD_LIGHT = "#EBD9A8";
const MUTED = "#9AA4BC";
const MINT = "#E2F6EE";

/* ------------------------------------------------------------------ */
/*  Asset helpers                                                      */
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

function toHexColor(pdf: jsPDF, hex: string) {
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
/*  Helper drawing                                                    */
/* ------------------------------------------------------------------ */

function roundedRectPath(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  pdf.roundedRect(x, y, w, h, r, r);
}

function cornerFlourish(
  pdf: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  toHexDraw(pdf, color);
  pdf.setLineWidth(1.2);
  pdf.circle(cx, cy, radius, "S");
  toHexDraw(pdf, GOLD);
  pdf.setLineWidth(0.9);
  pdf.circle(cx, cy, radius * 0.68, "S");
  pdf.setFillColor(GOLD);
  pdf.circle(cx, cy, 2.4, "F");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "S";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
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
  const seal = await loadImageDataUrl("/stamp.png");
  const avatar = data.userAvatar ? await loadImageDataUrl(data.userAvatar) : null;

  /* ---- Background ---- */
  toHexFill(pdf, "#FFFFFF");
  pdf.rect(0, 0, W, H, "F");

  // Soft mint top band and gold bottom band tint
  pdf.setGState(new (pdf as any).GState({ opacity: 0.16 }));
  toHexFill(pdf, MINT);
  pdf.rect(0, 0, W, 26, "F");
  toHexFill(pdf, GOLD);
  pdf.rect(0, H - 22, W, 22, "F");
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // Outer border (gold) + inner border (brand)
  toHexDraw(pdf, GOLD);
  pdf.setLineWidth(2.4);
  pdf.rect(22, 22, W - 44, H - 44);
  toHexDraw(pdf, BRAND);
  pdf.setLineWidth(1.1);
  pdf.rect(34, 34, W - 68, H - 68);

  // Corner flourishes
  const cornerR = 26;
  cornerFlourish(pdf, 50, 50, cornerR, GOLD);
  cornerFlourish(pdf, W - 50, 50, cornerR, GOLD);
  cornerFlourish(pdf, 50, H - 50, cornerR, GOLD);
  cornerFlourish(pdf, W - 50, H - 50, cornerR, GOLD);

  /* ---- Logo ---- */
  const logoH = 52;
  let titleY = 120;
  if (logo) {
    try {
      const size = pngSize(logo);
      const logoW = size ? (logoH * size.w) / size.h : logoH * 2.57;
      const logoX = (W - logoW) / 2;
      pdf.addImage(logo, "PNG", logoX, 66, logoW, logoH);
      titleY = 66 + logoH + 16;
    } catch {
      // fall through — keep default titleY
    }
  }

  /* ---- Organization tagline ---- */
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  toHexText(pdf, BODY);
  pdf.text("FLYBRIDGE EDUCATION GROUP", W / 2, titleY + 6, { align: "center" });

  const dividerY = titleY + 26;
  toHexDraw(pdf, GOLD_LIGHT);
  pdf.setLineWidth(1);
  pdf.line(W * 0.38, dividerY, W * 0.42, dividerY);
  pdf.line(W * 0.58, dividerY, W * 0.62, dividerY);
  toHexFill(pdf, GOLD);
  pdf.circle(W / 2, dividerY, 3, "F");

  /* ---- Heading ---- */
  const headY = dividerY + 42;
  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(30);
    toHexText(pdf, GOLD);
    pdf.text("Certificate of Completion", W / 2, headY, { align: "center" });
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    toHexText(pdf, GOLD);
    pdf.text("CERTIFICATE OF COMPLETION", W / 2, headY, { align: "center" });
  }

  const subY = headY + 26;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  toHexText(pdf, BODY);
  pdf.text("This is to proudly certify that", W / 2, subY, { align: "center" });

  /* ---- Avatar + name ---- */
  const nameY = subY + 22;
  const avatarR = 34;
  const avatarCY = nameY - 4;

  if (avatar) {
    try {
      const size = pngSize(avatar);
      if (size) {
        const aspect = size.w / size.h;
        let imgW = avatarR * 2;
        let imgH = avatarR * 2;
        if (aspect > 1) {
          imgH = imgW / aspect;
        } else {
          imgW = imgH * aspect;
        }
        pdf.saveGraphicsState();
        pdf.circle(W / 2, avatarCY, avatarR, "clip");
        pdf.addImage(avatar, "JPEG", W / 2 - imgW / 2, avatarCY - imgH / 2, imgW, imgH);
        pdf.restoreGraphicsState();
      }
    } catch {
      // avatar failed to clip — skip
    }
  }

  // Monogram ring behind/around avatar or as fallback
  toHexDraw(pdf, GOLD);
  pdf.setLineWidth(2.4);
  pdf.circle(W / 2, avatarCY, avatarR + 4, "S");
  toHexDraw(pdf, GOLD);
  pdf.setLineWidth(0.8);
  pdf.circle(W / 2, avatarCY, avatarR + 8, "S");

  if (!avatar) {
    toHexFill(pdf, MINT);
    pdf.circle(W / 2, avatarCY, avatarR, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(30);
    toHexText(pdf, BRAND_DARK);
    pdf.text(initials(data.userName), W / 2, avatarCY + 10, { align: "center" });
  }

  const nameY2 = avatarCY + avatarR + 26;
  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(52);
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);
  }
  toHexText(pdf, INK);
  pdf.text(data.userName || "Student", W / 2, nameY2, { align: "center" });

  // Flourish underline under name
  const nameWidth = pdf.getTextWidth(data.userName || "Student");
  const flX = Math.min(nameWidth / 2 + 26, W * 0.32);
  toHexDraw(pdf, GOLD);
  pdf.setLineWidth(1.2);
  const baseY = nameY2 + 12;
  pdf.line(W / 2 - flX, baseY, W / 2 + flX, baseY);
  pdf.setFillColor(GOLD);
  pdf.triangle(W / 2 - flX - 6, baseY, W / 2 - flX + 2, baseY - 4, W / 2 - flX + 2, baseY + 4, "F");
  pdf.triangle(W / 2 + flX + 6, baseY, W / 2 + flX - 2, baseY - 4, W / 2 + flX - 2, baseY + 4, "F");

  /* ---- Completion line ---- */
  const compY = baseY + 30;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  toHexText(pdf, BODY);
  pdf.text("has successfully completed the course", W / 2, compY, { align: "center" });

  /* ---- Course title ---- */
  const courseY = compY + 26;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  toHexText(pdf, BRAND_DARK);
  const lines = pdf.splitTextToSize(data.courseTitle || "Course", W * 0.7);
  pdf.text(lines, W / 2, courseY, { align: "center" });

  /* ---- Results strip ---- */
  const resultsY = courseY + 40;
  const boxH = 46;
  const boxGap = 24;
  const boxW = 120;
  const totalW = boxW * 3 + boxGap * 2;
  const startX = (W - totalW) / 2;
  const stats = [
    { label: "GRADE", value: data.grade.grade },
    { label: "SCORE", value: `${data.grade.percentage}%` },
    { label: "ENGLISH LEVEL", value: data.grade.englishLevel.split(" ")[0] },
  ];

  stats.forEach((s, i) => {
    const x = startX + i * (boxW + boxGap);
    toHexFill(pdf, MINT);
    pdf.roundedRect(x, resultsY, boxW, boxH, 8, 8, "F");
    toHexDraw(pdf, BRAND);
    pdf.setLineWidth(0.7);
    pdf.roundedRect(x, resultsY, boxW, boxH, 8, 8, "S");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    toHexText(pdf, MUTED);
    pdf.text(s.label, x + boxW / 2, resultsY + 16, { align: "center" });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    toHexText(pdf, BRAND_DARK);
    pdf.text(s.value, x + boxW / 2, resultsY + 34, { align: "center" });
  });

  /* ---- Footer ---- */
  const footerY = H - 92;

  // Left: date
  const dateStr = data.issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  toHexText(pdf, BODY);
  pdf.text("ISSUED ON", W * 0.2, footerY - 16, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  toHexText(pdf, INK);
  pdf.text(dateStr, W * 0.2, footerY + 6, { align: "center" });

  // Center: certificate ID
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  toHexText(pdf, BODY);
  pdf.text("CERTIFICATE ID", W * 0.5, footerY - 16, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  toHexText(pdf, INK);
  pdf.text(data.certId, W * 0.5, footerY + 6, { align: "center" });

  // Right: signature
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  toHexText(pdf, BODY);
  pdf.text("AUTHORIZED SIGNATURE", W * 0.8, footerY - 16, { align: "center" });

  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(24);
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(14);
  }
  toHexText(pdf, BRAND_DARK);
  pdf.text("FlyBridge Education", W * 0.8, footerY + 4, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  toHexText(pdf, MUTED);
  pdf.text(data.userEmail || "", W / 2, H - 40, { align: "center" });

  /* ---- Seal (bottom right, rotated) ---- */
  if (seal) {
    try {
      const size = pngSize(seal);
      const sH = 96;
      const sW = size ? (sH * size.w) / size.h : sH;
      const sx = W - sW - 62;
      const sy = H - sH - 44;
      pdf.saveGraphicsState();
      (pdf as any).rotate(-18, { origin: [sx + sW / 2, sy + sH / 2] });
      pdf.setGState(new (pdf as any).GState({ opacity: 0.22 }));
      pdf.addImage(seal, "PNG", sx, sy, sW, sH);
      pdf.restoreGraphicsState();
    } catch {
      // seal failed — ignore
    }
  }

  pdf.save(`FlyBridge-Certificate-${data.courseSlug || "course"}.pdf`);
}

function toHexFill(pdf: jsPDF, hex: string) {
  toHexColor(pdf, hex);
}
