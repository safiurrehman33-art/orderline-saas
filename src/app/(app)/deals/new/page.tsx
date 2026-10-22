import { PageHeader } from "@/components/ui/page-header";
import { DealForm } from "@/components/deals/deal-form";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";

export const metadata = { title: "New deal" };

export default async function NewDealPage() {
  const tenant = await requirePermission("products:write");
  const products = await db.product.findMany({
    where: {
      organizationId: tenant.organizationId,
      archivedAt: null,
      active: true,
      NOT: { sku: { startsWith: "DEAL-" } },
    },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, sku: true, priceCents: true },
  });

  return (
    <>
      <PageHeader
        title="New deal"
        description="Build a combo with included products and a discounted price."
      />
      {products.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
          Add menu products first, then create deals from them.
        </p>
      ) : (
        <DealForm mode="create" products={products} />
      )}
    </>
  );
}
