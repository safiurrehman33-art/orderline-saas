import type { ReportColumn, ReportRow } from "@/lib/reports/types";

export function ReportTable({
  columns,
  rows,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-surface px-5 py-12 text-center text-sm text-muted">
        No data for this date range.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="scroll-light max-h-[65vh] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-accent-soft/80 backdrop-blur">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-accent"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-accent-soft/30">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-foreground"
                  >
                    {row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-4 py-2 text-xs text-muted">
        {rows.length} row{rows.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
