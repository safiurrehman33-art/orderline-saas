import { PageHeader } from "@/components/ui/page-header";
import { TableForm } from "@/components/tables/table-form";
import { requirePermission } from "@/lib/tenant";

export const metadata = { title: "New table" };

export default async function NewTablePage() {
  await requirePermission("tables:write");
  return (
    <>
      <PageHeader title="New table" description="Add seating for dine-in." />
      <TableForm mode="create" />
    </>
  );
}
