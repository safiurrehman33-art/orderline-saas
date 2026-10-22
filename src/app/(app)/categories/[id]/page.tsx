import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryActions } from "@/components/categories/category-actions";
import { can } from "@/lib/permissions";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requirePermission("categories:read");
  const category = await db.category.findFirst({
    where: { id, organizationId: tenant.organizationId },
  });
  if (!category) notFound();

  return (
    <>
      <PageHeader title={category.name} description="Edit menu category.">
        {can(tenant.role, "categories:delete") ? (
          <CategoryActions categoryId={category.id} />
        ) : null}
      </PageHeader>
      {can(tenant.role, "categories:write") ? (
        <CategoryForm mode="edit" category={category} />
      ) : (
        <p className="text-sm text-muted">Read-only access.</p>
      )}
    </>
  );
}
