/**
 * csv-export.ts — Simple CSV export utility.
 * Generates a CSV from an array of objects and triggers a download.
 */

export function exportToCsv(
  filename: string,
  rows: Record<string, string | number | boolean | undefined | null>[],
  columns?: { key: string; label: string }[]
): void {
  if (rows.length === 0) return;

  const keys = columns?.map((c) => c.key) ?? Object.keys(rows[0]);
  const headers = columns?.map((c) => c.label) ?? keys;

  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) => keys.map((k) => escape(row[k])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
