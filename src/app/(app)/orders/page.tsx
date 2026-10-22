import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/client";
import { listOrders } from "@/lib/actions/orders";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SearchParams = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
};

function listHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `/orders?${qs}` : "/orders";
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "ALL" },
  ...(
    Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]
  ).map(([value, label]) => ({ label, value })),
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "orders:write");

  const q = sp.q?.trim() ?? "";
  const status = (sp.status as OrderStatus | "ALL") || "ALL";
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;

  const result = await listOrders({
    q,
    status,
    from: from || undefined,
    to: to || undefined,
    page,
    sort: "createdAt",
    dir: "desc",
  });

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track order workflow, totals, and fulfillment."
        actionHref={canWrite ? "/orders/new" : undefined}
        actionLabel={canWrite ? "New order" : undefined}
      >
        <a href="/api/export/orders">
          <Button variant="secondary">Export CSV</Button>
        </a>
      </PageHeader>

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <Input
            name="q"
            label="Search"
            placeholder="Order #, customer…"
            defaultValue={q}
            className="lg:col-span-2"
          />
          <Select
            name="status"
            label="Status"
            defaultValue={status}
            options={STATUS_OPTIONS}
          />
          <Input
            name="from"
            type="date"
            label="From"
            defaultValue={from}
          />
          <Input name="to" type="date" label="To" defaultValue={to} />
          <Button type="submit" variant="secondary" className="lg:col-span-1">
            Apply
          </Button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={
            q || status !== "ALL" || from || to
              ? "Try adjusting your filters."
              : "Create a draft order to get started."
          }
          actionHref={canWrite ? "/orders/new" : undefined}
          actionLabel={canWrite ? "New order" : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-background/50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((order) => (
                  <tr key={order.id} className="hover:bg-accent-soft/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.customer?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {order._count.items}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatMoney(order.totalCents, order.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-3">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              makeHref={(p) =>
                listHref({
                  q: q || undefined,
                  status: status !== "ALL" ? status : undefined,
                  from: from || undefined,
                  to: to || undefined,
                  page: p > 1 ? String(p) : undefined,
                })
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
