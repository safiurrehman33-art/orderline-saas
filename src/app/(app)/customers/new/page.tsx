import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader
        title="New customer"
        description="Add a customer record for your organization."
      />
      <CustomerForm mode="create" />
    </>
  );
}
