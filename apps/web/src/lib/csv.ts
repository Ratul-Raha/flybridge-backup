export type CsvValue = string | number | boolean | null | undefined;

export function csvEscape(value: CsvValue): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]): void {
  const csv = buildCsv(headers, rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function csvFilename(prefix: string): string {
  return `flybridge-${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}

/**
 * Minimal CSV parser that handles quoted fields, embedded commas, escaped
 * quotes and CRLF/CR/LF line endings. Returns an array of objects keyed by the
 * first (header) row, or `null` if the input has no usable rows.
 */
export function parseCsv(text: string): Record<string, string>[] | null {
  if (!text || typeof text !== "string") return null;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };

  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushRow();
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) pushRow();

  if (rows.length === 0) return null;
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const obj: Record<string, string> = {};
    headers.forEach((h, c) => {
      if (h) obj[h] = (rows[r][c] ?? "").trim();
    });
    if (Object.keys(obj).some((k) => obj[k] !== "")) out.push(obj);
  }
  return out.length ? out : null;
}
