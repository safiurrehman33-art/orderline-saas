import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/products/product-form";
import { ProductActions } from "@/components/products/product-actions";
import { Badge } from "@/components/ui/badge";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "products:write");
  const canDeletePerm = can(tenant.role, "products:delete");

  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        _count: { select: { orderItems: true } },
        category: { select: { name: true } },
      },
    }),
    db.category.findMany({
      where: { organizationId: tenant.organizationId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}${product.category ? ` · ${product.category.name}` : ""}`}
      >
        {product.archivedAt ? (
          <Badge tone="neutral">Archived</Badge>
        ) : product.active ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="warning">Inactive</Badge>
        )}
        {canDeletePerm || canWrite ? (
          <ProductActions
            productId={product.id}
            active={product.active}
            archived={Boolean(product.archivedAt)}
            canDelete={product._count.orderItems === 0}
          />
        ) : null}
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Price</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatMoney(product.priceCents, product.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Stock</p>
          <p className="text-lg font-semibold tabular-nums">
            {product.trackStock ? product.stockQty : "Not tracked"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-muted">Used on orders</p>
          <p className="text-lg font-semibold tabular-nums">
            {product._count.orderItems}
          </p>
        </div>
      </div>

      {canWrite && !product.archivedAt ? (
        <ProductForm mode="edit" product={product} categories={categories} />
      ) : (
        <div className="rounded-xl border border-line bg-surface p-6 text-sm text-muted">
          {product.description ?? "No description."}
        </div>
      )}
    </>
  );
}
