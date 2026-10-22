import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ReportExportBar } from "@/components/reports/report-export-bar";
import { ReportTable } from "@/components/reports/report-table";
import {
  getReportDefinition,
  REPORT_TYPES,
  type ReportType,
} from "@/lib/reports/types";
import { buildReportRows, parseReportRange } from "@/lib/reports/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const def = getReportDefinition(type);
  return { title: def?.title ?? "Report" };
}

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const tenant = await requirePermission("reports:read");
  const { type } = await params;
  const sp = await searchParams;

  if (!REPORT_TYPES.includes(type as ReportType)) notFound();
  const def = getReportDefinition(type);
  if (!def) notFound();

  const range = parseReportRange(sp.from, sp.to);
  const rows = await buildReportRows(
    tenant.organizationId,
    type as ReportType,
    range,
  );

  const fromValue = range.from.toISOString().slice(0, 10);
  const toValue = range.to.toISOString().slice(0, 10);
  const subtitle = `${fromValue} → ${toValue} · ${tenant.organizationName}`;

  return (
    <div>
      <PageHeader title={def.title} description={def.description}>
        <Link href="/reports">
          <Button variant="outline" size="sm">
            All reports
          </Button>
        </Link>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
        <form className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">From</span>
            <input
              type="date"
              name="from"
              defaultValue={fromValue}
              className="h-10 rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted">To</span>
            <input
              type="date"
              name="to"
              defaultValue={toValue}
              className="h-10 rounded-lg border border-line bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <Button type="submit" size="sm">
            Apply range
          </Button>
        </form>

        <ReportExportBar
          title={def.title}
          subtitle={subtitle}
          columns={def.columns}
          rows={rows}
        />
      </div>

      <ReportTable columns={def.columns} rows={rows} />
    </div>
  );
}
