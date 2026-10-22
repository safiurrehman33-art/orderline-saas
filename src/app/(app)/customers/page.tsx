import Link from "next/link";
import { listCustomers } from "@/lib/actions/customers";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
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
  return qs ? `/customers?${qs}` : "/customers";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "customers:write");

  const q = sp.q?.trim() ?? "";
  const status = (sp.status as "active" | "archived" | "all") || "active";
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;
  const sort = (sp.sort as "name" | "createdAt" | "company") || "createdAt";
  const dir = (sp.dir as "asc" | "desc") || "desc";

  const result = await listCustomers({ q, status, page, sort, dir });

  function sortHref(column: typeof sort) {
    const nextDir =
      sort === column && dir === "asc" ? "desc" : "asc";
    return listHref({
      q: q || undefined,
      status: status !== "active" ? status : undefined,
      sort: column,
      dir: nextDir,
      page: "1",
    });
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customer records linked to orders."
        actionHref={canWrite ? "/customers/new" : undefined}
        actionLabel={canWrite ? "New customer" : undefined}
      >
        <a href="/api/export/customers">
          <Button variant="secondary">Export CSV</Button>
        </a>
      </PageHeader>

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Input
            name="q"
            label="Search"
            placeholder="Name, email, company…"
            defaultValue={q}
            className="min-w-[200px] flex-1"
          />
          <Select
            name="status"
            label="Status"
            defaultValue={status}
            options={[
              { label: "Active", value: "active" },
              { label: "Archived", value: "archived" },
              { label: "All", value: "all" },
            ]}
            className="w-full sm:w-40"
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
          title="No customers found"
          description={
            q || status !== "active"
              ? "Try adjusting your filters or search query."
              : "Add your first customer to start linking orders."
          }
          actionHref={canWrite ? "/customers/new" : undefined}
          actionLabel={canWrite ? "New customer" : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-background/50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <Link href={sortHref("name")} className="hover:text-accent">
                      Name {sort === "name" ? (dir === "asc" ? "↑" : "↓") : ""}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">
                    <Link href={sortHref("company")} className="hover:text-accent">
                      Company{" "}
                      {sort === "company" ? (dir === "asc" ? "↑" : "↓") : ""}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((customer) => (
                  <tr key={customer.id} className="hover:bg-accent-soft/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {customer.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {customer.company ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {customer._count.orders}
                    </td>
                    <td className="px-4 py-3">
                      {customer.archivedAt ? (
                        <Badge tone="neutral">Archived</Badge>
                      ) : (
                        <Badge tone="success">Active</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-3">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              makeHref={(p) =>
                listHref({
                  q: q || undefined,
                  status: status !== "active" ? status : undefined,
                  sort: sort !== "createdAt" ? sort : undefined,
                  dir: dir !== "desc" ? dir : undefined,
                  page: p > 1 ? String(p) : undefined,
                })
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
