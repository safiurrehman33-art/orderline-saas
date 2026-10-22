import { listActivity } from "@/lib/actions/activity";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ActivityItem } from "@/components/activity/activity-item";

export const metadata = { title: "Activity" };

type SearchParams = {
  q?: string;
  entityType?: string;
  page?: string;
};

function listHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `/activity?${qs}` : "/activity";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const entityType = sp.entityType ?? "all";
  const page = Number.parseInt(sp.page ?? "1", 10) || 1;

  const result = await listActivity({ q, entityType, page, pageSize: 25 });

  return (
    <>
      <PageHeader
        title="Activity"
        description="Tenant audit trail for customers, products, orders, and settings."
      />

      <div className="mb-6 rounded-xl border border-line bg-surface p-4">
        <form
          method="get"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <Input
            name="q"
            label="Search"
            placeholder="Action, actor, summary…"
            defaultValue={q}
            className="min-w-[200px] flex-1"
          />
          <Select
            name="entityType"
            label="Entity"
            defaultValue={entityType}
            options={[
              { label: "All", value: "all" },
              { label: "Customers", value: "customer" },
              { label: "Categories", value: "category" },
              { label: "Products", value: "product" },
              { label: "Tables", value: "table" },
              { label: "Orders", value: "order" },
              { label: "Members", value: "member" },
              { label: "Organization", value: "organization" },
              { label: "Users / auth", value: "user" },
            ]}
            className="w-full sm:w-48"
          />
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Create customers, products, or orders to start building the audit trail."
        />
      ) : (
        <section className="rounded-xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {result.items.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              makeHref={(p) =>
                listHref({
                  q: q || undefined,
                  entityType: entityType !== "all" ? entityType : undefined,
                  page: String(p),
                })
              }
            />
          </div>
        </section>
      )}
    </>
  );
}
