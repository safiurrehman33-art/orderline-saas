export type PricingConfig = {
  taxEnabled: boolean;
  salesTaxPercent: number;
  vatPercent: number;
  serviceChargePercent: number;
  pricesIncludeTax: boolean;
};

export type OrderTotals = {
  subtotalCents: number;
  salesTaxCents: number;
  vatCents: number;
  serviceCents: number;
  taxCents: number;
  totalCents: number;
};

export function roundCents(value: number) {
  return Math.max(0, Math.round(value));
}

export function computeOrderTotals(
  subtotalCents: number,
  pricing: PricingConfig,
): OrderTotals {
  const subtotal = Math.max(0, Math.round(subtotalCents));

  if (!pricing.taxEnabled) {
    return {
      subtotalCents: subtotal,
      salesTaxCents: 0,
      vatCents: 0,
      serviceCents: 0,
      taxCents: 0,
      totalCents: subtotal,
    };
  }

  const sales = Math.max(0, pricing.salesTaxPercent);
  const vat = Math.max(0, pricing.vatPercent);
  const service = Math.max(0, pricing.serviceChargePercent);
  const combined = sales + vat + service;

  // Menu prices already include tax — back out the tax portion for display only.
  if (pricing.pricesIncludeTax && combined > 0) {
    const net = roundCents(subtotal / (1 + combined / 100));
    const taxTotal = subtotal - net;
    const salesTaxCents = roundCents(taxTotal * (sales / combined));
    const vatCents = roundCents(taxTotal * (vat / combined));
    const serviceCents = Math.max(0, taxTotal - salesTaxCents - vatCents);
    return {
      subtotalCents: net,
      salesTaxCents,
      vatCents,
      serviceCents,
      taxCents: taxTotal,
      totalCents: subtotal,
    };
  }

  const salesTaxCents = roundCents((subtotal * sales) / 100);
  const vatCents = roundCents((subtotal * vat) / 100);
  const serviceCents = roundCents((subtotal * service) / 100);
  const taxCents = salesTaxCents + vatCents + serviceCents;

  return {
    subtotalCents: subtotal,
    salesTaxCents,
    vatCents,
    serviceCents,
    taxCents,
    totalCents: subtotal + taxCents,
  };
}

export function pricingFromOrg(org: {
  taxEnabled: boolean;
  salesTaxPercent: number;
  vatPercent: number;
  serviceChargePercent: number;
  pricesIncludeTax: boolean;
}): PricingConfig {
  return {
    taxEnabled: org.taxEnabled,
    salesTaxPercent: org.salesTaxPercent,
    vatPercent: org.vatPercent,
    serviceChargePercent: org.serviceChargePercent,
    pricesIncludeTax: org.pricesIncludeTax,
  };
}
