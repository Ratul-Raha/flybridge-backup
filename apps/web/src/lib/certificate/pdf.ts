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
/*  Brand palette (premium dark credential)                            */
/* ------------------------------------------------------------------ */

const NAVY_TOP = "#0D1B33";
const NAVY = "#132243";
const NAVY_BOTTOM = "#0B1528";
const TILE = "#182A47";
const TEXT = "#F4F7FF";
const BODY = "#A8B6CF";
const MUTED = "#8A98B8";
const BRAND = "#34D399";
const BRAND_STRONG = "#4BE0A8";
const BORDER = "rgba(255,255,255,0.10)";

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

/* ------------------------------------------------------------------ */
/*  Helpers for the dark credential                                    */
/* ------------------------------------------------------------------ */

function drawNavy(pdf: jsPDF, W: number, H: number) {
  toHexFill(pdf, NAVY);
  pdf.rect(0, 0, W, H, "F");
  toHexFill(pdf, NAVY_TOP);
  pdf.rect(0, 0, W, H * 0.55, "F");
  toHexFill(pdf, NAVY_BOTTOM);
  pdf.rect(0, H * 0.86, W, H * 0.14, "F");

  // brand-green radial glow, top-right (layered translucent ellipses)
  const glowX = W * 0.88;
  const glowY = -20;
  for (let i = 5; i >= 1; i--) {
    pdf.saveGraphicsState();
    pdf.setGState(new (pdf as any).GState({ opacity: 0.045 }));
    toHexFill(pdf, BRAND);
    pdf.circle(glowX, glowY, 90 + i * 34, "F");
    pdf.restoreGraphicsState();
  }

  // subtle wave, bottom-left
  pdf.saveGraphicsState();
  pdf.setFillColor(BRAND);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
  pdf.lines(
    [
      [0, 40],
      [120, -10],
      [170, 40],
      [240, 10],
      [300, 40],
      [360, 0],
      [400, 30],
    ],
    -50,
    H - 150,
    "F"
  );
  pdf.restoreGraphicsState();
}

function drawFrame(pdf: jsPDF, W: number, H: number, M: number) {
  const inset = M - 18;
  toHexDraw(pdf, BRAND);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.5 }));
  pdf.setLineWidth(1.1);
  pdf.rect(inset, inset, W - inset * 2, H - inset * 2);
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
}

function drawRoundedRgba(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  hex: string,
  opacity: number,
  fill: boolean
) {
  pdf.saveGraphicsState();
  pdf.setGState(new (pdf as any).GState({ opacity }));
  toHexDraw(pdf, hex);
  toHexFill(pdf, hex);
  pdf.roundedRect(x, y, w, h, r, r, fill ? "FD" : "S");
  pdf.restoreGraphicsState();
}

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export async function generateCertificatePdf(data: CertificateData): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 56;

  const hasCaveat = await registerCaveat(pdf);
  const avatar = data.userAvatar
    ? await loadImageDataUrl(data.userAvatar)
    : null;
  const logo = await loadImageDataUrl("/transparent-logo-light.png");
  const qr =
    data.unlocked && data.verifyUrl
      ? await loadImageDataUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(
            data.verifyUrl
          )}`
        )
      : null;

  /* Background + frame */
  drawNavy(pdf, W, H);
  drawFrame(pdf, W, H, M);

  /* ---- Header: logo (left) + cert id (right) ---- */
  const cx = W / 2;

  if (logo) {
    const size = pngSize(logo);
    const logoH = 26;
    const logoW = size ? (logoH * size.w) / size.h : 120;
    try {
      pdf.addImage(logo, "PNG", M, M - 22, logoW, logoH);
    } catch {
      /* logo failed */
    }
  } else {
    sans(pdf, "bold", 22);
    toHexText(pdf, TEXT);
    pdf.text("flybridge", M, M - 2);
  }

  sans(pdf, "bold", 7);
  toHexText(pdf, MUTED);
  pdf.text("CERTIFICATE ID", W - M, M - 24, { align: "right" });
  sans(pdf, "bold", 11);
  toHexText(pdf, data.unlocked ? BRAND : MUTED);
  pdf.text(
    data.unlocked ? data.certId : "FB-••••-••••",
    W - M,
    M - 12,
    { align: "right" }
  );

  /* ---- Main: avatar (left) + text (right) ---- */
  const avatarR = 40;
  const avatarCX = M + avatarR + 16;
  const avatarCY = M + 78;

  toHexDraw(pdf, BRAND);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.55 }));
  pdf.setLineWidth(3.5);
  pdf.circle(avatarCX, avatarCY, avatarR, "S");
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
  toHexDraw(pdf, NAVY_TOP);
  pdf.setLineWidth(1.5);
  pdf.circle(avatarCX, avatarCY, avatarR - 3, "S");

  if (avatar) {
    try {
      const size = pngSize(avatar);
      if (size) {
        const aspect = size.w / size.h;
        let imgW = (avatarR - 3) * 2;
        let imgH = (avatarR - 3) * 2;
        if (aspect > 1) imgH = imgW / aspect;
        else imgW = imgH * aspect;
        pdf.saveGraphicsState();
        pdf.circle(avatarCX, avatarCY, avatarR - 3, "clip");
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
  } else {
    drawRoundedRgba(pdf, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2, avatarR, TILE, 1, true);
    sans(pdf, "bold", 30);
    toHexText(pdf, BRAND);
    const initial = (data.userName || "S").trim().charAt(0).toUpperCase() || "S";
    pdf.text(initial, avatarCX, avatarCY + 11, { align: "center" });
  }

  // Text column
  const tx = avatarCX + avatarR + 26;
  const tW = W - tx - M;

  sans(pdf, "bold", 9);
  toHexText(pdf, BRAND);
  pdf.text("CERTIFICATE OF", tx, M + 40);

  sans(pdf, "bold", 40);
  toHexText(pdf, TEXT);
  pdf.text("COMPLETION", tx, M + 66);

  toHexFill(pdf, BRAND);
  pdf.roundedRect(tx, M + 74, 52, 3, 1.5, 1.5, "F");

  sans(pdf, "normal", 11);
  toHexText(pdf, BODY);
  pdf.text("This is proudly presented to", tx, M + 96);

  if (hasCaveat) {
    pdf.setFont("Caveat", "normal");
    pdf.setFontSize(36);
  } else {
    sans(pdf, "bold", 24);
  }
  toHexText(pdf, TEXT);
  pdf.text(data.userName || "Student Name", tx, M + 122);

  sans(pdf, "normal", 11);
  toHexText(pdf, BODY);
  pdf.text("for successfully completing the course", tx, M + 140);

  // course title chip
  drawRoundedRgba(pdf, tx, M + 148, 148, 20, 6, BRAND, 0.14, true);
  toHexText(pdf, BRAND);
  sans(pdf, "bold", 9);
  pdf.text("✓", tx + 9, M + 162, { align: "center" });
  sans(pdf, "bold", 12);
  const courseChip = pdf.splitTextToSize(data.courseTitle || "Course", 118);
  pdf.text(courseChip[0], tx + 16, M + 162 + (courseChip.length - 1) * 14, { align: "left" });

  const afterCourseY = M + 148 + (courseChip ? (courseChip.length - 1) * 14 : 0) + 24;

  sans(pdf, "normal", 8.5);
  toHexText(pdf, BODY);
  const para = pdf.splitTextToSize(
    "The recipient has fulfilled all course requirements and demonstrated commitment to developing knowledge and skills in the field.",
    tW
  );
  pdf.text(para, tx, afterCourseY, { align: "left" });

  /* ---- unlock threshold ---- */
  const contentBottom = data.unlocked ? H - M - 108 : H * 0.46;

  /* If locked: fade lower half to invisible + lock hint */
  if (!data.unlocked) {
    const startY = H * 0.40;
    const bands = 10;
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const y = startY + (H - startY) * (i / bands);
      pdf.saveGraphicsState();
      pdf.setGState(new (pdf as any).GState({ opacity: 0.06 + t * 0.9 }));
      toHexFill(pdf, NAVY_TOP);
      pdf.rect(0, y, W, (H - startY) / bands + 2);
      pdf.restoreGraphicsState();
    }
    // lock badge
    const lx = cx;
    const ly = contentBottom - 2;
    drawRoundedRgba(pdf, lx - 44, ly - 18, 88, 36, 20, BRAND, 0.16, true);
    toHexDraw(pdf, BRAND);
    pdf.setLineWidth(1.4);
    pdf.rect(lx - 44, ly - 18, 88, 36, "S");
    // padlock icon (drawn)
    const pCx = lx - 26;
    toHexDraw(pdf, BRAND);
    pdf.setLineWidth(1.6);
    pdf.circle(pCx, ly - 10, 6, "S");
    pdf.line(pCx, ly - 16, pCx, ly - 17);
    pdf.line(pCx, ly - 4, pCx, ly - 9);
    sans(pdf, "bold", 9);
    toHexText(pdf, TEXT);
    pdf.text("Unlock the full certificate", lx + 6, ly - 2, { align: "left" });
  } else {
    /* ---- Divider ---- */
    const divY = Math.max(afterCourseY + para.length * 12 + 16, M + 210);
    toHexDraw(pdf, BRAND);
    pdf.setGState(new (pdf as any).GState({ opacity: 0.4 }));
    pdf.setLineWidth(0.8);
    pdf.line(M + 10, divY, W - M - 10, divY);
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

    /* ---- Stats row (professional tiles) ---- */
    const statsY = divY + 18;
    const boxW = (W - M * 2 - 14 * 3) / 4;
    const boxH = 42;
    const stats = [
      { label: "OVERALL SCORE", value: `${data.grade.percentage}%`, accent: true },
      { label: "GRADE", value: data.grade.grade, accent: true },
      { label: "ENGLISH LEVEL", value: data.grade.englishLevel.split(" ")[0], accent: false },
      { label: "QUIZZES DONE", value: `${data.grade.completedQuizzes ?? "—"}/${data.grade.totalQuizzes ?? "—"}`, accent: true },
    ];

    stats.forEach((s, i) => {
      const x = M + i * (boxW + 14);
      drawRoundedRgba(pdf, x, statsY, boxW, boxH, 8, TILE, 1, true);
      drawRoundedRgba(pdf, x + boxW / 2 - 18, statsY, 36, 3, 1.5, BRAND, s.accent ? 0.85 : 0.3, true);

      sans(pdf, "bold", 6.5);
      toHexText(pdf, MUTED);
      pdf.text(s.label, x + boxW / 2, statsY + 14, { align: "center" });

      sans(pdf, "bold", 15);
      toHexText(pdf, s.accent ? BRAND_STRONG : TEXT);
      pdf.text(s.value, x + boxW / 2, statsY + 32, { align: "center" });
    });

    /* ---- Bottom row: verified (left) + QR + date (right) ---- */
    const bottomY = H - M - 20;
    sans(pdf, "bold", 8);
    toHexText(pdf, BRAND);
    pdf.text("✓  VERIFIED", M + 10, bottomY - 16, { align: "left" });
    sans(pdf, "normal", 7.5);
    toHexText(pdf, MUTED);
    pdf.text(
      pdf.splitTextToSize(
        "Digitally issued & verified by FlyBridge Education Group. Scan to confirm authenticity.",
        tW * 0.55
      ),
      M + 10,
      bottomY - 6,
      { align: "left" }
    );

    if (qr) {
      const qrBox = 58;
      const qrX = W - M - 10 - qrBox;
      const qrY = bottomY - qrBox - 10;
      try {
        pdf.addImage(qr, "PNG", qrX, qrY, qrBox, qrBox);
      } catch {
        /* qr failed */
      }
      toHexDraw(pdf, BORDER);
      pdf.setLineWidth(1);
      pdf.rect(qrX, qrY, qrBox, qrBox);

      sans(pdf, "bold", 6);
      toHexText(pdf, MUTED);
      pdf.text("COMPLETION DATE", qrX - 14, qrY + 8, { align: "right" });
      sans(pdf, "bold", 9.5);
      toHexText(pdf, TEXT);
      pdf.text(
        data.issuedAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        qrX - 14,
        qrY + 20,
        { align: "right" }
      );
    }

    /* ---- Email caption (bottom center) ---- */
    sans(pdf, "normal", 7.5);
    toHexText(pdf, MUTED);
    pdf.text(data.userEmail || "", cx, H - 16, { align: "center" });
  }

  pdf.save(`FlyBridge-Certificate-${data.courseSlug || "course"}.pdf`);
}
