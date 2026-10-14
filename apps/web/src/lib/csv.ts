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
