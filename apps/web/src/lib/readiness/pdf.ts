import { jsPDF } from "jspdf";
import type { ReadinessResult } from "@/lib/readiness/questions";

const INK = "#122043";
const BODY = "#5B6478";
const BRAND = "#0FA968";
const TRACK = "#EEF1F8";
const MUTED = "#9AA4BC";

function scoreColor(score: number): string {
  if (score >= 80) return BRAND;
  if (score >= 60) return "#2F5FE0";
  if (score >= 40) return "#DB8A2E";
  return "#C0392B";
}

function plainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^- \[x\]\s*/gm, "[X]  ")
    .replace(/^- \[ \]\s*/gm, "[ ]  ")
    .replace(/^[-*]\s+/gm, "•  ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/logo-light.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function sectionHeader(pdf: jsPDF, title: string, x: number, y: number) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(INK);
  pdf.text(title.toUpperCase(), x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFillColor(BRAND);
  pdf.roundedRect(x, y + 6, 26, 3, 1.5, 1.5, "F");
}

export async function generateReadinessPdf(
  result: ReadinessResult,
  report: string
): Promise<void> {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 48;
  const contentW = W - M * 2;
  let y = 0;

  pdf.setFillColor(BRAND);
  pdf.rect(0, 0, W, 6, "F");
  pdf.setFillColor(INK);
  pdf.rect(0, 6, W, 74, "F");

  const logo = await loadLogo();
  let titleX = M;
  if (logo) {
    try {
      pdf.addImage(logo, "PNG", M, 22, 42, 42);
      titleX = M + 58;
    } catch {
      // logo embed failed — fall back to text header
    }
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor("#FFFFFF");
  pdf.text("FlyBridge Education Group", titleX, 34);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor("#9FEFC9");
  pdf.text("Study Abroad Readiness Report", titleX, 52);
  pdf.setTextColor("#C9D4E8");
  pdf.text(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    W - M,
    34,
    { align: "right" }
  );

  y = 6 + 74 + 26;

  pdf.setFillColor(BRAND);
  pdf.roundedRect(M, y, contentW, 116, 14, 14, "F");
  pdf.setFillColor("#FFFFFF");
  pdf.saveGraphicsState();
  pdf.setGState(
    new (pdf as unknown as { GState: new (o: { opacity: number }) => object }).GState({
      opacity: 0.09,
    })
  );
  pdf.circle(W - M - 30, y + 6, 58, "F");
  pdf.circle(M + 34, y + 118, 52, "F");
  pdf.restoreGraphicsState();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(62);
  pdf.setTextColor("#FFFFFF");
  pdf.text(String(result.score), W / 2, y + 66, { align: "center" });
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor("#D8FFEB");
  pdf.text("/ 100", W / 2 + 48, y + 68);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(result.label, W / 2, y + 96, { align: "center" });

  y += 116 + 22;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(BODY);
  const tagline = pdf.splitTextToSize(result.tagline, contentW);
  pdf.text(tagline, M, y);
  y += tagline.length * 15 + 14;

  sectionHeader(pdf, "How you scored by area", M, y);
  y += 26;
  pdf.setFillColor(TRACK);
  for (const c of result.categories) {
    const color = scoreColor(c.pct);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(INK);
    pdf.text(c.label, M, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(color);
    pdf.text(`${c.pct}%`, W - M, y, { align: "right" });
    pdf.setFillColor(TRACK);
    pdf.roundedRect(M, y + 7, contentW, 8, 4, 4, "F");
    pdf.setFillColor(color);
    pdf.roundedRect(M, y + 7, contentW * (c.pct / 100), 8, 4, 4, "F");
    y += 32;
  }
  y += 8;

  sectionHeader(pdf, "Priority focus areas", M, y);
  y += 26;
  if (result.priorityAreas.length) {
    pdf.setFillColor(TRACK);
    for (const p of result.priorityAreas) {
      const color = scoreColor(p.pct);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(INK);
      pdf.text(p.label, M, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(color);
      pdf.text(`${p.pct}%`, W - M, y, { align: "right" });
      pdf.setFillColor(TRACK);
      pdf.roundedRect(M, y + 7, contentW, 8, 4, 4, "F");
      pdf.setFillColor(color);
      pdf.roundedRect(M, y + 7, contentW * (p.pct / 100), 8, 4, 4, "F");
      y += 32;
    }
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(BODY);
    pdf.text("No priority areas — evenly balanced across dimensions.", M, y);
    y += 24;
  }
  y += 8;

  sectionHeader(pdf, "Your readiness report", M, y);
  y += 26;

  const paragraphs = plainText(report)
    .split(/\n{2,}/)
    .filter((p) => p.trim());
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(INK);
  for (const para of paragraphs) {
    const lines = pdf.splitTextToSize(para, contentW) as string[];
    for (const line of lines) {
      if (y > H - 92) {
        pdf.addPage();
        y = 60;
      }
      pdf.text(line, M, y);
      y += 14;
    }
    y += 10;
  }

  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    const fy = H - 44;
    pdf.setDrawColor("#E7EAF2");
    pdf.setLineWidth(1);
    pdf.line(M, fy - 14, W - M, fy - 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(MUTED);
    pdf.text(
      "This score is an advisory estimate — official eligibility depends on each university and visa office.",
      M,
      fy
    );
    pdf.text(
      "FlyBridge Education Group · +1 778 676 8459 · flybridgeedu.com",
      M,
      fy + 14
    );
    pdf.text(`Page ${i} of ${pageCount}`, W - M, fy, { align: "right" });
  }

  pdf.save("FlyBridge-Readiness-Report.pdf");
}
