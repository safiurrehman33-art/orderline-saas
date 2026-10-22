import Link from "next/link";
import {
  Bike,
  CircleDollarSign,
  Package,
  ShoppingCart,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { REPORT_CATALOG } from "@/lib/reports/types";

export const metadata = { title: "Reports" };

const ICONS = {
  sales: CircleDollarSign,
  orders: ShoppingCart,
  products: Package,
  customers: Users,
  "order-types": Bike,
} as const;

export default async function ReportsPage() {
  await requirePermission("reports:read");

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales, orders, products, and customer analytics — export to CSV, Excel, or PDF."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_CATALOG.map((report) => {
          const Icon = ICONS[report.type];
          return (
            <Link
              key={report.type}
              href={`/reports/${report.type}`}
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100 group-hover:text-accent" />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                {report.title}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {report.description}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent">
                Open report →
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
