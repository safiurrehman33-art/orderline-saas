import Link from "next/link";
import { listTables } from "@/lib/actions/tables";
import { requireTenant } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FloorPlan } from "@/components/tables/floor-plan";

export const metadata = { title: "Tables" };

export default async function TablesPage() {
  const tenant = await requireTenant();
  const canWrite = can(tenant.role, "tables:write");
  const tables = await listTables();

  return (
    <>
      <PageHeader
        title="Floor plan"
        description="Drag cloud tables to arrange your dining room. Live status, open tickets, and seat counts."
        actionHref={canWrite ? "/tables/new" : undefined}
        actionLabel={canWrite ? "New table" : undefined}
      >
        <Link href="/pos">
          <Button variant="secondary">Open POS</Button>
        </Link>
      </PageHeader>

      {tables.length === 0 ? (
        <EmptyState
          title="No tables yet"
          description="Add tables to build your interactive floor map."
          actionHref={canWrite ? "/tables/new" : undefined}
          actionLabel={canWrite ? "New table" : undefined}
        />
      ) : (
        <FloorPlan
          canEdit={canWrite}
          tables={tables.map((table) => ({
            id: table.id,
            name: table.name,
            code: table.code,
            seats: table.seats,
            status: table.status,
            section: table.section,
            shape: table.shape,
            posX: table.posX,
            posY: table.posY,
            orders: table.orders,
          }))}
        />
      )}
    </>
  );
}
