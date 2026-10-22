"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportReportCsv,
  exportReportExcel,
  exportReportPdf,
} from "@/lib/reports/export";
import type { ReportColumn, ReportRow } from "@/lib/reports/types";

export function ReportExportBar({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}) {
  const [busy, setBusy] = useState<"csv" | "excel" | "pdf" | null>(null);

  function run(kind: "csv" | "excel" | "pdf") {
    if (!rows.length) {
      toast.error("No rows to export for this range.");
      return;
    }
    setBusy(kind);
    try {
      if (kind === "csv") exportReportCsv(title, columns, rows);
      if (kind === "excel") exportReportExcel(title, columns, rows);
      if (kind === "pdf") exportReportPdf(title, columns, rows, subtitle);
      toast.success(`${kind.toUpperCase()} export ready`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
        <Download className="h-3.5 w-3.5" />
        Export
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => run("csv")}
      >
        <FileText className="h-3.5 w-3.5" />
        {busy === "csv" ? "…" : "CSV"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => run("excel")}
      >
        <Sheet className="h-3.5 w-3.5" />
        {busy === "excel" ? "…" : "Excel"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => run("pdf")}
      >
        <FileText className="h-3.5 w-3.5" />
        {busy === "pdf" ? "…" : "PDF"}
      </Button>
    </div>
  );
}
