import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/products/product-form";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";

export default async function NewProductPage() {
  const tenant = await requirePermission("products:write");
  const categories = await db.category.findMany({
    where: { organizationId: tenant.organizationId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="New product"
        description="Add a menu item with image and category."
      />
      <ProductForm mode="create" categories={categories} />
    </>
  );
}
