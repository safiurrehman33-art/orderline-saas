"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { ReportColumn, ReportRow } from "@/lib/reports/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function cellValue(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value);
}

export function exportReportCsv(
  title: string,
  columns: ReportColumn[],
  rows: ReportRow[],
) {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${cellValue(row[c.key]).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${slug(title)}.csv`,
  );
}

export function exportReportExcel(
  title: string,
  columns: ReportColumn[],
  rows: ReportRow[],
) {
  const data = [
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => cellValue(row[c.key]))),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, title.slice(0, 31) || "Report");
  XLSX.writeFile(book, `${slug(title)}.xlsx`);
}

export function exportReportPdf(
  title: string,
  columns: ReportColumn[],
  rows: ReportRow[],
  subtitle?: string,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 40, 58);
  }
  autoTable(doc, {
    startY: subtitle ? 70 : 55,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => cellValue(row[c.key]))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [15, 107, 76] },
    alternateRowStyles: { fillColor: [245, 248, 246] },
  });
  doc.save(`${slug(title)}.pdf`);
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "report"
  );
}
