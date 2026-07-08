// Exportación CSV client-side, sin dependencias, compatible con Excel es-CL.
// Usa separador ';' y prefijo BOM UTF-8 para que Excel abra los acentos correctamente.

function escapeCell(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(
  headers: string[],
  rows: (string | number)[][]
): string {
  const lines = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(";"))
    .join("\r\n");
  return lines;
}

export function downloadCSV(filename: string, content: string): void {
  const BOM = "﻿";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
