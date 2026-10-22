import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { listOrders } from "@/lib/actions/orders";
import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { CustomerActions } from "@/components/customers/customer-actions";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "customers:write");
  const canDeletePerm = can(tenant.role, "customers:delete");

  const customer = await db.customer.findFirst({
    where: { id, organizationId: tenant.organizationId },
    include: { _count: { select: { orders: true } } },
  });
  if (!customer) notFound();

  const orders = await listOrders({
    customerId: id,
    page: 1,
    pageSize: 5,
    sort: "createdAt",
    dir: "desc",
  });

  return (
    <>
      <PageHeader title={customer.name} description="Customer profile and orders.">
        {customer.archivedAt ? (
          <Badge tone="neutral">Archived</Badge>
        ) : null}
        {canDeletePerm ? (
          <CustomerActions
            customerId={customer.id}
            archived={Boolean(customer.archivedAt)}
            canDelete={customer._count.orders === 0}
          />
        ) : null}
      </PageHeader>

      {canWrite && !customer.archivedAt ? (
        <CustomerForm mode="edit" customer={customer} />
      ) : (
        <div className="rounded-xl border border-line bg-surface p-6 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted">Email</dt>
              <dd>{customer.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd>{customer.phone ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Address</dt>
              <dd>
                {[customer.addressLine1, customer.city, customer.state]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link
            href={`/orders?q=${encodeURIComponent(customer.name)}`}
            className="text-sm text-accent hover:underline"
          >
            View orders
          </Link>
        </div>
        {orders.items.length === 0 ? (
          <p className="text-sm text-muted">No orders for this customer yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.items.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(order.totalCents, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
