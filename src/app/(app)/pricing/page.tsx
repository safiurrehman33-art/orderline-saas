import { PageHeader } from "@/components/ui/page-header";
import { PricingForm } from "@/components/pricing/pricing-form";
import { updateSmartPricingAction } from "@/lib/actions/organization";
import { getSmartPricingSettings } from "@/lib/data/pricing";
import { can } from "@/lib/permissions";

export const metadata = { title: "Smart Pricing" };

export default async function PricingPage() {
  const { tenant, organization } = await getSmartPricingSettings();
  const canWrite = can(tenant.role, "pricing:write");

  return (
    <div>
      <PageHeader
        title="Smart Pricing"
        description="Configure sales tax, VAT, and service charge. Rates apply automatically on POS and new orders."
      />

      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-sm">
        {canWrite ? (
          <PricingForm
            action={updateSmartPricingAction}
            defaults={{
              taxEnabled: organization.taxEnabled,
              salesTaxPercent: organization.salesTaxPercent,
              vatPercent: organization.vatPercent,
              serviceChargePercent: organization.serviceChargePercent,
              pricesIncludeTax: organization.pricesIncludeTax,
            }}
          />
        ) : (
          <div className="space-y-3 text-sm">
            <p>
              Smart Pricing:{" "}
              <strong>{organization.taxEnabled ? "On" : "Off"}</strong>
            </p>
            <p>Sales tax: {organization.salesTaxPercent}%</p>
            <p>VAT: {organization.vatPercent}%</p>
            <p>Service charge: {organization.serviceChargePercent}%</p>
            <p className="text-muted">
              You need ADMIN or OWNER to edit pricing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
