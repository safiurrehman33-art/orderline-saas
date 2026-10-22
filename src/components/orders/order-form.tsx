"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  createOrderAction,
  updateOrderAction,
} from "@/lib/actions/orders";
import type { ActionState } from "@/lib/actions/auth";
import { formatMoney } from "@/lib/utils";

export type OrderFormProduct = {
  id: string;
  name: string;
  sku?: string;
  priceCents?: number;
  currency?: string;
};

export type OrderFormCustomer = {
  id: string;
  name: string;
};

type LineItem = {
  key: string;
  productId: string;
  quantity: number;
};

type Props = {
  mode: "create" | "edit";
  orderId?: string;
  customers: OrderFormCustomer[];
  products: OrderFormProduct[];
  defaultCustomerId?: string | null;
  defaultNotes?: string | null;
  defaultItems?: { productId: string; quantity: number }[];
  currency?: string;
};

function newRowKey() {
  return `row-${Math.random().toString(36).slice(2, 9)}`;
}

export function OrderForm({
  mode,
  orderId,
  customers,
  products,
  defaultCustomerId,
  defaultNotes,
  defaultItems,
  currency = "USD",
}: Props) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createOrderAction
      : updateOrderAction.bind(null, orderId!);

  type OrderActionState = ActionState & { orderId?: string };
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    action,
    {},
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const [lines, setLines] = useState<LineItem[]>(() => {
    if (defaultItems?.length) {
      return defaultItems.map((item) => ({
        key: newRowKey(),
        productId: item.productId,
        quantity: item.quantity,
      }));
    }
    return [{ key: newRowKey(), productId: products[0]?.id ?? "", quantity: 1 }];
  });

  const itemsJson = JSON.stringify(
    lines
      .filter((l) => l.productId && l.quantity > 0)
      .map((l) => ({ productId: l.productId, quantity: l.quantity })),
  );

  const subtotalCents = lines.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    if (!product?.priceCents) return sum;
    return sum + product.priceCents * line.quantity;
  }, 0);

  const displayCurrency =
    productMap.get(lines.find((l) => l.productId)?.productId ?? "")?.currency ??
    currency;

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") {
        if (state.orderId) {
          router.push(`/orders/${state.orderId}`);
        } else {
          router.push("/orders");
        }
      } else {
        router.refresh();
      }
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  const customerOptions = [
    { label: "No customer", value: "" },
    ...customers.map((c) => ({ label: c.name, value: c.id })),
  ];

  const productOptions = [
    { label: "Select product…", value: "" },
    ...products.map((p) => ({
      label: p.sku ? `${p.name} (${p.sku})` : p.name,
      value: p.id,
    })),
  ];

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        key: newRowKey(),
        productId: products[0]?.id ?? "",
        quantity: 1,
      },
    ]);
  }

  function removeLine(key: string) {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.key !== key),
    );
  }

  function updateLine(key: string, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-xl border border-line bg-surface p-6 shadow-sm"
    >
      <input type="hidden" name="itemsJson" value={itemsJson} readOnly />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          name="customerId"
          label="Customer"
          defaultValue={defaultCustomerId ?? ""}
          options={customerOptions}
          error={state.fieldErrors?.customerId?.[0]}
          className="sm:col-span-2"
        />
        <Textarea
          name="notes"
          label="Order notes"
          defaultValue={defaultNotes ?? ""}
          error={state.fieldErrors?.notes?.[0]}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Line items</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Add line
          </Button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => {
            const product = productMap.get(line.productId);
            const lineTotal =
              product?.priceCents != null
                ? product.priceCents * line.quantity
                : 0;
            return (
              <div
                key={line.key}
                className="grid gap-3 rounded-lg border border-line bg-background/40 p-3 sm:grid-cols-[1fr_100px_120px_auto]"
              >
                <Select
                  label="Product"
                  value={line.productId}
                  onChange={(e) =>
                    updateLine(line.key, { productId: e.target.value })
                  }
                  options={productOptions}
                />
                <Input
                  label="Qty"
                  type="number"
                  min={1}
                  max={99999}
                  value={String(line.quantity)}
                  onChange={(e) =>
                    updateLine(line.key, {
                      quantity: Math.max(
                        1,
                        Number.parseInt(e.target.value, 10) || 1,
                      ),
                    })
                  }
                />
                <div className="flex flex-col justify-end pb-1">
                  <span className="text-xs text-muted">Line total</span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoney(
                      lineTotal,
                      product?.currency ?? displayCurrency,
                    )}
                  </span>
                </div>
                <div className="flex items-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length <= 1}
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {state.fieldErrors?.items?.[0] ? (
          <p className="mt-2 text-xs text-danger">
            {state.fieldErrors.items[0]}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end border-t border-line pt-4">
          <div className="text-right">
            <p className="text-xs text-muted">Subtotal</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatMoney(subtotalCents, displayCurrency)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create order"
              : "Update order"}
        </Button>
      </div>
    </form>
  );
}
