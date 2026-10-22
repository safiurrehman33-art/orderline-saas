import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { TableForm } from "@/components/tables/table-form";
import { TableActions } from "@/components/tables/table-actions";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requirePermission("tables:read");
  const table = await db.diningTable.findFirst({
    where: { id, organizationId: tenant.organizationId },
  });
  if (!table) notFound();

  return (
    <>
      <PageHeader
        title={`${table.code} · ${table.name}`}
        description={`${table.seats} seats${table.section ? ` · ${table.section}` : ""}`}
      >
        {can(tenant.role, "tables:write") ? (
          <TableActions
            tableId={table.id}
            canDelete={can(tenant.role, "tables:delete")}
          />
        ) : null}
      </PageHeader>
      {can(tenant.role, "tables:write") ? (
        <TableForm mode="edit" table={table} />
      ) : (
        <p className="text-sm text-muted">Read-only access.</p>
      )}
    </>
  );
}
