import { PageHeader } from "@/components/ui/page-header";
import { CategoryForm } from "@/components/categories/category-form";
import { requirePermission } from "@/lib/tenant";

export const metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requirePermission("categories:write");
  return (
    <>
      <PageHeader title="New category" description="Add a POS menu group." />
      <CategoryForm mode="create" />
    </>
  );
}
