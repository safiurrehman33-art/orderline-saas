"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, cn } from "@/lib/utils";
import { placePosOrderAction } from "@/lib/actions/pos";
import {
  PosCustomerPicker,
  type PosCustomer,
} from "@/components/pos/pos-customer-picker";
import {
  PosReceiptModal,
  type PosReceiptPayload,
} from "@/components/pos/pos-receipt";
import { computeOrderTotals, type PricingConfig } from "@/lib/pricing";
import type { OrderType, TableStatus } from "@/generated/prisma/client";

type Category = {
  id: string;
  name: string;
  color: string;
  imageUrl: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  categoryId: string | null;
  trackStock: boolean;
  stockQty: number;
  description?: string | null;
};

type Deal = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  imageUrl: string | null;
  description: string | null;
  items: { quantity: number; productName: string }[];
};

type Table = {
  id: string;
  name: string;
  code: string;
  seats: number;
  status: TableStatus;
  section: string | null;
};

type CartLine = { productId: string; quantity: number };

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "DINE_IN", label: "Dine-in" },
  { value: "TAKEAWAY", label: "Takeaway" },
  { value: "DELIVERY", label: "Delivery" },
];

const statusTone: Record<TableStatus, string> = {
  AVAILABLE: "border-emerald-400 bg-emerald-50 text-emerald-800",
  OCCUPIED: "border-rose-400 bg-rose-50 text-rose-800",
  RESERVED: "border-amber-400 bg-amber-50 text-amber-800",
  CLEANING: "border-slate-300 bg-slate-100 text-slate-700",
};

export function PosTerminal({
  organizationName,
  categories,
  products,
  tables,
  deals,
  customers,
  pricing,
}: {
  organizationName: string;
  categories: Category[];
  products: Product[];
  tables: Table[];
  deals: Deal[];
  customers: PosCustomer[];
  pricing: PricingConfig;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState<string>("deals-first");
  const [menuQuery, setMenuQuery] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [tableId, setTableId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerList, setCustomerList] = useState<PosCustomer[]>(customers);
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [receipt, setReceipt] = useState<PosReceiptPayload | null>(null);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  useEffect(() => {
    setCustomerList(customers);
  }, [customers]);

  const dealBySku = useMemo(() => {
    const map = new Map<string, Deal>();
    for (const deal of deals) {
      map.set(`DEAL-${deal.slug.toUpperCase()}`, deal);
    }
    return map;
  }, [deals]);

  const dealsCategory = categories.find((c) => c.name === "Deals");

  const filtered = useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    let list =
      categoryId === "all"
        ? products
        : categoryId === "deals-first"
          ? products.filter(
              (p) =>
                p.categoryId === dealsCategory?.id || p.sku.startsWith("DEAL-"),
            )
          : products.filter((p) => p.categoryId === categoryId);

    // Search across the full menu when typing so any item is findable
    if (q) {
      list = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [products, categoryId, dealsCategory?.id, menuQuery]);

  const subtotal = cart.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    return sum + (product?.priceCents ?? 0) * line.quantity;
  }, 0);
  const totals = computeOrderTotals(subtotal, pricing);

  function addProduct(productId: string) {
    const product = productMap.get(productId);
    if (!product) return;
    if (product.trackStock && product.stockQty <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function setQty(productId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function clearCart() {
    setCart([]);
    setNotes("");
    setCustomerId("");
  }

  function submitOrder() {
    if (orderType === "DELIVERY" && !customerId) {
      toast.error("Select a customer for delivery.");
      return;
    }
    startTransition(async () => {
      const result = await placePosOrderAction({
        orderType,
        tableId: orderType === "DINE_IN" ? tableId || null : null,
        customerId: customerId || null,
        guestCount,
        notes,
        items: cart,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.orderNumber} sent to kitchen`);
      if (result.receipt) {
        setReceipt(result.receipt as PosReceiptPayload);
      }
      clearCart();
      setTableId("");
      router.refresh();
    });
  }

  return (
    <div className="flex h-dvh flex-col bg-[#111827] text-white">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">OrderLine POS</p>
            <p className="truncate text-xs text-white/60">{organizationName}</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={menuQuery}
            onChange={(e) => setMenuQuery(e.target.value)}
            placeholder="Search menu items, deals, SKU…"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#e11d48] focus:ring-2 focus:ring-[#e11d48]/20"
          />
          {menuQuery ? (
            <button
              type="button"
              onClick={() => setMenuQuery("")}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/kitchen"
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 hover:bg-white/15"
          >
            Kitchen
          </Link>
          {ORDER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setOrderType(type.value)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
                orderType === type.value
                  ? "bg-[#e11d48] text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/15",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_380px]">
        <section className="flex min-h-0 flex-col">
          <div className="scroll-chips flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setMenuQuery("");
                setCategoryId("deals-first");
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                categoryId === "deals-first" && !menuQuery
                  ? "bg-[#e11d48] text-white"
                  : "bg-[#e11d48]/25 text-[#fb7185]",
              )}
            >
              🔥 Deals
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuQuery("");
                setCategoryId("all");
              }}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
                categoryId === "all" && !menuQuery
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/80",
              )}
            >
              All menu
            </button>
            {categories
              .filter((c) => c.name !== "Deals")
              .map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setMenuQuery("");
                  setCategoryId(category.id);
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
                  categoryId === category.id && !menuQuery
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/80",
                )}
                style={
                  categoryId === category.id
                    ? undefined
                    : { boxShadow: `inset 0 -2px 0 ${category.color}` }
                }
              >
                {category.name}
              </button>
            ))}
          </div>

          {orderType === "DINE_IN" ? (
            <div className="border-b border-white/10 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Select table
                </p>
                <label className="flex items-center gap-2 text-xs text-white/70">
                  Guests
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={guestCount}
                    onChange={(e) =>
                      setGuestCount(Number.parseInt(e.target.value || "1", 10))
                    }
                    className="h-8 w-16 rounded-md border border-white/15 bg-white/10 px-2 text-white"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {tables.map((table) => {
                  const disabled = table.status === "OCCUPIED";
                  const selected = tableId === table.id;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setTableId(table.id)}
                      className={cn(
                        "rounded-xl border px-2 py-3 text-left transition",
                        statusTone[table.status],
                        selected && "ring-2 ring-[#e11d48] ring-offset-2 ring-offset-[#111827]",
                        disabled && "opacity-50",
                      )}
                    >
                      <p className="text-sm font-bold">{table.code}</p>
                      <p className="text-[11px]">
                        {table.seats} seats · {table.status.toLowerCase()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="scroll-dark min-h-0 flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-white/50">
                <UtensilsCrossed className="mb-3 h-10 w-10" />
                <p>
                  {menuQuery.trim()
                    ? `No items match “${menuQuery.trim()}”.`
                    : "No menu items in this category."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => {
                  const deal = dealBySku.get(product.sku);
                  const saveCents =
                    deal?.compareAtCents != null
                      ? deal.compareAtCents - deal.priceCents
                      : 0;
                  return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product.id)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
                  >
                    <div className="relative aspect-[4/3] bg-black/30">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="220px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/30">
                          <UtensilsCrossed className="h-8 w-8" />
                        </div>
                      )}
                      {saveCents > 0 ? (
                        <span className="absolute left-2 top-2 rounded-md bg-[#e11d48] px-2 py-1 text-[10px] font-bold uppercase">
                          Save {formatMoney(saveCents)}
                        </span>
                      ) : null}
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold">
                        {formatMoney(product.priceCents, product.currency)}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold leading-5">
                        {product.name}
                      </p>
                      {deal ? (
                        <>
                          {deal.compareAtCents ? (
                            <p className="mt-1 text-[11px] text-white/40 line-through">
                              {formatMoney(deal.compareAtCents)}
                            </p>
                          ) : null}
                          {deal.items.length > 0 ? (
                            <ul className="mt-2 space-y-0.5 border-t border-white/10 pt-2">
                              {deal.items.map((item, index) => (
                                <li
                                  key={`${product.id}-${item.productName}-${index}`}
                                  className="truncate text-[11px] leading-4 text-white/55"
                                >
                                  <span className="font-semibold text-[#fb7185]">
                                    {item.quantity}×
                                  </span>{" "}
                                  {item.productName}
                                </li>
                              ))}
                            </ul>
                          ) : deal.description ? (
                            <p className="mt-1 line-clamp-2 text-[11px] text-white/45">
                              {deal.description}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-1 line-clamp-1 text-[11px] text-white/45">
                          {product.description || product.sku}
                        </p>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t border-white/10 bg-[#0b1220] lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#fb7185]" />
              <p className="font-semibold">Current order</p>
            </div>
            <Badge tone="danger">{cart.length} lines</Badge>
          </div>

          <div className="scroll-dark min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {cart.length === 0 ? (
              <p className="px-1 py-10 text-center text-sm text-white/45">
                Tap menu items to build the ticket
              </p>
            ) : (
              cart.map((line) => {
                const product = productMap.get(line.productId);
                if (!product) return null;
                const deal = dealBySku.get(product.sku);
                return (
                  <div
                    key={line.productId}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/10">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-white/35">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-white/50">
                              {formatMoney(product.priceCents, product.currency)}{" "}
                              each
                            </p>
                            {deal?.items.length ? (
                              <ul className="mt-1 space-y-0.5">
                                {deal.items.map((item, index) => (
                                  <li
                                    key={`${line.productId}-inc-${index}`}
                                    className="truncate text-[10px] text-white/45"
                                  >
                                    {item.quantity}× {item.productName}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => setQty(line.productId, 0)}
                            className="shrink-0 text-white/40 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                          onClick={() => setQty(line.productId, line.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                          onClick={() => setQty(line.productId, line.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatMoney(
                          product.priceCents * line.quantity,
                          product.currency,
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-3 border-t border-white/10 p-4">
            <PosCustomerPicker
              customers={customerList}
              value={customerId}
              onChange={setCustomerId}
              onCustomersChange={setCustomerList}
              required={orderType === "DELIVERY"}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kitchen notes (no onions, extra sauce…)"
              className="min-h-16 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#e11d48]"
            />
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-white/60">
                <span>Subtotal</span>
                <span className="tabular-nums text-white/80">
                  {formatMoney(totals.subtotalCents)}
                </span>
              </div>
              {pricing.taxEnabled && totals.salesTaxCents > 0 ? (
                <div className="flex items-center justify-between text-white/55">
                  <span>Sales tax ({pricing.salesTaxPercent}%)</span>
                  <span className="tabular-nums">
                    {formatMoney(totals.salesTaxCents)}
                  </span>
                </div>
              ) : null}
              {pricing.taxEnabled && totals.vatCents > 0 ? (
                <div className="flex items-center justify-between text-white/55">
                  <span>VAT ({pricing.vatPercent}%)</span>
                  <span className="tabular-nums">
                    {formatMoney(totals.vatCents)}
                  </span>
                </div>
              ) : null}
              {pricing.taxEnabled && totals.serviceCents > 0 ? (
                <div className="flex items-center justify-between text-white/55">
                  <span>Service ({pricing.serviceChargePercent}%)</span>
                  <span className="tabular-nums">
                    {formatMoney(totals.serviceCents)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="font-medium text-white/70">Total</span>
                <span className="text-xl font-bold tabular-nums">
                  {formatMoney(totals.totalCents)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/15"
                onClick={clearCart}
                disabled={!cart.length || pending}
              >
                Clear
              </Button>
              <Button
                className="bg-[#e11d48] hover:bg-[#be123c]"
                onClick={submitOrder}
                disabled={
                  !cart.length ||
                  pending ||
                  (orderType === "DELIVERY" && !customerId)
                }
              >
                {pending ? "Sending…" : "Send to kitchen"}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {receipt ? (
        <PosReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      ) : null}
    </div>
  );
}
