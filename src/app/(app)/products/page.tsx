import Link from "next/link";
import { listProducts } from "@/lib/actions/products";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SearchParams = {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

function listHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "products:write");

  const q = sp.q?.trim() ?? "";
  const status =
    (sp.status as "active" | "inactive" | "archived" | "all") || "active";
  const categoryId = sp.categoryId?.trim() ?? "";
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;
  const sort =
    (sp.sort as "name" | "sku" | "priceCents" | "createdAt" | "stockQty") ||
    "createdAt";
  const dir = (sp.dir as "asc" | "desc") || "desc";

  const result = await listProducts({
    q,
    status,
    categoryId: categoryId || undefined,
    page,
    sort,
    dir,
  });

  function sortHref(column: typeof sort) {
    const nextDir = sort === column && dir === "asc" ? "desc" : "asc";
    return listHref({
      q: q || undefined,
      status: status !== "active" ? status : undefined,
      categoryId: categoryId || undefined,
      sort: column,
      dir: nextDir,
      page: "1",
    });
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Menu catalog with images, categories, and inventory."
        actionHref={canWrite ? "/products/new" : undefined}
        actionLabel={canWrite ? "New product" : undefined}
      >
        <Link href="/pos">
          <Button variant="secondary">Open POS</Button>
        </Link>
        <a href="/api/export/products">
          <Button variant="secondary">Export CSV</Button>
        </a>
      </PageHeader>

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        <form
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <Input
            name="q"
            label="Search"
            placeholder="Name, SKU, category…"
            defaultValue={q}
            className="min-w-[200px] flex-1"
          />
          <Select
            name="status"
            label="Status"
            defaultValue={status}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Archived", value: "archived" },
              { label: "All", value: "all" },
            ]}
            className="w-full sm:w-40"
          />
          <Select
            name="categoryId"
            label="Category"
            defaultValue={categoryId}
            options={[
              { label: "All categories", value: "" },
              ...result.categories.map((c) => ({ label: c.name, value: c.id })),
            ]}
            className="w-full sm:w-44"
          />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Add menu items with photos for the POS grid."
          actionHref={canWrite ? "/products/new" : undefined}
          actionLabel={canWrite ? "New product" : undefined}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-background/70 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">
                    <Link href={sortHref("sku")}>SKU</Link>
                  </th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">
                    <Link href={sortHref("priceCents")}>Price</Link>
                  </th>
                  <th className="px-4 py-3">
                    <Link href={sortHref("stockQty")}>Stock</Link>
                  </th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((product) => (
                  <tr key={product.id} className="hover:bg-accent-soft/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/products/${product.id}`}
                        className="flex items-center gap-3 font-medium hover:text-accent"
                      >
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-line/50 text-[10px] text-muted">
                            N/A
                          </span>
                        )}
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatMoney(product.priceCents, product.currency)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {product.trackStock ? product.stockQty : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {product.archivedAt ? (
                        <Badge tone="neutral">Archived</Badge>
                      ) : product.active ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="warning">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            makeHref={(p) =>
              listHref({
                q: q || undefined,
                status: status !== "active" ? status : undefined,
                categoryId: categoryId || undefined,
                sort,
                dir,
                page: String(p),
              })
            }
          />
        </>
      )}
    </>
  );
}
