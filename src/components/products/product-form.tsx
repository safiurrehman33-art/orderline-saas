"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/actions/products";
import type { ActionState } from "@/lib/actions/auth";
import { formatMoney } from "@/lib/utils";

export type ProductFormValues = {
  name: string;
  sku: string;
  description?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  costCents?: number | null;
  currency: string;
  stockQty: number;
  trackStock: boolean;
  active: boolean;
  sortOrder?: number;
};

type Props = {
  mode: "create" | "edit";
  product?: ProductFormValues & { id: string };
  categories: { id: string; name: string }[];
};

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "CAD", value: "CAD" },
];

export function ProductForm({ mode, product, categories }: Props) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createProductAction
      : updateProductAction.bind(null, product!.id);

  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") router.push("/products");
      else router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, mode, router]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="rounded-xl border border-line bg-surface p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Name"
          required
          defaultValue={product?.name ?? ""}
          error={state.fieldErrors?.name?.[0]}
          className="sm:col-span-2"
        />
        <Input
          name="sku"
          label="SKU"
          required
          defaultValue={product?.sku ?? ""}
          error={state.fieldErrors?.sku?.[0]}
        />
        <Select
          name="categoryId"
          label="Category"
          defaultValue={product?.categoryId ?? ""}
          options={[
            { label: "Uncategorized", value: "" },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
        <Input
          name="price"
          label="Price"
          required
          inputMode="decimal"
          placeholder="19.99"
          defaultValue={product ? centsToInput(product.priceCents) : ""}
          error={state.fieldErrors?.price?.[0]}
        />
        <Input
          name="cost"
          label="Cost (optional)"
          inputMode="decimal"
          defaultValue={
            product?.costCents != null ? centsToInput(product.costCents) : ""
          }
        />
        <Select
          name="currency"
          label="Currency"
          defaultValue={product?.currency ?? "USD"}
          options={CURRENCY_OPTIONS}
        />
        <Input
          name="stockQty"
          label="Stock quantity"
          type="number"
          min={0}
          defaultValue={String(product?.stockQty ?? 0)}
        />
        <Input
          name="sortOrder"
          label="POS sort order"
          type="number"
          defaultValue={String(product?.sortOrder ?? 0)}
        />
        <Input
          name="image"
          type="file"
          label="Product image"
          accept="image/*"
          className="sm:col-span-2"
        />
        {product?.imageUrl ? (
          <div className="sm:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt=""
              className="h-28 w-28 rounded-lg object-cover"
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="clearImage" value="on" />
              Remove current image
            </label>
          </div>
        ) : null}
        <Textarea
          name="description"
          label="Description"
          defaultValue={product?.description ?? ""}
          className="sm:col-span-2"
        />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="hidden" name="trackStock" value="off" />
            <input
              type="checkbox"
              name="trackStock"
              value="on"
              defaultChecked={product?.trackStock ?? false}
            />
            Track inventory
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="hidden" name="active" value="off" />
            <input
              type="checkbox"
              name="active"
              value="on"
              defaultChecked={product?.active ?? true}
            />
            Active on POS
          </label>
        </div>
      </div>

      {product ? (
        <p className="mt-4 text-xs text-muted">
          List price preview: {formatMoney(product.priceCents, product.currency)}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
