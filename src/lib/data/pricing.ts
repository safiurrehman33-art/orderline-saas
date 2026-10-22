import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";

export async function getSmartPricingSettings() {
  const tenant = await requirePermission("pricing:read");
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
    select: {
      id: true,
      name: true,
      taxEnabled: true,
      salesTaxPercent: true,
      vatPercent: true,
      serviceChargePercent: true,
      pricesIncludeTax: true,
    },
  });
  return { tenant, organization };
}
