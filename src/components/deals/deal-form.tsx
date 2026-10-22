"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createDealAction, updateDealAction } from "@/lib/actions/deals";
import type { ActionState } from "@/lib/actions/auth";
import { formatMoney } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
};

type Line = { key: string; productId: string; quantity: number };

function lineKey() {
  return `l-${Math.random().toString(36).slice(2, 8)}`;
}

export function DealForm({
  mode,
  products,
  deal,
}: {
  mode: "create" | "edit";
  products: ProductOption[];
  deal?: {
    id: string;
    name: string;
    description?: string | null;
    priceCents: number;
    compareAtCents?: number | null;
    sortOrder: number;
    active: boolean;
    imageUrl?: string | null;
    items: { productId: string; quantity: number }[];
  };
}) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createDealAction
      : updateDealAction.bind(null, deal!.id);
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  const [lines, setLines] = useState<Line[]>(() => {
    if (deal?.items?.length) {
      return deal.items.map((i) => ({
        key: lineKey(),
        productId: i.productId,
        quantity: i.quantity,
      }));
    }
    return [
      {
        key: lineKey(),
        productId: products[0]?.id ?? "",
        quantity: 1,
      },
    ];
  });

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const itemsJson = JSON.stringify(
    lines
      .filter((l) => l.productId && l.quantity > 0)
      .map((l) => ({ productId: l.productId, quantity: l.quantity })),
  );

  const bundleValue = lines.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    return sum + (product?.priceCents ?? 0) * line.quantity;
  }, 0);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") router.push("/deals");
      else router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, mode, router]);

  const options = products.map((p) => ({
    label: `${p.name} (${formatMoney(p.priceCents)})`,
    value: p.id,
  }));

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-5 rounded-xl border border-line bg-surface p-6"
    >
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Deal name"
          required
          defaultValue={deal?.name ?? ""}
          className="sm:col-span-2"
        />
        <Input
          name="price"
          label="Deal price"
          required
          inputMode="decimal"
          placeholder="7.99"
          defaultValue={
            deal ? (deal.priceCents / 100).toFixed(2) : ""
          }
        />
        <Input
          name="compareAt"
          label="Was price (optional)"
          inputMode="decimal"
          placeholder="9.90"
          defaultValue={
            deal?.compareAtCents != null
              ? (deal.compareAtCents / 100).toFixed(2)
              : ""
          }
        />
        <Input
          name="sortOrder"
          type="number"
          label="Sort order"
          defaultValue={String(deal?.sortOrder ?? 0)}
        />
        <Input name="image" type="file" label="Deal image" accept="image/*" />
        <Textarea
          name="description"
          label="Description"
          defaultValue={deal?.description ?? ""}
          className="sm:col-span-2"
          placeholder="What's included…"
        />
      </div>

      {deal?.imageUrl ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deal.imageUrl}
            alt=""
            className="h-28 w-28 rounded-lg object-cover"
          />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="clearImage" value="on" />
            Remove current image
          </label>
        </div>
      ) : null}

      <div className="rounded-xl border border-line p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-medium">Included products</p>
            <p className="text-xs text-muted">
              Regular value: {formatMoney(bundleValue)}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                {
                  key: lineKey(),
                  productId: products[0]?.id ?? "",
                  quantity: 1,
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => (
            <div
              key={line.key}
              className="grid gap-2 sm:grid-cols-[1fr_100px_40px] sm:items-end"
            >
              <Select
                label="Product"
                options={options}
                value={line.productId}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key
                        ? { ...l, productId: e.target.value }
                        : l,
                    ),
                  )
                }
              />
              <Input
                label="Qty"
                type="number"
                min={1}
                value={String(line.quantity)}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key
                        ? {
                            ...l,
                            quantity: Math.max(
                              1,
                              Number.parseInt(e.target.value || "1", 10),
                            ),
                          }
                        : l,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-0.5"
                onClick={() =>
                  setLines((prev) => prev.filter((l) => l.key !== line.key))
                }
                disabled={lines.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="off" />
        <input
          type="checkbox"
          name="active"
          value="on"
          defaultChecked={deal?.active ?? true}
        />
        Active on POS
      </label>

      <Button type="submit" disabled={pending || !products.length}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create deal"
            : "Save changes"}
      </Button>
    </form>
  );
}
