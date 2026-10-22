"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/auth";
import { computeOrderTotals } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";

export function PricingForm({
  action,
  defaults,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: {
    taxEnabled: boolean;
    salesTaxPercent: number;
    vatPercent: number;
    serviceChargePercent: number;
    pricesIncludeTax: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [enabled, setEnabled] = useState(defaults.taxEnabled);
  const [sales, setSales] = useState(String(defaults.salesTaxPercent));
  const [vat, setVat] = useState(String(defaults.vatPercent));
  const [service, setService] = useState(String(defaults.serviceChargePercent));
  const [inclusive, setInclusive] = useState(defaults.pricesIncludeTax);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  const preview = computeOrderTotals(10000, {
    taxEnabled: enabled,
    salesTaxPercent: Number(sales) || 0,
    vatPercent: Number(vat) || 0,
    serviceChargePercent: Number(service) || 0,
    pricesIncludeTax: inclusive,
  });

  return (
    <form action={formAction} className="space-y-5">
      <label className="flex items-center gap-3 rounded-xl border border-line bg-background px-4 py-3">
        <input
          type="checkbox"
          name="taxEnabled"
          value="on"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <span>
          <span className="block text-sm font-semibold">Enable Smart Pricing</span>
          <span className="text-xs text-muted">
            Apply tax / VAT / service charge on POS and orders
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          name="salesTaxPercent"
          label="Sales tax %"
          inputMode="decimal"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          disabled={!enabled}
        />
        <Input
          name="vatPercent"
          label="VAT %"
          inputMode="decimal"
          value={vat}
          onChange={(e) => setVat(e.target.value)}
          disabled={!enabled}
        />
        <Input
          name="serviceChargePercent"
          label="Service charge %"
          inputMode="decimal"
          value={service}
          onChange={(e) => setService(e.target.value)}
          disabled={!enabled}
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="pricesIncludeTax"
          value="on"
          checked={inclusive}
          onChange={(e) => setInclusive(e.target.checked)}
          disabled={!enabled}
        />
        Menu prices already include tax (extract for display)
      </label>

      <div className="rounded-xl border border-line bg-accent-soft/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Preview on $100.00 ticket
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatMoney(preview.subtotalCents)}</dd>
          </div>
          {preview.salesTaxCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">Sales tax</dt>
              <dd>{formatMoney(preview.salesTaxCents)}</dd>
            </div>
          ) : null}
          {preview.vatCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">VAT</dt>
              <dd>{formatMoney(preview.vatCents)}</dd>
            </div>
          ) : null}
          {preview.serviceCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">Service</dt>
              <dd>{formatMoney(preview.serviceCents)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(preview.totalCents)}</dd>
          </div>
        </dl>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Smart Pricing"}
      </Button>
    </form>
  );
}
