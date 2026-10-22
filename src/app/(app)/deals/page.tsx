import Image from "next/image";
import Link from "next/link";
import { listDeals } from "@/lib/actions/deals";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Deals" };

export default async function DealsPage() {
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "products:write");
  const deals = await listDeals();

  return (
    <>
      <PageHeader
        title="Deals"
        description="Create and edit value combos for the POS."
        actionHref={canWrite ? "/deals/new" : undefined}
        actionLabel={canWrite ? "New deal" : undefined}
      >
        <Link href="/pos">
          <Button variant="secondary">Open POS</Button>
        </Link>
      </PageHeader>

      {deals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description="Create a combo with included products and a deal price."
          actionHref={canWrite ? "/deals/new" : undefined}
          actionLabel={canWrite ? "New deal" : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => {
            const save =
              deal.compareAtCents != null
                ? deal.compareAtCents - deal.priceCents
                : 0;
            return (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="overflow-hidden rounded-xl border border-line bg-surface transition hover:border-accent/40"
              >
                <div className="relative aspect-[16/10] bg-line/40">
                  {deal.imageUrl ? (
                    <Image
                      src={deal.imageUrl}
                      alt={deal.name}
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold">{deal.name}</h2>
                    <Badge tone={deal.active ? "danger" : "neutral"}>
                      {deal.active ? "Live" : "Off"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {deal.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <p className="text-xl font-bold text-accent">
                      {formatMoney(deal.priceCents)}
                    </p>
                    {deal.compareAtCents ? (
                      <p className="text-sm text-muted line-through">
                        {formatMoney(deal.compareAtCents)}
                      </p>
                    ) : null}
                    {save > 0 ? (
                      <Badge tone="success">Save {formatMoney(save)}</Badge>
                    ) : null}
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-muted">
                    {deal.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.product.name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-medium text-accent">
                    Click to edit →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
