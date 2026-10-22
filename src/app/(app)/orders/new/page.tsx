import { db } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { OrderForm } from "@/components/orders/order-form";

export default async function NewOrderPage() {
  const tenant = await requireTenant();

  const [customers, products] = await Promise.all([
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
        active: true,
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
  ]);

  return (
    <>
      <PageHeader
        title="New order"
        description="Build a draft order with line items and optional customer."
      />
      <OrderForm mode="create" customers={customers} products={products} />
    </>
  );
}
