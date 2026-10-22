import Link from "next/link";
import { listCategories } from "@/lib/actions/categories";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "categories:write");
  const categories = await listCategories(true);

  return (
    <>
      <PageHeader
        title="Categories"
        description="Menu groups for the POS (Burgers, Drinks, Sides…)."
        actionHref={canWrite ? "/categories/new" : undefined}
        actionLabel={canWrite ? "New category" : undefined}
      />

      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create categories to organize your restaurant menu."
          actionHref={canWrite ? "/categories/new" : undefined}
          actionLabel={canWrite ? "New category" : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="rounded-xl border border-line bg-surface p-4 transition hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-lg"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-muted">
                      {category._count.products} products
                    </p>
                  </div>
                </div>
                <Badge tone={category.active ? "success" : "neutral"}>
                  {category.active ? "Active" : "Hidden"}
                </Badge>
              </div>
              {category.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">
                  {category.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      {!canWrite ? (
        <p className="mt-4 text-sm text-muted">Read-only for your role.</p>
      ) : (
        <div className="mt-6">
          <Link href="/pos">
            <Button variant="secondary">Open POS</Button>
          </Link>
        </div>
      )}
    </>
  );
}
