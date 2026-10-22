import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { DealForm } from "@/components/deals/deal-form";
import { DealActions } from "@/components/deals/deal-actions";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requirePermission("products:read");

  const [deal, products] = await Promise.all([
    db.deal.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: { items: true },
    }),
    db.product.findMany({
      where: {
        organizationId: tenant.organizationId,
        archivedAt: null,
        NOT: { sku: { startsWith: "DEAL-" } },
      },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, sku: true, priceCents: true },
    }),
  ]);

  if (!deal) notFound();

  return (
    <>
      <PageHeader title={deal.name} description="Edit combo deal for POS.">
        {can(tenant.role, "products:delete") ? (
          <DealActions dealId={deal.id} />
        ) : null}
      </PageHeader>

      {can(tenant.role, "products:write") ? (
        <DealForm
          mode="edit"
          products={products}
          deal={{
            id: deal.id,
            name: deal.name,
            description: deal.description,
            priceCents: deal.priceCents,
            compareAtCents: deal.compareAtCents,
            sortOrder: deal.sortOrder,
            active: deal.active,
            imageUrl: deal.imageUrl,
            items: deal.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          }}
        />
      ) : (
        <p className="text-sm text-muted">Read-only access.</p>
      )}
    </>
  );
}
