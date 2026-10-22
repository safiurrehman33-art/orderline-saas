import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { PageHeader } from "@/components/ui/page-header";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { OrderForm } from "@/components/orders/order-form";
import { OrderActions } from "@/components/orders/order-actions";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "orders:write");
  const canDelete = can(tenant.role, "orders:delete");
  const canTransition = can(tenant.role, "orders:transition");

  const order = await db.order.findFirst({
    where: { id, organizationId: tenant.organizationId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { orderBy: { productName: "asc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const editable =
    canWrite && (order.status === "DRAFT" || order.status === "PENDING");

  const [customers, products] = editable
    ? await Promise.all([
        db.customer.findMany({
          where: {
            organizationId: tenant.organizationId,
            archivedAt: null,
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        db.product.findMany({
          where: {
            organizationId: tenant.organizationId,
            archivedAt: null,
          },
          select: {
            id: true,
            name: true,
            sku: true,
            priceCents: true,
            currency: true,
          },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  const deletable =
    canDelete &&
    (order.status === "DRAFT" || order.status === "CANCELLED");

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={
          order.customer
            ? `Customer: ${order.customer.name}`
            : "No customer assigned"
        }
      >
        <OrderStatusBadge status={order.status} />
        {canTransition || canWrite ? (
          <OrderActions
            orderId={order.id}
            status={order.status}
            orderType={order.orderType}
            canDelete={deletable}
            canDuplicate={canWrite}
          />
        ) : null}
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Subtotal</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(order.subtotalCents || order.totalCents, order.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Tax / charges</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatMoney(order.taxCents, order.currency)}
          </p>
          {(order.salesTaxCents > 0 ||
            order.vatCents > 0 ||
            order.serviceCents > 0) && (
            <p className="mt-1 text-[11px] text-muted">
              {[
                order.salesTaxCents > 0
                  ? `Sales ${formatMoney(order.salesTaxCents, order.currency)}`
                  : null,
                order.vatCents > 0
                  ? `VAT ${formatMoney(order.vatCents, order.currency)}`
                  : null,
                order.serviceCents > 0
                  ? `Service ${formatMoney(order.serviceCents, order.currency)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Total</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatMoney(order.totalCents, order.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Created</p>
          <p className="text-sm font-medium">
            {order.createdAt.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted">
            {order.items.length} line item{order.items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Line items</h2>
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {item.productSku}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMoney(item.unitCents, order.currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatMoney(item.totalCents, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Status timeline</h2>
        <ol className="relative space-y-4 border-l border-line pl-6">
          {order.statusEvents.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-surface" />
              <p className="text-sm font-medium">
                {event.fromStatus
                  ? `${ORDER_STATUS_LABELS[event.fromStatus]} → ${ORDER_STATUS_LABELS[event.toStatus]}`
                  : ORDER_STATUS_LABELS[event.toStatus]}
              </p>
              {event.note ? (
                <p className="text-sm text-muted">{event.note}</p>
              ) : null}
              <p className="text-xs text-muted">
                {event.createdAt.toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {editable ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Edit order</h2>
          <OrderForm
            mode="edit"
            orderId={order.id}
            customers={customers}
            products={products}
            defaultCustomerId={order.customerId}
            defaultNotes={order.notes}
            defaultItems={order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }))}
            currency={order.currency}
          />
        </section>
      ) : order.notes ? (
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold">Notes</h2>
          <p className="text-sm text-muted whitespace-pre-wrap">{order.notes}</p>
        </section>
      ) : null}
    </>
  );
}
